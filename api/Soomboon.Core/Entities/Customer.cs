using Soomboon.Core.Common;

namespace Soomboon.Core.Entities;

public enum CustomerType { Individual, Company }
public enum CustomerGrade { A, B, C }

public class Customer : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public CustomerType Type { get; set; } = CustomerType.Individual;
    public CustomerGrade Grade { get; set; } = CustomerGrade.C;
    public string? ContactName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? TaxId { get; set; }
    public string? CreditTerms { get; set; }
    public decimal CreditLimit { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
}
