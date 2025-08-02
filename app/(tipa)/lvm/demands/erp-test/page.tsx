"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  FileText, 
  Users, 
  Calendar,
  DollarSign,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import ERPIntegrationTest from "@/components/ERPIntegrationTest";

export default function ERPTestPage() {
  const [demands, setDemands] = useState<any[]>([]);
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDemands();
  }, []);

  const fetchDemands = async () => {
    try {
      const response = await fetch('/api/demands');
      const result = await response.json();
      
      if (result.success) {
        setDemands(result.data.demands || []);
      }
    } catch (error) {
      console.error("Error fetching demands:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading demands...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ERP Integration Test</h1>
        <p className="text-gray-600">
          Test the ERP integration functionality with multi-line demand data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demands List */}
        <div className="lg:col-span-1">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <FileText className="h-5 w-5 text-gray-600" />
                <span>Available Demands</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Select a demand to test ERP integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {demands.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No demands found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Create a demand first to test ERP integration
                  </p>
                </div>
              ) : (
                demands.map((demand) => (
                  <div
                    key={demand.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDemandId === demand.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDemandId(demand.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        Demand #{demand.id.slice(-8)}
                      </h3>
                      <Badge 
                        variant={demand.status === 'PENDING' ? 'outline' : 'default'}
                        className={
                          demand.status === 'PENDING' 
                            ? 'text-orange-600 border-orange-200' 
                            : 'text-green-600'
                        }
                      >
                        {demand.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3" />
                        <span>{demand.department}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(demand.expectedDeliveryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-3 w-3" />
                        <span>{demand.demandLines?.length || 0} lines</span>
                      </div>
                      {demand.demandLines && demand.demandLines.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-3 w-3" />
                          <span>
                            {demand.demandLines
                              .reduce((sum: number, line: any) => sum + (line.estimatedCost || 0), 0)
                              .toLocaleString('vi-VN')} VND
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ERP Integration Test */}
        <div className="lg:col-span-2">
          {selectedDemandId ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-lg font-medium text-gray-900">
                <ArrowRight className="h-5 w-5 text-blue-600" />
                <span>ERP Integration for Demand #{selectedDemandId.slice(-8)}</span>
              </div>
              
              <ERPIntegrationTest demandId={selectedDemandId} />
            </div>
          ) : (
            <Card className="border shadow-sm">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a demand to test ERP integration</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose a demand from the list to preview and submit ERP data
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>How to Test ERP Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <h4 className="font-medium text-blue-900">Select Demand</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Choose a demand from the list that contains multiple demand lines
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <h4 className="font-medium text-green-900">Preview Data</h4>
                </div>
                <p className="text-sm text-green-700">
                  Click "Preview ERP Data" to see how the demand will be transformed
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <h4 className="font-medium text-purple-900">Submit to ERP</h4>
                </div>
                <p className="text-sm text-purple-700">
                  Click "Submit to ERP" to send the transformed data to the ERP system
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Expected ERP Data Format</h4>
              <p className="text-sm text-gray-600 mb-2">
                The system will transform your multi-line demand into the following ERP format:
              </p>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  "Supplier_code": "1001411",
  "Requested": "07/20/2025",
  "GridIn_1_3": [
    {
      "Item_Number": "MUA-DICH-VU",
      "Quantity_Ordered": "2",
      "Tr._UoM": "EA",
      "G_L_Offset": "NS26",
      "Cost_Center": "1320",
      "Obj_Acct": "64173"
    }
  ],
  "P4310_Version": "TIPA0031"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 