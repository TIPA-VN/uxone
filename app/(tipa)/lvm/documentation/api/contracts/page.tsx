"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  ChevronLeft, 
  ChevronRight,
  Home,
  Copy,
  ExternalLink,
  Play,
  Book,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import Link from 'next/link';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Response[];
  example?: {
    request?: string;
    response?: string;
  };
}

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

interface RequestBody {
  type: string;
  description: string;
  properties: { [key: string]: { type: string; description: string; required?: boolean } };
  example?: string;
}

interface Response {
  status: number;
  description: string;
  example?: string;
}

export default function ContractAPIReferencePage() {
  const [activeEndpoint, setActiveEndpoint] = useState<string>('lifecycle-post');
  const [copiedCode, setCopiedCode] = useState<string>('');

  const endpoints: APIEndpoint[] = [
    {
      method: 'POST',
      path: '/api/contracts/[id]/lifecycle',
      description: 'Perform lifecycle actions on a contract (hold, unhold, terminate, extend)',
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'Contract ID', example: 'cmev4btnm0006ap7kfn2of4mr' }
      ],
      requestBody: {
        type: 'application/json',
        description: 'Lifecycle action details',
        properties: {
          action: { type: 'string', description: 'Action type: HOLD, UNHOLD, TERMINATE, EXTEND_EXPIRATION, UPDATE_RENEWAL_SETTINGS', required: true },
          reason: { type: 'string', description: 'Reason for the action (required for HOLD and TERMINATE)' },
          newExpirationDate: { type: 'string', description: 'New expiration date (for EXTEND_EXPIRATION action)' },
          metadata: { type: 'object', description: 'Additional metadata for the action' }
        },
        example: `{
  "action": "HOLD",
  "reason": "Pending legal review of clause 5.2",
  "metadata": {
    "priority": "high",
    "department": "legal"
  }
}`
      },
      responses: [
        {
          status: 200,
          description: 'Action completed successfully',
          example: `{
  "success": true,
  "contract": {
    "id": "cmev4btnm0006ap7kfn2of4mr",
    "contractStatus": "ON_HOLD",
    "isOnHold": true,
    "holdReason": "Pending legal review of clause 5.2",
    "holdDate": "2025-01-30T10:30:00.000Z",
    "holdByUserId": "user123"
  },
  "message": "Contract put on hold successfully"
}`
        },
        {
          status: 400,
          description: 'Invalid action or missing required parameters',
          example: `{
  "error": "Invalid action"
}`
        },
        {
          status: 404,
          description: 'Contract not found',
          example: `{
  "error": "Contract not found"
}`
        }
      ]
    },
    {
      method: 'GET',
      path: '/api/contracts/[id]/lifecycle',
      description: 'Get lifecycle event history for a contract',
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'Contract ID', example: 'cmev4btnm0006ap7kfn2of4mr' }
      ],
      responses: [
        {
          status: 200,
          description: 'Lifecycle events retrieved successfully',
          example: `{
  "success": true,
  "events": [
    {
      "id": "event123",
      "contractId": "cmev4btnm0006ap7kfn2of4mr",
      "eventType": "HOLD",
      "eventDate": "2025-01-30T10:30:00.000Z",
      "userId": "user123",
      "reason": "Pending legal review",
      "user": {
        "id": "user123",
        "name": "John Doe",
        "email": "john@company.com"
      }
    }
  ]
}`
        }
      ]
    },
    {
      method: 'GET',
      path: '/api/contracts/expiration-monitor',
      description: 'Monitor contracts approaching expiration',
      parameters: [
        { name: 'action', type: 'string', required: false, description: 'Action type: list, send-notifications', example: 'list' },
        { name: 'days', type: 'number', required: false, description: 'Number of days to look ahead', example: '30' }
      ],
      responses: [
        {
          status: 200,
          description: 'Expiring contracts retrieved successfully',
          example: `{
  "success": true,
  "contracts": [
    {
      "id": "contract123",
      "contractTitle": "Software License Agreement",
      "expirationDate": "2025-02-15T00:00:00.000Z",
      "daysUntilExpiration": 16,
      "isUrgent": true,
      "isCritical": false,
      "project": {
        "name": "Project Alpha",
        "owner": {
          "name": "Jane Smith",
          "email": "jane@company.com"
        }
      }
    }
  ],
  "summary": {
    "total": 5,
    "critical": 1,
    "urgent": 3
  }
}`
        }
      ]
    },
    {
      method: 'POST',
      path: '/api/contracts/expiration-monitor',
      description: 'Perform bulk operations on expiring contracts',
      requestBody: {
        type: 'application/json',
        description: 'Bulk operation details',
        properties: {
          action: { type: 'string', description: 'Action type: bulk-extend', required: true },
          contractIds: { type: 'array', description: 'Array of contract IDs to process', required: true },
          extensionDays: { type: 'number', description: 'Number of days to extend (for bulk-extend)' },
          reason: { type: 'string', description: 'Reason for the operation' }
        },
        example: `{
  "action": "bulk-extend",
  "contractIds": ["contract1", "contract2", "contract3"],
  "extensionDays": 90,
  "reason": "Quarterly extension for ongoing projects"
}`
      },
      responses: [
        {
          status: 200,
          description: 'Bulk operation completed',
          example: `{
  "success": true,
  "results": [
    { "contractId": "contract1", "success": true },
    { "contractId": "contract2", "success": true },
    { "contractId": "contract3", "success": false, "error": "Contract not found" }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}`
        }
      ]
    }
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'PATCH': return 'bg-orange-100 text-orange-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
    if (status >= 400 && status < 500) return 'bg-red-100 text-red-800';
    if (status >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/lvm/documentation" className="flex items-center text-gray-600 hover:text-gray-900">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Documentation
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <div className="flex items-center space-x-2">
                  <Code className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Contract API Reference</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Link href="/lvm" className="flex items-center text-gray-600 hover:text-gray-900">
                  <Home className="w-4 h-4 mr-2" />
                  Back to LVM
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Endpoint Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Code className="w-5 h-5 mr-2" />
                    API Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1 p-4">
                    {endpoints.map((endpoint, index) => (
                      <button
                        key={`${endpoint.method}-${index}`}
                        onClick={() => setActiveEndpoint(`${endpoint.method.toLowerCase()}-${index}`)}
                        className={`w-full text-left p-3 rounded-md transition-colors ${
                          activeEndpoint === `${endpoint.method.toLowerCase()}-${index}`
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                        </div>
                        <div className="text-sm font-mono text-gray-600 truncate">
                          {endpoint.path}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Introduction */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-8 mb-6">
                <h1 className="text-3xl font-bold mb-4 text-white">Contract Management API Reference</h1>
                <p className="text-xl text-blue-100 mb-6">
                  Complete API documentation for contract lifecycle operations, including endpoints for holds, 
                  terminations, and expiration monitoring.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-500 hover:bg-blue-400 text-white">REST API</Badge>
                  <Badge className="bg-blue-500 hover:bg-blue-400 text-white">JSON</Badge>
                  <Badge className="bg-blue-500 hover:bg-blue-400 text-white">Authentication Required</Badge>
                </div>
              </div>

              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <Info className="w-6 h-6 text-blue-500 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Authentication</h3>
                      <p className="text-gray-600 mb-3">
                        All API endpoints require authentication. Include your session token in the request headers 
                        or ensure you're authenticated via the web application.
                      </p>
                      <div className="bg-gray-100 rounded-md p-3 font-mono text-sm">
                        Authorization: Bearer your-token-here
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Endpoint Details */}
            {endpoints.map((endpoint, index) => {
              const endpointId = `${endpoint.method.toLowerCase()}-${index}`;
              if (activeEndpoint !== endpointId) return null;

              return (
                <div key={endpointId} className="space-y-6">
                  {/* Endpoint Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className={getMethodColor(endpoint.method)} size="lg">
                            {endpoint.method}
                          </Badge>
                          <code className="text-lg font-mono text-gray-900">{endpoint.path}</code>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(endpoint.path, `path-${endpointId}`)}
                        >
                          {copiedCode === `path-${endpointId}` ? (
                            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copy
                        </Button>
                      </div>
                      <p className="text-gray-600 mt-2">{endpoint.description}</p>
                    </CardHeader>
                  </Card>

                  {/* Parameters */}
                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Path Parameters</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {endpoint.parameters.map((param) => (
                            <div key={param.name} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                    {param.name}
                                  </code>
                                  <Badge variant={param.required ? 'destructive' : 'secondary'} size="sm">
                                    {param.required ? 'Required' : 'Optional'}
                                  </Badge>
                                  <Badge variant="outline" size="sm">{param.type}</Badge>
                                </div>
                              </div>
                              <p className="text-gray-600 text-sm mb-2">{param.description}</p>
                              {param.example && (
                                <div className="bg-gray-50 rounded p-2">
                                  <span className="text-xs text-gray-500">Example: </span>
                                  <code className="text-sm">{param.example}</code>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Request Body */}
                  {endpoint.requestBody && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Request Body</CardTitle>
                        <p className="text-gray-600">{endpoint.requestBody.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Properties</h4>
                            <div className="space-y-3">
                              {Object.entries(endpoint.requestBody.properties).map(([key, prop]) => (
                                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                  <div className="flex items-center space-x-2">
                                    <code className="text-sm font-mono">{key}</code>
                                    <Badge variant="outline" size="sm">{prop.type}</Badge>
                                    {prop.required && (
                                      <Badge variant="destructive" size="sm">Required</Badge>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-600">{prop.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {endpoint.requestBody.example && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">Example</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(endpoint.requestBody!.example!, `request-${endpointId}`)}
                                >
                                  {copiedCode === `request-${endpointId}` ? (
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 mr-2" />
                                  )}
                                  Copy
                                </Button>
                              </div>
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                {endpoint.requestBody.example}
                              </pre>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Responses */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Responses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {endpoint.responses.map((response, responseIndex) => (
                          <div key={responseIndex} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <Badge className={getStatusColor(response.status)}>
                                  {response.status}
                                </Badge>
                                <span className="text-sm font-medium text-gray-900">
                                  {response.description}
                                </span>
                              </div>
                              {response.example && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(response.example!, `response-${endpointId}-${responseIndex}`)}
                                >
                                  {copiedCode === `response-${endpointId}-${responseIndex}` ? (
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 mr-2" />
                                  )}
                                  Copy
                                </Button>
                              )}
                            </div>
                            {response.example && (
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                {response.example}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-12">
              <Link href="/lvm/documentation/contracts/lifecycle-guide" className="flex items-center text-blue-600 hover:text-blue-700">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous: Lifecycle Guide
              </Link>
              <Link href="/lvm/documentation/system/expiration-monitoring" className="flex items-center text-blue-600 hover:text-blue-700">
                Next: System Setup
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
