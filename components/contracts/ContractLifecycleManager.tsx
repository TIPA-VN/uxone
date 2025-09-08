"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  AlertTriangle,
  Calendar,
  Clock,
  Pause,
  Play,
  X,
  CheckCircle,
  AlertCircle,
  Settings,
  History,
  Users,
  FileText
} from 'lucide-react';

interface ContractLifecycleManagerProps {
  contractId: string;
  contract: {
    id: string;
    contractNumber?: string;
    contractTitle?: string;
    contractStatus: string;
    expirationDate?: string;
    isOnHold: boolean;
    holdReason?: string;
    holdDate?: string;
    terminationReason?: string;
    terminationDate?: string;
    autoRenewal: boolean;
    renewalNoticeDays?: number;
    expirationWarningDays?: number;
    holdByUser?: {
      name: string;
      email: string;
    };
    terminatedByUser?: {
      name: string;
      email: string;
    };
  };
  onUpdate?: () => void;
}

interface LifecycleEvent {
  id: string;
  eventType: string;
  eventDate: string;
  reason?: string;
  user: {
    name: string;
    email: string;
  };
  metadata?: any;
}

export default function ContractLifecycleManager({ 
  contractId, 
  contract, 
  onUpdate 
}: ContractLifecycleManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'settings' | 'history'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lifecycleEvents, setLifecycleEvents] = useState<LifecycleEvent[]>([]);
  
  // Action modals
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Form states
  const [holdReason, setHoldReason] = useState('');
  const [terminateReason, setTerminateReason] = useState('');
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [renewalSettings, setRenewalSettings] = useState({
    autoRenewal: contract.autoRenewal,
    renewalNoticeDays: contract.renewalNoticeDays || 60,
    expirationWarningDays: contract.expirationWarningDays || 30
  });

  // Load lifecycle events
  useEffect(() => {
    if (activeTab === 'history') {
      fetchLifecycleEvents();
    }
  }, [activeTab, contractId]);

  const fetchLifecycleEvents = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/lifecycle`);
      if (response.ok) {
        const data = await response.json();
        setLifecycleEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching lifecycle events:', error);
    }
  };

  const handleLifecycleAction = async (action: string, data: any = {}) => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`/api/contracts/${contractId}/lifecycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          ...data
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage(result.message || 'Action completed successfully');
        onUpdate?.();
        
        // Close modals
        setShowHoldModal(false);
        setShowTerminateModal(false);
        setShowExtendModal(false);
        setShowSettingsModal(false);
        
        // Reset form states
        setHoldReason('');
        setTerminateReason('');
        setNewExpirationDate('');
        
        // Refresh events if on history tab
        if (activeTab === 'history') {
          fetchLifecycleEvents();
        }
      } else {
        setMessage(result.error || 'Action failed');
      }
    } catch (error) {
      setMessage('Error performing action');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysUntilExpiration = () => {
    if (!contract.expirationDate) return null;
    const now = new Date();
    const expiration = new Date(contract.expirationDate);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = () => {
    const daysLeft = getDaysUntilExpiration();
    if (daysLeft === null) return null;
    
    if (daysLeft < 0) return { status: 'expired', color: 'bg-red-100 text-red-800', label: 'Expired' };
    if (daysLeft <= 7) return { status: 'critical', color: 'bg-red-100 text-red-800', label: 'Critical' };
    if (daysLeft <= 30) return { status: 'warning', color: 'bg-yellow-100 text-yellow-800', label: 'Warning' };
    return { status: 'normal', color: 'bg-green-100 text-green-800', label: 'Normal' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'HOLD': return <Pause className="w-4 h-4" />;
      case 'UNHOLD': return <Play className="w-4 h-4" />;
      case 'TERMINATE': return <X className="w-4 h-4" />;
      case 'EXTEND_EXPIRATION': return <Calendar className="w-4 h-4" />;
      case 'EXPIRATION_WARNING': return <AlertTriangle className="w-4 h-4" />;
      case 'UPDATE_RENEWAL_SETTINGS': return <Settings className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const expirationStatus = getExpirationStatus();
  const daysLeft = getDaysUntilExpiration();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contract Lifecycle Management</h2>
          <p className="text-sm text-gray-600">
            Manage contract expiration, holds, and termination
          </p>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.includes('successfully') || message.includes('completed')
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            {message.includes('successfully') || message.includes('completed') ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.includes('successfully') || message.includes('completed')
                  ? 'text-green-800' 
                  : 'text-red-800'
              }`}>
                {message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'actions', label: 'Actions', icon: Settings },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'history', label: 'History', icon: History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Contract Status</span>
                <Badge variant={contract.contractStatus === 'ON_HOLD' ? 'destructive' : 'default'}>
                  {contract.contractStatus}
                </Badge>
              </div>
              
              {contract.isOnHold && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-center">
                    <Pause className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-800">Contract is on hold</span>
                  </div>
                  {contract.holdReason && (
                    <p className="text-sm text-yellow-700 mt-1">{contract.holdReason}</p>
                  )}
                  {contract.holdDate && contract.holdByUser && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Put on hold by {contract.holdByUser.name} on {formatDate(contract.holdDate)}
                    </p>
                  )}
                </div>
              )}

              {contract.terminationDate && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-center">
                    <X className="w-4 h-4 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-red-800">Contract terminated</span>
                  </div>
                  {contract.terminationReason && (
                    <p className="text-sm text-red-700 mt-1">{contract.terminationReason}</p>
                  )}
                  {contract.terminatedByUser && (
                    <p className="text-xs text-red-600 mt-1">
                      Terminated by {contract.terminatedByUser.name} on {formatDate(contract.terminationDate)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expiration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Expiration Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.expirationDate ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Expiration Date</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(contract.expirationDate)}
                    </span>
                  </div>
                  
                  {expirationStatus && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status</span>
                      <Badge className={expirationStatus.color}>
                        {expirationStatus.label}
                      </Badge>
                    </div>
                  )}
                  
                  {daysLeft !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Days Remaining</span>
                      <span className={`text-sm font-medium ${
                        daysLeft < 0 ? 'text-red-600' : 
                        daysLeft <= 7 ? 'text-red-600' :
                        daysLeft <= 30 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Auto Renewal</span>
                    <Badge variant={contract.autoRenewal ? 'default' : 'secondary'}>
                      {contract.autoRenewal ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No expiration date set</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Hold/Resume Actions */}
          {!contract.isOnHold && contract.contractStatus !== 'TERMINATED' && (
            <Button
              onClick={() => setShowHoldModal(true)}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              disabled={isLoading}
            >
              <Pause className="w-6 h-6 text-yellow-600" />
              <span className="font-medium">Put on Hold</span>
              <span className="text-xs text-gray-500">Temporarily suspend contract</span>
            </Button>
          )}

          {contract.isOnHold && (
            <Button
              onClick={() => handleLifecycleAction('UNHOLD')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              disabled={isLoading}
            >
              <Play className="w-6 h-6 text-green-600" />
              <span className="font-medium">Resume</span>
              <span className="text-xs text-gray-500">Remove hold status</span>
            </Button>
          )}

          {/* Terminate Action */}
          {contract.contractStatus !== 'TERMINATED' && (
            <Button
              onClick={() => setShowTerminateModal(true)}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              disabled={isLoading}
            >
              <X className="w-6 h-6 text-red-600" />
              <span className="font-medium">Terminate</span>
              <span className="text-xs text-gray-500">End contract permanently</span>
            </Button>
          )}

          {/* Extend Expiration */}
          {contract.expirationDate && contract.contractStatus !== 'TERMINATED' && (
            <Button
              onClick={() => setShowExtendModal(true)}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              disabled={isLoading}
            >
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="font-medium">Extend</span>
              <span className="text-xs text-gray-500">Extend expiration date</span>
            </Button>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Renewal & Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Auto Renewal</Label>
                <p className="text-sm text-gray-600">Automatically renew contract when it expires</p>
              </div>
              <Switch
                checked={renewalSettings.autoRenewal}
                onCheckedChange={(checked) => 
                  setRenewalSettings(prev => ({ ...prev, autoRenewal: checked }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="renewalNoticeDays">Renewal Notice Days</Label>
                <Input
                  id="renewalNoticeDays"
                  type="number"
                  value={renewalSettings.renewalNoticeDays}
                  onChange={(e) => 
                    setRenewalSettings(prev => ({ ...prev, renewalNoticeDays: parseInt(e.target.value) || 60 }))
                  }
                  min="1"
                  max="365"
                />
                <p className="text-xs text-gray-500 mt-1">Days before expiration to send renewal notice</p>
              </div>

              <div>
                <Label htmlFor="expirationWarningDays">Expiration Warning Days</Label>
                <Input
                  id="expirationWarningDays"
                  type="number"
                  value={renewalSettings.expirationWarningDays}
                  onChange={(e) => 
                    setRenewalSettings(prev => ({ ...prev, expirationWarningDays: parseInt(e.target.value) || 30 }))
                  }
                  min="1"
                  max="365"
                />
                <p className="text-xs text-gray-500 mt-1">Days before expiration to send warning</p>
              </div>
            </div>

            <Button
              onClick={() => handleLifecycleAction('UPDATE_RENEWAL_SETTINGS', renewalSettings)}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle Event History</CardTitle>
          </CardHeader>
          <CardContent>
            {lifecycleEvents.length > 0 ? (
              <div className="space-y-4">
                {lifecycleEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(event.eventType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {event.eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(event.eventDate)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        by {event.user.name}
                      </p>
                      {event.reason && (
                        <p className="text-sm text-gray-700 mt-1">
                          {event.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No lifecycle events recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hold Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Put Contract on Hold</h3>
              <div className="mb-4">
                <Label htmlFor="holdReason">Reason for Hold</Label>
                <Textarea
                  id="holdReason"
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  rows={3}
                  className="mt-1"
                  placeholder="Explain why this contract is being put on hold..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowHoldModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleLifecycleAction('HOLD', { reason: holdReason })}
                  disabled={isLoading}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {isLoading ? 'Processing...' : 'Put on Hold'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {showTerminateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Terminate Contract</h3>
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The contract will be permanently terminated.
                </p>
              </div>
              <div className="mb-4">
                <Label htmlFor="terminateReason">Reason for Termination</Label>
                <Textarea
                  id="terminateReason"
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  rows={3}
                  className="mt-1"
                  placeholder="Explain why this contract is being terminated..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTerminateModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleLifecycleAction('TERMINATE', { reason: terminateReason })}
                  disabled={isLoading || !terminateReason.trim()}
                  variant="destructive"
                >
                  {isLoading ? 'Processing...' : 'Terminate Contract'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extend Expiration Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Extend Contract Expiration</h3>
              <div className="mb-4">
                <Label htmlFor="currentExpiration">Current Expiration Date</Label>
                <Input
                  id="currentExpiration"
                  value={contract.expirationDate ? formatDate(contract.expirationDate) : 'Not set'}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="newExpirationDate">New Expiration Date</Label>
                <Input
                  id="newExpirationDate"
                  type="date"
                  value={newExpirationDate}
                  onChange={(e) => setNewExpirationDate(e.target.value)}
                  className="mt-1"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowExtendModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleLifecycleAction('EXTEND_EXPIRATION', { newExpirationDate })}
                  disabled={isLoading || !newExpirationDate}
                >
                  {isLoading ? 'Processing...' : 'Extend Expiration'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
