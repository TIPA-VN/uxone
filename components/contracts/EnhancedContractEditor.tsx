import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollaboration, CollaborationUser, DocumentChange } from '@/hooks/useCollaboration';
import { CollaborationPanel } from './CollaborationPanel';
import { CollaborationNotifications } from './CollaborationNotifications';
import { useSession } from 'next-auth/react';

interface EnhancedContractEditorProps {
  contractId: string;
  initialContent?: string;
  initialTitle?: string;
  initialContractType?: string;
  onSave?: (data: { content: string; title: string; contractType: string }) => void;
  onCancel?: () => void;
  isReadOnly?: boolean;
}

export const EnhancedContractEditor: React.FC<EnhancedContractEditorProps> = ({
  contractId,
  initialContent = '',
  initialTitle = '',
  initialContractType = 'PURCHASE_CONTRACT',
  onSave,
  onCancel,
  isReadOnly = false
}) => {
  const { data: session } = useSession();
  const [title, setTitle] = useState(initialTitle);
  const [contractType, setContractType] = useState(initialContractType);
  const [isSaving, setIsSaving] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(true);
  const [activeTab, setActiveTab] = useState('collaboration');
  const lastChangeRef = useRef<DocumentChange | null>(null);

  // Initialize collaboration
  const collaboration = useCollaboration({
    contractId,
    onUserJoined: (user) => {
      console.log(`${user.name} joined the contract`);
    },
    onUserLeft: (userId, userName) => {
      console.log(`${userName} left the contract`);
    },
    onDocumentChanged: (change) => {
      // Handle incoming changes from other users
      if (change.userId !== session?.user?.id) {
        applyRemoteChange(change);
      }
    },
    onCursorMoved: (userId, cursor) => {
      // Handle cursor movements from other users
      console.log(`User ${userId} moved cursor to`, cursor);
    },
    onCommentAdded: (comment) => {
      console.log('New comment added:', comment);
    }
  });

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialContent,
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      // Send change to collaboration server
      if (collaboration.isConnected && !isReadOnly) {
        const change = collaboration.sendDocumentChange({
          contractId,
          userId: session?.user?.id || '',
          userName: session?.user?.name || 'Unknown User',
          changeType: 'insert',
          position: editor.state.selection.from,
          oldContent: '',
          newContent: editor.getHTML(),
          metadata: {
            operation: 'content-update',
            timestamp: Date.now()
          }
        });
        
        if (change) {
          lastChangeRef.current = change;
        }
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Send cursor position to collaboration server
      if (collaboration.isConnected && !isReadOnly) {
        const selection = editor.state.selection;
        collaboration.sendCursorMove({
          x: selection.from,
          y: selection.to,
          selection: {
            from: selection.from,
            to: selection.to
          }
        });
      }
    }
  });

  // Apply remote changes from other users
  const applyRemoteChange = useCallback((change: DocumentChange) => {
    if (!editor || change.userId === session?.user?.id) return;

    // For now, we'll just log the change
    // In a full implementation, you'd want to apply the specific change
    console.log('Applying remote change:', change);
    
    // You could implement operational transformation here for more sophisticated merging
    // For now, we'll just show a notification
  }, [editor, session?.user?.id]);

  // Handle typing indicator
  useEffect(() => {
    if (editor && collaboration.isConnected) {
      let typingTimeout: NodeJS.Timeout;
      
      const handleUpdate = () => {
        collaboration.sendTypingIndicator(true);
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          collaboration.sendTypingIndicator(false);
        }, 1000);
      };

      editor.on('update', handleUpdate);
      
      return () => {
        editor.off('update', handleUpdate);
        clearTimeout(typingTimeout);
      };
    }
  }, [editor, collaboration]);

  // Handle save
  const handleSave = async () => {
    if (!editor) return;
    
    setIsSaving(true);
    try {
      await onSave?.({
        content: editor.getHTML(),
        title,
        contractType
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onCancel?.();
  };

  // Add comment
  const handleAddComment = () => {
    if (!collaboration.isConnected) return;
    
    const selection = editor?.state.selection;
    if (selection && !selection.empty) {
      const comment = {
        content: `Comment on selected text`,
        position: {
          from: selection.from,
          to: selection.to
        },
        author: session?.user?.name || 'Unknown User',
        authorId: session?.user?.id || '',
        timestamp: new Date()
      };
      
      collaboration.sendComment(comment);
    }
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="flex h-full gap-4">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Contract Editor</h2>
            <Badge variant={collaboration.isConnected ? "default" : "destructive"}>
              {collaboration.isConnected ? "Live" : "Offline"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCollaboration(!showCollaboration)}
            >
              {showCollaboration ? "Hide" : "Show"} Collaboration
            </Button>
            
            {!isReadOnly && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!collaboration.isConnected}
                >
                  Add Comment
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Contract Metadata */}
        <div className="p-4 border-b bg-muted/30">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Contract Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter contract title"
                disabled={isReadOnly}
              />
            </div>
            <div>
              <Label htmlFor="contractType">Contract Type</Label>
              <Select
                value={contractType}
                onValueChange={setContractType}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PURCHASE_CONTRACT">Purchase Contract</SelectItem>
                  <SelectItem value="LOGISTICS_AGREEMENT">Logistics Agreement</SelectItem>
                  <SelectItem value="PRICING_AGREEMENT">Pricing Agreement</SelectItem>
                  <SelectItem value="LEGAL_DISPUTE">Legal Dispute</SelectItem>
                  <SelectItem value="MOQ_AGREEMENT">MOQ Agreement</SelectItem>
                  <SelectItem value="SERVICE_AGREEMENT">Service Agreement</SelectItem>
                  <SelectItem value="EMPLOYMENT_CONTRACT">Employment Contract</SelectItem>
                  <SelectItem value="NDA">NDA</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Editor Toolbar */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-muted' : ''}
            >
              Bold
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-muted' : ''}
            >
              Italic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              disabled={!editor.can().chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? 'bg-muted' : ''}
            >
              Underline
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              disabled={!editor.can().chain().focus().toggleHighlight().run()}
              className={editor.isActive('highlight') ? 'bg-muted' : ''}
            >
              Highlight
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
            >
              Left
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
            >
              Center
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
            >
              Right
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            >
              Insert Table
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-4 overflow-auto">
          <EditorContent editor={editor} className="min-h-[500px] prose prose-sm max-w-none" />
        </div>
      </div>

      {/* Collaboration Panel */}
      {showCollaboration && (
        <div className="w-80 border-l bg-muted/20">
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="collaboration">Live</TabsTrigger>
                <TabsTrigger value="notifications">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="collaboration" className="mt-4">
                <CollaborationPanel
                  users={collaboration.users}
                  recentChanges={collaboration.recentChanges}
                  isConnected={collaboration.isConnected}
                  lastActivity={collaboration.lastActivity}
                  onUserClick={(user) => {
                    console.log('User clicked:', user);
                    // You could implement user interaction features here
                  }}
                />
              </TabsContent>
              
              <TabsContent value="notifications" className="mt-4">
                <CollaborationNotifications
                  contractId={contractId}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};
