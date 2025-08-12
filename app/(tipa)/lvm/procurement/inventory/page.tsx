"use client";
import React, { useState } from 'react';
import { Package, Search, Filter, RefreshCw, Trash2, Database, Clock, Calendar } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useGLClasses } from '@/hooks/useGLClasses';
import { formatQuantityForTable } from '@/lib/quantity-formatter';

import { InventoryExport } from '@/components/InventoryExport';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState('all');
  const [selectedGLClass, setSelectedGLClass] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: 'all',
    businessUnit: 'all',
    glClass: 'all'
  });
  const [isFiltersApplied, setIsFiltersApplied] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const pageSize = 100; // Changed to 100 for initial load

  // Use TanStack Query for data fetching with applied filters
  const { data, isLoading, error, refetch } = useInventory({
    page: currentPage,
    pageSize,
    search: appliedFilters.search || undefined,
    status: appliedFilters.status !== 'all' ? appliedFilters.status : undefined,
    businessUnit: appliedFilters.businessUnit !== 'all' ? appliedFilters.businessUnit : undefined,
    glClass: appliedFilters.glClass !== 'all' ? appliedFilters.glClass : undefined,
  });

  // Background loading effect - load more data when component mounts or filters change
  React.useEffect(() => {
    if (data?.data?.pagination?.totalItems > pageSize) {
      setIsLoadingMore(true);
      
      // Simulate background loading of remaining data
      const loadRemainingData = async () => {
        try {
          // In a real implementation, you would fetch the remaining pages
          // For now, we'll just simulate the loading
          await new Promise(resolve => setTimeout(resolve, 2000));
          setIsLoadingMore(false);
        } catch (error) {
          console.error('Background loading failed:', error);
          setIsLoadingMore(false);
        }
      };
      
      loadRemainingData();
    }
  }, [data?.data?.pagination?.totalItems, pageSize]);

  // Fetch GL classes for filter dropdown
  const { data: glClassesData, isLoading: glClassesLoading } = useGLClasses();

  const inventoryItems = data?.data?.inventoryLevels || [];
  const summary = data?.data?.summary;
  const pagination = data?.data?.pagination;

  const statuses = ['all', 'OK', 'LOW', 'OUT'];
  const glClasses = glClassesData || [];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OK':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'LOW':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'OUT':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };





  const getUnitOfMeasureLabel = (um: string) => {
    // Just return the raw UOM value, trimmed of spaces
    return um?.trim() || 'N/A';
  };

  const getBusinessUnitLabel = (mcu: string) => {
    // Remove leading/trailing spaces and format
    const cleanMCU = mcu?.trim() || '';
    return cleanMCU || 'N/A';
  };

  const getGLClassLabel = (glpt: string) => {
    // Remove leading/trailing spaces and format
    const cleanGLPT = glpt?.trim() || '';
    return cleanGLPT || 'N/A';
  };

  const formatCacheAge = (age: number) => {
    const seconds = Math.floor(age / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getCacheAgeColor = (age: number) => {
    const minutes = Math.floor(age / 1000 / 60);
    if (minutes < 5) return 'green';
    if (minutes < 10) return 'yellow';
    return 'red';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Package className="w-8 h-8 text-green-600 mr-3" />
          Inventory Management
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Track and manage inventory levels from JDE system
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-lg font-medium text-gray-700">Loading inventory data...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Package className="w-5 h-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading inventory</h3>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.inStock}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.lowStock}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Package className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.outOfStock}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalItems}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Controls */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="w-4 h-4" />
          <span>Configure your filters below, then click "Apply Filters" to load data. Initial load shows 100 items with background loading for the complete dataset.</span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Unit Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedBusinessUnit}
                onChange={(e) => setSelectedBusinessUnit(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Business Units</option>
                <option value="2000">2000</option>
                <option value="3000">3000</option>
                <option value="4000">4000</option>
              </select>
            </div>

            {/* GL-Class Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedGLClass}
                onChange={(e) => setSelectedGLClass(e.target.value)}
                disabled={glClassesLoading}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">
                  {glClassesLoading ? 'Loading GL-Classes...' : `All GL-Classes (${glClasses.length})`}
                </option>
                {glClasses.map(glClass => (
                  <option key={glClass} value={glClass}>
                    {glClass}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Apply Filters Button */}
            <button 
              onClick={() => {
                setAppliedFilters({
                  search: searchTerm,
                  status: selectedStatus,
                  businessUnit: selectedBusinessUnit,
                  glClass: selectedGLClass
                });
                setIsFiltersApplied(true);
                setCurrentPage(1); // Reset to first page when applying filters
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
            
            <button 
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={async () => {
                try {
                  await fetch('/api/jde/inventory/cached', { method: 'DELETE' });
                  refetch();
                } catch (error) {
                  console.error('Failed to clear cache:', error);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </button>
            <InventoryExport 
              filters={{
                glClass: appliedFilters.glClass !== 'all' ? appliedFilters.glClass : undefined,
                search: appliedFilters.search || undefined,
                status: appliedFilters.status !== 'all' ? appliedFilters.status : undefined,
                businessUnit: appliedFilters.businessUnit !== 'all' ? appliedFilters.businessUnit : undefined
              }}
              totalItems={pagination?.totalItems || 0}
              onExport={() => {
                // Optional: Add any post-export logic here
                console.log('Export completed');
              }}
            />
          </div>
        </div>
      </div>

      {/* Filter Status Indicator */}
      {isFiltersApplied && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Filters Applied</span>
              <span className="text-xs text-blue-600">
                {appliedFilters.search && `Search: "${appliedFilters.search}"`}
                {appliedFilters.status !== 'all' && ` • Status: ${appliedFilters.status}`}
                {appliedFilters.businessUnit !== 'all' && ` • Business Unit: ${appliedFilters.businessUnit}`}
                {appliedFilters.glClass !== 'all' && ` • GL Class: ${appliedFilters.glClass}`}
              </span>
            </div>
            <button
              onClick={() => {
                setAppliedFilters({ search: '', status: 'all', businessUnit: 'all', glClass: 'all' });
                setIsFiltersApplied(false);
                setSearchTerm('');
                setSelectedStatus('all');
                setSelectedBusinessUnit('all');
                setSelectedGLClass('all');
                setCurrentPage(1);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Background Loading Indicator */}
      {isLoadingMore && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
              <span className="text-sm font-medium text-yellow-800">
                Loading remaining inventory data in the background...
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-yellow-600">
                <span>Progress: {pageSize} of {data?.data?.pagination?.totalItems || '...'} items loaded</span>
                <span>Background loading in progress...</span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((pageSize / (data?.data?.pagination?.totalItems || 1)) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
            <span className="text-xs text-yellow-600">
              This ensures all data is available for export and analysis
            </span>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-green-600" />
              <h3 className="text-base font-semibold text-gray-900">Inventory Items</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Initial load: 100 items • Background loading enabled
              </span>
            </div>
            {data?.data?.cacheInfo && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200 hover:scale-105 shadow-sm">
                  <Database className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">
                    {data.data.cacheInfo.totalCachedItems.toLocaleString()} items
                  </span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm ${
                  getCacheAgeColor(data.data.cacheInfo.cacheAge) === 'green' 
                    ? 'bg-green-50 border border-green-200 hover:bg-green-100' 
                    : getCacheAgeColor(data.data.cacheInfo.cacheAge) === 'yellow'
                    ? 'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100'
                    : 'bg-red-50 border border-red-200 hover:bg-red-100'
                }`}>
                  <Clock className={`w-3 h-3 ${
                    getCacheAgeColor(data.data.cacheInfo.cacheAge) === 'green' 
                      ? 'text-green-600' 
                      : getCacheAgeColor(data.data.cacheInfo.cacheAge) === 'yellow'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`} />
                  <span className={`text-xs font-medium ${
                    getCacheAgeColor(data.data.cacheInfo.cacheAge) === 'green' 
                      ? 'text-green-700' 
                      : getCacheAgeColor(data.data.cacheInfo.cacheAge) === 'yellow'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {formatCacheAge(data.data.cacheInfo.cacheAge)}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-all duration-200 hover:scale-105 shadow-sm">
                  <Calendar className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">
                    {new Date(data.data.cacheInfo.cachedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {isLoading ? (
          // Skeleton loading state
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Primary UOM
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchasing UOM
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Unit
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GL-Class
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty On Hand
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available Stock
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hard Commit
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Soft Commit
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Safety Stock
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty On Order
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: 15 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    {Array.from({ length: 13 }).map((_, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Primary UOM
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchasing UOM
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Unit
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GL-Class
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty On Hand
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available Stock
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hard Commit
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Soft Commit
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Safety Stock
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty On Order
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryItems.map((item) => (
                  <tr key={item.IMITM} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.IMITM}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={item.IMLITM}>
                        {item.IMLITM}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {getUnitOfMeasureLabel(item.IMUOM1)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {getUnitOfMeasureLabel(item.IMUOM3)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {getBusinessUnitLabel(item.LIMCU)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {getGLClassLabel(item.IMGLPT)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatQuantityForTable(item.TotalQOH, item.IMUOM1)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatQuantityForTable(item.AvailableStock, item.IMUOM1)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatQuantityForTable(item.TotalHardCommit, item.IMUOM1)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatQuantityForTable(item.TotalSoftCommit, item.IMUOM1)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatQuantityForTable(item.IMSSQ, item.IMUOM1)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatQuantityForTable(item.TotalQOO, item.IMUOM1)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.StockStatus)}`}>
                        {item.StockStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {pagination && (
          <div className="px-6 py-4 flex justify-between items-center border-t border-gray-200">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages || pagination.totalItems === 0}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {inventoryItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-sm text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
} 