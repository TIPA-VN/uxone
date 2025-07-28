"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  Eye, 
  FileText,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DocumentTemplate {
  id: string;
  templateName: string;
  templateCode: string;
  description?: string;
  isActive: boolean;
  effectiveDate: string;
  revisionNumber: number;
  currentSequence: number;
  prefix: string;
  year: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    username: string;
  };
  _count: {
    generatedDocuments: number;
  };
}

interface CSVTemplate {
  templateName: string;
  templateCode: string;
  description: string;
  prefix: string;
  revisionNumber: number;
}

export default function DocumentTemplateManagePage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [csvData, setCsvData] = useState<CSVTemplate[]>([]);
  const [csvValidation, setCsvValidation] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] });

  // Form state
  const [formData, setFormData] = useState({
    templateName: "",
    templateCode: "",
    description: "",
    prefix: "",
    effectiveDate: new Date().toISOString().split('T')[0],
    revisionNumber: 1,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/document-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        setError('Failed to fetch templates');
      }
    } catch (err) {
      setError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingTemplate 
        ? `/api/document-templates` 
        : '/api/document-templates';
      
      const method = editingTemplate ? 'PATCH' : 'POST';
      const body = editingTemplate 
        ? { id: editingTemplate.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setEditingTemplate(null);
        resetForm();
        fetchTemplates();
        setSuccess(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to save template');
      }
    } catch (err) {
      setError('Failed to save template');
    }
  };

  const resetForm = () => {
    setFormData({
      templateName: "",
      templateCode: "",
      description: "",
      prefix: "",
      effectiveDate: new Date().toISOString().split('T')[0],
      revisionNumber: 1,
    });
  };

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      templateName: template.templateName,
      templateCode: template.templateCode,
      description: template.description || "",
      prefix: template.prefix,
      effectiveDate: new Date(template.effectiveDate).toISOString().split('T')[0],
      revisionNumber: template.revisionNumber,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await fetch(`/api/document-templates?id=${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTemplates();
        setSuccess('Template deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to delete template');
      }
    } catch (err) {
      setError('Failed to delete template');
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const requiredHeaders = ['templateName', 'templateCode', 'description', 'prefix', 'revisionNumber'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      setCsvValidation({
        valid: false,
        errors: [`Missing required headers: ${missingHeaders.join(', ')}`]
      });
      return;
    }

    const data: CSVTemplate[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Validate row
      if (!row.templateName) errors.push(`Row ${i + 1}: templateName is required`);
      if (!row.templateCode) errors.push(`Row ${i + 1}: templateCode is required`);
      if (!row.prefix) errors.push(`Row ${i + 1}: prefix is required`);
      if (!row.year || isNaN(Number(row.year))) errors.push(`Row ${i + 1}: year must be a valid number`);
      if (!row.revisionNumber || isNaN(Number(row.revisionNumber))) errors.push(`Row ${i + 1}: revisionNumber must be a valid number`);

      if (errors.length === 0) {
              data.push({
        templateName: row.templateName,
        templateCode: row.templateCode,
        description: row.description || '',
        prefix: row.prefix,
        revisionNumber: Number(row.revisionNumber),
      });
      }
    }

    setCsvData(data);
    setCsvValidation({
      valid: errors.length === 0,
      errors
    });
  };

  const handleCSVSubmit = async () => {
    if (!csvValidation.valid) return;

    try {
      const response = await fetch('/api/document-templates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: csvData }),
      });

      if (response.ok) {
        setShowCSVUpload(false);
        setCsvData([]);
        setCsvValidation({ valid: true, errors: [] });
        fetchTemplates();
        setSuccess(`${csvData.length} templates created successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to create templates');
      }
    } catch (err) {
      setError('Failed to create templates');
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = `templateName,templateCode,description,prefix,revisionNumber
Liên Lạc Nghiệp Vụ,LLNV,Business Communication Document,TIPA-LLNV,1
Engineer Change Request,ECO,Engineering Change Order Document,TIPA-ECO,1
Inspection Request,INSP,Quality Inspection Request Document,TIPA-INSP,1`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document_templates_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Document Template Management
              </h1>
              <p className="mt-2 text-gray-600">
                Create, edit, and manage document templates for project creation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowCSVUpload(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload CSV
              </Button>
              <Button
                onClick={downloadCSVTemplate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Template
              </Button>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </CardTitle>
              <CardDescription>
                {editingTemplate ? 'Update the template details' : 'Add a new document template'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.templateName}
                      onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Liên Lạc Nghiệp Vụ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.templateCode}
                      onChange={(e) => setFormData({ ...formData, templateCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., LLNV"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prefix *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.prefix}
                      onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., TIPA-LLNV"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Revision Number *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.revisionNumber}
                      onChange={(e) => setFormData({ ...formData, revisionNumber: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Effective Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.effectiveDate}
                      onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Template description..."
                  />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingTemplate(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* CSV Upload Modal */}
        {showCSVUpload && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload Templates via CSV</CardTitle>
              <CardDescription>
                Upload multiple templates using a CSV file. Download the template first to see the required format.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {csvData.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Preview ({csvData.length} templates)
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2">Name</th>
                            <th className="text-left py-2">Code</th>
                            <th className="text-left py-2">Prefix</th>
                            <th className="text-left py-2">Revision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.map((template, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-2">{template.templateName}</td>
                              <td className="py-2">{template.templateCode}</td>
                              <td className="py-2">{template.prefix}</td>
                              <td className="py-2">{template.revisionNumber}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {csvValidation.errors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {csvValidation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCSVUpload(false);
                      setCsvData([]);
                      setCsvValidation({ valid: true, errors: [] });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCSVSubmit}
                    disabled={!csvValidation.valid || csvData.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Upload {csvData.length} Templates
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates List */}
        <Card>
          <CardHeader>
            <CardTitle>Document Templates</CardTitle>
            <CardDescription>
              Manage all document templates used for project creation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600 mb-4">Create your first document template to get started</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Template</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Prefix</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Usage</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr key={template.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{template.templateName}</div>
                            {template.description && (
                              <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="font-mono">
                            {template.templateCode}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm">{template.prefix}</span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600">
                            {template._count.generatedDocuments} documents
                          </div>
                          <div className="text-xs text-gray-500">
                            Seq: {template.currentSequence}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600">
                            {formatDate(template.createdAt)}
                          </div>
                          <div className="text-xs text-gray-500">
                            by {template.createdBy.name}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(template.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 