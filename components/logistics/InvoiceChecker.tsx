'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, FileText, Settings, Key } from 'lucide-react';
import { InvoiceCheckerFormData, VNPTInvoiceApiResponse } from '@/types/invoice';

export default function InvoiceChecker() {
  const [formData, setFormData] = useState<InvoiceCheckerFormData>({
    account: '',
    acpass: '',
    username: '',
    password: '',
    pattern: '', // User must provide pattern
    fkeys: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Check if environment variables are configured
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const response = await fetch('/api/invoice/config');
        const data = await response.json();
        setIsConfigured(data.isConfigured);
      } catch (error) {
        console.error('Failed to check configuration:', error);
      }
    };

    checkConfiguration();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError(null);
  }, [error]);

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (isConfigured) {
      // When using environment variables, only check pattern and fkeys
      if (!formData.pattern.trim()) errors.push('Pattern is required');
      if (!formData.fkeys.trim()) errors.push('Foreign keys are required');
    } else {
      // When not configured, check all fields
      if (!formData.account.trim()) errors.push('Account is required');
      if (!formData.acpass.trim()) errors.push('AC Password is required');
      if (!formData.username.trim()) errors.push('Username is required');
      if (!formData.password.trim()) errors.push('Password is required');
      if (!formData.pattern.trim()) errors.push('Pattern is required');
      if (!formData.fkeys.trim()) errors.push('Foreign keys are required');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError('Please fill in all required fields:\n' + validationErrors.join('\n'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setDebugInfo(null);

    try {
      // Prepare the data to send
      const dataToSend = isConfigured ? {
        // Use environment variables for all credentials, user only provides pattern and fkeys
        pattern: formData.pattern,
        fkeys: formData.fkeys
        // All credentials will be added by the API from environment variables
      } : {
        // Use form data for all fields
        account: formData.account,
        acpass: formData.acpass,
        username: formData.username,
        password: formData.password,
        pattern: formData.pattern,
        fkeys: formData.fkeys
      };

      const response = await fetch('/api/invoice/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      const data: VNPTInvoiceApiResponse = await response.json();

      if (data.success) {
        setResult(data.data);
        setDebugInfo(data.metadata);
      } else {
        setError(data.message || 'Unknown error occurred');
        if (data.faultCode) {
          setDebugInfo({ faultCode: data.faultCode });
        }
      }
    } catch (err: any) {
      setError('Network error: Unable to connect to the server');
      console.error('Network error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch('/api/invoice/methods');
      const data = await response.json();
      
      if (data.success) {
        alert('SOAP connection successful! Available methods: ' + 
              Object.keys(data.data.methods).join(', '));
      } else {
        alert('Connection failed: ' + data.message);
      }
    } catch (err: any) {
      alert('Connection test failed: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">VNPT Invoice Checker</h2>
            <p className="text-sm text-gray-600">Verify tax invoices with VNPT system</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
            isConfigured 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            <Settings className="w-3 h-3" />
            {isConfigured ? 'Configured' : 'Manual Input'}
          </div>
          <button
            onClick={handleTestConnection}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Test Connection
          </button>
        </div>
      </div>

      {!isConfigured && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Environment Variables Not Configured</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Add VNPT credentials to your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file for automatic form filling:
              </p>
              <div className="mt-2 text-xs bg-yellow-100 p-2 rounded font-mono">
                VNPT_ACCOUNT=your_account<br/>
                VNPT_AC_PASSWORD=your_ac_password<br/>
                VNPT_USERNAME=your_username<br/>
                VNPT_PASSWORD=your_password<br/>
                # Pattern and fkeys must be provided by user for each API call
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {!isConfigured ? (
          // Show all fields if not configured
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account *
                </label>
                <input
                  type="text"
                  name="account"
                  value={formData.account}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AC Password *
                </label>
                <input
                  type="password"
                  name="acpass"
                  value={formData.acpass}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </>
        ) : (
          // Show only pattern and fkeys when configured
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Using Environment Credentials</span>
            </div>
            <p className="text-sm text-green-700">
              All authentication credentials are configured via environment variables. You only need to provide the invoice details below.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pattern *
          </label>
          <input
            type="text"
            name="pattern"
            value={formData.pattern}
            onChange={handleInputChange}
            placeholder="Enter invoice pattern (e.g., 01GTKT0/001)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Invoice pattern/template identifier (required for each API call)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foreign Keys *
          </label>
          <textarea
            name="fkeys"
            value={formData.fkeys}
            onChange={handleInputChange}
            placeholder="Enter invoice keys to check (comma-separated for multiple)"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Invoice keys or identifiers to verify (required for each API call)</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Checking Invoice...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Check Invoice
            </span>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <pre className="whitespace-pre-wrap">{error}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                <pre className="bg-green-100 p-3 rounded text-xs overflow-auto max-h-64">
                  {typeof result === 'object' ? JSON.stringify(result, null, 2) : result}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {debugInfo && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Debug Info</h3>
          <pre className="text-xs text-blue-700 overflow-auto bg-blue-100 p-3 rounded">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 