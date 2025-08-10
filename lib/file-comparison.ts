import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface FileComparisonResult {
  isIdentical: boolean;
  hashComparison?: {
    md5: { file1: string; file2: string; match: boolean };
    sha256: { file1: string; file2: string; match: boolean };
  };
  byteComparison?: {
    identical: boolean;
    differences?: Array<{
      offset: number;
      file1Byte: number;
      file2Byte: number;
    }>;
  };
  textDiff?: {
    identical: boolean;
    differences?: Array<{
      lineNumber: number;
      file1Line: string;
      file2Line: string;
      type: 'added' | 'removed' | 'modified';
    }>;
  };
  fileInfo: {
    file1: { size: number; lastModified: Date };
    file2: { size: number; lastModified: Date };
  };
}

export interface HashResult {
  md5: string;
  sha256: string;
}

/**
 * Generate MD5 and SHA-256 hashes for a file
 */
export async function generateFileHashes(filePath: string): Promise<HashResult> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const sha256Hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => {
      hash.update(data);
      sha256Hash.update(data);
    });
    
    stream.on('end', () => {
      resolve({
        md5: hash.digest('hex'),
        sha256: sha256Hash.digest('hex')
      });
    });
    
    stream.on('error', reject);
  });
}

/**
 * Compare two files using hash comparison
 */
export async function compareFilesByHash(file1Path: string, file2Path: string): Promise<FileComparisonResult> {
  try {
    const [hash1, hash2] = await Promise.all([
      generateFileHashes(file1Path),
      generateFileHashes(file2Path)
    ]);

    const md5Match = hash1.md5 === hash2.md5;
    const sha256Match = hash1.sha256 === hash2.sha256;
    const isIdentical = md5Match && sha256Match;

    const [stats1, stats2] = await Promise.all([
      fs.promises.stat(file1Path),
      fs.promises.stat(file2Path)
    ]);

    return {
      isIdentical,
      hashComparison: {
        md5: { file1: hash1.md5, file2: hash2.md5, match: md5Match },
        sha256: { file1: hash1.sha256, file2: hash2.sha256, match: sha256Match }
      },
      fileInfo: {
        file1: { size: stats1.size, lastModified: stats1.mtime },
        file2: { size: stats2.size, lastModified: stats2.mtime }
      }
    };
  } catch (error) {
    throw new Error(`Hash comparison failed: ${error}`);
  }
}

/**
 * Compare two files byte-by-byte
 */
export async function compareFilesByteByByte(file1Path: string, file2Path: string): Promise<FileComparisonResult> {
  try {
    const [buffer1, buffer2] = await Promise.all([
      fs.promises.readFile(file1Path),
      fs.promises.readFile(file2Path)
    ]);

    const [stats1, stats2] = await Promise.all([
      fs.promises.stat(file1Path),
      fs.promises.stat(file2Path)
    ]);

    if (buffer1.length !== buffer2.length) {
      const differences: Array<{ offset: number; file1Byte: number; file2Byte: number }> = [];
      const minLength = Math.min(buffer1.length, buffer2.length);
      
      // Compare up to the minimum length
      for (let i = 0; i < minLength; i++) {
        if (buffer1[i] !== buffer2[i]) {
          differences.push({
            offset: i,
            file1Byte: buffer1[i],
            file2Byte: buffer2[i]
          });
        }
      }
      
      // Add differences for the remaining bytes in the longer file
      for (let i = minLength; i < Math.max(buffer1.length, buffer2.length); i++) {
        differences.push({
          offset: i,
          file1Byte: i < buffer1.length ? buffer1[i] : -1,
          file2Byte: i < buffer2.length ? buffer2[i] : -1
        });
      }

      return {
        isIdentical: false,
        byteComparison: {
          identical: false,
          differences: differences.slice(0, 100) // Limit to first 100 differences
        },
        fileInfo: {
          file1: { size: stats1.size, lastModified: stats1.mtime },
          file2: { size: stats2.size, lastModified: stats2.mtime }
        }
      };
    }

    // Files are the same size, compare byte by byte
    const differences: Array<{ offset: number; file1Byte: number; file2Byte: number }> = [];
    for (let i = 0; i < buffer1.length; i++) {
      if (buffer1[i] !== buffer2[i]) {
        differences.push({
          offset: i,
          file1Byte: buffer1[i],
          file2Byte: buffer2[i]
        });
        
        // Limit to first 100 differences for performance
        if (differences.length >= 100) break;
      }
    }

    return {
      isIdentical: differences.length === 0,
      byteComparison: {
        identical: differences.length === 0,
        differences: differences.length > 0 ? differences : undefined
      },
      fileInfo: {
        file1: { size: stats1.size, lastModified: stats1.mtime },
        file2: { size: stats2.size, lastModified: stats2.mtime }
      }
    };
  } catch (error) {
    throw new Error(`Byte-by-byte comparison failed: ${error}`);
  }
}

/**
 * Compare two text files line by line
 */
export async function compareTextFiles(file1Path: string, file2Path: string): Promise<FileComparisonResult> {
  try {
    const [content1, content2] = await Promise.all([
      fs.promises.readFile(file1Path, 'utf-8'),
      fs.promises.readFile(file2Path, 'utf-8')
    ]);

    const [stats1, stats2] = await Promise.all([
      fs.promises.stat(file1Path),
      fs.promises.stat(file2Path)
    ]);

    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');

    const differences: Array<{
      lineNumber: number;
      file1Line: string;
      file2Line: string;
      type: 'added' | 'removed' | 'modified';
    }> = [];

    const maxLines = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = i < lines1.length ? lines1[i] : '';
      const line2 = i < lines2.length ? lines2[i] : '';
      
      if (line1 !== line2) {
        if (i >= lines1.length) {
          differences.push({
            lineNumber: i + 1,
            file1Line: '',
            file2Line: line2,
            type: 'added'
          });
        } else if (i >= lines2.length) {
          differences.push({
            lineNumber: i + 1,
            file1Line: line1,
            file2Line: '',
            type: 'removed'
          });
        } else {
          differences.push({
            lineNumber: i + 1,
            file1Line: line1,
            file2Line: line2,
            type: 'modified'
          });
        }
        
        // Limit to first 100 differences for performance
        if (differences.length >= 100) break;
      }
    }

    return {
      isIdentical: differences.length === 0,
      textDiff: {
        identical: differences.length === 0,
        differences: differences.length > 0 ? differences : undefined
      },
      fileInfo: {
        file1: { size: stats1.size, lastModified: stats1.mtime },
        file2: { size: stats2.size, lastModified: stats2.mtime }
      }
    };
  } catch (error) {
    throw new Error(`Text comparison failed: ${error}`);
  }
}

/**
 * Comprehensive file comparison using all methods
 */
export async function compareFilesComprehensive(
  file1Path: string, 
  file2Path: string,
  options: {
    useHash?: boolean;
    useByteComparison?: boolean;
    useTextDiff?: boolean;
  } = {}
): Promise<FileComparisonResult> {
  const {
    useHash = true,
    useByteComparison = true,
    useTextDiff = true
  } = options;

  try {
    // Get file stats first
    const [stats1, stats2] = await Promise.all([
      fs.promises.stat(file1Path),
      fs.promises.stat(file2Path)
    ]);

    const baseResult: FileComparisonResult = {
      isIdentical: false,
      fileInfo: {
        file1: { size: stats1.size, lastModified: stats1.mtime },
        file2: { size: stats2.size, lastModified: stats2.mtime }
      }
    };

    // Quick size check
    if (stats1.size !== stats2.size) {
      baseResult.isIdentical = false;
      return baseResult;
    }

    // Hash comparison
    if (useHash) {
      const hashResult = await compareFilesByHash(file1Path, file2Path);
      baseResult.hashComparison = hashResult.hashComparison;
      baseResult.isIdentical = hashResult.isIdentical;
      
      // If hashes match, files are identical
      if (baseResult.isIdentical) {
        return baseResult;
      }
    }

    // Byte-by-byte comparison
    if (useByteComparison) {
      const byteResult = await compareFilesByteByByte(file1Path, file2Path);
      baseResult.byteComparison = byteResult.byteComparison;
      if (!baseResult.isIdentical) {
        baseResult.isIdentical = byteResult.isIdentical;
      }
    }

    // Text diff (only for text files)
    if (useTextDiff) {
      const file1Ext = path.extname(file1Path).toLowerCase();
      const file2Ext = path.extname(file2Path).toLowerCase();
      const textExtensions = ['.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.json', '.xml', '.html', '.css', '.scss'];
      
      if (textExtensions.includes(file1Ext) && textExtensions.includes(file2Ext)) {
        const textResult = await compareTextFiles(file1Path, file2Path);
        baseResult.textDiff = textResult.textDiff;
        if (!baseResult.isIdentical) {
          baseResult.isIdentical = textResult.isIdentical;
        }
      }
    }

    return baseResult;
  } catch (error) {
    throw new Error(`Comprehensive file comparison failed: ${error}`);
  }
}

/**
 * Check if a file should be considered a new version based on content comparison
 */
export async function shouldCreateNewVersion(
  newFilePath: string,
  existingFilePath: string,
  threshold: number = 0.95 // 95% similarity threshold
): Promise<{ shouldVersion: boolean; similarity: number; reason: string }> {
  try {
    const result = await compareFilesComprehensive(newFilePath, existingFilePath);
    
    if (result.isIdentical) {
      return {
        shouldVersion: false,
        similarity: 1.0,
        reason: 'Files are identical'
      };
    }

    // Calculate similarity based on available comparison methods
    let similarity = 0;
    let totalComparisons = 0;

    if (result.hashComparison) {
      // Hash comparison gives binary result
      totalComparisons += 1;
      similarity += result.hashComparison.md5.match ? 1 : 0;
    }

    if (result.byteComparison) {
      const totalBytes = Math.max(
        result.fileInfo.file1.size,
        result.fileInfo.file2.size
      );
      const differentBytes = result.byteComparison.differences?.length || 0;
      const byteSimilarity = Math.max(0, (totalBytes - differentBytes) / totalBytes);
      similarity += byteSimilarity;
      totalComparisons += 1;
    }

    if (result.textDiff) {
      const totalLines = Math.max(
        result.fileInfo.file1.size > 0 ? result.fileInfo.file1.size / 100 : 1, // Rough estimate
        result.fileInfo.file2.size > 0 ? result.fileInfo.file2.size / 100 : 1
      );
      const differentLines = result.textDiff.differences?.length || 0;
      const lineSimilarity = Math.max(0, (totalLines - differentLines) / totalLines);
      similarity += lineSimilarity;
      totalComparisons += 1;
    }

    const averageSimilarity = totalComparisons > 0 ? similarity / totalComparisons : 0;
    const shouldVersion = averageSimilarity < threshold;

    return {
      shouldVersion,
      similarity: averageSimilarity,
      reason: shouldVersion 
        ? `Files are ${Math.round((1 - averageSimilarity) * 100)}% different`
        : `Files are ${Math.round(averageSimilarity * 100)}% similar`
    };
  } catch (error) {
    // If comparison fails, default to creating a new version
    return {
      shouldVersion: true,
      similarity: 0,
      reason: `Comparison failed: ${error}`
    };
  }
}
