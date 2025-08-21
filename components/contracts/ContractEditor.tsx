'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  Download, 
  Upload, 
  Eye, 
  History, 
  Users, 
  Lock, 
  Unlock,
  FileText,
  Edit3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Types
interface ContractEditorProps {
  contractId?: string;
  initialContent?: string;
  title?: string;
  contractType?: string;
  isEditable?: boolean;
  onSave?: (content: string, metadata: ContractMetadata) => Promise<void>;
  onVersionChange?: (version: number) => void;
}

interface ContractMetadata {
  title: string;
  contractType: string;
  version: number;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'FINALIZED';
  approvers: string[];
  dueDate?: Date;
}

interface DocumentChange {
  id: string;
  userId: string;
  userName: string;
  timestamp: Date;
  changeType: 'insert' | 'delete' | 'format' | 'comment';
  position: number;
  oldContent?: string;
  newContent?: string;
}

const ContractEditor: React.FC<ContractEditorProps> = ({
  contractId,
  initialContent = '',
  title = 'New Contract',
  contractType = 'PURCHASE_CONTRACT',
  isEditable = true,
  onSave,
  onVersionChange
}) => {
  // State
  const [metadata, setMetadata] = useState<ContractMetadata>({
    title,
    contractType,
    version: 1,
    status: 'DRAFT',
    approvers: []
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [changes, setChanges] = useState<DocumentChange[]>([]);
  const [collaborators, setCollaborators] = useState<string[]>([]);

  // Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify']
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300'
        }
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 font-semibold'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2'
        }
      })
    ],
    content: initialContent,
    editable: isEditable,
    onUpdate: ({ editor }) => {
      // Track changes for collaboration
      const content = editor.getHTML();
      // Here you would implement change tracking
    }
  });

  // Save contract
  const handleSave = useCallback(async () => {
    if (!editor || !onSave) return;
    
    setIsSaving(true);
    try {
      const content = editor.getHTML();
      await onSave(content, metadata);
      
      // Update version
      const newVersion = metadata.version + 1;
      setMetadata(prev => ({ ...prev, version: newVersion }));
      onVersionChange?.(newVersion);
      
    } catch (error) {
      // Handle error silently
    } finally {
      setIsSaving(false);
    }
  }, [editor, metadata, onSave, onVersionChange]);

  // Export functions
  const exportToWord = () => {
    if (!editor) return;
    const content = editor.getHTML();
    // Implementation for Word export
  };

  const exportToPDF = () => {
    if (!editor) return;
    const content = editor.getHTML();
    // Implementation for PDF export
  };

  // Toolbar actions
  const addTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addRow = () => {
    if (!editor) return;
    editor.chain().focus().addRowAfter().run();
  };

  const addColumn = () => {
    if (!editor) return;
    editor.chain().focus().addColumnAfter().run();
  };

  const deleteTable = () => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contract Editor</h1>
          <p className="text-gray-600 mt-1">Create and edit contracts with real-time collaboration</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant={metadata.status === 'DRAFT' ? 'secondary' : 'default'}>
            {metadata.status}
          </Badge>
          <Badge variant="outline">v{metadata.version}</Badge>
          <Button
            variant="outline"
            onClick={() => setShowMetadata(!showMetadata)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Metadata
          </Button>
        </div>
      </div>

      {/* Metadata Panel */}
      {showMetadata && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Contract Title</Label>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter contract title"
                />
              </div>
              
              <div>
                <Label htmlFor="contractType">Contract Type</Label>
                <Select
                  value={metadata.contractType}
                  onValueChange={(value) => setMetadata(prev => ({ ...prev, contractType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PURCHASE_CONTRACT">Purchase Contract</SelectItem>
                    <SelectItem value="LOGISTICS_AGREEMENT">Logistics Agreement</SelectItem>
                    <SelectItem value="PRICING_AGREEMENT">Pricing Agreement</SelectItem>
                    <SelectItem value="LEGAL_DISPUTE">Legal Dispute</SelectItem>
                    <SelectItem value="MOQ_AGREEMENT">MOQ Agreement</SelectItem>
                    <SelectItem value="SERVICE_AGREEMENT">Service Agreement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="approvers">Approvers</Label>
              <Textarea
                id="approvers"
                value={metadata.approvers.join(', ')}
                onChange={(e) => setMetadata(prev => ({ 
                  ...prev, 
                  approvers: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
                placeholder="Enter approver emails separated by commas"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {/* Text formatting */}
            <Button
              variant={editor.isActive('bold') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="w-4 h-4" />
            </Button>
            
            <Button
              variant={editor.isActive('italic') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="w-4 h-4" />
            </Button>
            
            <Button
              variant={editor.isActive('underline') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <Underline className="w-4 h-4" />
            </Button>
            
            <Button
              variant={editor.isActive('highlight') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
            >
              <Highlight className="w-4 h-4" />
            </Button>

            {/* Text alignment */}
            <div className="border-l border-gray-300 h-6 mx-2" />
            
            <Button
              variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            >
              Left
            </Button>
            
            <Button
              variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            >
              Center
            </Button>
            
            <Button
              variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            >
              Right
            </Button>

            {/* Table controls */}
            <div className="border-l border-gray-300 h-6 mx-2" />
            
            <Button variant="outline" size="sm" onClick={addTable}>
              Add Table
            </Button>
            
            <Button variant="outline" size="sm" onClick={addRow}>
              Add Row
            </Button>
            
            <Button variant="outline" size="sm" onClick={addColumn}>
              Add Column
            </Button>
            
            <Button variant="outline" size="sm" onClick={deleteTable}>
              Delete Table
            </Button>

            {/* Actions */}
            <div className="border-l border-gray-300 h-6 mx-2" />
            
            <Button
              variant="default"
              onClick={handleSave}
              disabled={isSaving || !isEditable}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={exportToWord}>
              <Download className="w-4 h-4 mr-2" />
              Export Word
            </Button>
            
            <Button variant="outline" onClick={exportToPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card className="min-h-[600px]">
        <CardContent className="p-6">
          <EditorContent 
            editor={editor} 
            className="prose prose-lg max-w-none min-h-[500px] focus:outline-none"
          />
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {collaborators.length} collaborators
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {changes.length} changes tracked
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {metadata.status === 'FINALIZED' ? (
            <div className="flex items-center space-x-2 text-green-600">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Contract Finalized</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-blue-600">
              <Unlock className="w-4 h-4" />
              <span className="text-sm font-medium">Editable</span>
            </div>
          )}
          
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContractEditor;
