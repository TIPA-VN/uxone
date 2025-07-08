'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, FileText, Image, Code, Database, LucideIcon } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon; // More specific type
}

const tools: Tool[] = [
  {
    id: 'so_request',
    name: 'Change Request Date',
    description: 'Change the request date of work orders',
    icon: Calculator,
  },
  {
    id: 'generate_wo',
    name: 'Generate WO',
    description: 'Generate work orders from SO',
    icon: FileText,
  },
  {
    id: 'image-editor',
    name: 'Image Editor',
    description: 'Edit and process images',
    icon: Image,
  },
  {
    id: 'code-editor',
    name: 'Code Editor',
    description: 'Write and edit code',
    icon: Code,
  },
  {
    id: 'data-analyzer',
    name: 'Data Analyzer',
    description: 'Analyze data and create charts',
    icon: Database,
  },
];

export default function ToolSelectionPage() {
  const router = useRouter();

  const handleToolClick = (toolId: string) => {
    router.push(`./tools/${toolId}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent, toolId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToolClick(toolId);
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
              onClick={() => handleToolClick(tool.id)}
              onKeyDown={(e) => handleKeyDown(e, tool.id)}
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