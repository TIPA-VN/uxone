"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Package,
  ShoppingCart,
  TrendingUp,
  Activity
} from "lucide-react";

interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  timestamp: string;
  environment: string;
  dbHost: string;
  dbPort: string;
  dbService: string;
  aisServer: string;
  aisPort: string;
}

interface TestResult {
  endpoint: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export default function JDETestingPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Test JDE Connection
  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/jde/connection');
      const result = await response.json();
      
      if (result.success) {
        setConnectionStatus(result.data);
        addTestResult('Connection Test', true, result.data);
      } else {
        setConnectionStatus({
          status: 'error',
          timestamp: new Date().toISOString(),
          environment: 'development',
          dbHost: 'error',
          dbPort: 'error',
          dbService: 'error',
          aisServer: 'error',
          aisPort: 'error'
        });
        addTestResult('Connection Test', false, null, result.error);
      }
    } catch (error) {
      setConnectionStatus({
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: 'development',
        dbHost: 'error',
        dbPort: 'error',
        dbService: 'error',
        aisServer: 'error',
        aisPort: 'error'
      });
      addTestResult('Connection Test', false, null, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync Data
  const syncData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/jde/connection', { method: 'POST' });
      const result = await response.json();
      
      setSyncResult(result);
      addTestResult('Data Sync', result.success, result.data, result.error);
    } catch (error) {
      addTestResult('Data Sync', false, null, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Test Inventory API
  const testInventory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/jde/inventory');
      const result = await response.json();
      
      addTestResult('Inventory API', result.success, result.data, result.error);
    } catch (error) {
      addTestResult('Inventory API', false, null, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Test Purchase Orders API
  const testPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/jde/purchase-orders');
      const result = await response.json();
      
      addTestResult('Purchase Orders API', result.success, result.data, result.error);
    } catch (error) {
      addTestResult('Purchase Orders API', false, null, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Test MRP API
  const testMRP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/jde/mrp');
      const result = await response.json();
      
      addTestResult('MRP API', result.success, result.data, result.error);
    } catch (error) {
      addTestResult('MRP API', false, null, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Run All Tests
  const runAllTests = async () => {
    await testConnection();
    await testInventory();
    await testPurchaseOrders();
    await testMRP();
    await syncData();
  };

  // Add test result
  const addTestResult = (endpoint: string, success: boolean, data?: any, error?: string) => {
    const result: TestResult = {
      endpoint,
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    };
    
    setTestResults(prev => [result, ...prev]);
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'testing':
        return <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">JDE 9.2 Integration Testing</h1>
          <p className="text-gray-600">Test JDE database connection and data synchronization</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={runAllTests} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Run All Tests
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Current JDE database and AIS connection status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(connectionStatus.status)}
                  <span className="font-medium">Status: {connectionStatus.status}</span>
                </div>
                <Badge variant={connectionStatus.status === 'connected' ? 'default' : 'destructive'}>
                  {connectionStatus.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Environment:</span> {connectionStatus.environment}
                </div>
                <div>
                  <span className="font-medium">DB Host:</span> {connectionStatus.dbHost}
                </div>
                <div>
                  <span className="font-medium">DB Port:</span> {connectionStatus.dbPort}
                </div>
                <div>
                  <span className="font-medium">DB Service:</span> {connectionStatus.dbService}
                </div>
                <div>
                  <span className="font-medium">AIS Server:</span> {connectionStatus.aisServer}
                </div>
                <div>
                  <span className="font-medium">AIS Port:</span> {connectionStatus.aisPort}
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                Last checked: {new Date(connectionStatus.timestamp).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No connection status available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Individual test functions for JDE integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              variant="outline"
              className="h-20 flex flex-col"
            >
              <Database className="h-5 w-5 mb-1" />
              Test Connection
            </Button>
            
            <Button 
              onClick={testInventory} 
              disabled={isLoading}
              variant="outline"
              className="h-20 flex flex-col"
            >
              <Package className="h-5 w-5 mb-1" />
              Test Inventory
            </Button>
            
            <Button 
              onClick={testPurchaseOrders} 
              disabled={isLoading}
              variant="outline"
              className="h-20 flex flex-col"
            >
              <ShoppingCart className="h-5 w-5 mb-1" />
              Test POs
            </Button>
            
            <Button 
              onClick={testMRP} 
              disabled={isLoading}
              variant="outline"
              className="h-20 flex flex-col"
            >
              <TrendingUp className="h-5 w-5 mb-1" />
              Test MRP
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <Button 
            onClick={syncData} 
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Data to Local Database
          </Button>
        </CardContent>
      </Card>

      {/* Sync Result */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle>Data Sync Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {syncResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
                </span>
              </div>
              <p className="text-sm text-gray-600">{syncResult.message}</p>
              {syncResult.data && (
                <div className="text-xs text-gray-500">
                  Timestamp: {new Date(syncResult.data.timestamp).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Recent test execution results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No test results available</p>
              </div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{result.endpoint}</span>
                    </div>
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </Badge>
                  </div>
                  
                  {result.error && (
                    <p className="text-sm text-red-600 mb-2">{result.error}</p>
                  )}
                  
                  {result.data && (
                    <div className="text-xs text-gray-500">
                      <div>Timestamp: {new Date(result.timestamp).toLocaleString()}</div>
                      {result.data.summary && (
                        <div className="mt-1">
                          {Object.entries(result.data.summary).map(([key, value]) => (
                            <div key={key}>
                              {key}: {String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 