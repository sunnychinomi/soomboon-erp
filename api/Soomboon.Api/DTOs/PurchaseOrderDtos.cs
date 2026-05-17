using Soomboon.Core.Entities;

namespace Soomboon.Api.DTOs;

public record PurchaseOrderListItemDto(
    Guid Id,
    string PoNo,
    DateTime PoDate,
    Guid? VendorId,
    string? VendorName,
    Guid? BranchId,
    string? BranchName,
    int ItemCount,
    decimal Total,
    PoStatus Status,
    DateTime CreatedAt
);

public record PurchaseOrderItemDto(
    Guid Id,
    Guid? ProductId,
    string ProductName,
    string? ProductCode,
    int Quantity,
    int ReceivedQuantity,
    decimal UnitPrice,
    decimal Total,
    int LineNo
);

public record PurchaseOrderDetailDto(
    Guid Id,
    string PoNo,
    DateTime PoDate,
    Guid? VendorId,
    string? VendorName,
    string? VendorAddress,
    string? VendorPhone,
    string? VendorTaxId,
    Guid? BranchId,
    string? BranchName,
    string? ShipTo,
    string? PaymentTerms,
    decimal Subtotal,
    decimal Discount,
    decimal Vat,
    decimal Total,
    PoStatus Status,
    string? Note,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<PurchaseOrderItemDto> Items
);

public record CreatePoItemRequest(
    Guid? ProductId,
    string ProductName,
    string? ProductCode,
    int Quantity,
    decimal UnitPrice
);

public record CreatePurchaseOrderRequest(
    DateTime? PoDate,
    Guid VendorId,
    Guid? BranchId,
    string? ShipTo,
    string? PaymentTerms,
    decimal Discount,
    decimal VatRate, // e.g., 7 for 7%
    string? Note,
    IReadOnlyList<CreatePoItemRequest> Items
);

public record UpdatePurchaseOrderRequest(
    DateTime PoDate,
    Guid VendorId,
    Guid? BranchId,
    string? ShipTo,
    string? PaymentTerms,
    decimal Discount,
    decimal VatRate,
    string? Note,
    IReadOnlyList<CreatePoItemRequest> Items
);
