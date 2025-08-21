# Custom File Storage Configuration

This guide explains how to configure custom upload directories outside of the `public` folder for file uploads and viewing.

## 🚀 Overview

By default, files are stored in `public/uploads/` and served directly by Next.js. However, you can configure custom directories anywhere on your system for:

- **Better security** (files not publicly accessible)
- **Flexible storage locations** (different drives, network paths)
- **Custom file serving logic** (authentication, logging, etc.)
- **Scalability** (separate storage servers)

## 📁 Configuration Options

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Custom upload directories (absolute paths)
UPLOAD_TASKS_DIR="/custom/path/to/tasks"
UPLOAD_PROJECTS_DIR="/custom/path/to/projects"
UPLOAD_DOCUMENTS_DIR="/custom/path/to/documents"
UPLOAD_TEMP_DIR="/custom/path/to/temp"
UPLOAD_ARCHIVE_DIR="/custom/path/to/archive"

# Alternative: Relative paths from project root
UPLOAD_TASKS_DIR="./custom-uploads/tasks"
UPLOAD_PROJECTS_DIR="./custom-uploads/projects"
UPLOAD_DOCUMENTS_DIR="./custom-uploads/documents"

# File serving configuration
ENABLE_CUSTOM_FILE_SERVING=true
FILE_SERVE_CACHE_MAX_AGE=3600
```

### 2. Configuration File

The system automatically reads from `config/app.ts`:

```typescript
upload: {
  // ... other config
  customDirectories: {
    tasks: process.env.UPLOAD_TASKS_DIR || path.join(process.cwd(), "uploads", "tasks"),
    projects: process.env.UPLOAD_PROJECTS_DIR || path.join(process.cwd(), "uploads", "projects"),
    documents: process.env.UPLOAD_DOCUMENTS_DIR || path.join(process.cwd(), "uploads", "documents"),
    temp: process.env.UPLOAD_TEMP_DIR || path.join(process.cwd(), "uploads", "temp"),
    archive: process.env.UPLOAD_ARCHIVE_DIR || path.join(process.cwd(), "uploads", "archive"),
  },
  serveFromCustom: true,
  customServeEndpoint: "/api/files/serve"
}
```

## 🔧 Implementation

### 1. Custom File Serving API

Files are served through `/api/files/serve?path=/uploads/category/filename`:

```typescript
// Example usage
const fileUrl = `/api/files/serve?path=/uploads/tasks/document.pdf`;
```

### 2. Utility Functions

Use the provided utility functions in `lib/file-utils.ts`:

```typescript
import { 
  getCustomUploadDir, 
  getCustomServeUrl, 
  generateUniqueFilename,
  ensureUploadDirectory 
} from '@/lib/file-utils';

// Get custom directory path
const uploadDir = getCustomUploadDir('tasks');

// Generate serve URL
const serveUrl = getCustomServeUrl('/uploads/tasks/filename.pdf');

// Ensure directory exists
await ensureUploadDirectory('tasks');

// Generate unique filename
const filename = generateUniqueFilename('document.pdf', 'tasks');
```

### 3. Updated Upload Routes

Upload routes now use custom directories automatically:

```typescript
// Old way (public directory)
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "tasks");

// New way (custom directory)
const uploadDir = await ensureUploadDirectory('tasks');
```

## 📂 Directory Structure Examples

### Option 1: Absolute Paths (Recommended for Production)

```bash
# Linux/Mac
UPLOAD_TASKS_DIR="/var/uploads/uxone/tasks"
UPLOAD_PROJECTS_DIR="/var/uploads/uxone/projects"
UPLOAD_DOCUMENTS_DIR="/var/uploads/uxone/documents"

# Windows
UPLOAD_TASKS_DIR="D:\\uploads\\uxone\\tasks"
UPLOAD_PROJECTS_DIR="D:\\uploads\\uxone\\projects"
UPLOAD_DOCUMENTS_DIR="D:\\uploads\\uxone\\documents"
```

### Option 2: Relative Paths (Good for Development)

```bash
UPLOAD_TASKS_DIR="./custom-uploads/tasks"
UPLOAD_PROJECTS_DIR="./custom-uploads/projects"
UPLOAD_DOCUMENTS_DIR="./custom-uploads/documents"
```

### Option 3: Network Paths (For Distributed Systems)

```bash
UPLOAD_TASKS_DIR="//nas-server/uploads/uxone/tasks"
UPLOAD_PROJECTS_DIR="//nas-server/uploads/uxone/projects"
UPLOAD_DOCUMENTS_DIR="//nas-server/uploads/uxone/documents"
```

## 🔒 Security Considerations

### 1. File Access Control

Custom directories provide better security:

```typescript
// Files are not directly accessible via URL
// Must go through your API with authentication
const fileUrl = `/api/files/serve?path=/uploads/tasks/document.pdf`;
```

### 2. Authentication Required

All file access goes through your API routes where you can:

- Verify user authentication
- Check file permissions
- Log access attempts
- Implement rate limiting

### 3. Path Validation

The system validates file paths to prevent directory traversal:

```typescript
// Only allows access to configured categories
const category = pathParts[1]; // e.g., "tasks", "projects"
const customDir = APP_CONFIG.upload.customDirectories[category];
```

## 🚀 Migration Guide

### From Public Directory to Custom Directory

1. **Set environment variables**:
   ```bash
   UPLOAD_TASKS_DIR="/custom/path/to/tasks"
   ```

2. **Copy existing files**:
   ```bash
   cp -r public/uploads/tasks /custom/path/to/tasks
   ```

3. **Update file references** (optional):
   ```typescript
   // Old: Direct file access
   const fileUrl = "/uploads/tasks/document.pdf";
   
   // New: Through API (automatic fallback)
   const fileUrl = "/api/files/serve?path=/uploads/tasks/document.pdf";
   ```

4. **Test file serving**:
   - Upload new files
   - Verify they're stored in custom directory
   - Check they're accessible through the API

## 📊 Performance Benefits

### 1. Caching

Custom file serving includes caching headers:

```typescript
response.headers.set('Cache-Control', 'public, max-age=3600'); // 1 hour
```

### 2. Streaming

Large files can be streamed efficiently:

```typescript
// Future enhancement: streaming for large files
const stream = createReadStream(filePath);
return new Response(stream);
```

### 3. Compression

Files can be compressed on-the-fly:

```typescript
// Future enhancement: gzip compression
response.headers.set('Content-Encoding', 'gzip');
```

## 🛠️ Troubleshooting

### Common Issues

1. **Permission Denied**:
   ```bash
   # Ensure directory has correct permissions
   chmod 755 /custom/path/to/uploads
   chown www-data:www-data /custom/path/to/uploads
   ```

2. **Directory Not Found**:
   ```bash
   # Create directory structure
   mkdir -p /custom/path/to/uploads/{tasks,projects,documents}
   ```

3. **File Not Accessible**:
   - Check file permissions
   - Verify path in environment variables
   - Check API route logs

### Debug Mode

Enable debug logging:

```typescript
// In your API routes
```

## 🔄 Fallback Behavior

If custom directories are not configured:

1. **Uploads**: Default to `public/uploads/`
2. **Serving**: Direct file access via URL
3. **Configuration**: Uses fallback paths from `config/app.ts`

This ensures backward compatibility while enabling custom configurations.

## 📝 Example Usage

### Complete Upload Example

```typescript
import { 
  ensureUploadDirectory, 
  generateUniqueFilename,
  getCustomServeUrl 
} from '@/lib/file-utils';

export async function POST(request: NextRequest) {
  // Ensure custom directory exists
  const uploadDir = await ensureUploadDirectory('tasks');
  
  // Generate unique filename
  const fileName = generateUniqueFilename(file.name, 'tasks');
  const filePath = path.join(uploadDir, fileName);
  
  // Save file
  await writeFile(filePath, fileBuffer);
  
  // Create database record with custom serve URL
  const attachment = await prisma.taskAttachment.create({
    data: {
      taskId: id,
      fileName: file.name,
      filePath: `/uploads/tasks/${fileName}`,
      // The frontend will automatically use custom serve URL
    }
  });
  
  return NextResponse.json(attachment);
}
```

### Frontend File Display

```typescript
// Files are automatically served through custom endpoint
const fileUrl = attachment.filePath; // e.g., "/uploads/tasks/filename.pdf"

// In your component, this becomes:
// /api/files/serve?path=/uploads/tasks/filename.pdf
```

This system provides maximum flexibility while maintaining security and performance! 🚀
