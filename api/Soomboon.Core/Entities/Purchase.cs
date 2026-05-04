using Soomboon.Core.Common;

namespace Soomboon.Core.Entities;

public enum PrStatus { Pending, Approved, Rejected, Converted }
public enum PoStatus { Pending, Partial, Received, Cancelled }
public enum ReceivingStatus { Complete, Partial }

public class PurchaseRequest : BaseEntity
{
    public string PrNo { get; set; } = string.Empty;
    public DateTime PrDate { get; set; } = DateTime.UtcNow.Date;
    public Guid? RequesterId { get; set; }
    public Employee? Requester { get; set; }
    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }
    public PrStatus Status { get; set; } = PrStatus.Pending;
    public string? Note { get; set; }
    public ICollection<PurchaseRequestItem> Items { get; set; } = new List<PurchaseRequestItem>();
}

public class PurchaseRequestItem : BaseEntity
{
    public Guid PurchaseRequestId { get; set; }
    public PurchaseRequest PurchaseRequest { get; set; } = null!;
    public Guid? ProductId { get; set; }
    public Product? Product { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int? CurrentStock { get; set; }
    public string? Note { get; set; }
    public int LineNo { get; set; }
}

public class PurchaseOrder : BaseEntity
{
    public string PoNo { get; set; } = string.Empty;
    public DateTime PoDate { get; set; } = DateTime.UtcNow.Date;
    public Guid? VendorId { get; set; }
    public Vendor? Vendor { get; set; }
    public Guid? PurchaseRequestId { get; set; }
    public PurchaseRequest? PurchaseRequest { get; set; }
    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }
    public string? ShipTo { get; set; }
    public string? PaymentTerms { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Vat { get; set; }
    public decimal Total { get; set; }
    public PoStatus Status { get; set; } = PoStatus.Pending;
    public string? Note { get; set; }
    public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
    public ICollection<Receiving> Receivings { get; set; } = new List<Receiving>();
}

public class PurchaseOrderItem : BaseEntity
{
    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public Guid? ProductId { get; set; }
    public Product? Product { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductCode { get; set; }
    public int Quantity { get; set; }
    public int ReceivedQuantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
    public int LineNo { get; set; }
}

public class Receiving : BaseEntity
{
    public string ReceivingNo { get; set; } = string.Empty;
    public DateTime ReceivingDate { get; set; } = DateTime.UtcNow.Date;
    public Guid? PurchaseOrderId { get; set; }
    public PurchaseOrder? PurchaseOrder { get; set; }
    public Guid? VendorId { get; set; }
    public Vendor? Vendor { get; set; }
    public string? VendorInvoiceNo { get; set; }
    public decimal Amount { get; set; }
    public Guid? ReceiverId { get; set; }
    public Employee? Receiver { get; set; }
    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }
    public ReceivingStatus Status { get; set; } = ReceivingStatus.Complete;
    public string? AttachmentUrl { get; set; }
    public string? Note { get; set; }
    public ICollection<ReceivingItem> Items { get; set; } = new List<ReceivingItem>();
}

public class ReceivingItem : BaseEntity
{
    public Guid ReceivingId { get; set; }
    public Receiving Receiving { get; set; } = null!;
    public Guid? PurchaseOrderItemId { get; set; }
    public PurchaseOrderItem? PurchaseOrderItem { get; set; }
    public Guid? ProductId { get; set; }
    public Product? Product { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int? OrderedQty { get; set; }
    public int ReceivedQty { get; set; }
    public decimal? UnitPrice { get; set; }
    public int LineNo { get; set; }
}
