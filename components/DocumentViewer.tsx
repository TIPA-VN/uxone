import React, { useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import * as fabric from "fabric";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [tool, setTool] = useState<'pen' | 'text' | 'rect' | 'circle' | 'line'>('pen');
  const [color, setColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotations, setAnnotations] = useState<any>(null);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || !isImage(fileName)) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: 800,
      height: 600,
    });

    fabricRef.current = canvas;

    // Load image as background
    fabric.Image.fromURL(filePath).then((img: fabric.Image) => {
      const canvasWidth = canvas.getWidth() || 800;
      const canvasHeight = canvas.getHeight() || 600;
      
      // Scale image to fit canvas while maintaining aspect ratio
      const scale = Math.min(
        canvasWidth / img.width!,
        canvasHeight / img.height!
      );
      
      img.scale(scale);
      img.set({
        left: (canvasWidth - img.width! * scale) / 2,
        top: (canvasHeight - img.height! * scale) / 2,
        selectable: false,
        evented: false,
      });
      
      canvas.backgroundImage = img;
      canvas.renderAll();
    });

    // Load existing annotations
    if (documentId) {
      loadAnnotations();
    }

    return () => {
      canvas.dispose();
    };
  }, [filePath, fileName, documentId]);

  // Update drawing mode and brush settings
  useEffect(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current;
    canvas.isDrawingMode = tool === 'pen';
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = color;
    }
  }, [tool, color, brushSize]);

  const loadAnnotations = async () => {
    if (!documentId) return;
    try {
      const response = await fetch(`/api/documents/${documentId}/annotations`);
      if (response.ok) {
        const data = await response.json();
        setAnnotations(data);
        if (fabricRef.current && data.canvasData) {
          fabricRef.current.loadFromJSON(data.canvasData, fabricRef.current.renderAll.bind(fabricRef.current));
        }
      }
    } catch (error) {
      console.error('Failed to load annotations:', error);
    }
  };

  const saveAnnotations = async () => {
    if (!fabricRef.current || !documentId) return;
    
    try {
      const canvasData = fabricRef.current.toJSON();
      const response = await fetch(`/api/documents/${documentId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasData }),
      });
      
      if (response.ok) {

      }
    } catch (error) {
      console.error('Failed to save annotations:', error);
    }
  };

  const clearAnnotations = () => {
    if (!fabricRef.current) return;
    fabricRef.current.clear();
    // Reload background image
    fabric.Image.fromURL(filePath).then((img: fabric.Image) => {
      const canvas = fabricRef.current!;
      const canvasWidth = canvas.getWidth() || 800;
      const canvasHeight = canvas.getHeight() || 600;
      
      const scale = Math.min(
        canvasWidth / img.width!,
        canvasHeight / img.height!
      );
      
      img.scale(scale);
      img.set({
        left: (canvasWidth - img.width! * scale) / 2,
        top: (canvasHeight - img.height! * scale) / 2,
        selectable: false,
        evented: false,
      });
      
      canvas.backgroundImage = img;
      canvas.renderAll();
    });
  };

  const addText = () => {
    if (!fabricRef.current) return;
    
    const text = new fabric.IText('Double click to edit', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: color,
    });
    
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
  };

  const addShape = (shapeType: 'rect' | 'circle' | 'line') => {
    if (!fabricRef.current) return;
    
    let shape: fabric.Object;
    
    switch (shapeType) {
      case 'rect':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 50,
          fill: 'transparent',
          stroke: color,
          strokeWidth: brushSize,
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: 'transparent',
          stroke: color,
          strokeWidth: brushSize,
        });
        break;
      case 'line':
        shape = new fabric.Line([50, 50, 200, 50], {
          stroke: color,
          strokeWidth: brushSize,
        });
        break;
    }
    
    fabricRef.current.add(shape);
    fabricRef.current.setActiveObject(shape);
  };

  if (isImage(fileName)) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Annotation Toolbar */}
        <div className="bg-gray-100 p-3 border-b flex flex-wrap gap-2 items-center">
          <div className="flex gap-1">
            <button
              onClick={() => setTool('pen')}
              className={`px-3 py-1 rounded text-sm ${tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              Pen
            </button>
            <button
              onClick={() => setTool('text')}
              className={`px-3 py-1 rounded text-sm ${tool === 'text' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              Text
            </button>
            <button
              onClick={() => setTool('rect')}
              className={`px-3 py-1 rounded text-sm ${tool === 'rect' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              Rectangle
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`px-3 py-1 rounded text-sm ${tool === 'circle' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              Circle
            </button>
            <button
              onClick={() => setTool('line')}
              className={`px-3 py-1 rounded text-sm ${tool === 'line' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              Line
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm">Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 border rounded cursor-pointer"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm">Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm">{brushSize}</span>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={addText}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Add Text
            </button>
            <button
              onClick={() => addShape('rect')}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Add Rect
            </button>
            <button
              onClick={() => addShape('circle')}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Add Circle
            </button>
            <button
              onClick={() => addShape('line')}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Add Line
            </button>
          </div>
          
          <div className="flex gap-1 ml-auto">
            <button
              onClick={saveAnnotations}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={clearAnnotations}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Clear
            </button>
          </div>
        </div>
        
        {/* Canvas Container */}
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
                    <canvas
                      ref={canvasRef}
                      className="border rounded"
                      style={{ maxHeight: '70vh', maxWidth: '100%' }}
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