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
[Route("api/stocks")]
[Authorize]
public class StocksController : ControllerBase
{
    private readonly AppDbContext _db;
    public StocksController(AppDbContext db) => _db = db;

    /// <summary>List stocks across all products and branches with filters</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<StockListItemDto>>> Get(
        [FromQuery] PagingQuery q,
        [FromQuery] Guid? branchId,
        [FromQuery] string? status) // "ok" | "low" | "out"
    {
        var query = _db.Stocks.AsNoTracking()
            .Include(s => s.Product).ThenInclude(p => p.PrimaryVendor)
            .Include(s => s.Branch)
            .Where(s => !s.Product.IsDeleted && !s.Branch.IsDeleted)
            .AsQueryable();

        if (branchId.HasValue)
            query = query.Where(s => s.BranchId == branchId.Value);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var search = q.Search.Trim().ToLower();
            query = query.Where(s =>
                s.Product.Name.ToLower().Contains(search) ||
                s.Product.Code.ToLower().Contains(search) ||
                (s.Product.Brand != null && s.Product.Brand.ToLower().Contains(search)));
        }

        // Sort
        query = (q.SortBy?.ToLower(), q.SortDir?.ToLower()) switch
        {
            ("quantity", "desc") => query.OrderByDescending(s => s.Quantity),
            ("quantity", _)      => query.OrderBy(s => s.Quantity),
            ("name", "desc")     => query.OrderByDescending(s => s.Product.Name),
            ("name", _)          => query.OrderBy(s => s.Product.Name),
            _ => query.OrderBy(s => s.Product.Code),
        };

        // Materialize to memory for status filter (computed value)
        var totalBeforeStatus = await query.CountAsync();
        var rawList = await query
            .Skip(string.IsNullOrEmpty(status) ? (q.Page - 1) * q.PageSize : 0)
            .Take(string.IsNullOrEmpty(status) ? q.PageSize : 10000)
            .Select(s => new
            {
                s.Id, s.ProductId, s.BranchId, s.Quantity, s.UpdatedAt,
                ProductCode = s.Product.Code,
                ProductName = s.Product.Name,
                s.Product.Brand,
                s.Product.Unit,
                s.Product.Cost,
                s.Product.Price,
                s.Product.ReorderLevel,
                BranchCode = s.Branch.Code,
                BranchName = s.Branch.Name,
                VendorName = s.Product.PrimaryVendor != null ? s.Product.PrimaryVendor.Name : null,
            })
            .ToListAsync();

        // Compute status
        IEnumerable<StockListItemDto> mapped = rawList.Select(s => new StockListItemDto(
            s.Id, s.ProductId, s.ProductCode, s.ProductName, s.Brand, s.Unit,
            s.Cost, s.Price, s.ReorderLevel,
            s.BranchId, s.BranchCode, s.BranchName, s.Quantity,
            s.Quantity == 0 ? "out" : s.Quantity <= s.ReorderLevel ? "low" : "ok",
            s.VendorName, s.UpdatedAt));

        // Apply status filter (post-projection)
        if (!string.IsNullOrEmpty(status))
        {
            mapped = mapped.Where(s => s.Status == status);
            var filtered = mapped.ToList();
            var total = filtered.Count;
            var paged = filtered.Skip((q.Page - 1) * q.PageSize).Take(q.PageSize).ToList();
            return Ok(PagedResult<StockListItemDto>.Create(paged, total, q.Page, q.PageSize));
        }

        return Ok(PagedResult<StockListItemDto>.Create(mapped.ToList(), totalBeforeStatus, q.Page, q.PageSize));
    }

    /// <summary>Get stock summary by product (all branches)</summary>
    [HttpGet("by-product/{productId:guid}")]
    public async Task<ActionResult<IEnumerable<StockListItemDto>>> GetByProduct(Guid productId)
    {
        var product = await _db.Products.AsNoTracking()
            .Include(p => p.PrimaryVendor)
            .FirstOrDefaultAsync(p => p.Id == productId);
        if (product is null) return NotFound();

        var stocks = await _db.Stocks.AsNoTracking()
            .Include(s => s.Branch)
            .Where(s => s.ProductId == productId && !s.Branch.IsDeleted)
            .Select(s => new StockListItemDto(
                s.Id, s.ProductId, product.Code, product.Name, product.Brand, product.Unit,
                product.Cost, product.Price, product.ReorderLevel,
                s.BranchId, s.Branch.Code, s.Branch.Name, s.Quantity,
                s.Quantity == 0 ? "out" : s.Quantity <= product.ReorderLevel ? "low" : "ok",
                product.PrimaryVendor != null ? product.PrimaryVendor.Name : null,
                s.UpdatedAt))
            .ToListAsync();

        return Ok(stocks);
    }

    /// <summary>Adjust stock quantity manually (creates StockMovement record)</summary>
    [HttpPost("adjust")]
    public async Task<ActionResult<StockListItemDto>> Adjust([FromBody] AdjustStockRequest req)
    {
        if (req.NewQuantity < 0)
            return BadRequest(new { message = "จำนวนต้องไม่ติดลบ" });

        var product = await _db.Products.FindAsync(req.ProductId);
        if (product is null) return BadRequest(new { message = "ไม่พบสินค้า" });

        var branch = await _db.Branches.FindAsync(req.BranchId);
        if (branch is null) return BadRequest(new { message = "ไม่พบสาขา" });

        // Find or create stock record
        var stock = await _db.Stocks
            .FirstOrDefaultAsync(s => s.ProductId == req.ProductId && s.BranchId == req.BranchId);

        var oldQty = stock?.Quantity ?? 0;

        if (stock is null)
        {
            stock = new Stock { ProductId = req.ProductId, BranchId = req.BranchId, Quantity = req.NewQuantity };
            _db.Stocks.Add(stock);
        }
        else
        {
            stock.Quantity = req.NewQuantity;
            stock.UpdatedAt = DateTime.UtcNow;
        }

        // Record movement
        var diff = req.NewQuantity - oldQty;
        if (diff != 0)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _db.StockMovements.Add(new StockMovement
            {
                ProductId = req.ProductId,
                BranchId = req.BranchId,
                Direction = diff > 0 ? MovementDirection.In : MovementDirection.Out,
                Quantity = Math.Abs(diff),
                UnitPrice = product.Cost,
                ReferenceType = MovementReferenceType.Manual,
                ReferenceNo = "ADJ-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss"),
                Note = string.IsNullOrWhiteSpace(req.Note)
                    ? $"ปรับสต็อกด้วยตนเอง ({oldQty} → {req.NewQuantity})"
                    : req.Note,
                CreatedById = userId,
            });
        }

        await _db.SaveChangesAsync();

        var result = new StockListItemDto(
            stock.Id, req.ProductId, product.Code, product.Name, product.Brand, product.Unit,
            product.Cost, product.Price, product.ReorderLevel,
            req.BranchId, branch.Code, branch.Name, stock.Quantity,
            stock.Quantity == 0 ? "out" : stock.Quantity <= product.ReorderLevel ? "low" : "ok",
            null, stock.UpdatedAt);

        return Ok(result);
    }
}
