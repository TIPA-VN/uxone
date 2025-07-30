'use client';
import React from 'react';
import { AlertTriangle, Download, Code, CheckCircle, Package } from 'lucide-react';

export default function InstallationGuide() {
  const installationSteps = [
    {
      step: 1,
      title: 'Install Main Packages',
      command: 'npm install soap xml2js',
      description: 'Install the SOAP client and XML parser packages'
    },
    {
      step: 2,
      title: 'Install TypeScript Types',
      command: 'npm install -D @types/soap @types/xml2js',
      description: 'Install TypeScript type definitions'
    },
    {
      step: 3,
      title: 'Install Peer Dependencies',
      command: 'npm install inherits once wrappy asap minimalistic-assert',
      description: 'Install required peer dependencies for SOAP package'
    },
    {
      step: 4,
      title: 'Restart Development Server',
      command: 'npm run dev',
      description: 'Restart your development server to load all packages'
    },
    {
      step: 5,
      title: 'Test Connection',
      description: 'Click the "Test Connection" button to verify SOAP integration'
    }
  ];

  const alternativeSolution = {
    title: 'Alternative: Use a Different SOAP Library',
    description: 'If you continue having issues with the soap package, consider using axios with XML parsing instead.',
    command: 'npm install axios xml2js @types/xml2js'
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            SOAP Dependencies Required
          </h3>
          <p className="text-yellow-700 mb-4">
            The VNPT Invoice Checker requires additional packages to communicate with the SOAP service. 
            The errors you're seeing are due to missing peer dependencies.
          </p>

          <div className="space-y-4">
            {installationSteps.map((step) => (
              <div key={step.step} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center">
                  <span className="text-yellow-800 text-sm font-medium">{step.step}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 mb-1">{step.title}</h4>
                  {step.command && (
                    <div className="bg-yellow-100 border border-yellow-300 rounded px-3 py-2 mb-2">
                      <code className="text-sm text-yellow-800 font-mono">{step.command}</code>
                    </div>
                  )}
                  <p className="text-sm text-yellow-700">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-white rounded border border-yellow-300">
            <div className="flex items-center space-x-2 mb-2">
              <Code className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Complete Install Command</span>
            </div>
            <div className="bg-gray-100 rounded px-3 py-2">
              <code className="text-sm text-gray-800 font-mono">
                npm install soap xml2js inherits once wrappy asap minimalistic-assert && npm install -D @types/soap @types/xml2js
              </code>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">{alternativeSolution.title}</span>
            </div>
            <p className="text-sm text-blue-700 mb-2">{alternativeSolution.description}</p>
            <div className="bg-blue-100 border border-blue-300 rounded px-3 py-2">
              <code className="text-sm text-blue-800 font-mono">{alternativeSolution.command}</code>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-2 text-sm text-yellow-700">
            <CheckCircle className="w-4 h-4" />
            <span>After installation, the Invoice Checker will be fully functional</span>
          </div>
        </div>
      </div>
    </div>
  );
} 