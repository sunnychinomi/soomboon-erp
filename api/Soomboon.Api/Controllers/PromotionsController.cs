using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Soomboon.Api.DTOs;
using Soomboon.Core.Entities;
using Soomboon.Infrastructure.Data;

namespace Soomboon.Api.Controllers;

[ApiController]
[Route("api/promotions")]
[Authorize]
public class PromotionsController : ControllerBase
{
    private readonly AppDbContext _db;
    public PromotionsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PromotionDto>>> Get([FromQuery] bool? activeOnly)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);

        var query = _db.Promotions.AsNoTracking().AsQueryable();
        if (activeOnly == true)
        {
            query = query.Where(p => p.IsActive && p.StartDate <= today && p.EndDate >= today);
        }

        var items = await query.OrderByDescending(p => p.StartDate).ToListAsync();
        return Ok(items.Select(p => ToDto(p, today)));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PromotionDto>> GetById(Guid id)
    {
        var p = await _db.Promotions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound();
        return Ok(ToDto(p, DateOnly.FromDateTime(DateTime.UtcNow.Date)));
    }

    [HttpPost]
    public async Task<ActionResult<PromotionDto>> Create([FromBody] CreatePromotionRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Code) || string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Code and Name are required" });

        if (await _db.Promotions.AnyAsync(p => p.Code == req.Code))
            return Conflict(new { message = $"Promotion code '{req.Code}' already exists" });

        if (req.EndDate < req.StartDate)
            return BadRequest(new { message = "End date must be after start date" });

        var promo = new Promotion
        {
            Code = req.Code.Trim(),
            Name = req.Name.Trim(),
            Description = req.Description?.Trim(),
            DiscountPct = req.DiscountPct,
            DiscountAmount = req.DiscountAmount,
            StartDate = req.StartDate,
            EndDate = req.EndDate,
        };

        _db.Promotions.Add(promo);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = promo.Id }, ToDto(promo, DateOnly.FromDateTime(DateTime.UtcNow.Date)));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PromotionDto>> Update(Guid id, [FromBody] UpdatePromotionRequest req)
    {
        var promo = await _db.Promotions.FirstOrDefaultAsync(p => p.Id == id);
        if (promo is null) return NotFound();

        if (req.EndDate < req.StartDate)
            return BadRequest(new { message = "End date must be after start date" });

        promo.Name = req.Name.Trim();
        promo.Description = req.Description?.Trim();
        promo.DiscountPct = req.DiscountPct;
        promo.DiscountAmount = req.DiscountAmount;
        promo.StartDate = req.StartDate;
        promo.EndDate = req.EndDate;
        promo.IsActive = req.IsActive;

        await _db.SaveChangesAsync();
        return Ok(ToDto(promo, DateOnly.FromDateTime(DateTime.UtcNow.Date)));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var promo = await _db.Promotions.FirstOrDefaultAsync(p => p.Id == id);
        if (promo is null) return NotFound();

        _db.Promotions.Remove(promo);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static PromotionDto ToDto(Promotion p, DateOnly today) => new(
        p.Id, p.Code, p.Name, p.Description,
        p.DiscountPct, p.DiscountAmount,
        p.StartDate, p.EndDate, p.IsActive,
        p.IsActive && p.StartDate <= today && p.EndDate >= today,
        p.CreatedAt, p.UpdatedAt);
}
