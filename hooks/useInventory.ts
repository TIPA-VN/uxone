import { useQuery } from '@tanstack/react-query';

interface InventoryFilters {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  businessUnit?: string;
  glClass?: string;
}

interface JDEInventoryLevel {
  IMITM: string;    // Item Number
  IMLITM: string;   // Item Description
  IMTYP: string;    // Item Type
  IMUM: string;     // Unit of Measure (legacy field)
  IMUOM1: string;   // Primary UOM (from F4101)
  IMUOM3: string;   // Purchasing UOM (from F4101)
  IMSSQ: number;    // Safety Stock
  IMMOQ: number;    // Minimum Order Quantity
  IMMXQ: number;    // Maximum Order Quantity
  IMLOTS: number;   // Lot Size
  IMCC: string;     // Cost Center
  IMPL: string;     // Planner
  IMBUY: string;    // Buyer
  IMGLPT: string;   // General Ledger Posting Type
  LIMCU: string;    // Business Unit
  
  // Stock Levels
  TotalQOH: number;           // Total Quantity On Hand
  TotalQOO: number;           // Total Quantity On Order
  TotalQC: number;            // Total Quantity Committed
  TotalHardCommit: number;    // Total Hard Committed
  TotalSoftCommit: number;    // Total Soft Committed
  
  // Calculated Values
  AvailableStock: number;
  NetStock: number;
  
  // Status Logic
  StockStatus: string;
}

interface InventoryResponse {
  success: boolean;
  data: {
    inventoryLevels: JDEInventoryLevel[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    summary: {
      totalItems: number;
      inStock: number;
      lowStock: number;
      outOfStock: number;
      totalValue: number;
      timestamp: string;
    };
    cacheInfo?: {
      cachedAt: string;
      cacheAge: number;
      totalCachedItems: number;
    };
  };
}

const fetchInventoryData = async (filters: InventoryFilters): Promise<InventoryResponse> => {
  const params = new URLSearchParams({
    page: filters.page.toString(),
    pageSize: filters.pageSize.toString()
  });
  
  if (filters.search) {
    params.append('search', filters.search);
  }
  
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  
  if (filters.businessUnit && filters.businessUnit !== 'all') {
    params.append('businessUnit', filters.businessUnit);
  }
  
  if (filters.glClass && filters.glClass !== 'all') {
    params.append('glClass', filters.glClass);
  }
  
  // Use the cached endpoint for better performance
  const response = await fetch(`/api/jde/inventory/cached?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch inventory data');
  }
  
  return response.json();
};

export const useInventory = (filters: InventoryFilters) => {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => fetchInventoryData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    refetchOnWindowFocus: false,
  });
}; 