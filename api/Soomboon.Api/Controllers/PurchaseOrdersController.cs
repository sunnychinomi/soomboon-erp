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
[Route("api/purchase-orders")]
[Authorize]
public class PurchaseOrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    public PurchaseOrdersController(AppDbContext db) => _db = db;

    /// <summary>List POs with filters</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<PurchaseOrderListItemDto>>> Get(
        [FromQuery] PagingQuery q,
        [FromQuery] PoStatus? status,
        [FromQuery] Guid? vendorId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var query = _db.PurchaseOrders.AsNoTracking()
            .Include(p => p.Vendor)
            .Include(p => p.Branch)
            .Include(p => p.Items)
            .AsQueryable();

        if (status.HasValue) query = query.Where(p => p.Status == status.Value);
        if (vendorId.HasValue) query = query.Where(p => p.VendorId == vendorId.Value);
        if (from.HasValue) query = query.Where(p => p.PoDate >= from.Value.Date);
        if (to.HasValue) query = query.Where(p => p.PoDate <= to.Value.Date);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(p =>
                p.PoNo.ToLower().Contains(s) ||
                (p.Vendor != null && p.Vendor.Name.ToLower().Contains(s)) ||
                (p.Note != null && p.Note.ToLower().Contains(s)));
        }

        query = query.OrderByDescending(p => p.PoDate).ThenByDescending(p => p.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(p => new PurchaseOrderListItemDto(
                p.Id, p.PoNo, p.PoDate,
                p.VendorId, p.Vendor == null ? null : p.Vendor.Name,
                p.BranchId, p.Branch == null ? null : p.Branch.Name,
                p.Items.Count,
                p.Total,
                p.Status,
                p.CreatedAt))
            .ToListAsync();

        return Ok(PagedResult<PurchaseOrderListItemDto>.Create(items, total, q.Page, q.PageSize));
    }

    /// <summary>Get PO detail with items</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PurchaseOrderDetailDto>> GetById(Guid id)
    {
        var po = await _db.PurchaseOrders.AsNoTracking()
            .Include(p => p.Vendor)
            .Include(p => p.Branch)
            .Include(p => p.Items.OrderBy(i => i.LineNo))
            .FirstOrDefaultAsync(p => p.Id == id);

        if (po is null) return NotFound();

        return Ok(ToDetailDto(po));
    }

    /// <summary>Create new PO with line items</summary>
    [HttpPost]
    public async Task<ActionResult<PurchaseOrderDetailDto>> Create([FromBody] CreatePurchaseOrderRequest req)
    {
        if (req.Items is null || req.Items.Count == 0)
            return BadRequest(new { message = "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" });

        var vendor = await _db.Vendors.FindAsync(req.VendorId);
        if (vendor is null) return BadRequest(new { message = "ไม่พบผู้ขาย" });

        if (req.BranchId.HasValue && !await _db.Branches.AnyAsync(b => b.Id == req.BranchId.Value))
            return BadRequest(new { message = "ไม่พบสาขา" });

        var poNo = await GenerateNextPoNoAsync();
        var poDate = req.PoDate?.Date ?? DateTime.UtcNow.Date;
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var po = new PurchaseOrder
        {
            PoNo = poNo,
            PoDate = poDate,
            VendorId = req.VendorId,
            BranchId = req.BranchId,
            ShipTo = req.ShipTo?.Trim(),
            PaymentTerms = req.PaymentTerms?.Trim() ?? vendor.PaymentTerms,
            Note = req.Note?.Trim(),
            Status = PoStatus.Pending,
            CreatedById = userId,
        };

        int lineNo = 1;
        foreach (var item in req.Items)
        {
            var lineTotal = item.Quantity * item.UnitPrice;
            po.Items.Add(new PurchaseOrderItem
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName.Trim(),
                ProductCode = item.ProductCode?.Trim(),
                Quantity = item.Quantity,
                ReceivedQuantity = 0,
                UnitPrice = item.UnitPrice,
                Total = lineTotal,
                LineNo = lineNo++,
            });
        }

        // Compute totals
        var subtotal = po.Items.Sum(i => i.Total);
        po.Subtotal = subtotal;
        po.Discount = Math.Max(0, req.Discount);
        var afterDiscount = Math.Max(0, subtotal - po.Discount);
        po.Vat = Math.Round(afterDiscount * (req.VatRate / 100m), 2);
        po.Total = afterDiscount + po.Vat;

        _db.PurchaseOrders.Add(po);
        await _db.SaveChangesAsync();

        // Reload for full data
        var created = await _db.PurchaseOrders.AsNoTracking()
            .Include(p => p.Vendor)
            .Include(p => p.Branch)
            .Include(p => p.Items)
            .FirstAsync(p => p.Id == po.Id);

        return CreatedAtAction(nameof(GetById), new { id = po.Id }, ToDetailDto(created));
    }

    /// <summary>Update existing PO (only if pending)</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PurchaseOrderDetailDto>> Update(Guid id, [FromBody] UpdatePurchaseOrderRequest req)
    {
        var po = await _db.PurchaseOrders
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (po is null) return NotFound();
        if (po.Status != PoStatus.Pending)
            return BadRequest(new { message = "ไม่สามารถแก้ไข PO ที่เริ่มรับสินค้าแล้ว" });

        var vendor = await _db.Vendors.FindAsync(req.VendorId);
        if (vendor is null) return BadRequest(new { message = "ไม่พบผู้ขาย" });

        po.PoDate = req.PoDate.Date;
        po.VendorId = req.VendorId;
        po.BranchId = req.BranchId;
        po.ShipTo = req.ShipTo?.Trim();
        po.PaymentTerms = req.PaymentTerms?.Trim();
        po.Note = req.Note?.Trim();

        // Replace items
        _db.PurchaseOrderItems.RemoveRange(po.Items);
        po.Items.Clear();
        int lineNo = 1;
        foreach (var item in req.Items)
        {
            po.Items.Add(new PurchaseOrderItem
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName.Trim(),
                ProductCode = item.ProductCode?.Trim(),
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Total = item.Quantity * item.UnitPrice,
                LineNo = lineNo++,
            });
        }

        var subtotal = po.Items.Sum(i => i.Total);
        po.Subtotal = subtotal;
        po.Discount = Math.Max(0, req.Discount);
        var afterDiscount = Math.Max(0, subtotal - po.Discount);
        po.Vat = Math.Round(afterDiscount * (req.VatRate / 100m), 2);
        po.Total = afterDiscount + po.Vat;

        await _db.SaveChangesAsync();

        var updated = await _db.PurchaseOrders.AsNoTracking()
            .Include(p => p.Vendor)
            .Include(p => p.Branch)
            .Include(p => p.Items)
            .FirstAsync(p => p.Id == id);

        return Ok(ToDetailDto(updated));
    }

    /// <summary>Cancel a PO (cannot be deleted if has receivings)</summary>
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == id);
        if (po is null) return NotFound();

        if (po.Status == PoStatus.Received)
            return BadRequest(new { message = "ไม่สามารถยกเลิก PO ที่รับสินค้าครบแล้ว" });

        var hasReceivings = await _db.Receivings.AnyAsync(r => r.PurchaseOrderId == id);
        if (hasReceivings)
            return BadRequest(new { message = "ไม่สามารถยกเลิก PO ที่มีการรับสินค้าบางส่วนแล้ว" });

        po.Status = PoStatus.Cancelled;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string> GenerateNextPoNoAsync()
    {
        var prefix = $"PO-{DateTime.UtcNow:yyyyMM}-";
        var maxNo = await _db.PurchaseOrders
            .Where(p => p.PoNo.StartsWith(prefix))
            .Select(p => p.PoNo)
            .ToListAsync();

        var nextNum = 1;
        if (maxNo.Any())
        {
            nextNum = maxNo
                .Select(s => int.TryParse(s.Substring(prefix.Length), out var n) ? n : 0)
                .Max() + 1;
        }
        return $"{prefix}{nextNum:D4}";
    }

    private static PurchaseOrderDetailDto ToDetailDto(PurchaseOrder p) => new(
        p.Id, p.PoNo, p.PoDate,
        p.VendorId, p.Vendor?.Name, p.Vendor?.Address, p.Vendor?.Phone, p.Vendor?.TaxId,
        p.BranchId, p.Branch?.Name,
        p.ShipTo, p.PaymentTerms,
        p.Subtotal, p.Discount, p.Vat, p.Total,
        p.Status, p.Note,
        p.CreatedAt, p.UpdatedAt,
        p.Items.OrderBy(i => i.LineNo).Select(i => new PurchaseOrderItemDto(
            i.Id, i.ProductId, i.ProductName, i.ProductCode,
            i.Quantity, i.ReceivedQuantity, i.UnitPrice, i.Total, i.LineNo
        )).ToList());
}
