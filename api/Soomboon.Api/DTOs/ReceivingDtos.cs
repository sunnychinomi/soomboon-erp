using Soomboon.Core.Entities;

namespace Soomboon.Api.DTOs;

public record ReceivingListItemDto(
    Guid Id,
    string ReceivingNo,
    DateTime ReceivingDate,
    Guid? PurchaseOrderId,
    string? PurchaseOrderNo,
    Guid? VendorId,
    string? VendorName,
    string? VendorInvoiceNo,
    decimal Amount,
    Guid? BranchId,
    string? BranchName,
    int ItemCount,
    ReceivingStatus Status,
    DateTime CreatedAt
);

public record ReceivingItemDto(
    Guid Id,
    Guid? PurchaseOrderItemId,
    Guid? ProductId,
    string ProductName,
    int? OrderedQty,
    int ReceivedQty,
    decimal? UnitPrice,
    int LineNo
);

public record ReceivingDetailDto(
    Guid Id,
    string ReceivingNo,
    DateTime ReceivingDate,
    Guid? PurchaseOrderId,
    string? PurchaseOrderNo,
    Guid? VendorId,
    string? VendorName,
    string? VendorInvoiceNo,
    decimal Amount,
    Guid? BranchId,
    string? BranchName,
    ReceivingStatus Status,
    string? AttachmentUrl,
    string? Note,
    DateTime CreatedAt,
    IReadOnlyList<ReceivingItemDto> Items
);

public record CreateReceivingItemRequest(
    Guid PurchaseOrderItemId,
    int ReceivedQty
);

public record CreateReceivingRequest(
    Guid PurchaseOrderId,
    DateTime? ReceivingDate,
    string? VendorInvoiceNo,
    string? Note,
    string? AttachmentUrl,
    IReadOnlyList<CreateReceivingItemRequest> Items
);
