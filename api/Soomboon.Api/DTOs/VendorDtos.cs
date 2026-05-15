namespace Soomboon.Api.DTOs;

public record VendorListItemDto(
    Guid Id,
    string Code,
    string Name,
    string? ContactName,
    string? Phone,
    string PaymentTerms,
    int ProductCount,
    bool IsActive,
    DateTime UpdatedAt
);

public record VendorDetailDto(
    Guid Id,
    string Code,
    string Name,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Address,
    string? TaxId,
    string PaymentTerms,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateVendorRequest(
    string Code,
    string Name,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Address,
    string? TaxId,
    string PaymentTerms
);

public record UpdateVendorRequest(
    string Name,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Address,
    string? TaxId,
    string PaymentTerms,
    bool IsActive
);
