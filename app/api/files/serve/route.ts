import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { APP_CONFIG } from "@/config/app";

export const runtime = 'nodejs';

// Helper function to get file path from custom directories
function getCustomFilePath(filePath: string): string | null {
  try {
    // Remove leading slash and split path
    const cleanPath = filePath.replace(/^\//, '');
    const pathParts = cleanPath.split('/');
    
    if (pathParts.length < 2) return null;
    
    const category = pathParts[1]; // e.g., "tasks", "projects", "documents"
    const customDir = APP_CONFIG.upload.customDirectories[category as keyof typeof APP_CONFIG.upload.customDirectories];
    
    if (!customDir) return null;
    
    // Reconstruct the full path
    const relativePath = pathParts.slice(2).join('/');
    return path.join(customDir, relativePath);
  } catch (error) {
    console.error('Error resolving custom file path:', error);
    return null;
  }
}

// Helper function to get MIME type
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }
    
    // Get the custom file path
    const customFilePath = getCustomFilePath(filePath);
    
    if (!customFilePath) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }
    
    // Check if file exists
    try {
      await stat(customFilePath);
    } catch (error) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read file
    const fileBuffer = await readFile(customFilePath);
    
    // Get MIME type
    const mimeType = getMimeType(customFilePath);
    
    // Create response with appropriate headers
    const response = new NextResponse(fileBuffer);
    response.headers.set('Content-Type', mimeType);
    response.headers.set('Content-Length', fileBuffer.length.toString());
    
    // Set cache headers
    response.headers.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    
    return response;
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Optional: Add HEAD method for checking file existence
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }
    
    const customFilePath = getCustomFilePath(filePath);
    
    if (!customFilePath) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }
    
    // Check if file exists and get stats
    const fileStats = await stat(customFilePath);
    
    const response = new NextResponse();
    response.headers.set('Content-Length', fileStats.size.toString());
    response.headers.set('Content-Type', getMimeType(customFilePath));
    response.headers.set('Last-Modified', fileStats.mtime.toUTCString());
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
