"use client";

import React from 'react';
import { Project } from '@/types';

interface SimpleContractEditorProps {
  project: Project;
  onSaveContent?: (content: string) => Promise<boolean>;
  onShare?: () => void;
}

export default function SimpleContractEditor({ 
  project, 
  onSaveContent,
  onShare 
}: SimpleContractEditorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Contract Document Editor</h3>
        <p className="text-sm text-gray-600 mt-2">
          Edit and manage contract content for project: {project.name}
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Contract Details</h4>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Project Type:</span> {project.projectType || 'GENERAL'}</div>
            <div><span className="font-medium">Contract Type:</span> {project.contractDetails?.contractType || 'N/A'}</div>
            <div><span className="font-medium">Counterparty:</span> {project.contractDetails?.counterparty || 'N/A'}</div>
            <div><span className="font-medium">Value:</span> {project.contractDetails?.value ? `${project.contractDetails.value} ${project.contractDetails.currency}` : 'N/A'}</div>
            <div><span className="font-medium">Status:</span> {project.contractDetails?.contractStatus || 'N/A'}</div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 text-blue-500 mr-3">📄</div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Document Editor</h3>
              <p className="text-sm text-blue-700 mt-1">
                This is a simplified contract editor. The full versioning and editing features are available in the enhanced version.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => onSaveContent?.('Sample contract content')}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            Save Content
          </button>
          <button
            onClick={onShare}
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Share Contract
          </button>
        </div>
      </div>
    </div>
  );
}
