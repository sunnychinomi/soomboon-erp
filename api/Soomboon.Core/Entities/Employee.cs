using Soomboon.Core.Common;

namespace Soomboon.Core.Entities;

public class Employee : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Position { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; } = true;

    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }
}
