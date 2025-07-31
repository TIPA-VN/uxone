import { useQuery } from "@tanstack/react-query";

interface PurchaseOrdersParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  priority?: string;
  poNumber?: string; // Single PO search
  poRangeStart?: string; // PO range start
  poRangeEnd?: string; // PO range end
}

interface JDEPurchaseOrderHeader {
  PDDOCO: string;
  PDAN8: string;
  PDALPH: string;
  PDRQDC: number;   // Order Date (JDE Julian date)
  PHDRQJ: number;   // Request Date (JDE Julian date)
  PDPDDJ?: number;  // Promise Date (JDE Julian date)
  PDSTS: string;
  PDTOA: number;
  PDFAP: number;
  PDCNDJ: string;
  PDBUY: string;
  PHMCU: string;
  PHDCTO: string;
  lineItemCount: number;
  // Approval information (only second approver)
  HORPER?: number;
  HOARTG?: string;
  DB_NAME?: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status: "PENDING" | "PENDING_APPROVAL" | "PARTIALLY_APPROVED" | "APPROVED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  orderDate: number;  // JDE Julian date
  expectedDelivery: number | string;  // JDE Julian date or "TBD"
  items: number;
  createdBy: string;
  approvedBy?: string;
  businessUnit: string;
  poType: string;
  // Approval information (only second approver)
  approver2?: string;
  requiresApproval?: boolean;
}

interface PurchaseOrdersResponse {
  success: boolean;
  data: {
    purchaseOrders: JDEPurchaseOrderHeader[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  };
}

const fetchPurchaseOrders = async (params: PurchaseOrdersParams): Promise<{
  purchaseOrders: PurchaseOrder[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}> => {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  });

  // Add search parameters
  if (params.search) queryParams.append("search", params.search);
  if (params.status && params.status !== "all") queryParams.append("status", params.status);
  if (params.priority && params.priority !== "all") queryParams.append("priority", params.priority);
  
  // Add PO-specific search parameters
  if (params.poNumber) queryParams.append("poNumber", params.poNumber);
  if (params.poRangeStart) queryParams.append("poRangeStart", params.poRangeStart);
  if (params.poRangeEnd) queryParams.append("poRangeEnd", params.poRangeEnd);

  const response = await fetch(`/api/jde/purchase-orders/optimized?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch purchase orders");
  }

  const data: PurchaseOrdersResponse = await response.json();

  if (!data.success || !data.data.purchaseOrders) {
    throw new Error("Invalid response format");
  }

  // Convert JDE data to PurchaseOrder format
  const convertedOrders: PurchaseOrder[] = data.data.purchaseOrders.map(
    (po: JDEPurchaseOrderHeader, index: number) => ({
      id: `${po.PDDOCO}-${index}`, // Use PO number + index for unique ID
      poNumber: po.PDDOCO,
      supplier: po.PDALPH,
      status: po.PDSTS as any,
      totalAmount: po.PDTOA,
      orderDate: po.PDRQDC, // Pass through JDE Julian date
      expectedDelivery: po.PDPDDJ || "TBD", // Pass through JDE Julian date or "TBD"
      items: po.lineItemCount || 0,
      createdBy: po.PDBUY,
      approvedBy: po.PDBUY !== "BUYER1" ? "Manager" : undefined,
      businessUnit: po.PHMCU,
      poType: po.PHDCTO,
      // Approval information
      approver2: po.DB_NAME || undefined,
      requiresApproval: !!(po.HOARTG && po.HOARTG.trim() !== ''),
    })
  );

  return {
    purchaseOrders: convertedOrders,
    pagination: data.data.pagination,
  };
};

export function usePurchaseOrders(params: PurchaseOrdersParams) {
  // Create a stable query key that includes all search parameters
  const queryKey = [
    "purchaseOrders", 
    params.page, 
    params.pageSize, 
    params.search || null, 
    params.status || null, 
    params.priority || null,
    params.poNumber || null,
    params.poRangeStart || null,
    params.poRangeEnd || null
  ];
  
  return useQuery({
    queryKey,
    queryFn: () => fetchPurchaseOrders(params),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
} 