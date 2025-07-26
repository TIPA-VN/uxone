import React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface DocumentViewerProps {
  fileName: string;
  filePath: string;
  className?: string;
  documentId?: string;
}

const isImage = (fileName: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
const isPDF = (fileName: string) => fileName.toLowerCase().endsWith('.pdf');

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  fileName, 
  filePath, 
  className,
  documentId 
}) => {

  if (isImage(fileName)) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Image Viewer */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
          <TransformWrapper>
            {({ zoomIn, zoomOut, resetTransform }) => (
              <div className="w-full h-full flex flex-col items-center">
                <div className="mb-2 flex gap-2">
                  <button onClick={() => zoomIn()} className="px-2 py-1 bg-blue-600 text-white rounded">+</button>
                  <button onClick={() => zoomOut()} className="px-2 py-1 bg-blue-600 text-white rounded">-</button>
                  <button onClick={() => resetTransform()} className="px-2 py-1 bg-gray-400 text-white rounded">Reset</button>
                </div>
                <div className="w-full h-full flex-1 flex items-center justify-center bg-white rounded border shadow">
                  <TransformComponent>
                    <img
                      src={filePath}
                      alt={fileName}
                      className="max-h-[70vh] max-w-full object-contain"
                    />
                  </TransformComponent>
                </div>
              </div>
            )}
          </TransformWrapper>
        </div>
      </div>
    );
  }

  if (isPDF(fileName)) {
    return (
      <iframe
        src={filePath}
        title="PDF Preview"
        className={className || "w-full h-[70vh] border rounded"}
      />
    );
  }

  return (
    <div className="text-gray-500 text-sm">
      Preview not available. <a href={filePath} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
    </div>
  );
}; 