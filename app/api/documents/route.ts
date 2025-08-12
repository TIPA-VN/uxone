import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { checkDocumentAccess } from "@/lib/documentAccess";
import { shouldCreateNewVersion } from "@/lib/file-comparison-server";

// Force Node.js runtime for Prisma
export const runtime = 'nodejs'

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "projects");

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const department = searchParams.get('department');
  const workflowState = searchParams.get('workflowState');
  
  try {
    let docs;
    
    if (projectId && department && workflowState) {
      docs = await prisma.document.findMany({
        where: {
          projectId,
          department,
          workflowState
        },
        include: { project: true },
        orderBy: { createdAt: 'desc' }
      });
    } else if (projectId && workflowState) {
      docs = await prisma.document.findMany({
        where: {
          projectId,
          workflowState
        },
        include: { project: true },
        orderBy: { createdAt: 'desc' }
      });
    } else if (projectId && department) {
      docs = await prisma.document.findMany({
        where: {
          projectId,
          department
        },
        include: { project: true },
        orderBy: { createdAt: 'desc' }
      });
    } else if (projectId) {
      docs = await prisma.document.findMany({
        where: { projectId },
        include: { project: true },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // For general document listing, limit to user's accessible documents
      docs = await prisma.document.findMany({
        include: { project: true },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
    }
    
    // Filter documents based on user access
    const accessibleDocs = docs.filter(doc => {
      const accessResult = checkDocumentAccess(doc, session.user);
      return accessResult.canAccess;
    });
    
    return NextResponse.json(accessibleDocs);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Parse multipart form
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  const fileName = `${Date.now()}_${file.name}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, fileName);
  const arrayBuffer = await file.arrayBuffer();
  // Metadata
  const metadata = formData.get("metadata");
  const department = formData.get("department") as string | null;
  const accessRoles = formData.getAll("accessRoles").map(String);
  const projectId = formData.get("projectId");
  // Parse type from metadata
  let docType = "";
  try {
    if (metadata) {
      const metaObj = JSON.parse(metadata as string);
      docType = metaObj.type || "";
    }
  } catch {}
  // Enhanced versioning with file comparison: find existing files with same content, type, project, department
  let version = 1;
  let shouldCreateVersion = true;
  let versionReason = 'New file';
  let identicalFileInfo = null; // Declare at higher scope
  
  console.log(`Starting versioning logic for file: ${file.name}`);
  
  if (docType && projectId && department) {
    try {
      // Only compare files if they have the same file type
      // Get file extension to determine if we should do content comparison
      const fileExtension = path.extname(file.name).toLowerCase().replace('.', '');
      console.log(`File extension detected: ${fileExtension} for file: ${file.name}`);
      console.log(`Document type from metadata: ${docType} (UI category)`);
      const shouldCompareContent = fileExtension && [
        // Office documents
        'pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        // Engineering CAD files
        'dwg', 'dxf', 'sldprt', 'sldasm', 'ipt', 'iam', 'prt', 'asm',
        // 3D modeling and design
        'stp', 'step', 'iges', 'igs', 'stl', 'obj', '3ds', 'max',
        // Technical drawings and schematics
        'dwg', 'dxf', 'skp', 'rvt', 'rfa', 'ifc', 'nwd', 'nwc',
        // Programming and configuration
        'xml', 'json', 'yaml', 'yml', 'sql', 'py', 'js', 'ts', 'cpp', 'h', 'java',
        // Data and analysis
        'csv', 'dat', 'mat', 'm', 'r', 'sas', 'spss'
      ].includes(fileExtension);
      
      if (shouldCompareContent) {
        // Find existing documents with same file extension, project, and department
        // We compare by actual file type (pdf, doc, etc.) not UI document type
        const existingDocs = await prisma.document.findMany({
          where: {
            projectId: projectId,
            department: department,
            // Find documents with the same file extension
            fileName: {
              endsWith: `.${fileExtension}`
            }
          },
          select: {
            id: true,
            fileName: true,
            version: true,
            filePath: true
          },
          orderBy: {
            version: 'desc'
          }
        });
        
        if (existingDocs.length > 0) {
    
          
          // First, save the uploaded file temporarily to compare with existing files
          const tempFilePath = path.join(UPLOAD_DIR, `temp_${Date.now()}_${fileName}`);
          await writeFile(tempFilePath, Buffer.from(arrayBuffer));
          console.log(`Temporary file saved for comparison: ${tempFilePath}`);
          
          // Compare the new file with all existing files of the same type/project/department
          let foundIdenticalFile = false;
          
          for (const existingDoc of existingDocs) {
            if (existingDoc.filePath) {
              const existingFilePath = path.join(process.cwd(), 'public', existingDoc.filePath);
              
              console.log(`Comparing new file (${file.name}) with existing file (${existingDoc.fileName})`);
              console.log(`Temp file path: ${tempFilePath}`);
              console.log(`Existing file path: ${existingFilePath}`);
              
              // Check if existing file exists before comparing
              try {
                const fs = await import('fs/promises');
                const existingFileExists = await fs.access(existingFilePath).then(() => true).catch(() => false);
                
                if (!existingFileExists) {
                  console.log(`Skipping comparison - existing file doesn't exist on disk`);
                  continue;
                }
                
                // Use 95% similarity threshold for versioning decisions
                const versionDecision = await shouldCreateNewVersion(tempFilePath, existingFilePath, 0.95);
                console.log(`Version decision for ${existingDoc.fileName}:`, versionDecision);
                
                if (!versionDecision.shouldVersion) {
                  // Found an identical or very similar file!
                  foundIdenticalFile = true;
                  identicalFileInfo = {
                    doc: existingDoc,
                    decision: versionDecision
                  };
                  
                  if (versionDecision.similarity === 1.0) {
            
                  } else {
            
                  }
                  break;
                } else {
          
                }
              } catch (comparisonError) {
                console.error(`File comparison failed for ${existingDoc.fileName}:`, comparisonError);
                // Continue checking other files
              }
            } else {
              console.log(`Skipping ${existingDoc.fileName} - no filePath`);
            }
          }
          
          // Clean up temporary file
          try {
            const fs = await import('fs/promises');
            await fs.unlink(tempFilePath);
            console.log(`Temporary file cleaned up: ${tempFilePath}`);
          } catch (cleanupError) {
            console.error(`Failed to clean up temp file:`, cleanupError);
          }
          
          if (foundIdenticalFile && identicalFileInfo) {
            // File is identical or very similar to an existing one, don't create new version
            shouldCreateVersion = false;
            version = identicalFileInfo.doc.version || 1;
            
            if (identicalFileInfo.decision.similarity === 1.0) {
              versionReason = `File content identical to existing file: ${identicalFileInfo.doc.fileName} (v${version}) - upload skipped`;
              console.log(`File comparison: ${file.name} is identical to existing file ${identicalFileInfo.doc.fileName} version ${version} - no new version needed, upload skipped`);
            } else {
              versionReason = `File content ${Math.round(identicalFileInfo.decision.similarity * 100)}% similar to existing file: ${identicalFileInfo.doc.fileName} (v${version}) - upload skipped`;
              console.log(`File comparison: ${file.name} is ${Math.round(identicalFileInfo.decision.similarity * 100)}% similar to existing file ${identicalFileInfo.doc.fileName} version ${version} - no new version needed, upload skipped`);
            }
          } else {
            // No identical files found, create new version
            const latestVersion = existingDocs[0].version || 1;
            version = latestVersion + 1;
            shouldCreateVersion = true;
            versionReason = 'New file with different content';
            console.log(`File comparison: ${file.name} has different content, creating new version ${version}`);
          }
        }
      } else {
        // For non-comparable file types (images, etc.), always create new version
        versionReason = `File type ${fileExtension || 'unknown'} not suitable for content comparison - creating new version`;
        console.log(`File type ${fileExtension || 'unknown'} not suitable for content comparison - creating new version`);
      }
    } catch (error) {
      console.error("Error in enhanced versioning:", error);
      // Fallback to version 1 if versioning fails
      version = 1;
      versionReason = 'Versioning failed, using fallback';
    }
    
    // Enhanced debug logging for versioning
    console.log(`Enhanced document upload versioning: fileName=${file.name}, docType=${docType}, projectId=${projectId}, department=${department}, calculatedVersion=${version}, shouldCreateVersion=${shouldCreateVersion}, reason=${versionReason}`);
  }
  // Save to DB using Prisma
  let doc;
  
  console.log(`Final versioning decision - shouldCreateVersion: ${shouldCreateVersion}, identicalFileInfo:`, identicalFileInfo);
  
  if (shouldCreateVersion) {
    // Create new document with new version
    // First, save the file to disk
    await writeFile(filePath, Buffer.from(arrayBuffer));
    
    
    doc = await prisma.document.create({
      data: {
        fileName: file.name,
        filePath: `/uploads/projects/${fileName}`,
        fileType: file.type,
        size: file.size,
        version: version,
        metadata: metadata ? JSON.parse(metadata as string) : {},
        ownerId: session.user.id,
        department: department,
        accessRoles: accessRoles,
        projectId: projectId
      }
    });
    
    
  } else {
    // File is identical or very similar, return existing document info
    // NO FILE UPLOAD NEEDED - we're reusing the existing file
    if (identicalFileInfo && identicalFileInfo.doc) {
      doc = identicalFileInfo.doc;
      
      if (identicalFileInfo.decision.similarity === 1.0) {

        console.log(`📁 File upload skipped - identical file already exists`);
      } else {

        console.log(`📁 File upload skipped - similar file already exists`);
      }
    } else {
      // Fallback: create new document if existing one not found
      
      console.log(`This should not happen - there's a logic error`);
      
      // Fallback: upload the file and create document
      await writeFile(filePath, Buffer.from(arrayBuffer));
      console.log(`⚠️ Fallback: File uploaded due to error: ${filePath}`);
      
      doc = await prisma.document.create({
        data: {
          fileName: file.name,
          filePath: `/uploads/projects/${fileName}`,
          fileType: file.type,
          size: file.size,
          version: version,
          metadata: metadata ? JSON.parse(metadata as string) : {},
          ownerId: session.user.id,
          department: department,
          accessRoles: accessRoles,
          projectId: projectId
        }
      });
      console.log(`⚠️ Fallback: new document created: ${doc.id}`);
    }
  }
  
  return NextResponse.json({
    ...doc,
    versionDecision: {
      shouldCreateVersion,
      version,
      reason: versionReason
    }
  });
} 