using Soomboon.Core.Entities;

namespace Soomboon.Api.DTOs;

public record CustomerListItemDto(
    Guid Id,
    string Code,
    string Name,
    CustomerType Type,
    CustomerGrade Grade,
    string? ContactName,
    string? Phone,
    string? CreditTerms,
    decimal CreditLimit,
    bool IsActive,
    DateTime UpdatedAt
);

public record CustomerDetailDto(
    Guid Id,
    string Code,
    string Name,
    CustomerType Type,
    CustomerGrade Grade,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Address,
    string? TaxId,
    string? CreditTerms,
    decimal CreditLimit,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateCustomerRequest(
    string Code,
    string Name,
    CustomerType Type,
    CustomerGrade Grade,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Address,
    string? TaxId,
    string? CreditTerms,
    decimal CreditLimit
);

public record UpdateCustomerRequest(
    string Name,
    CustomerType Type,
    CustomerGrade Grade,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Address,
    string? TaxId,
    string? CreditTerms,
    decimal CreditLimit,
    bool IsActive
);
