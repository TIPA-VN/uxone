"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  Plus,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';

interface ExpiringContract {
  id: string;
  contractNumber?: string;
  contractTitle?: string;
  contractStatus: string;
  expirationDate: string;
  daysUntilExpiration: number;
  isUrgent: boolean;
  isCritical: boolean;
  autoRenewal: boolean;
  project?: {
    id: string;
    name: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
  };
  currentApprover?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ExpirationSummary {
  total: number;
  critical: number;
  urgent: number;
}

export default function ContractExpirationDashboard() {
  const [contracts, setContracts] = useState<ExpiringContract[]>([]);
  const [summary, setSummary] = useState<ExpirationSummary>({ total: 0, critical: 0, urgent: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [filterDays, setFilterDays] = useState(90);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkExtensionDays, setBulkExtensionDays] = useState(30);
  const [bulkReason, setBulkReason] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchExpiringContracts();
  }, [filterDays]);

  const fetchExpiringContracts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contracts/expiration-monitor?action=list&days=${filterDays}`);
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
        setSummary(data.summary || { total: 0, critical: 0, urgent: 0 });
      }
    } catch (error) {
      console.error('Error fetching expiring contracts:', error);
      setMessage('Error loading contracts');
    } finally {
      setLoading(false);
    }
  };

  const sendExpirationNotifications = async () => {
    setIsProcessing(true);
    setMessage('');
    
    try {
      const response = await fetch(`/api/contracts/expiration-monitor?action=send-notifications&days=${filterDays}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`Sent ${data.notificationsSent} notifications for ${data.contractsProcessed} contracts`);
      } else {
        setMessage(data.error || 'Failed to send notifications');
      }
    } catch (error) {
      setMessage('Error sending notifications');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExtension = async () => {
    if (selectedContracts.length === 0) {
      setMessage('Please select contracts to extend');
      return;
    }

    setIsProcessing(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/contracts/expiration-monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'bulk-extend',
          contractIds: selectedContracts,
          extensionDays: bulkExtensionDays,
          reason: bulkReason
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`Extended ${data.summary.successful} contracts (${data.summary.failed} failed)`);
        setSelectedContracts([]);
        setShowBulkActions(false);
        setBulkReason('');
        fetchExpiringContracts(); // Refresh the list
      } else {
        setMessage(data.error || 'Failed to extend contracts');
      }
    } catch (error) {
      setMessage('Error extending contracts');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleContractSelection = (contractId: string) => {
    setSelectedContracts(prev => 
      prev.includes(contractId) 
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  };

  const toggleAllContracts = () => {
    if (selectedContracts.length === contracts.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(contracts.map(c => c.id));
    }
  };

  const getExpirationBadge = (contract: ExpiringContract) => {
    if (contract.daysUntilExpiration < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (contract.isCritical) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (contract.isUrgent) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
    } else {
      return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ['Contract Number', 'Title', 'Status', 'Expiration Date', 'Days Left', 'Priority', 'Auto Renewal', 'Owner'];
    const csvContent = [
      headers.join(','),
      ...contracts.map(contract => [
        contract.contractNumber || '',
        `"${contract.contractTitle || ''}"`,
        contract.contractStatus,
        formatDate(contract.expirationDate),
        contract.daysUntilExpiration,
        contract.isCritical ? 'Critical' : contract.isUrgent ? 'Warning' : 'Normal',
        contract.autoRenewal ? 'Yes' : 'No',
        `"${contract.project?.owner?.name || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-expirations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading expiring contracts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contract Expiration Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor and manage contract expirations</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={exportToCSV} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchExpiringContracts} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.includes('sent') || message.includes('Extended') || message.includes('successfully')
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            {message.includes('sent') || message.includes('Extended') || message.includes('successfully') ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.includes('sent') || message.includes('Extended') || message.includes('successfully')
                  ? 'text-green-800' 
                  : 'text-red-800'
              }`}>
                {message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expiring</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical (≤7 days)</p>
                <p className="text-2xl font-bold text-red-600">{summary.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warning (≤30 days)</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.urgent}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Normal</p>
                <p className="text-2xl font-bold text-green-600">{summary.total - summary.urgent}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Show contracts expiring within:</label>
                <Input
                  type="number"
                  value={filterDays}
                  onChange={(e) => setFilterDays(parseInt(e.target.value) || 90)}
                  className="w-20"
                  min="1"
                  max="365"
                />
                <span className="text-sm text-gray-600">days</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={sendExpirationNotifications}
                disabled={isProcessing}
                size="sm"
              >
                <Bell className="w-4 h-4 mr-2" />
                {isProcessing ? 'Sending...' : 'Send Notifications'}
              </Button>
              
              {selectedContracts.length > 0 && (
                <Button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Bulk Actions ({selectedContracts.length})
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Actions Panel */}
          {showBulkActions && selectedContracts.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md border">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Bulk Extension</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extension Days</label>
                  <Input
                    type="number"
                    value={bulkExtensionDays}
                    onChange={(e) => setBulkExtensionDays(parseInt(e.target.value) || 30)}
                    min="1"
                    max="365"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <Input
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    placeholder="Reason for extension..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkActions(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkExtension}
                  disabled={isProcessing || !bulkReason.trim()}
                >
                  {isProcessing ? 'Processing...' : `Extend ${selectedContracts.length} Contracts`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Expiring Contracts ({contracts.length})</span>
            {contracts.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedContracts.length === contracts.length}
                  onCheckedChange={toggleAllContracts}
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No contracts expiring within {filterDays} days</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedContracts.length === contracts.length}
                      onCheckedChange={toggleAllContracts}
                    />
                  </TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiration Date</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Auto Renewal</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedContracts.includes(contract.id)}
                        onCheckedChange={() => toggleContractSelection(contract.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {contract.contractTitle || contract.contractNumber || 'Untitled Contract'}
                        </div>
                        {contract.contractNumber && contract.contractTitle && (
                          <div className="text-sm text-gray-500">{contract.contractNumber}</div>
                        )}
                        {contract.project && (
                          <div className="text-sm text-gray-500">Project: {contract.project.name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{contract.contractStatus}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(contract.expirationDate)}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        contract.daysUntilExpiration < 0 ? 'text-red-600' :
                        contract.isCritical ? 'text-red-600' :
                        contract.isUrgent ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {contract.daysUntilExpiration < 0 
                          ? `${Math.abs(contract.daysUntilExpiration)} days overdue`
                          : `${contract.daysUntilExpiration} days`
                        }
                      </span>
                    </TableCell>
                    <TableCell>{getExpirationBadge(contract)}</TableCell>
                    <TableCell>
                      <Badge variant={contract.autoRenewal ? 'default' : 'secondary'}>
                        {contract.autoRenewal ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.project?.owner?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{contract.project?.owner?.email}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
