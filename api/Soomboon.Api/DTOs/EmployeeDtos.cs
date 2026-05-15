namespace Soomboon.Api.DTOs;

public record EmployeeDto(
    Guid Id,
    string Code,
    string Name,
    string? Position,
    Guid? BranchId,
    string? BranchName,
    string? Phone,
    string? Email,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateEmployeeRequest(
    string Code,
    string Name,
    string? Position,
    Guid? BranchId,
    string? Phone,
    string? Email
);

public record UpdateEmployeeRequest(
    string Name,
    string? Position,
    Guid? BranchId,
    string? Phone,
    string? Email,
    bool IsActive
);
