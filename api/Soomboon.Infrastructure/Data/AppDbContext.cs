using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Soomboon.Core.Entities;

namespace Soomboon.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Master
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Product> Products => Set<Product>();

    // Inventory
    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<PriceHistory> PriceHistories => Set<PriceHistory>();

    // Purchase
    public DbSet<PurchaseRequest> PurchaseRequests => Set<PurchaseRequest>();
    public DbSet<PurchaseRequestItem> PurchaseRequestItems => Set<PurchaseRequestItem>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();
    public DbSet<Receiving> Receivings => Set<Receiving>();
    public DbSet<ReceivingItem> ReceivingItems => Set<ReceivingItem>();

    // Sales
    public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
    public DbSet<SalesOrderItem> SalesOrderItems => Set<SalesOrderItem>();
    public DbSet<Receipt> Receipts => Set<Receipt>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<CreditNote> CreditNotes => Set<CreditNote>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Apply all configurations from this assembly
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Common conventions
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            // Decimal precision
            foreach (var prop in entityType.GetProperties())
            {
                if (prop.ClrType == typeof(decimal) || prop.ClrType == typeof(decimal?))
                {
                    prop.SetPrecision(15);
                    prop.SetScale(2);
                }
            }
        }

        // Unique indexes
        builder.Entity<Branch>().HasIndex(x => x.Code).IsUnique();
        builder.Entity<Employee>().HasIndex(x => x.Code).IsUnique();
        builder.Entity<Vendor>().HasIndex(x => x.Code).IsUnique();
        builder.Entity<Customer>().HasIndex(x => x.Code).IsUnique();
        builder.Entity<Product>().HasIndex(x => x.Code).IsUnique();
        builder.Entity<PurchaseOrder>().HasIndex(x => x.PoNo).IsUnique();
        builder.Entity<PurchaseRequest>().HasIndex(x => x.PrNo).IsUnique();
        builder.Entity<Receiving>().HasIndex(x => x.ReceivingNo).IsUnique();
        builder.Entity<SalesOrder>().HasIndex(x => x.InvoiceNo).IsUnique();
        builder.Entity<Receipt>().HasIndex(x => x.ReceiptNo).IsUnique();
        builder.Entity<Promotion>().HasIndex(x => x.Code).IsUnique();
        builder.Entity<CreditNote>().HasIndex(x => x.CnNo).IsUnique();

        // Stock unique on (Product, Branch)
        builder.Entity<Stock>().HasIndex(x => new { x.ProductId, x.BranchId }).IsUnique();

        // Soft delete filter
        builder.Entity<Branch>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Employee>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Vendor>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Customer>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Product>().HasQueryFilter(x => !x.IsDeleted);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<Soomboon.Core.Common.BaseEntity>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State == EntityState.Modified) entry.Entity.UpdatedAt = now;
        }
        return await base.SaveChangesAsync(ct);
    }
}
