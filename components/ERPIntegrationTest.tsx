"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Package,
  DollarSign,
  Calendar,
  Building
} from "lucide-react";
import { type ERPPurchaseOrderData } from "@/lib/erp-data-transformer";

interface ERPIntegrationTestProps {
  demandId?: string;
  className?: string;
}

export default function ERPIntegrationTest({ demandId, className }: ERPIntegrationTestProps) {
  const [supplierCode, setSupplierCode] = useState("1001411");
  const [p4310Version, setP4310Version] = useState("TIPA0031");
  const [isLoading, setIsLoading] = useState(false);
  const [erpData, setErpData] = useState<ERPPurchaseOrderData | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const previewERPData = async () => {
    if (!demandId) {
      setError("Demand ID is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/demands/erp-integration?demandId=${demandId}&supplierCode=${supplierCode}&p4310Version=${p4310Version}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to preview ERP data');
      }

      setErpData(result.data.erpData);
      setSummary(result.data.summary);
      setSuccess("ERP data preview generated successfully");

    } catch (error) {
      console.error("Preview error:", error);
      setError(error instanceof Error ? error.message : "Failed to preview ERP data");
    } finally {
      setIsLoading(false);
    }
  };

  const submitToERP = async () => {
    if (!demandId) {
      setError("Demand ID is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/demands/erp-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demandId,
          supplierCode,
          p4310Version
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit to ERP');
      }

      setErpData(result.data.erpData);
      setSummary(result.data.summary);
      setSuccess("Demand successfully submitted to ERP system");

    } catch (error) {
      console.error("Submission error:", error);
      setError(error instanceof Error ? error.message : "Failed to submit to ERP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ERP Integration Configuration */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Building className="h-5 w-5 text-gray-600" />
            <span>ERP Integration Configuration</span>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Configure ERP system parameters for demand integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="supplierCode" className="text-sm font-medium text-gray-700">
                Supplier Code
              </Label>
              <Input
                id="supplierCode"
                value={supplierCode}
                onChange={(e) => setSupplierCode(e.target.value)}
                placeholder="Enter supplier code..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p4310Version" className="text-sm font-medium text-gray-700">
                P4310 Version
              </Label>
              <Input
                id="p4310Version"
                value={p4310Version}
                onChange={(e) => setP4310Version(e.target.value)}
                placeholder="Enter P4310 version..."
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={previewERPData}
              disabled={isLoading || !demandId}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview ERP Data
                </>
              )}
            </Button>

            <Button
              onClick={submitToERP}
              disabled={isLoading || !demandId}
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit to ERP
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Success</span>
          </div>
          <p className="text-green-700 mt-1">{success}</p>
        </div>
      )}

      {/* ERP Data Preview */}
      {erpData && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Package className="h-5 w-5 text-gray-600" />
              <span>ERP Purchase Order Data</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Transformed data ready for ERP system integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Information */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{summary.totalLines}</div>
                  <div className="text-sm text-gray-600">Total Lines</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.totalQuantity}</div>
                  <div className="text-sm text-gray-600">Total Quantity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {summary.totalEstimatedCost.toLocaleString('vi-VN')}
                  </div>
                  <div className="text-sm text-gray-600">Total Cost (VND)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{summary.supplierCode}</div>
                  <div className="text-sm text-gray-600">Supplier</div>
                </div>
              </div>
            )}

            {/* ERP Data Structure */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">ERP Data Structure</h4>
                <Badge variant="outline" className="text-blue-600">
                  {erpData.P4310_Version}
                </Badge>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(erpData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Purchase Order Lines */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Purchase Order Lines</h4>
              <div className="space-y-2">
                {erpData.GridIn_1_3.map((line, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Line {index + 1}</span>
                      <Badge variant="outline">{line.Tr_UoM}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Item:</span>
                        <div className="font-medium">{line.Item_Number}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <div className="font-medium">{line.Quantity_Ordered}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Cost Center:</span>
                        <div className="font-medium">{line.Cost_Center}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Object Account:</span>
                        <div className="font-medium">{line.Obj_Acct}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 