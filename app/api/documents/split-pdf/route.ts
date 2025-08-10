import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
// PDF-LIB will be imported when the library is installed
// import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { shouldCreateNewVersion } from "@/lib/file-comparison-server";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const department = formData.get('department') as string;
    const metadata = formData.get('metadata') as string;

    if (!file || !projectId || !department) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        id: true, 
        ownerId: true, 
        departments: true,
        members: { select: { userId: true } }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check project access
    const hasProjectAccess = 
      project.ownerId === session.user.id ||
      project.members.some(member => member.userId === session.user.id) ||
      project.departments.includes(session.user.department || "");

    if (!hasProjectAccess) {
      return NextResponse.json({ error: "Access denied to this project" }, { status: 403 });
    }

    // Check if file is a PDF
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    // Parse metadata
    let docType = "";
    try {
      if (metadata) {
        const metaObj = JSON.parse(metadata as string);
        docType = metaObj.type || "";
      }
    } catch {}

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId, 'pages');
    await mkdir(uploadDir, { recursive: true });

    // Check if PDF-LIB is available and split PDF
    let pdfDoc: any;
    let pageCount: number;
    
    try {
      const { PDFDocument } = await import("pdf-lib");
      
      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      pdfDoc = await PDFDocument.load(arrayBuffer);
      pageCount = pdfDoc.getPageCount();

      if (pageCount === 0) {
        return NextResponse.json({ error: "PDF has no pages" }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: "PDF-LIB library not installed. Please run 'npm install pdf-lib' to enable PDF splitting functionality." 
      }, { status: 500 });
    }

    const pages = [];
    const baseFileName = file.name.replace('.pdf', '');

    // Split PDF into individual pages
    try {
      const { PDFDocument } = await import("pdf-lib");
      
      for (let i = 0; i < pageCount; i++) {
        const newPdfDoc = await PDFDocument.create();
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);

        const pdfBytes = await newPdfDoc.save();
        const pageFileName = `${baseFileName}_page_${i + 1}.pdf`;
        const pageFilePath = join(uploadDir, pageFileName);
        const relativePath = `/uploads/projects/${projectId}/pages/${pageFileName}`;

        // Save the page file
        await writeFile(pageFilePath, pdfBytes);

        // Enhanced versioning with file comparison for split PDF pages
        let version = 1;
        let shouldCreateVersion = true;
        let versionReason = 'New split page';
        let identicalFileInfo = null; // Declare at higher scope
        
        if (docType && projectId && department) {
          try {
            // For PDF pages, we can do content comparison since they're PDFs
            const shouldCompareContent = true; // PDF pages are always comparable
            
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
                // Compare the new page with all existing files of the same type/project/department
                let foundIdenticalFile = false;
                let identicalFileInfo = null;
                
                for (const existingDoc of existingDocs) {
                  if (existingDoc.filePath) {
                    const existingFilePath = join(process.cwd(), 'public', existingDoc.filePath);
                    
                    try {
                      const versionDecision = await shouldCreateNewVersion(pageFilePath, existingFilePath);
                      
                      if (!versionDecision.shouldVersion) {
                        // Found an identical file!
                        foundIdenticalFile = true;
                        identicalFileInfo = {
                          doc: existingDoc,
                          decision: versionDecision
                        };
                        break;
                      }
                    } catch (comparisonError) {
                      console.error(`PDF split file comparison failed for ${existingDoc.fileName}:`, comparisonError);
                      // Continue checking other files
                    }
                  }
                }
                
                if (foundIdenticalFile && identicalFileInfo) {
                  // File is identical to an existing one, don't create new version
                  shouldCreateVersion = false;
                  version = identicalFileInfo.doc.version || 1;
                  versionReason = `File content identical to existing file: ${identicalFileInfo.doc.fileName} (v${version})`;
                  console.log(`PDF split file comparison: ${pageFileName} is identical to existing file ${identicalFileInfo.doc.fileName} version ${version} - no new version needed`);
                } else {
                  // No identical files found, create new version
                  const latestVersion = existingDocs[0].version || 1;
                  version = latestVersion + 1;
                  shouldCreateVersion = true;
                  versionReason = 'New file with different content';
                  console.log(`PDF split file comparison: ${pageFileName} has different content, creating new version ${version}`);
                }
              }
            } else {
              // For non-comparable file types, always create new version
              versionReason = `File type not suitable for content comparison - creating new version`;
              console.log(`File type not suitable for content comparison - creating new version`);
            }
          } catch (error) {
            console.error("Error in enhanced PDF split versioning:", error);
            // Fallback to version 1 if versioning fails
            version = 1;
            versionReason = 'Versioning failed, using fallback';
          }
          
          // Enhanced debug logging for PDF split versioning
          console.log(`Enhanced PDF split versioning: pageFileName=${pageFileName}, docType=${docType}, projectId=${projectId}, department=${department}, calculatedVersion=${version}, shouldCreateVersion=${shouldCreateVersion}, reason=${versionReason}`);
        }

        // Save page document to database with enhanced versioning
        let pageDoc;
        
        if (shouldCreateVersion) {
          // Create new document with new version
          pageDoc = await prisma.document.create({
            data: {
              fileName: pageFileName,
              filePath: relativePath,
              fileType: "application/pdf",
              size: pdfBytes.length,
              version,
              metadata: {
                type: docType,
                pageNumber: i + 1,
                originalFile: file.name,
                splitFrom: true
              },
              ownerId: session.user.id,
              department,
              projectId,
              accessRoles: ["ADMIN", "SENIOR MANAGER", "MANAGER"]
            }
          });
          
          console.log(`New PDF split page version created: ${pageDoc.id} with version ${version}`);
        } else {
          // File is identical, find existing document
          // We need to find the existing document that was identified as identical
          if (identicalFileInfo && identicalFileInfo.doc) {
            pageDoc = identicalFileInfo.doc;
            console.log(`PDF split page identical to existing version, returning existing document: ${pageDoc.id}`);
          } else {
            // Fallback: create new document if existing one not found
            pageDoc = await prisma.document.create({
              data: {
                fileName: pageFileName,
                filePath: relativePath,
                fileType: "application/pdf",
                size: pdfBytes.length,
                version,
                metadata: {
                  type: docType,
                  pageNumber: i + 1,
                  originalFile: file.name,
                  splitFrom: true
                },
                ownerId: session.user.id,
                department,
                projectId,
                accessRoles: ["ADMIN", "SENIOR MANAGER", "MANAGER"]
              }
            });
            console.log(`Fallback: new PDF split page created: ${pageDoc.id}`);
          }
        }

        pages.push(pageDoc);
      }

      return NextResponse.json({ 
        success: true, 
        message: `PDF split into ${pageCount} pages`,
        pages: pages.map(page => ({
          id: page.id,
          fileName: page.fileName,
          filePath: page.filePath
        }))
      });

    } catch (error) {
      console.error('Error splitting PDF:', error);
      return NextResponse.json({ 
        error: "Failed to split PDF" 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in split-pdf route:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 