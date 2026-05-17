using Soomboon.Core.Entities;

namespace Soomboon.Api.DTOs;

public record SalesOrderListItemDto(
    Guid Id,
    string InvoiceNo,
    DateTime OrderDate,
    Guid? CustomerId,
    string CustomerName,
    Guid? BranchId,
    string? BranchName,
    int ItemCount,
    decimal Total,
    decimal PaidAmount,
    decimal Balance,
    SalesOrderStatus Status,
    DateTime? DueDate,
    DateTime CreatedAt
);

public record SalesOrderItemDto(
    Guid Id,
    Guid? ProductId,
    string ProductName,
    string? ProductCode,
    int Quantity,
    decimal UnitPrice,
    decimal DiscountPct,
    decimal DiscountAmount,
    Guid? PromotionId,
    string? PromotionName,
    decimal Total,
    int LineNo
);

public record SalesOrderDetailDto(
    Guid Id,
    string InvoiceNo,
    DateTime OrderDate,
    Guid? CustomerId,
    string CustomerName,
    string? CustomerAddress,
    string? CustomerPhone,
    string? CustomerTaxId,
    Guid? BranchId,
    string? BranchName,
    Guid? SalespersonId,
    string? SalespersonName,
    string? PaymentMethod,
    string? PaymentTerms,
    DateTime? DueDate,
    decimal Subtotal,
    decimal Discount,
    decimal Vat,
    decimal Total,
    decimal PaidAmount,
    decimal Balance,
    SalesOrderStatus Status,
    string? Note,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyList<SalesOrderItemDto> Items,
    IReadOnlyList<ReceiptListItemDto> Receipts
);

public record CreateSoItemRequest(
    Guid? ProductId,
    string ProductName,
    string? ProductCode,
    int Quantity,
    decimal UnitPrice,
    decimal DiscountPct,
    decimal DiscountAmount,
    Guid? PromotionId
);

public record CreateSalesOrderRequest(
    DateTime? OrderDate,
    Guid CustomerId,
    Guid? BranchId,
    Guid? SalespersonId,
    string? PaymentMethod,
    string? PaymentTerms,
    DateTime? DueDate,
    decimal Discount,
    decimal VatRate,
    string? Note,
    IReadOnlyList<CreateSoItemRequest> Items
);
