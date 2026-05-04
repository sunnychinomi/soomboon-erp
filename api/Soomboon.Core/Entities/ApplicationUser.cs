using Microsoft.AspNetCore.Identity;

namespace Soomboon.Core.Entities;

public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
    public Guid? EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ApplicationRole : IdentityRole
{
    public string? Description { get; set; }
}
