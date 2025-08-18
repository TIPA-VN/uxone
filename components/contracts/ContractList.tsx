'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface Contract {
  id: string;
  title: string;
  contractType: string;
  workflowState: string;
  version: number;
  department: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    name: string;
    username: string;
  };
  contractDetails?: {
    isLocked: boolean;
    currentApprovalLevel: number;
    totalApprovalLevels: number;
    value?: number;
    currency?: string;
  };
  project?: {
    name: string;
  };
}

interface ContractListProps {
  onContractSelect?: (contract: Contract) => void;
  onNewContract?: () => void;
  projectId?: string;
}

const ContractList: React.FC<ContractListProps> = ({
  onContractSelect,
  onNewContract,
  projectId
}) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');

  // Fetch contracts
  useEffect(() => {
    fetchContracts();
  }, [projectId]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (filterType !== 'all') params.append('contractType', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterDepartment !== 'all') params.append('department', filterDepartment);

      const response = await fetch(`/api/contracts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      } else {
        console.error('Failed to fetch contracts');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter contracts based on search and filters
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.owner.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || contract.contractType === filterType;
    const matchesStatus = filterStatus === 'all' || contract.workflowState === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || contract.department === filterDepartment;

    return matchesSearch && matchesType && matchesStatus && matchesDepartment;
  });

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary">Draft</Badge>;
      case 'IN_REVIEW':
        return <Badge variant="default">In Review</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'FINALIZED':
        return <Badge variant="default" className="bg-blue-600">Finalized</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get contract type display name
  const getContractTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'PURCHASE_CONTRACT': 'Purchase Contract',
      'LOGISTICS_AGREEMENT': 'Logistics Agreement',
      'PRICING_AGREEMENT': 'Pricing Agreement',
      'LEGAL_DISPUTE': 'Legal Dispute',
      'MOQ_AGREEMENT': 'MOQ Agreement',
      'SERVICE_AGREEMENT': 'Service Agreement'
    };
    return typeMap[type] || type;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle contract actions
  const handleView = (contract: Contract) => {
    onContractSelect?.(contract);
  };

  const handleEdit = (contract: Contract) => {
    if (contract.contractDetails?.isLocked) {
      alert('This contract is locked and cannot be edited');
      return;
    }
    onContractSelect?.(contract);
  };

  const handleDelete = async (contract: Contract) => {
    if (!confirm(`Are you sure you want to delete "${contract.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setContracts(contracts.filter(c => c.id !== contract.id));
      } else {
        alert('Failed to delete contract');
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Failed to delete contract');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading contracts...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contracts</h2>
          <p className="text-gray-600 mt-1">Manage and track contract documents</p>
        </div>
        
        <Button onClick={onNewContract} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Contract Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Contract Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PURCHASE_CONTRACT">Purchase Contract</SelectItem>
                <SelectItem value="LOGISTICS_AGREEMENT">Logistics Agreement</SelectItem>
                <SelectItem value="PRICING_AGREEMENT">Pricing Agreement</SelectItem>
                <SelectItem value="LEGAL_DISPUTE">Legal Dispute</SelectItem>
                <SelectItem value="MOQ_AGREEMENT">MOQ Agreement</SelectItem>
                <SelectItem value="SERVICE_AGREEMENT">Service Agreement</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="FINALIZED">Finalized</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Department Filter */}
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="PROCUREMENT">Procurement</SelectItem>
                <SelectItem value="LEGAL">Legal</SelectItem>
                <SelectItem value="FINANCE">Finance</SelectItem>
                <SelectItem value="OPERATIONS">Operations</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button variant="outline" onClick={fetchContracts}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredContracts.length} Contract{filteredContracts.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No contracts found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{contract.title}</div>
                        {contract.project && (
                          <div className="text-sm text-gray-500">
                            Project: {contract.project.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getContractTypeName(contract.contractType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(contract.workflowState)}
                      {contract.contractDetails && (
                        <div className="text-xs text-gray-500 mt-1">
                          Level {contract.contractDetails.currentApprovalLevel} of {contract.contractDetails.totalApprovalLevels}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">v{contract.version}</Badge>
                    </TableCell>
                    <TableCell>{contract.department}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.owner.name}</div>
                        <div className="text-sm text-gray-500">{contract.owner.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(contract.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(contract)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(contract)}
                          disabled={contract.contractDetails?.isLocked}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contract)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
};

export default ContractList;
