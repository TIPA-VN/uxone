"use client";

import React from 'react';
import EnhancedContractTab from '@/components/contracts/EnhancedContractTab';
import { Project } from '@/types';

export default function EnhancedContractDemoPage() {
  // Mock project data for demonstration
  const mockProject: Project = {
    id: 'demo-contract-enhanced-1',
    name: 'Enhanced Contract Project Demo',
    description: 'This is a comprehensive demonstration of the enhanced contract management system',
    status: 'ACTIVE',
    departments: ['IT', 'Finance', 'Legal'],
    documentTemplate: 'contract-template-1',
    documentNumber: 'CON-2025-001',
    projectType: 'CONTRACT',
    contractDetails: {
      id: 'contract-enhanced-1',
      contractType: 'SERVICE_AGREEMENT',
      counterparty: 'Tech Solutions Inc.',
      value: 75000,
      currency: 'USD',
      contractStatus: 'REVIEW',
      contractNumber: 'CON-2025-001'
    },
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z'
  };

  // Sample formatted content for the document editor
  const sampleFormattedContent = `
    <h1>Service Agreement Contract</h1>
    
    <h2>1. Parties</h2>
    <p><strong>Service Provider:</strong> UXOne Corporation</p>
    <p><strong>Client:</strong> Tech Solutions Inc.</p>
    
    <h2>2. Services</h2>
    <p>The Service Provider shall provide the following services:</p>
    <ul>
      <li>Software development and implementation</li>
      <li>System integration services</li>
      <li>Technical support and maintenance</li>
      <li>Training and documentation</li>
    </ul>
    
    <h2>3. Term</h2>
    <p>This agreement shall commence on <em>January 15, 2025</em> and continue for a period of <strong>12 months</strong>.</p>
    
    <h2>4. Payment Terms</h2>
    <p>Total contract value: <strong>$75,000 USD</strong></p>
    <p>Payment schedule:</p>
    <ol>
      <li>30% upon contract signing</li>
      <li>40% upon project milestone completion</li>
      <li>30% upon final delivery and acceptance</li>
    </ol>
    
    <blockquote>
      <p>All payments shall be made within 30 days of invoice receipt.</p>
    </blockquote>
    
    <h2>5. Deliverables</h2>
    <p>The Service Provider shall deliver:</p>
    <ul>
      <li>Project management system</li>
      <li>User documentation</li>
      <li>Training materials</li>
      <li>Source code and technical specifications</li>
    </ul>
    
    <p>For more information, visit our <a href="https://uxone.com">website</a> or contact our team.</p>
  `;

  // Update the mock project with formatted content
  const projectWithContent = {
    ...mockProject,
    contractDetails: {
      ...mockProject.contractDetails,
      // Add sample content to show rich text capabilities
      sampleContent: sampleFormattedContent
    }
  };

  const handleContractUpdate = (updates: Partial<{
    contractType: string;
    counterparty: string;
    value: number | null;
    currency: string;
    contractStatus: string;
  }>) => {
    console.log('Contract updates received:', updates);
    // In a real app, this would trigger a refresh of the project data
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Contract Management Demo</h1>
          <p className="mt-2 text-sm text-gray-600">
            This page demonstrates the complete contract management system including document editing and workflow management
          </p>
        </div>

        {/* Feature Overview */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-medium text-blue-600">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Contract Details</h3>
                <p className="text-sm text-gray-600">
                  Manage contract information, status, and metadata
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-medium text-purple-600">✏️</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Document Editor</h3>
                <p className="text-sm text-gray-600">
                  Rich text editing with version control and history
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-medium text-green-600">🔄</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Workflow Management</h3>
                <p className="text-sm text-gray-600">
                  Approval workflows, status changes, and execution tracking
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Contract Tab */}
        <EnhancedContractTab 
          project={projectWithContent}
          onUpdateContract={handleContractUpdate}
        />

        {/* Usage Instructions */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Use This Demo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">1. Contract Details Tab</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• View and edit contract information</li>
                <li>• Update contract type, counterparty, and value</li>
                <li>• Change contract status</li>
                <li>• See contract workflow progression</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">2. Document Editor Tab</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Edit contract content in rich text</li>
                <li>• Save and manage document versions</li>
                <li>• View version history</li>
                <li>• Restore previous versions</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">3. Workflow Tab</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Approve or reject contracts</li>
                <li>• Send for review</li>
                <li>• Sign contracts</li>
                <li>• Track approval history</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">4. Quick Actions</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Export contracts</li>
                <li>• Share with stakeholders</li>
                <li>• Quick navigation between tabs</li>
                <li>• Status-based action buttons</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Features */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Technical Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h3 className="font-medium mb-2">Frontend Components:</h3>
              <ul className="space-y-1">
                <li>• React hooks for state management</li>
                <li>• TypeScript for type safety</li>
                <li>• Tailwind CSS for styling</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Backend Integration:</h3>
              <ul className="space-y-1">
                <li>• RESTful API endpoints</li>
                <li>• Prisma ORM integration</li>
                <li>• Authentication & authorization</li>
                <li>• Audit logging</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
