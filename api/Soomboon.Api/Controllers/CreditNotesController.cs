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
[Route("api/credit-notes")]
[Authorize]
public class CreditNotesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CreditNotesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<PagedResult<CreditNoteListItemDto>>> Get(
        [FromQuery] PagingQuery q,
        [FromQuery] Guid? customerId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var query = _db.CreditNotes.AsNoTracking()
            .Include(c => c.ReferenceInvoice)
            .AsQueryable();

        if (customerId.HasValue) query = query.Where(c => c.CustomerId == customerId.Value);
        if (from.HasValue) query = query.Where(c => c.CnDate >= from.Value.Date);
        if (to.HasValue) query = query.Where(c => c.CnDate <= to.Value.Date);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(c =>
                c.CnNo.ToLower().Contains(s) ||
                c.CustomerName.ToLower().Contains(s) ||
                c.Reason.ToLower().Contains(s));
        }

        query = query.OrderByDescending(c => c.CnDate);

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(c => new CreditNoteListItemDto(
                c.Id, c.CnNo, c.CnDate,
                c.ReferenceInvoiceId, c.ReferenceInvoice == null ? null : c.ReferenceInvoice.InvoiceNo,
                c.CustomerId, c.CustomerName,
                c.Reason, c.Amount, c.Note, c.CreatedAt))
            .ToListAsync();

        return Ok(PagedResult<CreditNoteListItemDto>.Create(items, total, q.Page, q.PageSize));
    }

    [HttpPost]
    public async Task<ActionResult<CreditNoteListItemDto>> Create([FromBody] CreateCreditNoteRequest req)
    {
        if (req.Amount <= 0)
            return BadRequest(new { message = "ยอดเงินต้องมากกว่า 0" });
        if (string.IsNullOrWhiteSpace(req.Reason))
            return BadRequest(new { message = "ระบุเหตุผล" });

        var customer = await _db.Customers.FindAsync(req.CustomerId);
        if (customer is null) return BadRequest(new { message = "ไม่พบลูกค้า" });

        string? invoiceNo = null;
        if (req.ReferenceInvoiceId.HasValue)
        {
            var so = await _db.SalesOrders.FindAsync(req.ReferenceInvoiceId.Value);
            if (so is null) return BadRequest(new { message = "ไม่พบใบกำกับภาษีอ้างอิง" });
            invoiceNo = so.InvoiceNo;
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var cnNo = await GenerateNextCnNoAsync();

        var cn = new CreditNote
        {
            CnNo = cnNo,
            CnDate = req.CnDate?.Date ?? DateTime.UtcNow.Date,
            ReferenceInvoiceId = req.ReferenceInvoiceId,
            CustomerId = req.CustomerId,
            CustomerName = customer.Name,
            Reason = req.Reason.Trim(),
            Amount = req.Amount,
            Note = req.Note?.Trim(),
            CreatedById = userId,
        };

        _db.CreditNotes.Add(cn);
        await _db.SaveChangesAsync();

        return Ok(new CreditNoteListItemDto(
            cn.Id, cn.CnNo, cn.CnDate,
            cn.ReferenceInvoiceId, invoiceNo,
            cn.CustomerId, cn.CustomerName,
            cn.Reason, cn.Amount, cn.Note, cn.CreatedAt));
    }

    private async Task<string> GenerateNextCnNoAsync()
    {
        var prefix = $"CN-{DateTime.UtcNow:yyyyMM}-";
        var existing = await _db.CreditNotes
            .Where(c => c.CnNo.StartsWith(prefix))
            .Select(c => c.CnNo)
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
