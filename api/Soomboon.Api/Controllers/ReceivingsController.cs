using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Soomboon.Api.DTOs;
using Soomboon.Core.Common;
using Soomboon.Core.Entities;
using Soomboon.Infrastructure.Data;

namespace Soomboon.Api.Controllers;

[ApiController]
[Route("api/receivings")]
[Authorize]
public class ReceivingsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReceivingsController(AppDbContext db) => _db = db;

    /// <summary>List receivings with filters</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<ReceivingListItemDto>>> Get(
        [FromQuery] PagingQuery q,
        [FromQuery] Guid? vendorId,
        [FromQuery] Guid? branchId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var query = _db.Receivings.AsNoTracking()
            .Include(r => r.PurchaseOrder)
            .Include(r => r.Vendor)
            .Include(r => r.Branch)
            .Include(r => r.Items)
            .AsQueryable();

        if (vendorId.HasValue) query = query.Where(r => r.VendorId == vendorId.Value);
        if (branchId.HasValue) query = query.Where(r => r.BranchId == branchId.Value);
        if (from.HasValue) query = query.Where(r => r.ReceivingDate >= from.Value.Date);
        if (to.HasValue) query = query.Where(r => r.ReceivingDate <= to.Value.Date);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(r =>
                r.ReceivingNo.ToLower().Contains(s) ||
                (r.VendorInvoiceNo != null && r.VendorInvoiceNo.ToLower().Contains(s)) ||
                (r.PurchaseOrder != null && r.PurchaseOrder.PoNo.ToLower().Contains(s)));
        }

        query = query.OrderByDescending(r => r.ReceivingDate).ThenByDescending(r => r.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(r => new ReceivingListItemDto(
                r.Id, r.ReceivingNo, r.ReceivingDate,
                r.PurchaseOrderId, r.PurchaseOrder == null ? null : r.PurchaseOrder.PoNo,
                r.VendorId, r.Vendor == null ? null : r.Vendor.Name,
                r.VendorInvoiceNo, r.Amount,
                r.BranchId, r.Branch == null ? null : r.Branch.Name,
                r.Items.Count, r.Status, r.CreatedAt))
            .ToListAsync();

        return Ok(PagedResult<ReceivingListItemDto>.Create(items, total, q.Page, q.PageSize));
    }

    /// <summary>Get receiving detail</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReceivingDetailDto>> GetById(Guid id)
    {
        var r = await _db.Receivings.AsNoTracking()
            .Include(x => x.PurchaseOrder)
            .Include(x => x.Vendor)
            .Include(x => x.Branch)
            .Include(x => x.Items.OrderBy(i => i.LineNo))
            .FirstOrDefaultAsync(x => x.Id == id);

        if (r is null) return NotFound();

        return Ok(new ReceivingDetailDto(
            r.Id, r.ReceivingNo, r.ReceivingDate,
            r.PurchaseOrderId, r.PurchaseOrder?.PoNo,
            r.VendorId, r.Vendor?.Name, r.VendorInvoiceNo,
            r.Amount,
            r.BranchId, r.Branch?.Name,
            r.Status, r.AttachmentUrl, r.Note, r.CreatedAt,
            r.Items.OrderBy(i => i.LineNo).Select(i => new ReceivingItemDto(
                i.Id, i.PurchaseOrderItemId, i.ProductId,
                i.ProductName, i.OrderedQty, i.ReceivedQty, i.UnitPrice, i.LineNo
            )).ToList()));
    }

    /// <summary>Create receiving from PO — auto-updates stock + records movements</summary>
    [HttpPost]
    public async Task<ActionResult<ReceivingDetailDto>> Create([FromBody] CreateReceivingRequest req)
    {
        if (req.Items is null || req.Items.Count == 0)
            return BadRequest(new { message = "ต้องระบุรายการที่รับอย่างน้อย 1 รายการ" });

        var po = await _db.PurchaseOrders
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == req.PurchaseOrderId);

        if (po is null) return BadRequest(new { message = "ไม่พบใบสั่งซื้อ" });
        if (po.Status == PoStatus.Cancelled)
            return BadRequest(new { message = "ใบสั่งซื้อถูกยกเลิกแล้ว" });
        if (po.Status == PoStatus.Received)
            return BadRequest(new { message = "ใบสั่งซื้อรับสินค้าครบแล้ว" });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var receivingNo = await GenerateNextReceivingNoAsync();
        var date = req.ReceivingDate?.Date ?? DateTime.UtcNow.Date;

        var receiving = new Receiving
        {
            ReceivingNo = receivingNo,
            ReceivingDate = date,
            PurchaseOrderId = po.Id,
            VendorId = po.VendorId,
            VendorInvoiceNo = req.VendorInvoiceNo?.Trim(),
            BranchId = po.BranchId,
            AttachmentUrl = req.AttachmentUrl?.Trim(),
            Note = req.Note?.Trim(),
            CreatedById = userId,
        };

        decimal totalAmount = 0;
        int lineNo = 1;

        foreach (var item in req.Items)
        {
            if (item.ReceivedQty <= 0) continue;

            var poItem = po.Items.FirstOrDefault(pi => pi.Id == item.PurchaseOrderItemId);
            if (poItem is null)
                return BadRequest(new { message = $"ไม่พบรายการ {item.PurchaseOrderItemId} ใน PO" });

            var remaining = poItem.Quantity - poItem.ReceivedQuantity;
            if (item.ReceivedQty > remaining)
                return BadRequest(new
                {
                    message = $"{poItem.ProductName}: รับเกินจำนวนคงเหลือ (เหลือ {remaining}, จะรับ {item.ReceivedQty})"
                });

            // Update PO item received qty
            poItem.ReceivedQuantity += item.ReceivedQty;

            // Add to receiving
            receiving.Items.Add(new ReceivingItem
            {
                PurchaseOrderItemId = poItem.Id,
                ProductId = poItem.ProductId,
                ProductName = poItem.ProductName,
                OrderedQty = poItem.Quantity,
                ReceivedQty = item.ReceivedQty,
                UnitPrice = poItem.UnitPrice,
                LineNo = lineNo++,
            });

            totalAmount += item.ReceivedQty * poItem.UnitPrice;

            // Update Stock + Stock Movement
            if (poItem.ProductId.HasValue && po.BranchId.HasValue)
            {
                var stock = await _db.Stocks
                    .FirstOrDefaultAsync(s => s.ProductId == poItem.ProductId.Value && s.BranchId == po.BranchId.Value);

                if (stock is null)
                {
                    stock = new Stock
                    {
                        ProductId = poItem.ProductId.Value,
                        BranchId = po.BranchId.Value,
                        Quantity = item.ReceivedQty,
                    };
                    _db.Stocks.Add(stock);
                }
                else
                {
                    stock.Quantity += item.ReceivedQty;
                    stock.UpdatedAt = DateTime.UtcNow;
                }

                _db.StockMovements.Add(new StockMovement
                {
                    ProductId = poItem.ProductId.Value,
                    BranchId = po.BranchId.Value,
                    Direction = MovementDirection.In,
                    Quantity = item.ReceivedQty,
                    UnitPrice = poItem.UnitPrice,
                    ReferenceType = MovementReferenceType.Receiving,
                    ReferenceId = receiving.Id,
                    ReferenceNo = receivingNo,
                    Note = $"รับสินค้าจาก PO {po.PoNo}",
                    CreatedById = userId,
                });
            }
        }

        receiving.Amount = totalAmount;

        // Update PO status (Pending → Partial → Received)
        var allReceived = po.Items.All(pi => pi.ReceivedQuantity >= pi.Quantity);
        var anyReceived = po.Items.Any(pi => pi.ReceivedQuantity > 0);

        if (allReceived) po.Status = PoStatus.Received;
        else if (anyReceived) po.Status = PoStatus.Partial;

        receiving.Status = allReceived ? ReceivingStatus.Complete : ReceivingStatus.Partial;

        _db.Receivings.Add(receiving);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = receiving.Id }, await GetByIdInternal(receiving.Id));
    }

    private async Task<string> GenerateNextReceivingNoAsync()
    {
        var prefix = $"RC-{DateTime.UtcNow:yyyyMM}-";
        var existing = await _db.Receivings
            .Where(r => r.ReceivingNo.StartsWith(prefix))
            .Select(r => r.ReceivingNo)
            .ToListAsync();

        var nextNum = 1;
        if (existing.Any())
        {
            nextNum = existing
                .Select(s => int.TryParse(s.Substring(prefix.Length), out var n) ? n : 0)
                .Max() + 1;
        }
        return $"{prefix}{nextNum:D4}";
    }

    private async Task<ReceivingDetailDto> GetByIdInternal(Guid id)
    {
        var r = await _db.Receivings.AsNoTracking()
            .Include(x => x.PurchaseOrder)
            .Include(x => x.Vendor)
            .Include(x => x.Branch)
            .Include(x => x.Items.OrderBy(i => i.LineNo))
            .FirstAsync(x => x.Id == id);

        return new ReceivingDetailDto(
            r.Id, r.ReceivingNo, r.ReceivingDate,
            r.PurchaseOrderId, r.PurchaseOrder?.PoNo,
            r.VendorId, r.Vendor?.Name, r.VendorInvoiceNo,
            r.Amount,
            r.BranchId, r.Branch?.Name,
            r.Status, r.AttachmentUrl, r.Note, r.CreatedAt,
            r.Items.OrderBy(i => i.LineNo).Select(i => new ReceivingItemDto(
                i.Id, i.PurchaseOrderItemId, i.ProductId,
                i.ProductName, i.OrderedQty, i.ReceivedQty, i.UnitPrice, i.LineNo
            )).ToList());
    }
}
