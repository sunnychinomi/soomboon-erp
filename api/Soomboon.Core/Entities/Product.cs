using Soomboon.Core.Common;

namespace Soomboon.Core.Entities;

public enum ProductType { Genuine, Aftermarket }

public class Product : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? Category { get; set; }
    public string? Brand { get; set; }
    public string? PartNumberOem { get; set; }
    public string? PartNumberVendor { get; set; }
    public string? CarModel { get; set; }
    public string? CarBrand { get; set; }
    public ProductType Type { get; set; } = ProductType.Aftermarket;
    public string Unit { get; set; } = "ชิ้น";
    public decimal Cost { get; set; }
    public decimal Price { get; set; }
    public int ReorderLevel { get; set; } = 5;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;

    public Guid? PrimaryVendorId { get; set; }
    public Vendor? PrimaryVendor { get; set; }

    public ICollection<Stock> Stocks { get; set; } = new List<Stock>();
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public ICollection<PriceHistory> PriceHistories { get; set; } = new List<PriceHistory>();
}
