import React, { useState, useRef } from "react";
import { Download, Eye, FileText, Image, File, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface SimpleDocumentViewerProps {
  fileName: string;
  filePath: string;
  documentId: string;
  onClose: () => void;
}

const isImage = (fileName: string) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName);
const isPDF = (fileName: string) => fileName.toLowerCase().endsWith('.pdf');
const isText = (fileName: string) => /\.(txt|md|json|xml|csv|log)$/i.test(fileName);

export const SimpleDocumentViewer: React.FC<SimpleDocumentViewerProps> = ({
  fileName,
  filePath,
  documentId,
  onClose
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const getFileIcon = () => {
    if (isImage(fileName)) return <Image className="w-8 h-8 text-blue-600" />;
    if (isPDF(fileName)) return <FileText className="w-8 h-8 text-red-600" />;
    if (isText(fileName)) return <FileText className="w-8 h-8 text-green-600" />;
    return <File className="w-8 h-8 text-gray-600" />;
  };

  const getFileTypeLabel = () => {
    if (isImage(fileName)) return "Image";
    if (isPDF(fileName)) return "PDF Document";
    if (isText(fileName)) return "Text File";
    return "Document";
  };

  const handleDownload = () => {
    window.open(`/api/documents/${documentId}/download`, '_blank');
  };

  const handleOpenInNewTab = () => {
    window.open(filePath, '_blank');
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  if (isImage(fileName)) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{fileName}</h3>
                <p className="text-sm text-gray-600">{getFileTypeLabel()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image Content */}
          <div className="flex-1 overflow-hidden relative">
            {imageError ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Failed to load image</p>
                  <button
                    onClick={handleOpenInNewTab}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Open in New Tab
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                {/* Image Controls */}
                <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 border-b">
                  <button
                    onClick={handleZoomOut}
                    disabled={scale <= 0.1}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    disabled={scale >= 5}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Reset View"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Image Container */}
                <div 
                  className="flex-1 overflow-hidden relative"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  style={{ cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default' }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      ref={imageRef}
                      src={filePath}
                      alt={fileName}
                      className="max-w-none transition-transform duration-200"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default'
                      }}
                      onError={() => setImageError(true)}
                      onLoad={() => setIsLoading(false)}
                    />
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isPDF(fileName)) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{fileName}</h3>
                <p className="text-sm text-gray-600">{getFileTypeLabel()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenInNewTab}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="Open in New Tab"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Content */}
          <div className="flex-1 h-[calc(95vh-80px)]">
            <iframe
              src={`${filePath}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
              title="PDF Preview"
              className="w-full h-full border-0"
              onError={() => {
                // Fallback to download if iframe fails
                handleDownload();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Default for other file types
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            {getFileIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{fileName}</h3>
              <p className="text-sm text-gray-600">{getFileTypeLabel()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {getFileIcon()}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Document</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This file type cannot be previewed. Please download the file to view its contents.
            </p>
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 mx-auto"
            >
              <Download className="w-4 h-4" />
              Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 