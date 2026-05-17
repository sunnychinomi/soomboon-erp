using Soomboon.Core.Entities;

namespace Soomboon.Api.DTOs;

public record ReceiptListItemDto(
    Guid Id,
    string ReceiptNo,
    DateTime ReceiptDate,
    Guid? SalesOrderId,
    string? InvoiceNo,
    Guid? CustomerId,
    string CustomerName,
    decimal Amount,
    PaymentMethod PaymentMethod,
    string? PaymentReference,
    string? Note,
    DateTime CreatedAt
);

public record CreateReceiptRequest(
    Guid SalesOrderId,
    DateTime? ReceiptDate,
    decimal Amount,
    PaymentMethod PaymentMethod,
    string? PaymentReference,
    string? Note
);
