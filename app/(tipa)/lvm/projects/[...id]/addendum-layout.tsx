"use client";

import React, { useState } from 'react';
import { Project } from '@/types';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import EnhancedContractTab from '@/components/contracts/EnhancedContractTab';
import { useProject } from './hooks/useProject';

interface ExtendedContractDetails {
  contractTitle?: string;
  addendumNumber?: number;
  parentContract?: {
    contractNumber?: string;
    project?: {
      id: string;
    };
  };
}

interface AddendumLayoutProps {
  project: Project & {
    contractDetails?: ExtendedContractDetails;
  };
}

export default function AddendumLayout({ project: initialProject }: AddendumLayoutProps) {
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const { project: currentProject, updateProject, refetchProject } = useProject(initialProject.id);
  
  // Use current project data from hook, fallback to initial project
  const project = currentProject || initialProject;
  

  
  const parentContractId = project.contractDetails?.parentContract?.project?.id;
  const parentContractNumber = project.contractDetails?.parentContract?.contractNumber;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Header with navigation back to parent */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                {/* Back button - prefer parent contract, fallback to projects */}
                <>
                  <Link
                    href={parentContractId ? `/lvm/projects/addendums/${parentContractId}` : '/lvm/projects'}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Go Back
                  </Link>
                  <div className="h-4 w-px bg-gray-300"></div>
                </>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {project.contractDetails?.contractTitle}
                    </h1>
                    <p className="text-sm text-gray-600">
                      Addendum {project.contractDetails?.addendumNumber} 
                      {parentContractNumber && ` to ${parentContractNumber}`}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Addendum badge only */}
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                  <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                  ADDENDUM
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Status Message */}
      {actionStatus && (
        <div className="px-4 sm:px-6 lg:px-8 py-2">
          <div className={`rounded-md p-3 ${
            actionStatus.includes('successfully') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {actionStatus}
          </div>
        </div>
      )}

      {/* Main content - Full width contract management */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <EnhancedContractTab 
          project={project}
          hideHeader={true}
          onUpdateContract={async (contractData: Partial<Project['contractDetails']>) => {
            try {
              const updatedProject = {
                ...project,
                contractDetails: contractData as Project['contractDetails']
              };
              updateProject(updatedProject);
              
              await new Promise(resolve => setTimeout(resolve, 100));
              await refetchProject();
              
              setActionStatus("Addendum workflow updated successfully!");
              setTimeout(() => setActionStatus(null), 3000);
            } catch (error) {
              console.error('Error updating addendum workflow:', error);
              setActionStatus("Error updating addendum workflow.");
              setTimeout(() => setActionStatus(null), 5000);
            }
          }}
        />
      </div>
    </div>
  );
}
