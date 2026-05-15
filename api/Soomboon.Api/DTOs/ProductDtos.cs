using Soomboon.Core.Entities;

namespace Soomboon.Api.DTOs;

public record ProductListItemDto(
    Guid Id,
    string Code,
    string Name,
    string? NameEn,
    string? Brand,
    string? Category,
    ProductType Type,
    string Unit,
    decimal Cost,
    decimal Price,
    int ReorderLevel,
    Guid? PrimaryVendorId,
    string? PrimaryVendorName,
    DateTime UpdatedAt
);

public record ProductDetailDto(
    Guid Id,
    string Code,
    string Name,
    string? NameEn,
    string? Category,
    string? Brand,
    string? PartNumberOem,
    string? PartNumberVendor,
    string? CarModel,
    string? CarBrand,
    ProductType Type,
    string Unit,
    decimal Cost,
    decimal Price,
    int ReorderLevel,
    string? ImageUrl,
    Guid? PrimaryVendorId,
    string? PrimaryVendorName,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateProductRequest(
    string Code,
    string Name,
    string? NameEn,
    string? Category,
    string? Brand,
    string? PartNumberOem,
    string? PartNumberVendor,
    string? CarModel,
    string? CarBrand,
    ProductType Type,
    string Unit,
    decimal Cost,
    decimal Price,
    int ReorderLevel,
    Guid? PrimaryVendorId
);

public record UpdateProductRequest(
    string Name,
    string? NameEn,
    string? Category,
    string? Brand,
    string? PartNumberOem,
    string? PartNumberVendor,
    string? CarModel,
    string? CarBrand,
    ProductType Type,
    string Unit,
    decimal Cost,
    decimal Price,
    int ReorderLevel,
    Guid? PrimaryVendorId
);
