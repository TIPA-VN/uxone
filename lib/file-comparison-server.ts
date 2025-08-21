import { createHash } from 'crypto';
import { readFile, stat } from 'fs/promises';
import path from 'path';

export interface FileComparisonResult {
  isIdentical: boolean;
  hashComparison?: {
    md5: { file1: string; file2: string; match: boolean };
    sha256: { file1: string; file2: string; match: boolean };
  };
  fileInfo: {
    file1: { size: number; path: string };
    file2: { size: number; path: string };
  };
  similarity: number;
  reason: string;
}

export async function generateFileHashes(filePath: string): Promise<{ md5: string; sha256: string }> {
  try {
    const fileBuffer = await readFile(filePath);
    
    // Generate MD5 hash
    const md5Hash = createHash('md5');
    md5Hash.update(fileBuffer);
    const md5 = md5Hash.digest('hex');
    
    // Generate SHA-256 hash
    const sha256Hash = createHash('sha256');
    sha256Hash.update(fileBuffer);
    const sha256 = sha256Hash.digest('hex');
    
    return { md5, sha256 };
  } catch (error) {
    throw new Error(`Failed to generate hashes for ${filePath}: ${error}`);
  }
}

export async function compareFilesByHash(
  filePath1: string, 
  filePath2: string
): Promise<FileComparisonResult> {
  try {
    const [hash1, hash2] = await Promise.all([
      generateFileHashes(filePath1),
      generateFileHashes(filePath2)
    ]);
    
    const md5Match = hash1.md5 === hash2.md5;
    const sha256Match = hash1.sha256 === hash2.sha256;
    const isIdentical = md5Match && sha256Match;
    
    const [stats1, stats2] = await Promise.all([
      stat(filePath1),
      stat(filePath2)
    ]);
    
    return {
      isIdentical,
      hashComparison: {
        md5: { file1: hash1.md5, file2: hash2.md5, match: md5Match },
        sha256: { file1: hash1.sha256, file2: hash2.sha256, match: sha256Match }
      },
      fileInfo: {
        file1: { size: stats1.size, path: filePath1 },
        file2: { size: stats2.size, path: filePath2 }
      },
      similarity: isIdentical ? 1.0 : 0.0,
      reason: isIdentical ? 'Files are identical' : 'Files have different hashes'
    };
  } catch (error) {
    throw new Error(`Hash comparison failed: ${error}`);
  }
}

export async function shouldCreateNewVersion(
  newFilePath: string,
  existingFilePath: string,
  threshold: number = 0.95 // 95% similarity threshold
): Promise<{ shouldVersion: boolean; similarity: number; reason: string }> {
  try {
    const result = await compareFilesByHash(newFilePath, existingFilePath);
    
    if (result.isIdentical) {
      return { 
        shouldVersion: false, 
        similarity: 1.0, 
        reason: 'Files are identical - no new version needed' 
      };
    }
    
    // Enhanced similarity analysis for non-identical files
    const similarity = await analyzeFileSimilarity(newFilePath, existingFilePath);
    
    if (similarity >= threshold) {
      return {
        shouldVersion: false,
        similarity: similarity,
        reason: `Files are ${Math.round(similarity * 100)}% similar - no new version needed (above ${Math.round(threshold * 100)}% threshold)`
      };
    } else {
      return {
        shouldVersion: true,
        similarity: similarity,
        reason: `Files are ${Math.round(similarity * 100)}% similar - new version needed (below ${Math.round(threshold * 100)}% threshold)`
      };
    }
  } catch (error) {
    // If comparison fails, err on the side of caution and create a new version
    return { 
      shouldVersion: true, 
      similarity: 0.0, 
      reason: `Comparison failed: ${error}` 
    };
  }
}

// New function to analyze file similarity
async function analyzeFileSimilarity(filePath1: string, filePath2: string): Promise<number> {
  try {
    const [content1, content2] = await Promise.all([
      readFile(filePath1),
      readFile(filePath2)
    ]);
    
    // Get file extensions for type-specific comparison
    const ext1 = path.extname(filePath1).toLowerCase();
    const ext2 = path.extname(filePath2).toLowerCase();
    
    // If different file types, they're not similar
    if (ext1 !== ext2) {
      return 0.0;
    }
    
    // Text-based files: line-by-line comparison
    if (['.txt', '.md', '.json', '.xml', '.yaml', '.yml', '.sql', '.py', '.js', '.ts', '.cpp', '.h', '.java', '.csv'].includes(ext1)) {
      return await compareTextFiles(content1, content2);
    }
    
    // Binary files: byte-by-byte comparison with tolerance
    else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.dwg', '.dxf'].includes(ext1)) {
      return await compareBinaryFiles(content1, content2);
    }
    
    // Images and other files: size-based comparison
    else {
      return await compareFileSizes(content1, content2);
    }
  } catch (error) {
    return 0.0;
  }
}

// Compare text files line by line
async function compareTextFiles(content1: Buffer, content2: Buffer): Promise<number> {
  const lines1 = content1.toString().split('\n').filter(line => line.trim());
  const lines2 = content2.toString().split('\n').filter(line => line.trim());
  
  if (lines1.length === 0 && lines2.length === 0) return 1.0;
  if (lines1.length === 0 || lines2.length === 0) return 0.0;
  
  let matchingLines = 0;
  const maxLines = Math.max(lines1.length, lines2.length);
  
  for (let i = 0; i < Math.min(lines1.length, lines2.length); i++) {
    if (lines1[i].trim() === lines2[i].trim()) {
      matchingLines++;
    }
  }
  
  return matchingLines / maxLines;
}

// Compare binary files with tolerance for minor differences
async function compareBinaryFiles(content1: Buffer, content2: Buffer): Promise<number> {
  if (content1.length !== content2.length) {
    // Size difference penalty
    const sizeDiff = Math.abs(content1.length - content2.length);
    const maxSize = Math.max(content1.length, content2.length);
    const sizeSimilarity = 1 - (sizeDiff / maxSize);
    
    // If size is very different, content is likely very different
    if (sizeSimilarity < 0.8) {
      return sizeSimilarity * 0.5; // Reduce similarity score
    }
  }
  
  // Byte-by-byte comparison with tolerance
  const minLength = Math.min(content1.length, content2.length);
  let matchingBytes = 0;
  let totalBytes = minLength;
  
  // Sample bytes for performance (compare every 100th byte for large files)
  const sampleRate = Math.max(1, Math.floor(minLength / 10000));
  
  for (let i = 0; i < minLength; i += sampleRate) {
    if (content1[i] === content2[i]) {
      matchingBytes++;
    }
  }
  
  // Adjust for sampling
  const byteSimilarity = (matchingBytes * sampleRate) / totalBytes;
  
  // Combine size and content similarity
  const sizeSimilarity = content1.length === content2.length ? 1.0 : 0.9;
  return (byteSimilarity * 0.7) + (sizeSimilarity * 0.3);
}

// Compare files based on size similarity
async function compareFileSizes(content1: Buffer, content2: Buffer): Promise<number> {
  const size1 = content1.length;
  const size2 = content2.length;
  
  if (size1 === size2) return 1.0;
  
  const maxSize = Math.max(size1, size2);
  const minSize = Math.min(size1, size2);
  
  return minSize / maxSize;
}

export async function findIdenticalFile(
  newFilePath: string,
  projectId: string,
  department: string,
  docType: string,
  fileName: string
): Promise<{ found: boolean; existingFilePath?: string; existingVersion?: number }> {
  try {
    // This function would need to be called from the API route where we have access to Prisma
    // For now, return a placeholder - the actual implementation will be in the API route
    return { found: false };
  } catch (error) {
    return { found: false };
  }
}
