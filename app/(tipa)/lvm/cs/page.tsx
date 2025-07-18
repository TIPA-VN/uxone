'use client';
import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaRobot, FaFileAlt, FaImage, FaCode, FaDatabase } from "react-icons/fa";
import { IconType } from 'react-icons';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: IconType; // Changed from LucideIcon to IconType
  path: string; // Added path property
}

const tools: Tool[] = [
  {
    id: 'cs-agent',
    name: 'CS Agent',
    description: 'Customer Service Agent for handling customer inquiries',
    icon: FaRobot,
    path: '/chat/cs-chatbox', // Specify your custom path here
  },
  {
    id: 'generate_wo',
    name: 'Generate WO',
    description: 'Generate work orders from SO',
    icon: FaFileAlt, // React Icons equivalent of FileText
    path: '/tools/generate-wo', // Specify your custom path here
  },
  {
    id: 'image-editor',
    name: 'Image Editor',
    description: 'Edit and process images',
    icon: FaImage, // React Icons equivalent of Image
    path: '/tools/image-editor', // Specify your custom path here
  },
  {
    id: 'code-editor',
    name: 'Code Editor',
    description: 'Write and edit code',
    icon: FaCode, // React Icons equivalent of Code
    path: '/tools/code-editor', // Specify your custom path here
  },
  {
    id: 'data-analyzer',
    name: 'Data Analyzer',
    description: 'Analyze data and create charts',
    icon: FaDatabase, // React Icons equivalent of Database
    path: '/tools/data-analyzer', // Specify your custom path here
  },
];

export default function ToolSelectionPage() {
  const handleToolClick = (path: string) => {
    window.open(path, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (event: React.KeyboardEvent, path: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToolClick(path);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose a Tool</h1>
        <p className="text-muted-foreground">Select the tool you want to use</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Card 
              key={tool.id}
              className="cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => handleToolClick(tool.path)}
              onKeyDown={(e) => handleKeyDown(e, tool.path)}
              tabIndex={0}
              role="button"
              aria-label={`Select ${tool.name} tool`}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 p-2 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}