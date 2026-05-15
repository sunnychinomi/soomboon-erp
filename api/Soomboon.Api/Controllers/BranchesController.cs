using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Soomboon.Api.DTOs;
using Soomboon.Core.Entities;
using Soomboon.Infrastructure.Data;

namespace Soomboon.Api.Controllers;

[ApiController]
[Route("api/branches")]
[Authorize]
public class BranchesController : ControllerBase
{
    private readonly AppDbContext _db;
    public BranchesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BranchDto>>> Get([FromQuery] string? search)
    {
        var query = _db.Branches.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(b =>
                b.Name.ToLower().Contains(s) ||
                b.Code.ToLower().Contains(s));
        }

        var items = await query
            .OrderByDescending(b => b.IsHeadquarters)
            .ThenBy(b => b.Code)
            .Select(b => new BranchDto(
                b.Id, b.Code, b.Name, b.Address, b.Phone,
                b.IsHeadquarters,
                b.Employees.Count(e => !e.IsDeleted),
                b.IsActive, b.CreatedAt, b.UpdatedAt))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BranchDto>> GetById(Guid id)
    {
        var b = await _db.Branches.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new BranchDto(
                x.Id, x.Code, x.Name, x.Address, x.Phone,
                x.IsHeadquarters,
                x.Employees.Count(e => !e.IsDeleted),
                x.IsActive, x.CreatedAt, x.UpdatedAt))
            .FirstOrDefaultAsync();

        return b is null ? NotFound() : Ok(b);
    }

    [HttpPost]
    public async Task<ActionResult<BranchDto>> Create([FromBody] CreateBranchRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Code) || string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Code and Name are required" });

        if (await _db.Branches.AnyAsync(b => b.Code == req.Code))
            return Conflict(new { message = $"Branch with code '{req.Code}' already exists" });

        // Only one HQ allowed
        if (req.IsHeadquarters && await _db.Branches.AnyAsync(b => b.IsHeadquarters))
            return BadRequest(new { message = "Headquarters already exists. Only one HQ is allowed." });

        var branch = new Branch
        {
            Code = req.Code.Trim(),
            Name = req.Name.Trim(),
            Address = req.Address?.Trim(),
            Phone = req.Phone?.Trim(),
            IsHeadquarters = req.IsHeadquarters
        };

        _db.Branches.Add(branch);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = branch.Id }, new BranchDto(
            branch.Id, branch.Code, branch.Name, branch.Address, branch.Phone,
            branch.IsHeadquarters, 0, branch.IsActive, branch.CreatedAt, branch.UpdatedAt));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BranchDto>> Update(Guid id, [FromBody] UpdateBranchRequest req)
    {
        var branch = await _db.Branches.FirstOrDefaultAsync(b => b.Id == id);
        if (branch is null) return NotFound();

        if (req.IsHeadquarters && !branch.IsHeadquarters
            && await _db.Branches.AnyAsync(b => b.Id != id && b.IsHeadquarters))
            return BadRequest(new { message = "Another branch is already HQ. Only one HQ is allowed." });

        branch.Name = req.Name.Trim();
        branch.Address = req.Address?.Trim();
        branch.Phone = req.Phone?.Trim();
        branch.IsHeadquarters = req.IsHeadquarters;
        branch.IsActive = req.IsActive;

        await _db.SaveChangesAsync();

        var count = await _db.Employees.CountAsync(e => e.BranchId == id && !e.IsDeleted);
        return Ok(new BranchDto(branch.Id, branch.Code, branch.Name, branch.Address, branch.Phone,
            branch.IsHeadquarters, count, branch.IsActive, branch.CreatedAt, branch.UpdatedAt));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var branch = await _db.Branches.FirstOrDefaultAsync(b => b.Id == id);
        if (branch is null) return NotFound();

        if (branch.IsHeadquarters)
            return BadRequest(new { message = "ไม่สามารถลบสำนักงานใหญ่ได้" });

        var hasEmployees = await _db.Employees.AnyAsync(e => e.BranchId == id && !e.IsDeleted);
        if (hasEmployees)
            return BadRequest(new { message = "ไม่สามารถลบสาขาที่ยังมีพนักงานสังกัดอยู่ได้" });

        branch.IsDeleted = true;
        branch.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
