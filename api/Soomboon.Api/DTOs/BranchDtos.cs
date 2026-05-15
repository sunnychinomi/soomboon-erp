namespace Soomboon.Api.DTOs;

public record BranchDto(
    Guid Id,
    string Code,
    string Name,
    string? Address,
    string? Phone,
    bool IsHeadquarters,
    int EmployeeCount,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateBranchRequest(
    string Code,
    string Name,
    string? Address,
    string? Phone,
    bool IsHeadquarters
);

public record UpdateBranchRequest(
    string Name,
    string? Address,
    string? Phone,
    bool IsHeadquarters,
    bool IsActive
);
