using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Soomboon.Api.DTOs;
using Soomboon.Core.Common;
using Soomboon.Core.Entities;
using Soomboon.Infrastructure.Data;

namespace Soomboon.Api.Controllers;

[ApiController]
[Route("api/stock-movements")]
[Authorize]
public class StockMovementsController : ControllerBase
{
    private readonly AppDbContext _db;
    public StockMovementsController(AppDbContext db) => _db = db;

    /// <summary>List stock movements with filters (date, product, branch, direction)</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<StockMovementDto>>> Get(
        [FromQuery] PagingQuery q,
        [FromQuery] Guid? productId,
        [FromQuery] Guid? branchId,
        [FromQuery] MovementDirection? direction,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var query = _db.StockMovements.AsNoTracking()
            .Include(m => m.Product)
            .Include(m => m.Branch)
            .AsQueryable();

        if (productId.HasValue) query = query.Where(m => m.ProductId == productId.Value);
        if (branchId.HasValue) query = query.Where(m => m.BranchId == branchId.Value);
        if (direction.HasValue) query = query.Where(m => m.Direction == direction.Value);
        if (from.HasValue) query = query.Where(m => m.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(m => m.CreatedAt <= to.Value);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(m =>
                m.Product.Name.ToLower().Contains(s) ||
                m.Product.Code.ToLower().Contains(s) ||
                (m.ReferenceNo != null && m.ReferenceNo.ToLower().Contains(s)));
        }

        query = query.OrderByDescending(m => m.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(m => new StockMovementDto(
                m.Id, m.CreatedAt, m.Direction,
                m.ProductId, m.Product.Code, m.Product.Name,
                m.BranchId, m.Branch.Name,
                m.Quantity, m.UnitPrice,
                m.ReferenceType, m.ReferenceNo, m.Note))
            .ToListAsync();

        return Ok(PagedResult<StockMovementDto>.Create(items, total, q.Page, q.PageSize));
    }
}
