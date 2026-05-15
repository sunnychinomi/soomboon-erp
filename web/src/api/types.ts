// Common API types

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PagingQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// Products
export type ProductType = 'Genuine' | 'Aftermarket';

export interface ProductListItem {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  brand: string | null;
  category: string | null;
  type: ProductType;
  unit: string;
  cost: number;
  price: number;
  reorderLevel: number;
  primaryVendorId: string | null;
  primaryVendorName: string | null;
  updatedAt: string;
}

export interface ProductDetail extends ProductListItem {
  partNumberOem: string | null;
  partNumberVendor: string | null;
  carModel: string | null;
  carBrand: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProductInput {
  code?: string;
  name: string;
  nameEn?: string | null;
  category?: string | null;
  brand?: string | null;
  partNumberOem?: string | null;
  partNumberVendor?: string | null;
  carModel?: string | null;
  carBrand?: string | null;
  type: ProductType;
  unit: string;
  cost: number;
  price: number;
  reorderLevel: number;
  primaryVendorId?: string | null;
}

// Customers
export type CustomerType = 'Individual' | 'Company';
export type CustomerGrade = 'A' | 'B' | 'C';

export interface CustomerListItem {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
  grade: CustomerGrade;
  contactName: string | null;
  phone: string | null;
  creditTerms: string | null;
  creditLimit: number;
  isActive: boolean;
  updatedAt: string;
}

export interface CustomerDetail extends CustomerListItem {
  email: string | null;
  address: string | null;
  taxId: string | null;
  createdAt: string;
}

export interface CustomerInput {
  code?: string;
  name: string;
  type: CustomerType;
  grade: CustomerGrade;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxId?: string | null;
  creditTerms?: string | null;
  creditLimit: number;
  isActive?: boolean;
}

// Vendors
export interface VendorListItem {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  paymentTerms: string;
  productCount: number;
  isActive: boolean;
  updatedAt: string;
}

export interface VendorDetail {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  paymentTerms: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorInput {
  code?: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxId?: string | null;
  paymentTerms: string;
  isActive?: boolean;
}

// Branches
export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  isHeadquarters: boolean;
  employeeCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchInput {
  code?: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isHeadquarters: boolean;
  isActive?: boolean;
}

// Stocks
export type StockStatus = 'ok' | 'low' | 'out';
export type MovementDirection = 'In' | 'Out' | 'Adjust';
export type MovementReferenceType = 'Receiving' | 'SalesOrder' | 'Manual' | 'Adjustment';

export interface StockListItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  brand: string | null;
  unit: string;
  cost: number;
  price: number;
  reorderLevel: number;
  branchId: string;
  branchCode: string;
  branchName: string;
  quantity: number;
  status: StockStatus;
  vendorName: string | null;
  updatedAt: string;
}

export interface AdjustStockInput {
  productId: string;
  branchId: string;
  newQuantity: number;
  note?: string | null;
}

export interface StockMovement {
  id: string;
  createdAt: string;
  direction: MovementDirection;
  productId: string;
  productCode: string;
  productName: string;
  branchId: string;
  branchName: string;
  quantity: number;
  unitPrice: number | null;
  referenceType: MovementReferenceType;
  referenceNo: string | null;
  note: string | null;
}

// Employees
export interface Employee {
  id: string;
  code: string;
  name: string;
  position: string | null;
  branchId: string | null;
  branchName: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeInput {
  code?: string;
  name: string;
  position?: string | null;
  branchId?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
}
