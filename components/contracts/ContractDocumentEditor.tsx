"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project } from '@/types';
import { 
  FileText, 
  Save, 
  Eye, 
  Edit3,
  History,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Code,
  Link,
  Image,
  Upload,
  IndentIncrease,
  IndentDecrease
} from 'lucide-react';

interface ContractDocumentEditorProps {
  project: Project;
  onShare?: () => void;
}

interface DocumentVersion {
  id: string;
  version: number;
  content: string;
  createdAt: string;
  createdBy: string;
  changeDescription: string;
}

export default function ContractDocumentEditor({ 
  project, 
  onShare 
}: ContractDocumentEditorProps) {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Upload-related state
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<File | null>(null);
  const [uploadAction, setUploadAction] = useState<'replace' | 'append' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  
  // Flag to prevent localStorage restoration after upload
  const [hasNewlyUploadedContent, setHasNewlyUploadedContent] = useState(false);
  
  // Debug modal visibility
  useEffect(() => {
    if (showUploadModal && pendingUpload) {
      // console.log('🔔 MODAL IS VISIBLE - showUploadModal:', showUploadModal, 'pendingUpload:', pendingUpload.name);
    }
  }, [showUploadModal, pendingUpload]);
  
  // Update editor content when newly uploaded content is ready and editor is available
  useEffect(() => {
    if (hasNewlyUploadedContent && editorRef.current && content && isEditing) {
      // console.log('Updating editor with newly uploaded content:', content.substring(0, 100));
      updateEditorContent(content, true);
    }
  }, [hasNewlyUploadedContent, content, isEditing]);
  
  const isInitialized = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Track the contract ID
  const [contractId, setContractId] = useState<string | null>(() => {
    return project.contractDetails?.id || null;
  });

  // Save state to localStorage
  const saveStateToStorage = useCallback((cId: string, content: string) => {
    try {
      localStorage.setItem(`contract-doc-${project.id}`, JSON.stringify({
        contractId: cId,
        content: content,
        timestamp: Date.now()
      }));
    } catch (error) {
      // console.warn('Failed to save state to localStorage:', error);
    }
  }, [project.id]);

  // Load state from localStorage
  const loadStateFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(`contract-doc-${project.id}`);
      if (saved) {
        const data = JSON.parse(saved);
        // Only restore if data is less than 1 hour old
        if (Date.now() - data.timestamp < 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      // console.warn('Failed to load state from localStorage:', error);
    }
    return null;
  }, [project.id]);

  // Load versions for a specific contract ID
  const loadVersionsForContract = useCallback(async (contractId: string) => {
    try {
      // First, try to get the contract details with document content
      const contractResponse = await fetch(`/api/contracts/${contractId}`);
      if (contractResponse.ok) {
        const contractData = await contractResponse.json();
        const contract = contractData.contract;
        
        // If there's a document, use its content
        if (contract.document && contract.document.content) {
          setContent(contract.document.content);
        }
        
        // Also load workflow history for versions
        const workflowResponse = await fetch(`/api/contracts/${contractId}/workflow`);
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json();
          return workflowData.workflowHistory?.map((entry: { id: string; version: number; content: string; createdAt: string; creator: { name: string; username: string }; changeSummary?: string }) => ({
            id: entry.id,
            version: entry.version,
            content: entry.content,
            createdAt: entry.createdAt,
            createdBy: entry.creator.name || entry.creator.username,
            changeDescription: entry.changeSummary || `Version ${entry.version}`
          })) || [];
        }
      }
      return [];
    } catch (error) {
      console.error('Error loading contract versions:', error);
      return [];
    }
  }, []);



  // Save content to the contract via API
  const saveContent = useCallback(async (newContent: string) => {
    try {
      // console.log('=== SAVE CONTRACT CONTENT DEBUG INFO ===');
      // console.log('Input content:', newContent);
      // console.log('Input content length:', newContent.length);
      // console.log('Contract ID:', project.contractDetails?.id);
      
      // Clean and normalize the HTML content before saving
      const cleanContent = newContent
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with regular spaces
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim(); // Remove leading/trailing whitespace
      
      if (!project.contractDetails?.id) {
        // console.error('No contract ID available');
        return false;
      }
      
      // Save to contract system
      const response = await fetch(`/api/contracts/${project.contractDetails.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_DOCUMENT',
          content: cleanContent
        })
      });
      
      if (response.ok) {
        // console.log('Contract content saved successfully');
        // Save updated state to localStorage
        saveStateToStorage(project.contractDetails.id, cleanContent);
        // Reload versions after save
        const updatedVersions = await loadVersionsForContract(project.contractDetails.id);
        setVersions(updatedVersions);
        return true;
      } else {
        // console.error('Failed to save contract content:', response.status, await response.text());
        return false;
      }
    } catch (error) {
      // console.error('Error saving contract content:', error);
      return false;
    }
  }, [project.contractDetails?.id, project.name, loadVersionsForContract]);

  // Reset initialization when project changes
  useEffect(() => {
    // Update contract ID when project changes
    const newContractId = project.contractDetails?.id || null;
    if (newContractId !== contractId) {
      // console.log('Contract ID changed, resetting state');
      setContractId(newContractId);
      isInitialized.current = false;
      setContent('');
      setVersions([]);
    }
  }, [project.contractDetails?.id, contractId]);

  // Function to update editor content without losing cursor position
  const updateEditorContent = useCallback((newContent: string, forceUpdate = false) => {
    if (editorRef.current && (forceUpdate || editorRef.current.innerHTML !== newContent)) {
      // Don't update if user is actively typing (has unsaved changes)
      if (hasUnsavedChanges && !forceUpdate) {
        return;
      }

      // console.log('Updating editor content:', { newContent, forceUpdate, hasUnsavedChanges });

      // Clean the content before setting it in the editor
      const cleanContent = newContent
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with regular spaces
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim(); // Remove leading/trailing whitespace

      // Save cursor position
      const selection = window.getSelection();
      let range = null;
      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      }

      // Update content with cleaned version
      editorRef.current.innerHTML = cleanContent;

      // Restore cursor position if possible
      if (range && selection) {
        try {
          selection.removeAllRanges();
          selection.addRange(range);
        } catch {
          // If restoring cursor fails, place at end
          const newRange = document.createRange();
          newRange.selectNodeContents(editorRef.current);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
  }, [hasUnsavedChanges]);

  // Initialize content from project sample content or stored state
  useEffect(() => {
    if (isInitialized.current) return;
    
    // Don't restore from localStorage if we have newly uploaded content
    if (hasNewlyUploadedContent) {
      // console.log('Skipping localStorage restoration due to newly uploaded content');
      isInitialized.current = true;
      return;
    }
    
    // Try to restore from localStorage first
    const storedState = loadStateFromStorage();
    if (storedState && storedState.contractId && storedState.contractId === contractId) {
      // console.log('Restoring state from localStorage:', storedState);
      setContent(storedState.content);
      updateEditorContent(storedState.content, true);
      // Load versions for the restored contract
      if (contractId) {
        loadVersionsForContract(contractId).then(loadedVersions => {
          setVersions(loadedVersions);
        });
      }
      isInitialized.current = true;
      return;
    }
    
    // Load contract content from database if contract exists
    if (contractId) {
      loadVersionsForContract(contractId).then(loadedVersions => {
        setVersions(loadedVersions);
        if (loadedVersions.length > 0) {
          // Use the latest version content
          const latestVersion = loadedVersions[0];
          setContent(latestVersion.content);
          updateEditorContent(latestVersion.content, true);
        } else {
          // No versions exist, use default content
          const sampleContent = (project.contractDetails as { sampleContent?: string })?.sampleContent;
          const initialContent = sampleContent || 'This is the initial contract content. Please review and edit as needed.';
          setContent(initialContent);
          updateEditorContent(initialContent, true);
        }
        isInitialized.current = true;
      }).catch(() => {
        // Fallback to default content on error
        const sampleContent = (project.contractDetails as { sampleContent?: string })?.sampleContent;
        const initialContent = sampleContent || 'This is the initial contract content. Please review and edit as needed.';
        setContent(initialContent);
        updateEditorContent(initialContent, true);
        setVersions([]);
        isInitialized.current = true;
      });
    } else {
      // No contract ID, use default content
      const sampleContent = (project.contractDetails as { sampleContent?: string })?.sampleContent;
      const initialContent = sampleContent || 'This is the initial contract content. Please review and edit as needed.';
      setContent(initialContent);
      updateEditorContent(initialContent, true);
      setVersions([]);
      isInitialized.current = true;
    }
  }, [project.contractDetails, updateEditorContent, loadStateFromStorage, loadVersionsForContract, hasNewlyUploadedContent]);

  // Handle component re-mounting (e.g., navigating away and back)
  useEffect(() => {
    // If we have versions but no content is set, load the latest version
    if (versions.length > 0 && !content && !isInitialized.current) {
      // API returns versions in newest-first order, so first element is latest
      const latestVersion = versions[0];
      setContent(latestVersion.content);
      updateEditorContent(latestVersion.content, true);
    }
  }, [versions, content, updateEditorContent]);

  // Update content when versions change (to show latest version)
  // But only when not currently editing and no unsaved changes
  useEffect(() => {
    if (versions.length > 0 && isInitialized.current && !isEditing && !hasUnsavedChanges) {
      // API returns versions in newest-first order, so first element is latest
      const latestVersion = versions[0];
      // console.log('Updating content from latest version:', latestVersion.content);
      setContent(latestVersion.content);
      updateEditorContent(latestVersion.content, true); // Force update when version changes
    }
  }, [versions, isEditing, hasUnsavedChanges, updateEditorContent]);

  // Load versions when contractId changes (after initialization)
  useEffect(() => {
    if (contractId && !isInitialized.current) {
      loadVersionsForContract(contractId).then(loadedVersions => {
        setVersions(loadedVersions);
        if (loadedVersions.length > 0) {
          // API returns versions in newest-first order, so first element is latest
          const latestVersion = loadedVersions[0];
          setContent(latestVersion.content);
          updateEditorContent(latestVersion.content, true);
        }
      });
    }
  }, [contractId, loadVersionsForContract, updateEditorContent]);

  // Only update editor content when first entering edit mode, not on every content change
  useEffect(() => {
    // console.log('Edit mode useEffect triggered:', {
    //   isEditing,
    //   hasEditorRef: !!editorRef.current,
    //   hasContent: !!content,
    //   hasUnsavedChanges,
    //   hasNewlyUploadedContent,
    //   editorHTML: editorRef.current?.innerHTML?.substring(0, 50) || 'NO HTML'
    // });
    
    if (isEditing && editorRef.current && content && !hasUnsavedChanges && !hasNewlyUploadedContent) {
      // Only update if the editor is empty or significantly different
      if (!editorRef.current.innerHTML || editorRef.current.innerHTML.trim() === '') {
        // console.log('Editor is empty, setting content from state:', content);
        editorRef.current.innerHTML = content;
      } else {
        // console.log('Editor has content, syncing state with editor HTML');
        // Sync the content state with what's actually in the editor
        setContent(editorRef.current.innerHTML);
      }
    } else if (hasNewlyUploadedContent) {
      // console.log('Skipping editor update due to newly uploaded content');
    }
  }, [isEditing, content, hasUnsavedChanges, hasNewlyUploadedContent]); // Include hasNewlyUploadedContent

  // Additional content sync effect to ensure state is always current
  useEffect(() => {
    if (isEditing && editorRef.current && hasUnsavedChanges) {
      // Periodically sync content state with editor HTML when there are unsaved changes
      const syncInterval = setInterval(() => {
        if (editorRef.current && hasUnsavedChanges) {
          const currentEditorContent = editorRef.current.innerHTML;
          if (currentEditorContent !== content) {
            // console.log('Syncing content state with editor:', currentEditorContent);
            setContent(currentEditorContent);
          }
        }
      }, 1000); // Sync every second when editing

      return () => clearInterval(syncInterval);
    }
  }, [isEditing, hasUnsavedChanges, content]);

  // Mutation observer to watch for DOM changes in the editor
  useEffect(() => {
    if (isEditing && editorRef.current) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            if (editorRef.current) {
              const newContent = editorRef.current.innerHTML;
              // console.log('DOM mutation detected, new content:', newContent);
              setContent(newContent);
              setHasUnsavedChanges(true);
            }
          }
        });
      });

      observer.observe(editorRef.current, {
        childList: true,
        characterData: true,
        subtree: true
      });

      return () => observer.disconnect();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Get the current content from the editor to ensure we have the latest changes
      const currentContent = editorRef.current?.innerHTML || content;
      // console.log('=== SAVE DEBUG INFO ===');
      // console.log('Editor HTML content:', currentContent);
      // console.log('Content state before save:', content);
      // console.log('Has unsaved changes:', hasUnsavedChanges);
      // console.log('Content length:', currentContent.length);
      // console.log('Content state length:', content.length);
      // console.log('Document ID:', documentId);
      
      // Check if content is empty or just whitespace
      if (!currentContent || currentContent.trim() === '' || currentContent.replace(/<[^>]*>/g, '').trim() === '') {
        setSaveMessage('❌ Cannot save empty document. Please add some content.');
        return;
      }
      
      // Update the content state to match what we're saving
      setContent(currentContent);
      
      const success = await saveContent(currentContent);
      if (success) {
        setSaveMessage('✅ Document saved successfully!');
        setIsEditing(false);
        setHasUnsavedChanges(false);
        setHasNewlyUploadedContent(false); // Reset flag after successful save
        
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('❌ Failed to save document. Please try again.');
      }
    } catch (error) {
      // console.error('Save error:', error);
      setSaveMessage('❌ Error saving document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restore content from latest version
    if (versions.length > 0) {
      // API returns versions in newest-first order, so first element is latest
      const latestVersion = versions[0];
      setContent(latestVersion.content);
      updateEditorContent(latestVersion.content, true); // Force update on cancel
    }
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleVersionRestore = async (version: DocumentVersion) => {
    setContent(version.content);
    updateEditorContent(version.content, true); // Force update on version restore
    
    // Save the restored content as a new version
    if (contractId) {
      const success = await saveContent(version.content);
      if (success) {
        setSaveMessage('Version restored and saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }
    
    setIsEditing(false);
    setShowVersions(false);
    setHasUnsavedChanges(false);
  };

  // Upload functionality
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Check if there are unsaved changes
    if (hasUnsavedChanges) {
      const shouldOverwrite = window.confirm(
        '⚠️ You have unsaved changes. Uploading a new document will replace the current content. Do you want to continue?\n\n' +
        '• Click "OK" to upload and replace current content\n' +
        '• Click "Cancel" to keep current content and save first'
      );
      
      if (!shouldOverwrite) {
        setSaveMessage('❌ Upload cancelled. Please save your current changes first.');
        return;
      }
    }

    // Check if there's existing content (even if saved)
    const hasExistingContent = content.trim().length > 0;
    // console.log('Upload check - hasExistingContent:', hasExistingContent, 'hasUnsavedChanges:', hasUnsavedChanges);
    // console.log('Current content:', content);
    // console.log('Content length:', content.length);
    if (hasExistingContent && !hasUnsavedChanges) {
      // Show modal to choose action
      // console.log('Showing upload modal for existing content');
      // console.log('🔔 UPLOAD MODAL SHOULD BE VISIBLE - Check for the modal dialog asking Replace/Append!');
      setPendingUpload(file);
      setShowUploadModal(true);
      return;
    }

    // Proceed with upload (no existing content or unsaved changes)
    await processFileUpload(file, 'replace');
  };

  // Process the actual file upload
  const processFileUpload = async (file: File, action: 'replace' | 'append') => {
    // console.log('🚀 processFileUpload started with action:', action, 'file:', file.name);
    setIsUploading(true);
    setSaveMessage('');

    try {
      // console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Remove file extension for title
      formData.append('documentType', 'contract');
      formData.append('status', 'draft');

      // Upload file to parse and convert
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      // console.log('File uploaded and parsed successfully:', result);
      // console.log('Result content exists:', !!result.content);
      // console.log('Editor ref exists:', !!editorRef.current);
      // console.log('Result content length:', result.content?.length || 0);
      // console.log('Result content preview:', result.content?.substring(0, 100) || 'NO CONTENT');

      // Update editor with parsed content
      if (result.content) {
        // Decode HTML entities and preserve formatting
        const decodedContent = result.content
          .replace(/&lt;/g, '<')  // Decode &lt; to <
          .replace(/&gt;/g, '>')  // Decode &gt; to >
          .replace(/&amp;/g, '&')  // Decode &amp; to &
          .replace(/&quot;/g, '"')  // Decode &quot; to "
          .replace(/&#39;/g, "'")   // Decode &#39; to '
          // Don't replace &nbsp; and &emsp; - these preserve spacing/tabs
          // Don't normalize multiple spaces - these might be intentional formatting
          .trim();
        
        const cleanContent = decodedContent;
        
        let newContent = cleanContent;
        
        if (action === 'append' && content.trim().length > 0) {
          // Append new content to existing content
          newContent = content + '\n\n' + cleanContent;
        }
        
        // console.log('=== UPLOAD DEBUG INFO ===');
        // console.log('Original uploaded content (first 200 chars):', result.content.substring(0, 200));
        // console.log('Decoded content (first 200 chars):', cleanContent.substring(0, 200));
        // console.log('Final content to set (first 200 chars):', newContent.substring(0, 200));
        // console.log('Current content before upload:', content);
        // console.log('Action:', action);
        
        // Set the content state first
        setContent(newContent);
        setHasUnsavedChanges(true);
        setHasNewlyUploadedContent(true); // Prevent localStorage restoration
        
        // Update localStorage with the new content to prevent future conflicts
        if (contractId) {
          saveStateToStorage(contractId, newContent);
        }
        
        // console.log('Content state after upload:', newContent);
        // console.log('Has unsaved changes:', true);
        // console.log('Has newly uploaded content:', true);
        
        // Try to update editor if available, but don't fail if it's not
        if (editorRef.current) {
          updateEditorContent(newContent, true);
          // console.log('Editor HTML after upload:', editorRef.current.innerHTML);
        } else {
          // console.log('Editor ref not available, will update when editor is ready');
        }
        
        // Clear any previous save messages
        setSaveMessage('');
      }

      const actionText = action === 'append' ? 'appended to' : 'replaced';
      setSaveMessage(`✅ Document uploaded and ${actionText} successfully!`);
      
      // Auto-enter edit mode after upload
      setIsEditing(true);

    } catch (error) {
      // console.error('File upload error:', error);
      setSaveMessage(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle upload modal actions
  const handleUploadAction = async (action: 'replace' | 'append') => {
    // console.log('handleUploadAction called with action:', action, 'pendingUpload:', pendingUpload?.name);
    if (pendingUpload) {
      setShowUploadModal(false);
      setPendingUpload(null);
      setUploadAction(null);
      await processFileUpload(pendingUpload, action);
    }
  };

  const handleCancelUpload = () => {
    setShowUploadModal(false);
    setPendingUpload(null);
    setUploadAction(null);
    setSaveMessage('❌ Upload cancelled. Existing content preserved.');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
      // Reset input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Rich text editor functions - Modern approach
  const execCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) {
      // No selection, just focus the editor
      editor.focus();
      return;
    }
    
    const range = selection.getRangeAt(0);
    
    // Modern formatting approach
    switch (command) {
      case 'bold':
        document.execCommand('insertHTML', false, `<strong>${range.toString()}</strong>`);
        break;
      case 'italic':
        document.execCommand('insertHTML', false, `<em>${range.toString()}</em>`);
        break;
      case 'underline':
        document.execCommand('insertHTML', false, `<u>${range.toString()}</u>`);
        break;
      case 'formatBlock':
        if (value === '<h1>') {
          document.execCommand('formatBlock', false, '<h1>');
        } else if (value === '<h2>') {
          document.execCommand('formatBlock', false, '<h2>');
        } else if (value === '<blockquote>') {
          document.execCommand('formatBlock', false, '<blockquote>');
        } else if (value === '<pre>') {
          document.execCommand('formatBlock', false, '<pre>');
        }
        break;
      case 'insertUnorderedList':
        document.execCommand('insertHTML', false, `<ul><li>${range.toString()}</li></ul>`);
        break;
      case 'insertOrderedList':
        document.execCommand('insertHTML', false, `<ol><li>${range.toString()}</li></ol>`);
        break;
      case 'justifyLeft':
        document.execCommand('justifyLeft', false);
        break;
      case 'justifyCenter':
        document.execCommand('justifyCenter', false);
        break;
      case 'justifyRight':
        document.execCommand('justifyRight', false);
        break;
      case 'createLink':
        if (value) {
          document.execCommand('insertHTML', false, `<a href="${value}" target="_blank">${range.toString()}</a>`);
        }
        break;
      case 'insertImage':
        if (value) {
          document.execCommand('insertHTML', false, `<img src="${value}" alt="Image" style="max-width: 100%; height: auto;" />`);
        }
        break;
      case 'indent':
        // Enhanced indentation with CSS margin
        if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
          const paragraph = range.commonAncestorContainer.parentElement?.closest('p, div, li, blockquote') as HTMLElement;
          if (paragraph) {
            const currentMargin = parseInt(paragraph.style.marginLeft || '0');
            paragraph.style.marginLeft = `${currentMargin + 20}px`;
          }
        } else {
          // Fallback to execCommand
          document.execCommand('indent', false);
        }
        break;
      case 'outdent':
        // Enhanced outdentation with CSS margin
        if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
          const paragraph = range.commonAncestorContainer.parentElement?.closest('p, div, li, blockquote') as HTMLElement;
          if (paragraph) {
            const currentMargin = parseInt(paragraph.style.marginLeft || '0');
            paragraph.style.marginLeft = `${Math.max(0, currentMargin - 20)}px`;
          }
        } else {
          // Fallback to execCommand
          document.execCommand('outdent', false);
        }
        break;
      default:
        // Fallback to execCommand for other commands
        document.execCommand(command, false, value);
    }
    
    // Focus back to the editor
    editor.focus();
    
    // Immediately capture the updated content
    const newContent = editor.innerHTML;
    // console.log('Content changed via execCommand:', command, newContent);
    setContent(newContent);
    setHasUnsavedChanges(true);
    
    // Ensure selection is maintained
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!project.contractDetails) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Contract Found</h3>
        <p className="mt-1 text-sm text-gray-500">
          This project does not have contract details yet.
        </p>
      </div>
    );
  }

  const contract = project.contractDetails;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contract Document Editor</h2>
          <p className="text-sm text-gray-600">
            Edit and manage the contract content for {project.name}
          </p>
        </div>
        <div className="flex space-x-3">
          {!isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setHasUnsavedChanges(false);
                  // Ensure editor content is displayed when starting to edit
                  // Use the latest version content if available, otherwise use stored content
                  const contentToDisplay = versions.length > 0 
                    ? versions[0].content  // API returns versions in newest-first order
                    : content;
                  
                  if (editorRef.current && contentToDisplay) {
                    // console.log('Setting editor content for edit mode:', contentToDisplay);
                    editorRef.current.innerHTML = contentToDisplay;
                    // Update the content state to match what's displayed
                    setContent(contentToDisplay);
                  }
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Document
              </button>
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <History className="w-4 h-4 mr-2" />
                Versions
              </button>
              <button
                onClick={triggerFileUpload}
                disabled={isUploading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload Document (DOC, DOCX, TXT, RTF, HTML)"
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={onShare}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Users className="w-4 h-4 mr-2" />
                Share
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Document'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`rounded-md p-4 ${
          saveMessage.includes('successfully') 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            {saveMessage.includes('successfully') ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                saveMessage.includes('successfully') ? 'text-green-800' : 'text-red-800'
              }`}>
                {saveMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".doc,.docx,.txt,.rtf,.html,.htm"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Document Content */}
      <div 
        className={`bg-white shadow rounded-lg relative ${isDragOver ? 'ring-2 ring-blue-400 ring-opacity-75' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag & Drop Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-50">
            <div className="text-center text-blue-700 font-semibold">
              <div className="text-2xl mb-2">📄</div>
              <div>Drop your document here</div>
              <div className="text-sm mt-1">Supports DOC, DOCX, TXT, RTF, and HTML files</div>
            </div>
          </div>
        )}

        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Contract Content</h3>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>Last modified: {formatDate(versions[0]?.createdAt || new Date().toISOString())}</span>
              <span>•</span>
              <span>Version {versions.length}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-4">
              {/* Rich Text Toolbar */}
              <div className="border border-gray-300 rounded-md p-2 bg-gray-50">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Text Formatting */}
                  <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
                    <button
                      onClick={() => execCommand('bold')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => execCommand('italic')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => execCommand('underline')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Underline"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Headings */}
                  <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
                    <button
                      onClick={() => execCommand('formatBlock', '<h1>')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 text-xs font-bold"
                      title="Heading 1"
                    >
                      H1
                    </button>
                    <button
                      onClick={() => execCommand('formatBlock', '<h2>')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 text-xs font-bold"
                      title="Heading 2"
                    >
                      H2
                    </button>
                  </div>

                  {/* Lists */}
                  <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
                    <button
                      onClick={() => execCommand('insertUnorderedList')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => execCommand('insertOrderedList')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Alignment */}
                  <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
                    <button
                      onClick={() => execCommand('justifyLeft')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Align Left"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => execCommand('justifyCenter')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Align Center"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => execCommand('justifyRight')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Align Right"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Indentation */}
                  <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
                    <button
                      onClick={() => execCommand('indent')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Increase Indentation"
                    >
                      <IndentIncrease className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => execCommand('outdent')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Decrease Indentation"
                    >
                      <IndentDecrease className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Special Elements */}
                  <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
                    <button
                      onClick={() => execCommand('formatBlock', '<blockquote>')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Quote"
                    >
                      <Quote className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => execCommand('formatBlock', '<pre>')}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Code Block"
                    >
                      <Code className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Links and Images */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        const url = prompt('Enter URL:');
                        if (url) execCommand('createLink', url);
                      }}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Insert Link"
                    >
                      <Link className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const url = prompt('Enter image URL:');
                        if (url) execCommand('insertImage', url);
                      }}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                      title="Insert Image"
                    >
                      <Image className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Test Formatting Button */}
                  <div className="flex items-center space-x-1 border-l border-gray-300 pl-2">
                    <button
                      onClick={() => {
                        if (editorRef.current) {
                          const testContent = '<p>This is a <strong>test</strong> with <em>formatting</em>.</p><ul><li>List item 1</li><li>List item 2</li></ul>';
                          editorRef.current.innerHTML = testContent;
                          setContent(testContent);
                          setHasUnsavedChanges(true);
                          // console.log('Test content inserted:', testContent);
                        }
                      }}
                      className="p-2 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900 text-xs"
                      title="Insert Test Content"
                    >
                      TEST
                    </button>
                  </div>
                </div>
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Content
                </label>
                <div
                  ref={editorRef}
                  id="rich-text-editor"
                  contentEditable
                  suppressContentEditableWarning={true}
                  onInput={(e) => {
                    const newContent = e.currentTarget.innerHTML;
                    // console.log('Content changed via input:', newContent);
                    setContent(newContent);
                    setHasUnsavedChanges(true);
                  }}
                  onPaste={(e) => {
                    // Allow paste to happen, then capture the result
                    setTimeout(() => {
                      if (editorRef.current) {
                        const newContent = editorRef.current.innerHTML;
                        // console.log('Content changed via paste:', newContent);
                        setContent(newContent);
                        setHasUnsavedChanges(true);
                      }
                    }, 10);
                  }}
                  className="w-full min-h-[400px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white overflow-y-auto"
                  style={{ 
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    outline: 'none'
                  }}
                />
                <style jsx>{`
                  #rich-text-editor {
                    outline: none;
                  }
                  #rich-text-editor:focus {
                    outline: none;
                  }
                  #rich-text-editor h1 {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 16px 0 8px 0;
                    color: #1f2937;
                  }
                  #rich-text-editor h2 {
                    font-size: 20px;
                    font-weight: bold;
                    margin: 14px 0 6px 0;
                    color: #374151;
                  }
                  #rich-text-editor p {
                    margin: 8px 0;
                    line-height: 1.6;
                  }
                  #rich-text-editor ul, #rich-text-editor ol {
                    margin: 8px 0;
                    padding-left: 24px;
                  }
                  #rich-text-editor li {
                    margin: 4px 0;
                  }
                  #rich-text-editor blockquote {
                    border-left: 4px solid #e5e7eb;
                    margin: 16px 0;
                    padding: 8px 16px;
                    background-color: #f9fafb;
                    font-style: italic;
                  }
                  #rich-text-editor pre {
                    background-color: #f3f4f6;
                    border: 1px solid #e5e7eb;
                    border-radius: 4px;
                    padding: 12px;
                    margin: 16px 0;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    overflow-x: auto;
                  }
                  #rich-text-editor a {
                    color: #2563eb;
                    text-decoration: underline;
                  }
                  #rich-text-editor a:hover {
                    color: #1d4ed8;
                  }
                  #rich-text-editor img {
                    max-width: 100%;
                    height: auto;
                    margin: 8px 0;
                    border-radius: 4px;
                  }
                `}</style>
              </div>
              
              {/* Character and Word Count */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Characters: {content.replace(/<[^>]*>/g, '').length}</span>
                <span>Words: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length}</span>
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <div 
                className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md border"
                dangerouslySetInnerHTML={{ __html: content || 'No content available. Click "Edit Document" to add content.' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Document Versions */}
      {showVersions && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Document Versions</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {versions.map((version) => (
                <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        Version {version.version}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(version.createdAt)}
                      </span>
                      <span className="text-xs text-gray-500">
                        by {version.createdBy}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {version.changeDescription}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVersionRestore(version)}
                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                    >
                      Restore
                    </button>
                    <button className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100">
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && pendingUpload && (
        <div className="fixed inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border-4 border-red-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-red-600">🚨 UPLOAD MODAL - ACTION REQUIRED!</h3>
              <button
                onClick={handleCancelUpload}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-lg font-bold text-red-600 mb-3">
                🚨 ATTENTION: You're uploading: <span className="font-medium">{pendingUpload.name}</span>
              </p>
              <p className="text-lg font-semibold text-gray-700">
                There is already content in this document. How would you like to handle the upload?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ⚠️ You MUST click one of the buttons below to proceed!
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleUploadAction('replace')}
                className="w-full px-6 py-4 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-offset-2 text-lg font-bold border-2 border-red-800"
              >
                🔄 REPLACE EXISTING CONTENT
              </button>
              
              <button
                onClick={() => handleUploadAction('append')}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 text-lg font-bold border-2 border-blue-800"
              >
                ➕ APPEND TO EXISTING CONTENT
              </button>
              
              <button
                onClick={handleCancelUpload}
                className="w-full px-6 py-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-offset-2 text-lg font-bold border-2 border-gray-600"
              >
                ❌ CANCEL UPLOAD
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> The uploaded content will be parsed and converted to the editor format. 
                You can then edit and save it as a new version.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contract Status Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-blue-500 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Document Status</h3>
            <p className="text-sm text-blue-700 mt-1">
              Current status: <span className="font-medium">{project.contractDetails?.contractStatus || 'DRAFT'}</span>
              {project.contractDetails?.contractStatus === 'DRAFT' && ' - Document can be edited'}
              {project.contractDetails?.contractStatus === 'REVIEW' && ' - Document is under review'}
              {project.contractDetails?.contractStatus === 'APPROVED' && ' - Document is approved and locked'}
              {project.contractDetails?.contractStatus === 'SIGNED' && ' - Document is signed and cannot be modified'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
