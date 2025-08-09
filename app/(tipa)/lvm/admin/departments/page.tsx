'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  X,
  Check,
  AlertTriangle,
  Users,
  Settings,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
type UIDepartment = {
  id: string;
  value: string;
  label: string;
  code: string;
  color: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  category: string;
  createdAt: string;
  updatedAt: string;
};

type DepartmentFormData = {
  value: string;
  label: string;
  code: string;
  color: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  category: string;
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<UIDepartment[]>([]);
  const [newDepartment, setNewDepartment] = useState<DepartmentFormData>({
    value: '',
    label: '',
    code: '',
    color: 'bg-blue-500',
    description: '',
    isActive: true,
    sortOrder: 1,
    category: 'general'
  });
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<DepartmentFormData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search');
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchTerm) {
        setSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm]);

  // Clear messages after delay
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Load departments on component mount
  useEffect(() => {
    const savedDepartments = localStorage.getItem('departments');
    if (savedDepartments) {
      try {
        const parsed = JSON.parse(savedDepartments);
        setDepartments(parsed);
        setHasUnsavedChanges(true);
        return;
      } catch {
        console.warn('Failed to parse saved departments, falling back to config');
      }
    }
    
    // Initialize with config data
    const defaultDepartments = [
      {
        value: 'engineering',
        label: 'Engineering',
        code: 'ENG',
        color: 'bg-blue-500',
        description: 'Engineering department',
        isActive: true,
        sortOrder: 1,
        category: 'technical'
      },
      {
        value: 'operations',
        label: 'Operations',
        code: 'OPS',
        color: 'bg-green-500',
        description: 'Operations department',
        isActive: true,
        sortOrder: 2,
        category: 'business'
      }
    ];
    
    const allDepts = defaultDepartments;
    const mutableDepts: UIDepartment[] = allDepts.map((dept) => ({
      id: Date.now().toString() + Math.random(),
      value: dept.value,
      label: dept.label,
      code: dept.code,
      color: dept.color,
      description: dept.description,
      isActive: dept.isActive ?? true,
      sortOrder: dept.sortOrder ?? 1,
      category: dept.category || 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    setDepartments(mutableDepts);
    setHasUnsavedChanges(false);
  }, []);

  // Save to localStorage
  const saveToLocalStorage = (departmentsData: UIDepartment[]) => {
    try {
      localStorage.setItem('departments', JSON.stringify(departmentsData));
      setHasUnsavedChanges(true);
    } catch (_error) {
      console.error('Failed to save departments to localStorage:', _error);
    }
  };

  // Helper functions
  const getNextSortOrder = (): number => {
    if (departments.length === 0) return 1;
    return Math.max(...departments.map(dept => dept.sortOrder)) + 1;
  };

  const getAvailableColors = (): string[] => {
    return [
      'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
    ];
  };

  const validateDepartmentData = (data: DepartmentFormData): boolean => {
    return !!(data.value && data.code && data.description);
  };

  // Add new department
  const handleAddDepartment = () => {
    if (!validateDepartmentData(newDepartment)) {
      setError('Please fill in all required fields.');
      return;
    }

    const departmentToAdd: UIDepartment = {
      id: Date.now().toString(),
      value: newDepartment.value,
      label: newDepartment.label,
      code: newDepartment.code,
      color: newDepartment.color,
      description: newDepartment.description,
      isActive: newDepartment.isActive,
      sortOrder: getNextSortOrder(),
      category: newDepartment.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDepartments(prev => [...prev, departmentToAdd]);
    saveToLocalStorage([...departments, departmentToAdd]);
    setNewDepartment({
      value: '',
      label: '',
      code: '',
      color: 'bg-blue-500',
      description: '',
      isActive: true,
      sortOrder: 1,
      category: 'general'
    });
    setSuccess('Department added successfully!');
    setError('');
    setHasUnsavedChanges(true);
  };

  // Edit department
  const handleEditDepartment = (value: string) => {
    const dept = departments.find(d => d.value === value);
    if (dept) {
      setEditingDepartment(value);
      setEditFormData({
        value: dept.value,
        label: dept.label,
        code: dept.code,
        color: dept.color,
        description: dept.description,
        isActive: dept.isActive,
        sortOrder: dept.sortOrder,
        category: dept.category
      });
    }
  };

  // Save edited department
  const handleSaveDepartment = (value: string) => {
    if (!editFormData || !validateDepartmentData(editFormData)) {
      setError('Please fill in all required fields.');
      return;
    }

    setDepartments(prev => prev.map(dept => 
      dept.value === value 
        ? { ...dept, ...editFormData, updatedAt: new Date().toISOString() }
        : dept
    ));

    const updatedDepartments = departments.map(dept => 
      dept.value === value 
        ? { ...dept, ...editFormData, updatedAt: new Date().toISOString() }
        : dept
    );
    saveToLocalStorage(updatedDepartments);

    setEditingDepartment(null);
    setEditFormData(null);
    setSuccess('Department updated successfully!');
    setError('');
    setHasUnsavedChanges(true);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingDepartment(null);
    setEditFormData(null);
    setError('');
  };

  // Delete department (mark as inactive)
  const handleDeleteDepartment = (value: string) => {
    const updatedDepartments = departments.map(dept =>
      dept.value === value
        ? { ...dept, isActive: false }
        : dept
    );
    
    setDepartments(updatedDepartments);
    saveToLocalStorage(updatedDepartments);
    setSuccess('Department deactivated successfully!');
    setError('');
  };

  // Activate department
  const handleActivateDepartment = (value: string) => {
    const updatedDepartments = departments.map(dept =>
      dept.value === value
        ? { ...dept, isActive: true }
        : dept
    );
    
    setDepartments(updatedDepartments);
    saveToLocalStorage(updatedDepartments);
    setSuccess('Department activated successfully!');
    setError('');
  };

  // Reset to original config
  const resetToOriginalConfig = () => {
    if (confirm("Are you sure you want to reset to original configuration? This will discard all changes.")) {
      // Reset to default departments
      const defaultDepartments: UIDepartment[] = [
        {
          id: '1',
          value: 'general',
          label: 'General',
          code: 'GEN',
          color: 'bg-blue-500',
          description: 'General department',
          isActive: true,
          sortOrder: 1,
          category: 'general',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          value: 'engineering',
          label: 'Engineering',
          code: 'ENG',
          color: 'bg-green-500',
          description: 'Engineering department',
          isActive: true,
          sortOrder: 2,
          category: 'technical',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setDepartments(defaultDepartments);
      saveToLocalStorage(defaultDepartments);
      setSuccess('Configuration reset to original values.');
      setError('');
      setHasUnsavedChanges(false);
    }
  };

  // Export departments configuration
  const handleExport = () => {
    const dataStr = JSON.stringify(departments, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `departments-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import departments configuration
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          setDepartments(data);
          saveToLocalStorage(data);
          setSuccess('Department configuration imported successfully!');
          setError('');
        } else {
          setError('Invalid file format. Please upload a valid JSON file.');
        }
      } catch {
        setError('Failed to parse the uploaded file. Please check the format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const colorOptions = getAvailableColors();
  const activeDepartments = departments.filter(dept => dept.isActive);
  const inactiveDepartments = departments.filter(dept => !dept.isActive);

  // Filtered departments based on search and status
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dept.value.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && dept.isActive) ||
                         (filterStatus === 'inactive' && !dept.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const filteredActiveDepartments = filteredDepartments.filter(dept => dept.isActive);
  const filteredInactiveDepartments = filteredDepartments.filter(dept => !dept.isActive);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage organizational departments and their configurations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total Departments:</span> {departments.length}
              </div>
            </div>
          </div>
          
          {/* Unsaved Changes Indicator */}
          {hasUnsavedChanges && (
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Using modified configuration (changes saved locally)</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="import-departments"
            />
            <Button
              variant="outline"
              className="flex items-center gap-2"
              asChild
            >
              <label htmlFor="import-departments">
                <Upload className="w-4 h-4" />
                Import Config
              </label>
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Config
          </Button>
          <Button
            variant="outline"
            onClick={resetToOriginalConfig}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Reset to Original
          </Button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search Departments</Label>
                <div className="relative mt-1">
                  <Input
                    id="search"
                    placeholder="Search by name, code, or key..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1 h-6 w-6 p-0"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+K</kbd> to focus search
                </p>
              </div>
              <div>
                <Label htmlFor="status-filter">Status Filter</Label>
                <Select
                  value={filterStatus}
                  onValueChange={(value: 'all' | 'active' | 'inactive') => setFilterStatus(value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-sm text-gray-600">
                  Showing {filteredDepartments.length} of {departments.length} departments
                </div>
                {(searchTerm || filterStatus !== 'all') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add New Department Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Department</CardTitle>
            <CardDescription>Create a new department with custom settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleAddDepartment(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="new-value">Internal Key *</Label>
                  <Input
                    id="new-value"
                    value={newDepartment.value}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="e.g., LOG"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-label">Display Name *</Label>
                  <Input
                    id="new-label"
                    value={newDepartment.label}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g., Logistics"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-code">Department Code *</Label>
                  <Input
                    id="new-code"
                    value={newDepartment.code}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g., LOG"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-color">Color Theme</Label>
                  <Select
                    value={newDepartment.color}
                    onValueChange={(value) => setNewDepartment(prev => ({ ...prev, color: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${color}`}></div>
                            {color}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="new-description">Description</Label>
                  <Input
                    id="new-description"
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Department description..."
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="submit" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Department
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Active Departments */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Departments</h2>
          {filteredActiveDepartments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'No active departments match your search criteria.'
                : 'No active departments found.'
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActiveDepartments.map((dept) => (
              <Card key={dept.value} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{dept.label}</CardTitle>
                    <div className={`w-4 h-4 rounded-full ${dept.color}`}></div>
                  </div>
                  <CardDescription>{dept.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {editingDepartment === dept.value ? (
                    // Edit Form
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`edit-label-${dept.value}`}>Display Name</Label>
                        <Input
                          id={`edit-label-${dept.value}`}
                          value={editFormData?.label || ''}
                          onChange={(e) => setEditFormData(prev => prev ? { ...prev, label: e.target.value } : null)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-code-${dept.value}`}>Department Code</Label>
                        <Input
                          id={`edit-code-${dept.value}`}
                          value={editFormData?.code || ''}
                          onChange={(e) => setEditFormData(prev => prev ? { ...prev, code: e.target.value } : null)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-color-${dept.value}`}>Color Theme</Label>
                        <Select
                          value={editFormData?.color || dept.color}
                          onValueChange={(value) => setEditFormData(prev => prev ? { ...prev, color: value } : null)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map((color) => (
                              <SelectItem key={color} value={color}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full ${color}`}></div>
                                  {color}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`edit-description-${dept.value}`}>Description</Label>
                        <Input
                          id={`edit-description-${dept.value}`}
                          value={editFormData?.description || ''}
                          onChange={(e) => setEditFormData(prev => prev ? { ...prev, description: e.target.value } : null)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-sort-${dept.value}`}>Sort Order</Label>
                        <Input
                          id={`edit-sort-${dept.value}`}
                          type="number"
                          value={editFormData?.sortOrder || dept.sortOrder}
                          onChange={(e) => setEditFormData(prev => prev ? { ...prev, sortOrder: parseInt(e.target.value) || 1 } : null)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveDepartment(dept.value)}
                          className="flex-1"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="flex-1"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Department Info:</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Internal Key:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {dept.value}
                            </code>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Department Code:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {dept.code}
                            </code>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Color Theme:</span>
                            <span className="text-gray-900">{dept.color}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Sort Order:</span>
                            <span className="text-gray-900">{dept.sortOrder}</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            Active
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditDepartment(dept.value)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDepartment(dept.value)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Deactivate
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>

        {/* Inactive Departments */}
        {filteredInactiveDepartments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Inactive Departments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInactiveDepartments.map((dept) => (
                <Card key={dept.value} className="hover:shadow-md transition-shadow border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-500">{dept.label}</CardTitle>
                      <div className={`w-4 h-4 rounded-full ${dept.color}`}></div>
                    </div>
                    <CardDescription className="text-gray-400">{dept.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Department Info:</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Internal Key:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500">
                              {dept.value}
                            </code>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Department Code:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500">
                              {dept.code}
                            </code>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Status:</span>
                          <Badge variant="outline" className="text-gray-500 border-gray-300">
                            Inactive
                          </Badge>
                        </div>
                      </div>
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleActivateDepartment(dept.value)}
                          className="w-full"
                        >
                          <Check className="w-4 h-4" />
                          Activate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Department Statistics */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Department Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-500 text-white">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Departments</p>
                    <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-500 text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Departments</p>
                    <p className="text-2xl font-bold text-gray-900">{activeDepartments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-orange-500 text-white">
                    <Settings className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Inactive Departments</p>
                    <p className="text-2xl font-bold text-gray-900">{inactiveDepartments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-500 text-white">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Available Colors</p>
                    <p className="text-2xl font-bold text-gray-900">{colorOptions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Department Configuration */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Department Configuration</h2>
          <Card>
            <CardHeader>
              <CardTitle>Department Settings</CardTitle>
              <CardDescription>
                Configure department-specific settings and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Department
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select default department</option>
                      {activeDepartments.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department Access Level
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="all">All Departments</option>
                      <option value="own">Own Department Only</option>
                      <option value="restricted">Restricted Access</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                    Cancel
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Save Changes
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 