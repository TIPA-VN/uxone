"use client";
import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText,
  AlertCircle
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

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    templateName: "",
    templateCode: "",
    description: "",
    prefix: "",
    year: new Date().getFullYear(),
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
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
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
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to save template');
      }
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setError('Failed to save template');
    }
  };

  const resetForm = () => {
    setFormData({
      templateName: "",
      templateCode: "",
      description: "",
      prefix: "",
      year: new Date().getFullYear(),
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
      year: template.year,
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
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setError('Failed to delete template');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Templates</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage document templates for automatic document number generation
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </CardTitle>
              <CardDescription>
                {editingTemplate 
                  ? 'Update the document template settings' 
                  : 'Create a new document template for automatic numbering'
                }
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
                      value={formData.templateName}
                      onChange={(e) => setFormData({...formData, templateName: e.target.value})}
                      required
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
                      value={formData.templateCode}
                      onChange={(e) => setFormData({...formData, templateCode: e.target.value.toUpperCase()})}
                      required
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
                      value={formData.prefix}
                      onChange={(e) => setFormData({...formData, prefix: e.target.value.toUpperCase()})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., TIPA-LLNV"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year *
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      required
                      min={2020}
                      max={2030}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Effective Date *
                    </label>
                    <input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Revision Number *
                    </label>
                    <input
                      type="number"
                      value={formData.revisionNumber}
                      onChange={(e) => setFormData({...formData, revisionNumber: parseInt(e.target.value)})}
                      required
                      min={1}
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
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Optional description of the template"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingTemplate(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Templates List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.templateName}</CardTitle>
                    <CardDescription className="mt-1">
                      Code: <span className="font-mono text-blue-600">{template.templateCode}</span>
                    </CardDescription>
                  </div>
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p><strong>Prefix:</strong> {template.prefix}</p>
                  <p><strong>Year:</strong> {template.year}</p>
                  <p><strong>Revision:</strong> {template.revisionNumber}</p>
                  <p><strong>Current Sequence:</strong> {template.currentSequence}</p>
                  <p><strong>Generated Documents:</strong> {template._count.generatedDocuments}</p>
                </div>
                
                {template.description && (
                  <p className="text-sm text-gray-500">{template.description}</p>
                )}
                
                <div className="flex items-center text-xs text-gray-500">
                  <FileText className="w-3 h-3 mr-1" />
                  Effective: {formatDate(template.effectiveDate)}
                </div>
                
                <div className="flex items-center text-xs text-gray-500">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Created by: {template.createdBy.name} (@{template.createdBy.username})
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No document templates found</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Template
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 