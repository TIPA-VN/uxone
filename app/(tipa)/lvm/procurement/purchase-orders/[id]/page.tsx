"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Calendar, DollarSign, User, MapPin, Package, RefreshCw, CheckCircle } from 'lucide-react';

interface PurchaseOrderDetail {
  PDDOCO: string;
  PDLINE: number;
  PDITM: string;
  PDDSC1: string;
  PDQTOR: number;
  PDRQTOR: number;
  PDUPRC: number;
  PDEXRC: number;
  PDFRRC: number;   // Foreign Unit Cost (Transaction Currency)
  PDFEA: number;    // Foreign Extended Cost (Transaction Currency)
  PDPDDJ?: Date;
  PDSTS: string;
  PDNSTS: string;
  PDLSTS: string;
}

interface PurchaseOrder {
  PDDOCO: string;
  PDAN8: string;
  PDALPH: string;
  PDRQDC: Date;
  PDPDDJ?: Date;
  PDSTS: string;
  PDTOA: number;
  PDFAP: number;    // Foreign Amount (Transaction Currency)
  PDCNDJ: string;   // Transaction Currency Code
  PDCNDC: string;   // Base Currency Code
  PDBUY: string;
  supplierAddress?: string;
  // Approval information (only second approver)
  DB_NAME?: string;  // Second approver name
  HORPER?: number;   // Second approver ID
  HORDB?: string;    // First approver ID (for reference only)
  HOARTG?: string;   // Order routing for approval
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const poNumber = params.id as string;

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [lineDetails, setLineDetails] = useState<PurchaseOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch PO header and details with approval information
      const response = await fetch(`/api/jde/purchase-orders/${poNumber}`);
      const data = await response.json();

      if (data.success && data.data.purchaseOrder) {
        setPurchaseOrder(data.data.purchaseOrder);
        setLineDetails(data.data.lineDetails || []);
      } else {
        setError('Purchase order not found');
      }
    } catch (err) {
      setError('Error loading purchase order details');
      console.error('Error fetching PO details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (poNumber) {
      fetchPurchaseOrderDetails();
    }
  }, [poNumber]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PARTIALLY_APPROVED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PENDING_APPROVAL':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PENDING':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLineStatusColor = (status: string) => {
    switch (status) {
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'C':
        return 'bg-gray-100 text-gray-800';
      case 'H':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateLineSummary = () => {
    const totalLines = lineDetails.length;
    const totalQuantity = lineDetails.reduce((sum, line) => sum + line.PDQTOR, 0);
    const totalReceived = lineDetails.reduce((sum, line) => sum + line.PDRQTOR, 0);
    const totalValue = lineDetails.reduce((sum, line) => sum + line.PDEXRC, 0);
    const pendingQuantity = totalQuantity - totalReceived;

    return {
      totalLines,
      totalQuantity,
      totalReceived,
      totalValue,
      pendingQuantity,
      completionRate: totalQuantity > 0 ? (totalReceived / totalQuantity) * 100 : 0
    };
  };

  const summary = calculateLineSummary();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2">
                <h3 className="text-xs font-medium text-red-800">Error loading purchase order</h3>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">Purchase Order Not Found</h2>
            <p className="text-sm text-gray-600 mt-1">The requested purchase order could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600 mr-2" />
                  PO {purchaseOrder.PDDOCO}
                </h1>
                <p className="text-xs text-gray-600">Purchase order details</p>
              </div>
            </div>
            <button
              onClick={fetchPurchaseOrderDetails}
              disabled={loading}
              className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* PO Header Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          {/* Row 1: PO Number, Status, Order Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">PO Number</p>
                <p className="text-sm font-semibold text-gray-900">{purchaseOrder.PDDOCO}</p>
              </div>
            </div>



            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Order Date</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(purchaseOrder.PDRQDC)}</p>
                {purchaseOrder.PDPDDJ && (
                  <p className="text-xs text-gray-500">Due: {formatDate(purchaseOrder.PDPDDJ)}</p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <User className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Status</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(purchaseOrder.PDSTS)}`}>
                  {purchaseOrder.PDSTS}
                </span>
                <p className="text-xs text-gray-500 mt-1">Buyer: {purchaseOrder.PDBUY}</p>
              </div>
            </div>
          </div>

          {/* Row 2: Supplier (full width) */}
          <div className="mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-xs font-medium text-gray-600">Supplier</p>
                <p className="text-sm font-semibold text-gray-900 break-words" title={purchaseOrder.PDALPH}>
                  {purchaseOrder.PDALPH}
                </p>
                <p className="text-xs text-gray-500">ID: {purchaseOrder.PDAN8}</p>
              </div>
            </div>
          </div>

          {/* Row 2.5: Approval Information */}
          {purchaseOrder.DB_NAME && (
            <div className="mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-xs font-medium text-gray-600">Approval Information</p>
                  <div className="mt-1">
                    <p className="text-xs text-gray-500">Approver:</p>
                    <p className="text-sm font-semibold text-gray-900">{purchaseOrder.DB_NAME}</p>
                    <p className="text-xs text-gray-500">ID: {purchaseOrder.HORPER}</p>
                  </div>
                  {purchaseOrder.HOARTG && (
                    <p className="text-xs text-gray-500 mt-1">Routing: {purchaseOrder.HOARTG}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Row 3: Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Base Amount</p>
                <p className="text-sm font-semibold text-gray-900">{purchaseOrder.PDTOA.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{purchaseOrder.PDCNDC}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Foreign Amount</p>
                <p className="text-sm font-semibold text-gray-900">{purchaseOrder.PDFAP.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{purchaseOrder.PDCNDJ}</p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600">Supplier Address</p>
                <p className="text-xs text-gray-900 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {purchaseOrder.supplierAddress || 'Not available'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <Package className="w-4 h-4 mr-2" />
            Line Items Summary
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{summary.totalLines}</p>
              <p className="text-xs text-gray-600">Lines</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{summary.totalQuantity}</p>
              <p className="text-xs text-gray-600">Quantity</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-600">{summary.totalReceived}</p>
              <p className="text-xs text-gray-600">Received</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">{summary.pendingQuantity}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-600">{formatCurrency(summary.totalValue)}</p>
              <p className="text-xs text-gray-600">Value</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-indigo-600">{summary.completionRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-600">Complete</p>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Line Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rcv
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Foreign Unit Cost
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Extended Price
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Foreign Extended Cost
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lineDetails.map((line) => (
                  <tr key={line.PDLINE} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      {line.PDLINE}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                      {line.PDITM}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-900">
                      <div className="max-w-xs truncate" title={line.PDDSC1}>
                        {line.PDDSC1}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                      {line.PDQTOR.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                      {line.PDRQTOR.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                      {formatCurrency(line.PDUPRC)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                      {line.PDFRRC.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      {formatCurrency(line.PDEXRC)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                      {line.PDFEA.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${getLineStatusColor(line.PDSTS)}`}>
                        {line.PDSTS === 'A' ? 'Active' : line.PDSTS === 'C' ? 'Closed' : line.PDSTS === 'H' ? 'Hold' : line.PDSTS}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 