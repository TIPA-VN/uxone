# Next.js Document Editor Development Guide

## Table of Contents
1. [Project Setup](#project-setup)
2. [Editor Selection & Implementation](#editor-selection--implementation)
3. [Document Storage & Management](#document-storage--management)
4. [Contract-Specific Features](#contract-specific-features)
5. [File Import/Export](#file-importexport)
6. [Authentication & Permissions](#authentication--permissions)
7. [Real-time Collaboration (Optional)](#real-time-collaboration-optional)
8. [Testing & Deployment](#testing--deployment)

## Project Setup

### Initial Setup
```bash
npx create-next-app@latest document-editor --typescript --tailwind --eslint
cd document-editor
```

### Essential Dependencies
```bash
# Core editor dependencies
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-document @tiptap/extension-paragraph
npm install @tiptap/extension-text @tiptap/extension-bold
npm install @tiptap/extension-italic @tiptap/extension-underline
npm install @tiptap/extension-highlight @tiptap/extension-text-align

# Database & Storage
npm install prisma @prisma/client
npm install @supabase/supabase-js  # Alternative: AWS S3, Cloudinary

# File handling
npm install mammoth        # Word document processing
npm install react-pdf      # PDF viewing/editing
npm install jspdf          # PDF generation
npm install file-saver     # File downloads

# UI Components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-toast
npm install lucide-react    # Icons

# Authentication
npm install next-auth       # Or clerk, auth0, etc.

# Optional: Real-time collaboration
npm install socket.io-client yjs y-websocket
```

## Editor Selection & Implementation

### 1. Tiptap Editor Setup (Recommended)

Create `components/DocumentEditor.tsx`:

```typescript
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { Bold, Italic, Underline, Highlighter } from 'lucide-react'

interface DocumentEditorProps {
  initialContent?: string
  onUpdate?: (content: string) => void
  editable?: boolean
}

export default function DocumentEditor({ 
  initialContent = '', 
  onUpdate,
  editable = true 
}: DocumentEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML())
      }
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-lg">
      {/* Toolbar */}
      <div className="border-b p-2 flex gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${editor.isActive('bold') ? 'bg-blue-200' : 'hover:bg-gray-100'}`}
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${editor.isActive('italic') ? 'bg-blue-200' : 'hover:bg-gray-100'}`}
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-2 rounded ${editor.isActive('highlight') ? 'bg-yellow-200' : 'hover:bg-gray-100'}`}
        >
          <Highlighter size={16} />
        </button>
      </div>
      
      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="prose max-w-none p-4 min-h-[400px] focus:outline-none"
      />
    </div>
  )
}
```

### 2. Advanced Toolbar Component

Create `components/EditorToolbar.tsx`:

```typescript
import { Editor } from '@tiptap/react'
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Code,
  Undo, Redo, Save
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor
  onSave?: () => void
}

export default function EditorToolbar({ editor, onSave }: EditorToolbarProps) {
  const toolbarItems = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      title: 'Bold'
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      title: 'Italic'
    },
    // Add more toolbar items...
  ]

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
      {toolbarItems.map((item, index) => (
        <button
          key={index}
          onClick={item.action}
          className={`p-2 rounded hover:bg-gray-200 ${
            item.isActive ? 'bg-blue-200 text-blue-700' : ''
          }`}
          title={item.title}
        >
          <item.icon size={16} />
        </button>
      ))}
      
      <div className="ml-auto">
        {onSave && (
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Save size={16} />
            Save
          </button>
        )}
      </div>
    </div>
  )
}
```

## Document Storage & Management

### 1. Database Schema (Prisma)

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // or sqlite, mysql
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  documents Document[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Document {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  contentType String   @default("html") // html, markdown, json
  type        String   @default("document") // contract, agreement, memo
  status      String   @default("draft") // draft, review, approved, signed
  
  // Metadata
  tags        String[]
  category    String?
  
  // Ownership & Permissions
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  shared      DocumentShare[]
  
  // Versioning
  version     Int      @default(1)
  parentId    String?
  parent      Document? @relation("DocumentVersions", fields: [parentId], references: [id])
  versions    Document[] @relation("DocumentVersions")
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Contract-specific fields
  signedAt    DateTime?
  expiresAt   DateTime?
  
  @@map("documents")
}

model DocumentShare {
  id         String   @id @default(cuid())
  documentId String
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  email      String
  role       String   // view, edit, admin
  createdAt  DateTime @default(now())
  
  @@unique([documentId, email])
  @@map("document_shares")
}
```

### 2. API Routes

Create `app/api/documents/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const documents = await prisma.document.findMany({
    where: {
      owner: { email: session.user.email }
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      updatedAt: true,
      createdAt: true
    }
  })

  return NextResponse.json(documents)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, content, type = 'document' } = await request.json()
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const document = await prisma.document.create({
    data: {
      title,
      content,
      type,
      ownerId: user.id
    }
  })

  return NextResponse.json(document)
}
```

Create `app/api/documents/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const document = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { name: true, email: true } },
      versions: { 
        select: { id: true, version: true, createdAt: true },
        orderBy: { version: 'desc' }
      }
    }
  })

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  return NextResponse.json(document)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { content, title, status } = await request.json()
  
  const document = await prisma.document.update({
    where: { id: params.id },
    data: {
      content,
      title,
      status,
      version: { increment: 1 }
    }
  })

  return NextResponse.json(document)
}
```

## Contract-Specific Features

### 1. Contract Template System

Create `components/ContractTemplates.tsx`:

```typescript
const contractTemplates = {
  nda: {
    title: "Non-Disclosure Agreement",
    content: `
      <h2>NON-DISCLOSURE AGREEMENT</h2>
      <p><strong>Effective Date:</strong> [DATE]</p>
      <p><strong>Parties:</strong></p>
      <ul>
        <li><strong>Disclosing Party:</strong> [COMPANY_NAME]</li>
        <li><strong>Receiving Party:</strong> [RECIPIENT_NAME]</li>
      </ul>
      
      <h3>1. Definition of Confidential Information</h3>
      <p>For purposes of this Agreement, "Confidential Information" means...</p>
      
      <h3>2. Obligation to Maintain Confidentiality</h3>
      <p>The Receiving Party agrees to...</p>
    `
  },
  serviceAgreement: {
    title: "Service Agreement",
    content: `
      <h2>SERVICE AGREEMENT</h2>
      <p><strong>Service Provider:</strong> [PROVIDER_NAME]</p>
      <p><strong>Client:</strong> [CLIENT_NAME]</p>
      <p><strong>Effective Date:</strong> [START_DATE]</p>
      
      <h3>1. Services to be Provided</h3>
      <p>The Service Provider agrees to provide the following services...</p>
    `
  }
}

export default function ContractTemplates({ onSelectTemplate }: { 
  onSelectTemplate: (template: any) => void 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(contractTemplates).map(([key, template]) => (
        <div key={key} className="border rounded-lg p-4 hover:shadow-md cursor-pointer"
             onClick={() => onSelectTemplate(template)}>
          <h3 className="font-semibold mb-2">{template.title}</h3>
          <p className="text-gray-600 text-sm">Click to use this template</p>
        </div>
      ))}
    </div>
  )
}
```

### 2. Clause Management

Create `components/ClauseManager.tsx`:

```typescript
interface Clause {
  id: string
  title: string
  content: string
  category: string
  mandatory: boolean
}

const standardClauses: Clause[] = [
  {
    id: '1',
    title: 'Termination Clause',
    content: 'Either party may terminate this agreement with 30 days written notice...',
    category: 'termination',
    mandatory: false
  },
  {
    id: '2',
    title: 'Liability Limitation',
    content: 'In no event shall either party be liable for any indirect, incidental...',
    category: 'liability',
    mandatory: true
  }
]

export default function ClauseManager({ onInsertClause }: {
  onInsertClause: (clause: Clause) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Standard Clauses</h3>
      {standardClauses.map(clause => (
        <div key={clause.id} className="border rounded p-3">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium">{clause.title}</h4>
            {clause.mandatory && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                Mandatory
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{clause.content.substring(0, 100)}...</p>
          <button
            onClick={() => onInsertClause(clause)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Insert Clause
          </button>
        </div>
      ))}
    </div>
  )
}
```

## File Import/Export

### 1. Word Document Import

Create `lib/documentImport.ts`:

```typescript
import mammoth from 'mammoth'

export async function importWordDocument(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    return result.value
  } catch (error) {
    console.error('Error importing Word document:', error)
    throw new Error('Failed to import Word document')
  }
}

export async function importTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      // Convert line breaks to HTML paragraphs
      const htmlContent = content
        .split('\n\n')
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('')
      resolve(htmlContent)
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
```

### 2. PDF Export

Create `lib/pdfExport.ts`:

```typescript
import jsPDF from 'jspdf'

export function exportToPDF(title: string, htmlContent: string) {
  const doc = new jsPDF()
  
  // Remove HTML tags for plain text PDF
  const textContent = htmlContent.replace(/<[^>]*>/g, '')
  
  // Add title
  doc.setFontSize(16)
  doc.text(title, 20, 30)
  
  // Add content
  doc.setFontSize(12)
  const lines = doc.splitTextToSize(textContent, 170)
  doc.text(lines, 20, 50)
  
  // Download
  doc.save(`${title}.pdf`)
}
```

### 3. File Upload Component

Create `components/FileUpload.tsx`:

```typescript
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { importWordDocument, importTextFile } from '@/lib/documentImport'

interface FileUploadProps {
  onFileImported: (content: string, filename: string) => void
}

export default function FileUpload({ onFileImported }: FileUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    try {
      let content = ''
      
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        content = await importWordDocument(file)
      } else if (file.type === 'text/plain') {
        content = await importTextFile(file)
      } else {
        throw new Error('Unsupported file type')
      }
      
      onFileImported(content, file.name)
    } catch (error) {
      console.error('File import error:', error)
      alert('Failed to import file')
    }
  }, [onFileImported])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <p className="text-gray-600">
        {isDragActive
          ? 'Drop the file here...'
          : 'Drag & drop a document here, or click to select'}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        Supported formats: .docx, .txt
      </p>
    </div>
  )
}
```

## Authentication & Permissions

### 1. NextAuth Setup

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
```

### 2. Permission Middleware

Create `lib/permissions.ts`:

```typescript
import { prisma } from './prisma'

export async function checkDocumentPermission(
  documentId: string,
  userEmail: string,
  requiredRole: 'view' | 'edit' | 'admin' = 'view'
) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      OR: [
        { owner: { email: userEmail } },
        {
          shared: {
            some: {
              email: userEmail,
              role: { in: getRoleHierarchy(requiredRole) }
            }
          }
        }
      ]
    }
  })

  return !!document
}

function getRoleHierarchy(role: string): string[] {
  switch (role) {
    case 'view':
      return ['view', 'edit', 'admin']
    case 'edit':
      return ['edit', 'admin']
    case 'admin':
      return ['admin']
    default:
      return []
  }
}
```

## Real-time Collaboration (Optional)

### 1. WebSocket Setup

Create `lib/socket.ts`:

```typescript
import { Server as NetServer } from 'http'
import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'

export type NextApiResponseServerIO = {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const path = '/api/socketio'
    const httpServer = res.socket.server
    const io = new ServerIO(httpServer, {
      path,
      addTrailingSlash: false,
    })
    
    io.on('connection', (socket) => {
      socket.on('join-document', (documentId) => {
        socket.join(documentId)
      })
      
      socket.on('document-change', ({ documentId, content }) => {
        socket.to(documentId).emit('document-updated', { content })
      })
    })
    
    res.socket.server.io = io
  }
  res.end()
}
```

## Testing & Deployment

### 1. Testing Setup

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

Create `__tests__/DocumentEditor.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import DocumentEditor from '@/components/DocumentEditor'

describe('DocumentEditor', () => {
  it('renders editor with toolbar', () => {
    render(<DocumentEditor initialContent="<p>Test content</p>" />)
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument()
  })

  it('calls onUpdate when content changes', () => {
    const mockOnUpdate = jest.fn()
    render(<DocumentEditor onUpdate={mockOnUpdate} />)
    
    // Simulate typing
    const editor = screen.getByRole('textbox')
    fireEvent.input(editor, { target: { innerHTML: '<p>New content</p>' } })
    
    expect(mockOnUpdate).toHaveBeenCalled()
  })
})
```

### 2. Environment Variables

Create `.env.local`:

```
DATABASE_URL="postgresql://username:password@localhost:5432/document_editor"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Deployment Checklist

- [ ] Set up production database
- [ ] Configure authentication providers
- [ ] Set environment variables in production
- [ ] Set up file storage (AWS S3, Cloudinary)
- [ ] Configure domain and SSL
- [ ] Set up monitoring and error tracking
- [ ] Test document import/export functionality
- [ ] Verify permission system works correctly
- [ ] Test collaborative features (if implemented)

## Next Steps

1. **Start with basic editor** - Implement Tiptap with simple toolbar
2. **Add document management** - Create, save, load documents
3. **Implement contract templates** - Pre-built contract types
4. **Add file import/export** - Support common document formats
5. **Set up authentication** - User accounts and document ownership
6. **Add collaboration features** - Real-time editing and commenting
7. **Implement advanced features** - Digital signatures, version control
8. **Deploy and test** - Production deployment with monitoring

## Resources

- [Tiptap Documentation](https://tiptap.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Socket.IO Documentation](https://socket.io/docs/)