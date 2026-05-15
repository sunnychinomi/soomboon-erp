using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Soomboon.Api.DTOs;
using Soomboon.Core.Common;
using Soomboon.Core.Entities;
using Soomboon.Infrastructure.Data;

namespace Soomboon.Api.Controllers;

[ApiController]
[Route("api/employees")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _db;
    public EmployeesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<PagedResult<EmployeeDto>>> Get(
        [FromQuery] PagingQuery q,
        [FromQuery] Guid? branchId)
    {
        var query = _db.Employees.AsNoTracking()
            .Include(e => e.Branch)
            .AsQueryable();

        if (branchId.HasValue)
            query = query.Where(e => e.BranchId == branchId.Value);

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim().ToLower();
            query = query.Where(e =>
                e.Name.ToLower().Contains(s) ||
                e.Code.ToLower().Contains(s) ||
                (e.Position != null && e.Position.ToLower().Contains(s)) ||
                (e.Phone != null && e.Phone.Contains(s)));
        }

        query = query.OrderBy(e => e.Code);

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(e => new EmployeeDto(
                e.Id, e.Code, e.Name, e.Position,
                e.BranchId, e.Branch == null ? null : e.Branch.Name,
                e.Phone, e.Email, e.IsActive, e.CreatedAt, e.UpdatedAt))
            .ToListAsync();

        return Ok(PagedResult<EmployeeDto>.Create(items, total, q.Page, q.PageSize));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EmployeeDto>> GetById(Guid id)
    {
        var e = await _db.Employees.AsNoTracking()
            .Include(x => x.Branch)
            .FirstOrDefaultAsync(x => x.Id == id);

        return e is null ? NotFound() : Ok(ToDto(e));
    }

    [HttpPost]
    public async Task<ActionResult<EmployeeDto>> Create([FromBody] CreateEmployeeRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Code) || string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Code and Name are required" });

        if (await _db.Employees.AnyAsync(e => e.Code == req.Code))
            return Conflict(new { message = $"Employee with code '{req.Code}' already exists" });

        if (req.BranchId.HasValue && !await _db.Branches.AnyAsync(b => b.Id == req.BranchId.Value))
            return BadRequest(new { message = "Branch not found" });

        var employee = new Employee
        {
            Code = req.Code.Trim(),
            Name = req.Name.Trim(),
            Position = req.Position?.Trim(),
            BranchId = req.BranchId,
            Phone = req.Phone?.Trim(),
            Email = req.Email?.Trim()
        };

        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();

        await _db.Entry(employee).Reference(e => e.Branch).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = employee.Id }, ToDto(employee));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EmployeeDto>> Update(Guid id, [FromBody] UpdateEmployeeRequest req)
    {
        var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == id);
        if (employee is null) return NotFound();

        if (req.BranchId.HasValue && !await _db.Branches.AnyAsync(b => b.Id == req.BranchId.Value))
            return BadRequest(new { message = "Branch not found" });

        employee.Name = req.Name.Trim();
        employee.Position = req.Position?.Trim();
        employee.BranchId = req.BranchId;
        employee.Phone = req.Phone?.Trim();
        employee.Email = req.Email?.Trim();
        employee.IsActive = req.IsActive;

        await _db.SaveChangesAsync();
        await _db.Entry(employee).Reference(e => e.Branch).LoadAsync();
        return Ok(ToDto(employee));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var employee = await _db.Employees.FirstOrDefaultAsync(e => e.Id == id);
        if (employee is null) return NotFound();

        employee.IsDeleted = true;
        employee.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static EmployeeDto ToDto(Employee e) => new(
        e.Id, e.Code, e.Name, e.Position,
        e.BranchId, e.Branch?.Name, e.Phone, e.Email,
        e.IsActive, e.CreatedAt, e.UpdatedAt);
}
