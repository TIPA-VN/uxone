import path from 'path';
import { APP_CONFIG } from '@/config/app';

/**
 * File utility functions for managing custom upload directories
 */

export interface CustomUploadConfig {
  directory: string;
  serveUrl: string;
  maxSize?: number;
  allowedTypes?: string[];
}

/**
 * Get the custom upload directory path for a specific category
 */
export function getCustomUploadDir(category: string): string {
  const customDir = APP_CONFIG.upload.customDirectories[category as keyof typeof APP_CONFIG.upload.customDirectories];
  return customDir || path.join(process.cwd(), 'uploads', category);
}

/**
 * Get the serve URL for a file in a custom directory
 */
export function getCustomServeUrl(filePath: string): string {
  if (!APP_CONFIG.upload.serveFromCustom) {
    // Fallback to public directory
    return filePath;
  }
  
  // Convert file path to serve URL
  // e.g., "/uploads/tasks/filename.pdf" -> "/api/files/serve?path=/uploads/tasks/filename.pdf"
  return `${APP_CONFIG.upload.customServeEndpoint}?path=${encodeURIComponent(filePath)}`;
}

/**
 * Convert a custom file path to a relative path for storage
 */
export function getRelativeFilePath(fullPath: string, category: string): string {
  const customDir = getCustomUploadDir(category);
  return path.relative(customDir, fullPath);
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string, category: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, extension);
  
  return `${timestamp}_${randomSuffix}_${nameWithoutExt}${extension}`;
}

/**
 * Validate file type against allowed types
 */
export function isValidFileType(fileName: string): boolean {
  const extension = path.extname(fileName).toLowerCase();
  const allowedExtensions = APP_CONFIG.upload.allowedFileTypes.map(type => {
    if (type.startsWith('image/')) return '.jpg,.jpeg,.png,.gif';
    if (type.startsWith('application/pdf')) return '.pdf';
    if (type.includes('msword')) return '.doc';
    if (type.includes('wordprocessingml')) return '.docx';
    if (type.includes('ms-excel')) return '.xls';
    if (type.includes('spreadsheetml')) return '.xlsx';
    return '';
  }).join(',').split(',').filter(Boolean);
  
  return allowedExtensions.includes(extension);
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file size is within limits
 */
export function isValidFileSize(bytes: number): boolean {
  return bytes <= APP_CONFIG.upload.maxFileSize;
}

/**
 * Create directory structure for uploads
 */
export async function ensureUploadDirectory(category: string): Promise<string> {
  const { mkdir } = await import('fs/promises');
  const uploadDir = getCustomUploadDir(category);
  
  try {
    await mkdir(uploadDir, { recursive: true });
    return uploadDir;
  } catch (error) {
    console.error(`Failed to create upload directory: ${uploadDir}`, error);
    throw new Error(`Failed to create upload directory: ${uploadDir}`);
  }
}

/**
 * Clean up old temporary files
 */
export async function cleanupTempFiles(category: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
  const { readdir, stat, unlink } = await import('fs/promises');
  const uploadDir = getCustomUploadDir(category);
  
  try {
    const files = await readdir(uploadDir);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const fileStats = await stat(filePath);
      
      if (now - fileStats.mtime.getTime() > maxAge) {
        await unlink(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
}

/**
 * Get file information for display
 */
export function getFileInfo(filePath: string) {
  const fileName = path.basename(filePath);
  const extension = path.extname(fileName).toLowerCase();
  const category = path.dirname(filePath).split('/').pop() || 'unknown';
  
  return {
    fileName,
    extension,
    category,
    isImage: ['.jpg', '.jpeg', '.png', '.gif'].includes(extension),
    isDocument: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'].includes(extension),
    isText: ['.txt', '.csv'].includes(extension),
  };
}
