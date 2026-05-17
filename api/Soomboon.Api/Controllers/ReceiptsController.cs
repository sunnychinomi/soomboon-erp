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
[Route("api/receipts")]
[Authorize]
public class ReceiptsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ReceiptsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<PagedResult<ReceiptListItemDto>>> Get(
        [FromQuery] PagingQuery q,
        [FromQuery] Guid? customerId,
        [FromQuery] PaymentMethod? method,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var query = _db.Receipts.AsNoTracking()
            .Include(r => r.SalesOrder)
            .AsQueryable();

        if (customerId.HasValue) query = query.Where(r => r.CustomerId == customerId.Value);
        if (method.HasValue) query = query.Where(r => r.PaymentMethod == method.Value);
        if (from.HasValue) query = query.Where(r => r.ReceiptDate >= from.Value.Date);
        if (to.HasValue) query = query.Where(r => r.ReceiptDate <= to.Value.Date);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(r =>
                r.ReceiptNo.ToLower().Contains(s) ||
                r.CustomerName.ToLower().Contains(s) ||
                (r.SalesOrder != null && r.SalesOrder.InvoiceNo.ToLower().Contains(s)));
        }

        query = query.OrderByDescending(r => r.ReceiptDate).ThenByDescending(r => r.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(r => new ReceiptListItemDto(
                r.Id, r.ReceiptNo, r.ReceiptDate,
                r.SalesOrderId, r.SalesOrder == null ? null : r.SalesOrder.InvoiceNo,
                r.CustomerId, r.CustomerName,
                r.Amount, r.PaymentMethod, r.PaymentReference, r.Note, r.CreatedAt))
            .ToListAsync();

        return Ok(PagedResult<ReceiptListItemDto>.Create(items, total, q.Page, q.PageSize));
    }

    /// <summary>Create receipt and update SO paid amount + status</summary>
    [HttpPost]
    public async Task<ActionResult<ReceiptListItemDto>> Create([FromBody] CreateReceiptRequest req)
    {
        if (req.Amount <= 0)
            return BadRequest(new { message = "ยอดเงินต้องมากกว่า 0" });

        var so = await _db.SalesOrders.FirstOrDefaultAsync(s => s.Id == req.SalesOrderId);
        if (so is null) return BadRequest(new { message = "ไม่พบใบขาย" });
        if (so.Status == SalesOrderStatus.Cancelled)
            return BadRequest(new { message = "ใบขายถูกยกเลิกแล้ว" });
        if (so.Status == SalesOrderStatus.Paid)
            return BadRequest(new { message = "ใบขายชำระครบแล้ว" });

        var balance = so.Total - so.PaidAmount;
        if (req.Amount > balance)
            return BadRequest(new { message = $"ยอดเกินค้างชำระ (เหลือ ฿{balance:N2})" });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var receiptNo = await GenerateNextReceiptNoAsync();

        var receipt = new Receipt
        {
            ReceiptNo = receiptNo,
            ReceiptDate = req.ReceiptDate?.Date ?? DateTime.UtcNow.Date,
            SalesOrderId = so.Id,
            CustomerId = so.CustomerId,
            CustomerName = so.CustomerName,
            Amount = req.Amount,
            PaymentMethod = req.PaymentMethod,
            PaymentReference = req.PaymentReference?.Trim(),
            Note = req.Note?.Trim(),
            CreatedById = userId,
        };

        // Update SO
        so.PaidAmount += req.Amount;
        so.Status = so.PaidAmount >= so.Total
            ? SalesOrderStatus.Paid
            : SalesOrderStatus.Partial;

        _db.Receipts.Add(receipt);
        await _db.SaveChangesAsync();

        return Ok(new ReceiptListItemDto(
            receipt.Id, receipt.ReceiptNo, receipt.ReceiptDate,
            receipt.SalesOrderId, so.InvoiceNo,
            receipt.CustomerId, receipt.CustomerName,
            receipt.Amount, receipt.PaymentMethod, receipt.PaymentReference, receipt.Note,
            receipt.CreatedAt));
    }

    private async Task<string> GenerateNextReceiptNoAsync()
    {
        var prefix = $"RCP-{DateTime.UtcNow:yyyyMM}-";
        var existing = await _db.Receipts
            .Where(r => r.ReceiptNo.StartsWith(prefix))
            .Select(r => r.ReceiptNo)
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
}
