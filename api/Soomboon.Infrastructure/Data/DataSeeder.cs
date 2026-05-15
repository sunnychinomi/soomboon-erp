using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Soomboon.Core.Entities;

namespace Soomboon.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider sp)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        try
        {
            // Skip if already seeded
            if (await db.Branches.AnyAsync())
            {
                logger.LogInformation("Seed data already exists, skipping...");
                return;
            }

            logger.LogInformation("Seeding initial data...");

            // 1. BRANCHES
            var hq = new Branch
            {
                Code = "BR01",
                Name = "สาขาอรัญประเทศ",
                Address = "29,31 ถ.ราษฎร์อุทิศ ต.อรัญประเทศ จ.สระแก้ว 27120",
                Phone = "037-231-XXX",
                IsHeadquarters = true
            };
            var br02 = new Branch
            {
                Code = "BR02",
                Name = "สาขาสระแก้ว",
                Address = "112 ถ.สุวรรณศร ต.สระแก้ว อ.เมือง จ.สระแก้ว 27000",
                Phone = "037-241-XXX"
            };
            var br03 = new Branch
            {
                Code = "BR03",
                Name = "สาขาวัฒนานคร",
                Address = "87/2 ถ.สุวรรณศร ต.วัฒนานคร จ.สระแก้ว 27160",
                Phone = "037-261-XXX"
            };
            db.Branches.AddRange(hq, br02, br03);

            // 2. EMPLOYEES
            db.Employees.AddRange(
                new Employee { Code = "E001", Name = "เบญจทิพย์ ชิโนมิ", Position = "เจ้าของกิจการ", Branch = hq, Phone = "081-XXX-1234" },
                new Employee { Code = "E002", Name = "สมชาย รักดี", Position = "พนักงานขาย", Branch = hq, Phone = "089-XXX-5678" },
                new Employee { Code = "E003", Name = "มาลี สวยงาม", Position = "เจ้าหน้าที่บัญชี", Branch = hq, Phone = "086-XXX-9012" },
                new Employee { Code = "E004", Name = "วิทยา ขยันเรียน", Position = "เจ้าหน้าที่คลัง", Branch = br02, Phone = "092-XXX-3456" },
                new Employee { Code = "E005", Name = "พรทิพย์ มีชัย", Position = "ลูกค้าสัมพันธ์", Branch = hq, Phone = "083-XXX-7890" },
                new Employee { Code = "E006", Name = "ธีรพงษ์ จิตใส", Position = "พนักงานขาย", Branch = br03, Phone = "084-XXX-2345" }
            );

            // 3. VENDORS
            var v1 = new Vendor { Code = "V001", Name = "บริษัท เกียรติยนต์อะไหล่ จำกัด", ContactName = "คุณประยูร", Phone = "02-XXX-1234", PaymentTerms = "30 วัน" };
            var v2 = new Vendor { Code = "V002", Name = "ห้างหุ้นส่วน สมศักดิ์การยนต์", ContactName = "คุณสมศักดิ์", Phone = "037-XXX-456", PaymentTerms = "15 วัน" };
            var v3 = new Vendor { Code = "V003", Name = "บริษัท เอเซีย พาร์ทส์ จำกัด", ContactName = "คุณวิภา", Phone = "02-XXX-7890", PaymentTerms = "45 วัน" };
            var v4 = new Vendor { Code = "V004", Name = "ร้านชัยรุ่งเรืองยนต์", ContactName = "คุณชัย", Phone = "037-XXX-321", PaymentTerms = "เงินสด" };
            var v5 = new Vendor { Code = "V005", Name = "บริษัท สยามมอเตอร์ จำกัด", ContactName = "คุณนิตยา", Phone = "02-XXX-5678", PaymentTerms = "30 วัน" };
            db.Vendors.AddRange(v1, v2, v3, v4, v5);

            // 4. CUSTOMERS
            db.Customers.AddRange(
                new Customer { Code = "C001", Name = "อู่ช่างเอ การาจ", Type = CustomerType.Company, Grade = CustomerGrade.A, Phone = "081-XXX-001", CreditTerms = "30 วัน", CreditLimit = 200000 },
                new Customer { Code = "C002", Name = "อู่สมบัติเซอร์วิส", Type = CustomerType.Company, Grade = CustomerGrade.A, Phone = "081-XXX-002", CreditTerms = "30 วัน", CreditLimit = 150000 },
                new Customer { Code = "C003", Name = "คุณวิชัย ใจดี", Type = CustomerType.Individual, Grade = CustomerGrade.B, Phone = "081-XXX-003", CreditTerms = "เงินสด" },
                new Customer { Code = "C004", Name = "หจก. ทรัพย์ทวีอะไหล่", Type = CustomerType.Company, Grade = CustomerGrade.A, Phone = "081-XXX-004", CreditTerms = "30 วัน", CreditLimit = 300000 },
                new Customer { Code = "C005", Name = "บริษัท คาราวานเซอร์วิส จำกัด", Type = CustomerType.Company, Grade = CustomerGrade.A, Phone = "081-XXX-005", CreditTerms = "30 วัน", CreditLimit = 500000 },
                new Customer { Code = "C006", Name = "อู่ธนกฤตยนต์", Type = CustomerType.Company, Grade = CustomerGrade.B, Phone = "081-XXX-006", CreditTerms = "15 วัน", CreditLimit = 50000 },
                new Customer { Code = "C007", Name = "คุณสมชาย รักษ์รถ", Type = CustomerType.Individual, Grade = CustomerGrade.C, Phone = "081-XXX-007", CreditTerms = "เงินสด" }
            );

            // 5. PRODUCTS
            var products = new[]
            {
                new Product { Code = "AP-2401", Name = "บังลมหม้อน้ำ Toyota Vios 2008", Brand = "Toyota", Type = ProductType.Genuine, Unit = "ชิ้น", Cost = 680, Price = 980, ReorderLevel = 5, CarBrand = "Toyota", CarModel = "Vios 2008", PrimaryVendor = v1 },
                new Product { Code = "AP-2402", Name = "กรองอากาศ Honda Civic FB", Brand = "Honda", Type = ProductType.Aftermarket, Unit = "ลูก", Cost = 240, Price = 420, ReorderLevel = 10, CarBrand = "Honda", CarModel = "Civic FB", PrimaryVendor = v5 },
                new Product { Code = "AP-2403", Name = "สายพานไทม์มิ่ง Mitsubishi Triton", Brand = "Mitsubishi", Type = ProductType.Genuine, Unit = "เส้น", Cost = 1450, Price = 2100, ReorderLevel = 5, CarBrand = "Mitsubishi", CarModel = "Triton", PrimaryVendor = v3 },
                new Product { Code = "AP-2404", Name = "หม้อน้ำ Isuzu D-Max 2.5", Brand = "Isuzu", Type = ProductType.Genuine, Unit = "ใบ", Cost = 3200, Price = 4500, ReorderLevel = 3, CarBrand = "Isuzu", CarModel = "D-Max 2.5", PrimaryVendor = v1 },
                new Product { Code = "AP-2405", Name = "แบตเตอรี่ GS 65D26L MF", Brand = "GS", Type = ProductType.Aftermarket, Unit = "ลูก", Cost = 2100, Price = 2890, ReorderLevel = 5, CarBrand = "Universal", PrimaryVendor = v4 },
                new Product { Code = "AP-2406", Name = "ผ้าเบรกหน้า Toyota Vigo", Brand = "Toyota", Type = ProductType.Aftermarket, Unit = "ชุด", Cost = 520, Price = 790, ReorderLevel = 8, CarBrand = "Toyota", CarModel = "Vigo", PrimaryVendor = v2 },
                new Product { Code = "AP-2407", Name = "น้ำมันเครื่อง Mobil 1 5W-30 4L", Brand = "Mobil", Type = ProductType.Aftermarket, Unit = "ขวด", Cost = 980, Price = 1450, ReorderLevel = 20, CarBrand = "Universal", PrimaryVendor = v3 },
                new Product { Code = "AP-2408", Name = "โช้คอัพหน้า KYB Vigo Champ", Brand = "KYB", Type = ProductType.Aftermarket, Unit = "คู่", Cost = 1850, Price = 2680, ReorderLevel = 5, CarBrand = "Toyota", CarModel = "Vigo Champ", PrimaryVendor = v5 },
                new Product { Code = "AP-2409", Name = "ลูกหมาก Camry ACV40", Brand = "555", Type = ProductType.Aftermarket, Unit = "ตัว", Cost = 380, Price = 580, ReorderLevel = 8, CarBrand = "Toyota", CarModel = "Camry ACV40", PrimaryVendor = v1 },
                new Product { Code = "AP-2410", Name = "ปั๊มน้ำ Nissan Navara", Brand = "GMB", Type = ProductType.Aftermarket, Unit = "ตัว", Cost = 1280, Price = 1890, ReorderLevel = 4, CarBrand = "Nissan", CarModel = "Navara", PrimaryVendor = v4 },
                new Product { Code = "AP-2411", Name = "กรองน้ำมันเครื่อง C-1107", Brand = "Denso", Type = ProductType.Aftermarket, Unit = "ลูก", Cost = 80, Price = 120, ReorderLevel = 20, CarBrand = "Toyota", PrimaryVendor = v2 },
                new Product { Code = "AP-2412", Name = "หัวเทียน NGK Iridium IX", Brand = "NGK", Type = ProductType.Aftermarket, Unit = "หัว", Cost = 180, Price = 250, ReorderLevel = 15, CarBrand = "Universal", PrimaryVendor = v5 }
            };
            db.Products.AddRange(products);

            await db.SaveChangesAsync();

            // 6. INITIAL STOCK
            var stockData = new (string code, int qty, Branch branch)[]
            {
                ("AP-2401", 24, hq), ("AP-2402", 8, hq), ("AP-2403", 15, br02),
                ("AP-2404", 3, hq),  ("AP-2405", 42, br03), ("AP-2406", 0, hq),
                ("AP-2407", 67, hq), ("AP-2408", 11, br02), ("AP-2409", 18, hq),
                ("AP-2410", 5, hq),  ("AP-2411", 32, hq),   ("AP-2412", 48, hq)
            };

            foreach (var (code, qty, branch) in stockData)
            {
                var product = products.First(p => p.Code == code);
                db.Stocks.Add(new Stock { Product = product, Branch = branch, Quantity = qty });
            }

            // 7. PROMOTIONS
            var today = DateOnly.FromDateTime(DateTime.Today);
            db.Promotions.AddRange(
                new Promotion { Code = "PRM-001", Name = "ส่วนลดน้ำมันเครื่อง", Description = "ลด 15% สำหรับน้ำมันเครื่องทุกยี่ห้อ", DiscountPct = 15, StartDate = today.AddDays(-30), EndDate = today.AddDays(30) },
                new Promotion { Code = "PRM-002", Name = "แบตเตอรี่ลดราคา", Description = "ลด ฿200 เมื่อซื้อแบตเตอรี่", DiscountAmount = 200, StartDate = today.AddDays(-15), EndDate = today.AddDays(45) },
                new Promotion { Code = "PRM-003", Name = "ผ้าเบรกชุดคู่ลด 10%", Description = "ส่วนลด 10% เมื่อซื้อผ้าเบรกหน้า+หลังพร้อมกัน", DiscountPct = 10, StartDate = today.AddDays(7), EndDate = today.AddDays(60) }
            );

            await db.SaveChangesAsync();

            logger.LogInformation("✅ Seed data created successfully: {Branches} branches, {Vendors} vendors, {Customers} customers, {Products} products, {Stocks} stocks",
                3, 5, 7, products.Length, stockData.Length);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ Error seeding data: {Message}", ex.Message);
            throw;
        }
    }
}
