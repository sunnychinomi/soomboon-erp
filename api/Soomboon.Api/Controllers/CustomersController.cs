using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Soomboon.Api.DTOs;
using Soomboon.Core.Common;
using Soomboon.Core.Entities;
using Soomboon.Infrastructure.Data;

namespace Soomboon.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    public CustomersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<PagedResult<CustomerListItemDto>>> Get([FromQuery] PagingQuery q)
    {
        var query = _db.Customers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(s) ||
                c.Code.ToLower().Contains(s) ||
                (c.Phone != null && c.Phone.Contains(s)) ||
                (c.TaxId != null && c.TaxId.Contains(s)));
        }

        query = (q.SortBy?.ToLower(), q.SortDir?.ToLower()) switch
        {
            ("name", "desc") => query.OrderByDescending(c => c.Name),
            ("name", _)      => query.OrderBy(c => c.Name),
            ("grade", "desc") => query.OrderByDescending(c => c.Grade),
            ("grade", _) => query.OrderBy(c => c.Grade),
            _ => query.OrderBy(c => c.Code),
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(c => new CustomerListItemDto(
                c.Id, c.Code, c.Name, c.Type, c.Grade,
                c.ContactName, c.Phone, c.CreditTerms, c.CreditLimit,
                c.IsActive, c.UpdatedAt))
            .ToListAsync();

        return Ok(PagedResult<CustomerListItemDto>.Create(items, total, q.Page, q.PageSize));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerDetailDto>> GetById(Guid id)
    {
        var c = await _db.Customers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (c is null) return NotFound();
        return Ok(ToDetailDto(c));
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDetailDto>> Create([FromBody] CreateCustomerRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Code) || string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Code and Name are required" });

        if (await _db.Customers.AnyAsync(c => c.Code == req.Code))
            return Conflict(new { message = $"Customer with code '{req.Code}' already exists" });

        var customer = new Customer
        {
            Code = req.Code.Trim(),
            Name = req.Name.Trim(),
            Type = req.Type,
            Grade = req.Grade,
            ContactName = req.ContactName?.Trim(),
            Phone = req.Phone?.Trim(),
            Email = req.Email?.Trim(),
            Address = req.Address?.Trim(),
            TaxId = req.TaxId?.Trim(),
            CreditTerms = req.CreditTerms?.Trim(),
            CreditLimit = req.CreditLimit
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = customer.Id }, ToDetailDto(customer));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CustomerDetailDto>> Update(Guid id, [FromBody] UpdateCustomerRequest req)
    {
        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (customer is null) return NotFound();

        customer.Name = req.Name.Trim();
        customer.Type = req.Type;
        customer.Grade = req.Grade;
        customer.ContactName = req.ContactName?.Trim();
        customer.Phone = req.Phone?.Trim();
        customer.Email = req.Email?.Trim();
        customer.Address = req.Address?.Trim();
        customer.TaxId = req.TaxId?.Trim();
        customer.CreditTerms = req.CreditTerms?.Trim();
        customer.CreditLimit = req.CreditLimit;
        customer.IsActive = req.IsActive;

        await _db.SaveChangesAsync();
        return Ok(ToDetailDto(customer));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (customer is null) return NotFound();

        customer.IsDeleted = true;
        customer.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static CustomerDetailDto ToDetailDto(Customer c) => new(
        c.Id, c.Code, c.Name, c.Type, c.Grade,
        c.ContactName, c.Phone, c.Email, c.Address, c.TaxId,
        c.CreditTerms, c.CreditLimit, c.IsActive, c.CreatedAt, c.UpdatedAt);
}
