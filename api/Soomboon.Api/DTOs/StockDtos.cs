using Soomboon.Core.Entities;

namespace Soomboon.Api.DTOs;

public record StockListItemDto(
    Guid Id,
    Guid ProductId,
    string ProductCode,
    string ProductName,
    string? Brand,
    string Unit,
    decimal Cost,
    decimal Price,
    int ReorderLevel,
    Guid BranchId,
    string BranchCode,
    string BranchName,
    int Quantity,
    string Status,
    string? VendorName,
    DateTime UpdatedAt
);

public record AdjustStockRequest(
    Guid ProductId,
    Guid BranchId,
    int NewQuantity,
    string? Note
);

public record StockMovementDto(
    Guid Id,
    DateTime CreatedAt,
    MovementDirection Direction,
    Guid ProductId,
    string ProductCode,
    string ProductName,
    Guid BranchId,
    string BranchName,
    int Quantity,
    decimal? UnitPrice,
    MovementReferenceType ReferenceType,
    string? ReferenceNo,
    string? Note
);
