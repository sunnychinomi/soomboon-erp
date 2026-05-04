using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Soomboon.Core.Entities;
using Soomboon.Infrastructure.Data;

namespace Soomboon.Api.Controllers;

[ApiController]
[Route("api/products")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProductsController(AppDbContext db) => _db = db;

    /// <summary>List products with optional search</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> Get(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _db.Products.AsNoTracking()
            .Include(p => p.PrimaryVendor)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(s) ||
                p.Code.ToLower().Contains(s) ||
                (p.Brand != null && p.Brand.ToLower().Contains(s)));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(p => p.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.Id,
                p.Code,
                p.Name,
                p.NameEn,
                p.Brand,
                p.Type,
                p.Unit,
                p.Cost,
                p.Price,
                p.ReorderLevel,
                Vendor = p.PrimaryVendor == null ? null : new { p.PrimaryVendor.Id, p.PrimaryVendor.Name }
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Product>> GetById(Guid id)
    {
        var product = await _db.Products
            .Include(p => p.PrimaryVendor)
            .FirstOrDefaultAsync(p => p.Id == id);

        return product is null ? NotFound() : Ok(product);
    }
}
