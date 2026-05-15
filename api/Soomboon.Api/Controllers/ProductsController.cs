using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Soomboon.Api.DTOs;
using Soomboon.Core.Common;
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

    /// <summary>List products with pagination, search, and price history</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductListItemDto>>> Get([FromQuery] PagingQuery q)
    {
        var query = _db.Products.AsNoTracking()
            .Include(p => p.PrimaryVendor)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(s) ||
                p.Code.ToLower().Contains(s) ||
                (p.Brand != null && p.Brand.ToLower().Contains(s)) ||
                (p.NameEn != null && p.NameEn.ToLower().Contains(s)));
        }

        // Sorting
        query = (q.SortBy?.ToLower(), q.SortDir?.ToLower()) switch
        {
            ("name", "desc") => query.OrderByDescending(p => p.Name),
            ("name", _)      => query.OrderBy(p => p.Name),
            ("price", "desc")=> query.OrderByDescending(p => p.Price),
            ("price", _)     => query.OrderBy(p => p.Price),
            ("updated", "desc") => query.OrderByDescending(p => p.UpdatedAt),
            ("updated", _)      => query.OrderBy(p => p.UpdatedAt),
            _ => query.OrderBy(p => p.Code),
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(p => new ProductListItemDto(
                p.Id, p.Code, p.Name, p.NameEn, p.Brand, p.Category,
                p.Type, p.Unit, p.Cost, p.Price, p.ReorderLevel,
                p.PrimaryVendorId,
                p.PrimaryVendor == null ? null : p.PrimaryVendor.Name,
                p.UpdatedAt))
            .ToListAsync();

        return Ok(PagedResult<ProductListItemDto>.Create(items, total, q.Page, q.PageSize));
    }

    /// <summary>Get product by ID</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductDetailDto>> GetById(Guid id)
    {
        var p = await _db.Products.AsNoTracking()
            .Include(x => x.PrimaryVendor)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (p is null) return NotFound();

        return Ok(new ProductDetailDto(
            p.Id, p.Code, p.Name, p.NameEn, p.Category, p.Brand,
            p.PartNumberOem, p.PartNumberVendor, p.CarModel, p.CarBrand,
            p.Type, p.Unit, p.Cost, p.Price, p.ReorderLevel, p.ImageUrl,
            p.PrimaryVendorId, p.PrimaryVendor?.Name,
            p.IsActive, p.CreatedAt, p.UpdatedAt));
    }

    /// <summary>Create new product</summary>
    [HttpPost]
    public async Task<ActionResult<ProductDetailDto>> Create([FromBody] CreateProductRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Code) || string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Code and Name are required" });

        if (await _db.Products.AnyAsync(p => p.Code == req.Code))
            return Conflict(new { message = $"Product with code '{req.Code}' already exists" });

        if (req.PrimaryVendorId.HasValue &&
            !await _db.Vendors.AnyAsync(v => v.Id == req.PrimaryVendorId.Value))
            return BadRequest(new { message = "Vendor not found" });

        var product = new Product
        {
            Code = req.Code.Trim(),
            Name = req.Name.Trim(),
            NameEn = req.NameEn?.Trim(),
            Category = req.Category?.Trim(),
            Brand = req.Brand?.Trim(),
            PartNumberOem = req.PartNumberOem?.Trim(),
            PartNumberVendor = req.PartNumberVendor?.Trim(),
            CarModel = req.CarModel?.Trim(),
            CarBrand = req.CarBrand?.Trim(),
            Type = req.Type,
            Unit = string.IsNullOrWhiteSpace(req.Unit) ? "ชิ้น" : req.Unit.Trim(),
            Cost = req.Cost,
            Price = req.Price,
            ReorderLevel = req.ReorderLevel,
            PrimaryVendorId = req.PrimaryVendorId
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, await GetByIdInternal(product.Id));
    }

    /// <summary>Update existing product</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProductDetailDto>> Update(Guid id, [FromBody] UpdateProductRequest req)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return NotFound();

        if (req.PrimaryVendorId.HasValue &&
            !await _db.Vendors.AnyAsync(v => v.Id == req.PrimaryVendorId.Value))
            return BadRequest(new { message = "Vendor not found" });

        // Track price/cost change for history
        var oldCost = product.Cost;
        var oldPrice = product.Price;

        product.Name = req.Name.Trim();
        product.NameEn = req.NameEn?.Trim();
        product.Category = req.Category?.Trim();
        product.Brand = req.Brand?.Trim();
        product.PartNumberOem = req.PartNumberOem?.Trim();
        product.PartNumberVendor = req.PartNumberVendor?.Trim();
        product.CarModel = req.CarModel?.Trim();
        product.CarBrand = req.CarBrand?.Trim();
        product.Type = req.Type;
        product.Unit = string.IsNullOrWhiteSpace(req.Unit) ? "ชิ้น" : req.Unit.Trim();
        product.Cost = req.Cost;
        product.Price = req.Price;
        product.ReorderLevel = req.ReorderLevel;
        product.PrimaryVendorId = req.PrimaryVendorId;

        // Record price history if cost or price changed
        if (oldCost != req.Cost || oldPrice != req.Price)
        {
            _db.PriceHistories.Add(new PriceHistory
            {
                ProductId = product.Id,
                OldCost = oldCost,
                NewCost = req.Cost,
                OldPrice = oldPrice,
                NewPrice = req.Price,
                VendorId = req.PrimaryVendorId
            });
        }

        await _db.SaveChangesAsync();
        return Ok(await GetByIdInternal(product.Id));
    }

    /// <summary>Soft delete a product</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return NotFound();

        product.IsDeleted = true;
        product.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<ProductDetailDto?> GetByIdInternal(Guid id)
    {
        var p = await _db.Products.AsNoTracking()
            .Include(x => x.PrimaryVendor)
            .FirstOrDefaultAsync(x => x.Id == id);

        return p is null ? null : new ProductDetailDto(
            p.Id, p.Code, p.Name, p.NameEn, p.Category, p.Brand,
            p.PartNumberOem, p.PartNumberVendor, p.CarModel, p.CarBrand,
            p.Type, p.Unit, p.Cost, p.Price, p.ReorderLevel, p.ImageUrl,
            p.PrimaryVendorId, p.PrimaryVendor?.Name,
            p.IsActive, p.CreatedAt, p.UpdatedAt);
    }
}
