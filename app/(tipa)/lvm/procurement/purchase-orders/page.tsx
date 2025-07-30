"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import {
  Search,
  Filter,
  Plus,
  Download,
  RefreshCw,
  ShoppingCart,
  Eye,
  Edit,
} from "lucide-react";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status:
    | "PENDING"
    | "PENDING_APPROVAL"
    | "PARTIALLY_APPROVED"
    | "APPROVED"
    | "ACTIVE"
    | "COMPLETED"
    | "CANCELLED";
  totalAmount: number;
  orderDate: string;
  expectedDelivery: string;
  items: number;
  createdBy: string;
  approvedBy?: string;
  businessUnit: string;
  poType: string;
  // Approval information
  approver1?: string; // First approver name
  approver2?: string; // Second approver name
  requiresApproval?: boolean;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

type SearchMode = "general" | "single" | "range";

export default function PurchaseOrdersPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>("general");
  const [searchTerm, setSearchTerm] = useState("");
  const [singlePO, setSinglePO] = useState("");
  const [poRangeStart, setPoRangeStart] = useState("");
  const [poRangeEnd, setPoRangeEnd] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [debouncedSinglePO, setDebouncedSinglePO] = useState("");
  const [debouncedPoRangeStart, setDebouncedPoRangeStart] = useState("");
  const [debouncedPoRangeEnd, setDebouncedPoRangeEnd] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Debounce search terms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSinglePO(singlePO);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [singlePO]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPoRangeStart(poRangeStart);
      setDebouncedPoRangeEnd(poRangeEnd);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [poRangeStart, poRangeEnd]);

  // Build query parameters based on search mode
  const queryParams = {
    page: currentPage,
    pageSize,
    search: searchMode === "general" ? debouncedSearchTerm : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
    poNumber: searchMode === "single" ? debouncedSinglePO : undefined,
    poRangeStart: searchMode === "range" ? debouncedPoRangeStart : undefined,
    poRangeEnd: searchMode === "range" ? debouncedPoRangeEnd : undefined,
  };

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = usePurchaseOrders(queryParams);

  const purchaseOrders = data?.purchaseOrders || [];
  const pagination = data?.pagination;

  const statuses = ["all", "PENDING", "PENDING_APPROVAL", "PARTIALLY_APPROVED", "APPROVED", "ACTIVE", "COMPLETED", "CANCELLED"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PARTIALLY_APPROVED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "ACTIVE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSinglePO("");
    setPoRangeStart("");
    setPoRangeEnd("");
    setCurrentPage(1);
  };

  const handleSearchModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    clearSearch(); // Clear all search inputs when switching modes
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3">
        <div className="flex flex-col gap-4">
          {/* Search Mode Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleSearchModeChange("general")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 ease-in-out ${
                searchMode === "general"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              General Search
            </button>
            <button
              onClick={() => handleSearchModeChange("single")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 ease-in-out ${
                searchMode === "single"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Single PO
            </button>
            <button
              onClick={() => handleSearchModeChange("range")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 ease-in-out ${
                searchMode === "range"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              PO Range
            </button>
          </div>

          {/* Search Inputs */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* General Search */}
              {searchMode === "general" && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search PO number, supplier, buyer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 pr-8 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm transition-all duration-200 hover:border-gray-400"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              {/* Single PO Search */}
              {searchMode === "single" && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter exact PO number (e.g., 50005963)"
                    value={singlePO}
                    onChange={(e) => setSinglePO(e.target.value)}
                    className="pl-7 pr-8 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm transition-all duration-200 hover:border-gray-400"
                  />
                  {singlePO && (
                    <button
                      onClick={() => setSinglePO("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              {/* PO Range Search */}
              {searchMode === "range" && (
                <div className="flex gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Start PO (e.g., 50005960)"
                      value={poRangeStart}
                      onChange={(e) => setPoRangeStart(e.target.value)}
                      className="pl-7 pr-8 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm transition-all duration-200 hover:border-gray-400"
                    />
                    {poRangeStart && (
                      <button
                        onClick={() => setPoRangeStart("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="flex items-center text-gray-400">to</div>
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="End PO (e.g., 50005970)"
                      value={poRangeEnd}
                      onChange={(e) => setPoRangeEnd(e.target.value)}
                      className="pl-7 pr-8 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm transition-all duration-200 hover:border-gray-400"
                    />
                    {poRangeEnd && (
                      <button
                        onClick={() => setPoRangeEnd("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="pl-7 pr-6 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm transition-all duration-200 hover:border-gray-400"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status === "all" ? "All Statuses" : status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading || isRefetching}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 flex items-center disabled:opacity-50 text-sm hover:shadow-md active:scale-95"
              >
                <RefreshCw
                  className={`w-3 h-3 mr-1.5 ${isLoading || isRefetching ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <Link
                href="/lvm/procurement/purchase-orders/new"
                className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 flex items-center text-sm hover:shadow-md active:scale-95"
              >
                <Plus className="w-3 h-3 mr-1.5" />
                New PO
              </Link>
              <button className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all duration-200 flex items-center text-sm hover:shadow-md active:scale-95">
                <Download className="w-3 h-3 mr-1.5" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                // Loading state with skeleton rows
                Array.from({ length: 10 }).map((_, index) => (
                  <tr key={`loading-${index}`} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-8"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {po.poNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${getStatusColor(
                          po.status
                        )}`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(po.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.orderDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.expectedDelivery}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {po.items}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/lvm/procurement/purchase-orders/${po.poNumber}`}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-1 rounded hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/lvm/procurement/purchase-orders/${po.poNumber}/edit`}
                          className="text-green-600 hover:text-green-900 transition-colors duration-200 p-1 rounded hover:bg-green-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Loading overlay with spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex flex-col items-center space-y-2">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-sm text-gray-600">Loading purchase orders...</span>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!isLoading && !error && purchaseOrders.length === 0 && (
        <div className="text-center py-8">
          <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            No data loaded
          </h3>
          <p className="text-xs text-gray-600">
            There are no purchase orders to display.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading || isRefetching}
                className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center transition-all duration-200 hover:shadow-sm active:scale-95"
              >
                {isLoading || isRefetching ? (
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                ) : null}
                Previous
              </button>
              <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded">
                {currentPage}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.totalPages || isLoading || isRefetching}
                className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center transition-all duration-200 hover:shadow-sm active:scale-95"
              >
                Next
                {isLoading || isRefetching ? (
                  <RefreshCw className="w-3 h-3 ml-1 animate-spin" />
                ) : null}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
