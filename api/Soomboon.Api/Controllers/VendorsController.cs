using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Soomboon.Api.DTOs;
using Soomboon.Core.Common;
using Soomboon.Core.Entities;
using Soomboon.Infrastructure.Data;

namespace Soomboon.Api.Controllers;

[ApiController]
[Route("api/vendors")]
[Authorize]
public class VendorsController : ControllerBase
{
    private readonly AppDbContext _db;
    public VendorsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<PagedResult<VendorListItemDto>>> Get([FromQuery] PagingQuery q)
    {
        var query = _db.Vendors.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(v =>
                v.Name.ToLower().Contains(s) ||
                v.Code.ToLower().Contains(s) ||
                (v.ContactName != null && v.ContactName.ToLower().Contains(s)) ||
                (v.Phone != null && v.Phone.Contains(s)));
        }

        query = (q.SortBy?.ToLower(), q.SortDir?.ToLower()) switch
        {
            ("name", "desc") => query.OrderByDescending(v => v.Name),
            ("name", _)      => query.OrderBy(v => v.Name),
            _ => query.OrderBy(v => v.Code),
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(v => new VendorListItemDto(
                v.Id, v.Code, v.Name, v.ContactName, v.Phone,
                v.PaymentTerms,
                v.Products.Count(p => !p.IsDeleted),
                v.IsActive, v.UpdatedAt))
            .ToListAsync();

        return Ok(PagedResult<VendorListItemDto>.Create(items, total, q.Page, q.PageSize));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<VendorDetailDto>> GetById(Guid id)
    {
        var v = await _db.Vendors.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (v is null) return NotFound();
        return Ok(ToDetailDto(v));
    }

    [HttpPost]
    public async Task<ActionResult<VendorDetailDto>> Create([FromBody] CreateVendorRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Code) || string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Code and Name are required" });

        if (await _db.Vendors.AnyAsync(v => v.Code == req.Code))
            return Conflict(new { message = $"Vendor with code '{req.Code}' already exists" });

        var vendor = new Vendor
        {
            Code = req.Code.Trim(),
            Name = req.Name.Trim(),
            ContactName = req.ContactName?.Trim(),
            Phone = req.Phone?.Trim(),
            Email = req.Email?.Trim(),
            Address = req.Address?.Trim(),
            TaxId = req.TaxId?.Trim(),
            PaymentTerms = string.IsNullOrWhiteSpace(req.PaymentTerms) ? "30 วัน" : req.PaymentTerms.Trim()
        };

        _db.Vendors.Add(vendor);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = vendor.Id }, ToDetailDto(vendor));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<VendorDetailDto>> Update(Guid id, [FromBody] UpdateVendorRequest req)
    {
        var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == id);
        if (vendor is null) return NotFound();

        vendor.Name = req.Name.Trim();
        vendor.ContactName = req.ContactName?.Trim();
        vendor.Phone = req.Phone?.Trim();
        vendor.Email = req.Email?.Trim();
        vendor.Address = req.Address?.Trim();
        vendor.TaxId = req.TaxId?.Trim();
        vendor.PaymentTerms = string.IsNullOrWhiteSpace(req.PaymentTerms) ? "30 วัน" : req.PaymentTerms.Trim();
        vendor.IsActive = req.IsActive;

        await _db.SaveChangesAsync();
        return Ok(ToDetailDto(vendor));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == id);
        if (vendor is null) return NotFound();

        // Prevent deletion if vendor has products
        var hasProducts = await _db.Products.AnyAsync(p => p.PrimaryVendorId == id && !p.IsDeleted);
        if (hasProducts)
            return BadRequest(new { message = "ไม่สามารถลบผู้ขายที่ยังมีสินค้าผูกอยู่ได้" });

        vendor.IsDeleted = true;
        vendor.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static VendorDetailDto ToDetailDto(Vendor v) => new(
        v.Id, v.Code, v.Name, v.ContactName, v.Phone, v.Email,
        v.Address, v.TaxId, v.PaymentTerms,
        v.IsActive, v.CreatedAt, v.UpdatedAt);
}
