using Soomboon.Core.Common;

namespace Soomboon.Core.Entities;

public class Stock : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public int Quantity { get; set; }
}

public enum MovementDirection { In, Out, Adjust }
public enum MovementReferenceType { Receiving, SalesOrder, Manual, Adjustment }

public class StockMovement : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public MovementDirection Direction { get; set; }
    public int Quantity { get; set; }
    public decimal? UnitPrice { get; set; }
    public MovementReferenceType ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? ReferenceNo { get; set; }
    public string? Note { get; set; }
}

public class PriceHistory : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal? OldCost { get; set; }
    public decimal? NewCost { get; set; }
    public decimal? OldPrice { get; set; }
    public decimal? NewPrice { get; set; }
    public Guid? VendorId { get; set; }
    public Vendor? Vendor { get; set; }
}
