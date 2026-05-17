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
[Route("api/sales-orders")]
[Authorize]
public class SalesOrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    public SalesOrdersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<PagedResult<SalesOrderListItemDto>>> Get(
        [FromQuery] PagingQuery q,
        [FromQuery] SalesOrderStatus? status,
        [FromQuery] Guid? customerId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var query = _db.SalesOrders.AsNoTracking()
            .Include(s => s.Customer)
            .Include(s => s.Branch)
            .Include(s => s.Items)
            .AsQueryable();

        if (status.HasValue) query = query.Where(s => s.Status == status.Value);
        if (customerId.HasValue) query = query.Where(s => s.CustomerId == customerId.Value);
        if (from.HasValue) query = query.Where(s => s.OrderDate >= from.Value.Date);
        if (to.HasValue) query = query.Where(s => s.OrderDate <= to.Value.Date);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(o =>
                o.InvoiceNo.ToLower().Contains(s) ||
                o.CustomerName.ToLower().Contains(s) ||
                (o.Note != null && o.Note.ToLower().Contains(s)));
        }

        query = query.OrderByDescending(s => s.OrderDate).ThenByDescending(s => s.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(s => new SalesOrderListItemDto(
                s.Id, s.InvoiceNo, s.OrderDate,
                s.CustomerId, s.CustomerName,
                s.BranchId, s.Branch == null ? null : s.Branch.Name,
                s.Items.Count, s.Total, s.PaidAmount, s.Total - s.PaidAmount,
                s.Status, s.DueDate, s.CreatedAt))
            .ToListAsync();

        return Ok(PagedResult<SalesOrderListItemDto>.Create(items, total, q.Page, q.PageSize));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SalesOrderDetailDto>> GetById(Guid id)
    {
        var so = await _db.SalesOrders.AsNoTracking()
            .Include(s => s.Customer)
            .Include(s => s.Branch)
            .Include(s => s.Salesperson)
            .Include(s => s.Items.OrderBy(i => i.LineNo))
            .Include(s => s.Receipts)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (so is null) return NotFound();
        return Ok(await ToDetailDto(so));
    }

    /// <summary>Create new SO and deduct stock automatically</summary>
    [HttpPost]
    public async Task<ActionResult<SalesOrderDetailDto>> Create([FromBody] CreateSalesOrderRequest req)
    {
        if (req.Items is null || req.Items.Count == 0)
            return BadRequest(new { message = "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" });

        var customer = await _db.Customers.FindAsync(req.CustomerId);
        if (customer is null) return BadRequest(new { message = "ไม่พบลูกค้า" });

        if (req.BranchId.HasValue && !await _db.Branches.AnyAsync(b => b.Id == req.BranchId.Value))
            return BadRequest(new { message = "ไม่พบสาขา" });

        if (req.SalespersonId.HasValue && !await _db.Employees.AnyAsync(e => e.Id == req.SalespersonId.Value))
            return BadRequest(new { message = "ไม่พบพนักงานขาย" });

        var invoiceNo = await GenerateNextInvoiceNoAsync();
        var orderDate = req.OrderDate?.Date ?? DateTime.UtcNow.Date;
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var so = new SalesOrder
        {
            InvoiceNo = invoiceNo,
            OrderDate = orderDate,
            CustomerId = req.CustomerId,
            CustomerName = customer.Name,
            BranchId = req.BranchId,
            SalespersonId = req.SalespersonId,
            PaymentTerms = req.PaymentTerms?.Trim() ?? customer.CreditTerms,
            DueDate = req.DueDate?.Date,
            Note = req.Note?.Trim(),
            Status = SalesOrderStatus.Unpaid,
            CreatedById = userId,
        };

        int lineNo = 1;
        decimal itemsDiscount = 0;
        foreach (var item in req.Items)
        {
            var gross = item.Quantity * item.UnitPrice;
            var lineDiscount = item.DiscountAmount + (gross * item.DiscountPct / 100m);
            var lineTotal = Math.Max(0, gross - lineDiscount);
            itemsDiscount += lineDiscount;

            so.Items.Add(new SalesOrderItem
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName.Trim(),
                ProductCode = item.ProductCode?.Trim(),
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                DiscountPct = item.DiscountPct,
                DiscountAmount = item.DiscountAmount,
                PromotionId = item.PromotionId,
                Total = lineTotal,
                LineNo = lineNo++,
            });
        }

        // Calculate totals
        so.Subtotal = so.Items.Sum(i => i.Quantity * i.UnitPrice);
        so.Discount = itemsDiscount + Math.Max(0, req.Discount);
        var afterDiscount = Math.Max(0, so.Subtotal - so.Discount);
        so.Vat = Math.Round(afterDiscount * (req.VatRate / 100m), 2);
        so.Total = afterDiscount + so.Vat;

        // ─── AUTO-DEDUCT STOCK ─────────────────────────────────────
        if (req.BranchId.HasValue)
        {
            foreach (var item in so.Items.Where(i => i.ProductId.HasValue))
            {
                var stock = await _db.Stocks
                    .FirstOrDefaultAsync(s => s.ProductId == item.ProductId!.Value && s.BranchId == req.BranchId.Value);

                if (stock is null)
                {
                    return BadRequest(new
                    {
                        message = $"{item.ProductName}: ไม่พบสต็อกในสาขานี้"
                    });
                }

                if (stock.Quantity < item.Quantity)
                {
                    return BadRequest(new
                    {
                        message = $"{item.ProductName}: สต็อกไม่พอ (มี {stock.Quantity} ต้องการ {item.Quantity})"
                    });
                }

                stock.Quantity -= item.Quantity;
                stock.UpdatedAt = DateTime.UtcNow;

                _db.StockMovements.Add(new StockMovement
                {
                    ProductId = item.ProductId.Value,
                    BranchId = req.BranchId.Value,
                    Direction = MovementDirection.Out,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    ReferenceType = MovementReferenceType.SalesOrder,
                    ReferenceId = so.Id,
                    ReferenceNo = invoiceNo,
                    Note = $"ขายให้ {customer.Name}",
                    CreatedById = userId,
                });
            }
        }

        _db.SalesOrders.Add(so);
        await _db.SaveChangesAsync();

        var created = await _db.SalesOrders.AsNoTracking()
            .Include(s => s.Customer)
            .Include(s => s.Branch)
            .Include(s => s.Salesperson)
            .Include(s => s.Items.OrderBy(i => i.LineNo))
            .Include(s => s.Receipts)
            .FirstAsync(s => s.Id == so.Id);

        return CreatedAtAction(nameof(GetById), new { id = so.Id }, await ToDetailDto(created));
    }

    /// <summary>Cancel SO and restore stock</summary>
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var so = await _db.SalesOrders
            .Include(s => s.Items)
            .Include(s => s.Receipts)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (so is null) return NotFound();

        if (so.Status == SalesOrderStatus.Cancelled)
            return BadRequest(new { message = "ใบขายนี้ถูกยกเลิกแล้ว" });

        if (so.Receipts.Any())
            return BadRequest(new { message = "ไม่สามารถยกเลิกใบขายที่มีการรับชำระเงินแล้ว" });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Restore stock
        if (so.BranchId.HasValue)
        {
            foreach (var item in so.Items.Where(i => i.ProductId.HasValue))
            {
                var stock = await _db.Stocks
                    .FirstOrDefaultAsync(s => s.ProductId == item.ProductId!.Value && s.BranchId == so.BranchId.Value);

                if (stock != null)
                {
                    stock.Quantity += item.Quantity;
                    stock.UpdatedAt = DateTime.UtcNow;
                }

                _db.StockMovements.Add(new StockMovement
                {
                    ProductId = item.ProductId.Value,
                    BranchId = so.BranchId.Value,
                    Direction = MovementDirection.In,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    ReferenceType = MovementReferenceType.Adjustment,
                    ReferenceId = so.Id,
                    ReferenceNo = so.InvoiceNo,
                    Note = $"คืนสต็อกจากการยกเลิก {so.InvoiceNo}",
                    CreatedById = userId,
                });
            }
        }

        so.Status = SalesOrderStatus.Cancelled;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string> GenerateNextInvoiceNoAsync()
    {
        var prefix = $"INV-{DateTime.UtcNow:yyyyMM}-";
        var existing = await _db.SalesOrders
            .Where(s => s.InvoiceNo.StartsWith(prefix))
            .Select(s => s.InvoiceNo)
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

    private async Task<SalesOrderDetailDto> ToDetailDto(SalesOrder s)
    {
        // Get promotion names for items
        var promoIds = s.Items.Where(i => i.PromotionId.HasValue).Select(i => i.PromotionId!.Value).Distinct().ToList();
        var promoNames = promoIds.Any()
            ? await _db.Promotions.AsNoTracking()
                .Where(p => promoIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.Name)
            : new Dictionary<Guid, string>();

        return new SalesOrderDetailDto(
            s.Id, s.InvoiceNo, s.OrderDate,
            s.CustomerId, s.CustomerName,
            s.Customer?.Address, s.Customer?.Phone, s.Customer?.TaxId,
            s.BranchId, s.Branch?.Name,
            s.SalespersonId, s.Salesperson?.Name,
            null, s.PaymentTerms, s.DueDate,
            s.Subtotal, s.Discount, s.Vat, s.Total, s.PaidAmount, s.Total - s.PaidAmount,
            s.Status, s.Note,
            s.CreatedAt, s.UpdatedAt,
            s.Items.OrderBy(i => i.LineNo).Select(i => new SalesOrderItemDto(
                i.Id, i.ProductId, i.ProductName, i.ProductCode,
                i.Quantity, i.UnitPrice, i.DiscountPct, i.DiscountAmount,
                i.PromotionId, i.PromotionId.HasValue && promoNames.TryGetValue(i.PromotionId.Value, out var pn) ? pn : null,
                i.Total, i.LineNo
            )).ToList(),
            s.Receipts.OrderByDescending(r => r.ReceiptDate).Select(r => new ReceiptListItemDto(
                r.Id, r.ReceiptNo, r.ReceiptDate,
                r.SalesOrderId, s.InvoiceNo,
                r.CustomerId, r.CustomerName,
                r.Amount, r.PaymentMethod, r.PaymentReference, r.Note, r.CreatedAt
            )).ToList()
        );
    }
}
