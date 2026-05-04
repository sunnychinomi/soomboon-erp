using Soomboon.Core.Common;

namespace Soomboon.Core.Entities;

public enum SalesOrderStatus { Unpaid, Partial, Paid, Cancelled }
public enum PaymentMethod { Cash, Transfer, Cheque, CreditCard }

public class SalesOrder : BaseEntity
{
    public string InvoiceNo { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; } = DateTime.UtcNow.Date;

    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string CustomerName { get; set; } = string.Empty;

    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public Guid? SalespersonId { get; set; }
    public Employee? Salesperson { get; set; }

    public string? PaymentTerms { get; set; }
    public DateTime? DueDate { get; set; }

    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Vat { get; set; }
    public decimal Total { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal Balance => Total - PaidAmount;

    public SalesOrderStatus Status { get; set; } = SalesOrderStatus.Unpaid;
    public string? Note { get; set; }

    public ICollection<SalesOrderItem> Items { get; set; } = new List<SalesOrderItem>();
    public ICollection<Receipt> Receipts { get; set; } = new List<Receipt>();
}

public class SalesOrderItem : BaseEntity
{
    public Guid SalesOrderId { get; set; }
    public SalesOrder SalesOrder { get; set; } = null!;

    public Guid? ProductId { get; set; }
    public Product? Product { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public string? ProductCode { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPct { get; set; }
    public decimal DiscountAmount { get; set; }
    public Guid? PromotionId { get; set; }
    public decimal Total { get; set; }
    public int LineNo { get; set; }
}

public class Receipt : BaseEntity
{
    public string ReceiptNo { get; set; } = string.Empty;
    public DateTime ReceiptDate { get; set; } = DateTime.UtcNow.Date;

    public Guid? SalesOrderId { get; set; }
    public SalesOrder? SalesOrder { get; set; }

    public Guid? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string? PaymentReference { get; set; }
    public string? Note { get; set; }
}

public class Promotion : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? DiscountPct { get; set; }
    public decimal? DiscountAmount { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CreditNote : BaseEntity
{
    public string CnNo { get; set; } = string.Empty;
    public DateTime CnDate { get; set; } = DateTime.UtcNow.Date;
    public Guid? ReferenceInvoiceId { get; set; }
    public SalesOrder? ReferenceInvoice { get; set; }
    public Guid? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}
