namespace Soomboon.Api.DTOs;

// PROMOTIONS
public record PromotionDto(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    decimal? DiscountPct,
    decimal? DiscountAmount,
    DateOnly StartDate,
    DateOnly EndDate,
    bool IsActive,
    bool IsCurrentlyActive, // computed: today between start/end & isActive
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreatePromotionRequest(
    string Code,
    string Name,
    string? Description,
    decimal? DiscountPct,
    decimal? DiscountAmount,
    DateOnly StartDate,
    DateOnly EndDate
);

public record UpdatePromotionRequest(
    string Name,
    string? Description,
    decimal? DiscountPct,
    decimal? DiscountAmount,
    DateOnly StartDate,
    DateOnly EndDate,
    bool IsActive
);

// CREDIT NOTES
public record CreditNoteListItemDto(
    Guid Id,
    string CnNo,
    DateTime CnDate,
    Guid? ReferenceInvoiceId,
    string? ReferenceInvoiceNo,
    Guid? CustomerId,
    string CustomerName,
    string Reason,
    decimal Amount,
    string? Note,
    DateTime CreatedAt
);

public record CreateCreditNoteRequest(
    DateTime? CnDate,
    Guid? ReferenceInvoiceId,
    Guid CustomerId,
    string Reason,
    decimal Amount,
    string? Note
);
