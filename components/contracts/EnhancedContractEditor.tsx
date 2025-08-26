'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'quill/dist/quill.snow.css';

// Dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading editor...</div>
});

interface EnhancedContractEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const EnhancedContractEditor: React.FC<EnhancedContractEditorProps> = ({
  initialContent = '',
  onContentChange,
  placeholder = 'Start writing your contract...',
  readOnly = false
}) => {
  const [content, setContent] = useState(initialContent);
  const quillRef = useRef<any>(null);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': ['noto-sans', 'helvetica', 'times-new-roman'] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  };

  // Quill formats configuration
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'color', 'background',
    'align', 'direction'
  ];

  // Handle content changes
  const handleChange = (value: string) => {
    setContent(value);
    if (onContentChange) {
      onContentChange(value);
    }
  };

  // Custom font configuration for Vietnamese support
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Quill) {
      const Quill = window.Quill;
      
      // Import and register custom fonts
      const Font = Quill.import('formats/font');
      Font.whitelist = ['noto-sans', 'helvetica', 'times-new-roman'];
      Quill.register(Font, true);

      // Add custom CSS for Vietnamese font support
      const style = document.createElement('style');
      style.textContent = `
        .ql-editor {
          font-family: 'Noto Sans', 'Helvetica', 'Arial', sans-serif;
        }
        .ql-editor[data-font="noto-sans"] {
          font-family: 'Noto Sans', sans-serif;
        }
        .ql-editor[data-font="helvetica"] {
          font-family: 'Helvetica', 'Arial', sans-serif;
        }
        .ql-editor[data-font="times-new-roman"] {
          font-family: 'Times New Roman', serif;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Contract Editor
        </h3>
        <p className="text-sm text-gray-600">
          Rich text editor with Vietnamese character support
        </p>
      </div>
      
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
          className="min-h-[400px]"
        />
      </div>

      {/* Content preview */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Content Preview:</h4>
        <div className="text-sm text-gray-600">
          {content ? (
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <span className="text-gray-400">No content yet</span>
          )}
        </div>
      </div>

      {/* Character count */}
      <div className="mt-2 text-xs text-gray-500 text-right">
        {content.length} characters
      </div>
    </div>
  );
};

export default EnhancedContractEditor;
