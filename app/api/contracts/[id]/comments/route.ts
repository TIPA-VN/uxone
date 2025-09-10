import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/contracts/[id]/comments - Get all comments for a contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get contract details to verify access
    const contract = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if user has access to this contract
    const isLegalUser = session.user.department?.toUpperCase() === 'LEGAL' ||
                       session.user.role === 'ADMIN' ||
                       ['GENERAL_DIRECTOR', 'GENERAL DIRECTOR', 'VICE_GENERAL_DIRECTOR', 'VICE GENERAL DIRECTOR', 'CHIEF_SPECIALIST', 'MANAGER', 'SENIOR_MANAGER', 'DIRECTOR'].includes(session.user.role?.toUpperCase() || '');
    
    const hasAccess = 
      contract.project?.ownerId === session.user.id ||
      contract.project?.members.some((member: any) => member.userId === session.user.id) ||
      session.user.role === 'ADMIN' ||
      isLegalUser;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all comments for this contract
    const comments = await prisma.documentComment.findMany({
      where: {
        contractId: id,
        status: { not: 'DELETED' }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            role: true
          }
        },
        resolvedByUser: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            role: true
          }
        },
        legalReviewRequest: {
          select: {
            id: true,
            status: true,
            requestedByUser: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true
              }
            },
            assignedToUser: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true
              }
            }
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true,
                role: true
              }
            },
            resolvedByUser: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group comments by parent (threaded structure)
    const topLevelComments = comments.filter(comment => !comment.parentId);
    const threadedComments = topLevelComments.map(comment => ({
      ...comment,
      replies: comments.filter(reply => reply.parentId === comment.id)
    }));

    return NextResponse.json({
      success: true,
      comments: threadedComments,
      total: comments.length
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/contracts/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      content,
      parentId,
      selectionStart,
      selectionEnd,
      selectedText,
      priority = 'NORMAL',
      category = 'GENERAL',
      legalReviewRequestId = null
    } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Get contract details to verify access - first try ContractDetails ID
    let contract = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    });

    let contractId = id; // Use a mutable variable for the contract ID

    // If not found by ContractDetails ID, try to find by Document ID
    if (!contract) {
      console.log('Contract not found by ContractDetails ID, trying Document ID:', id);
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          contractDetails: {
            include: {
              project: {
                include: {
                  members: true
                }
              }
            }
          }
        }
      });

      if (document?.contractDetails) {
        contract = document.contractDetails;
        // Update the contract ID to use the ContractDetails ID for operations
        contractId = contract.id;
      }
    }

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if this is a fallback authentication user
    const isFallbackAuth = (session.user as any).isFallbackAuth;
    
    let currentUser;
    
    if (isFallbackAuth) {
      // For fallback auth, create or find the user in database
      let fallbackUser = await prisma.user.findUnique({
        where: { username: session.user.username }
      });
      
      if (!fallbackUser) {
        // Create the fallback user in database
        fallbackUser = await prisma.user.create({
          data: {
            id: session.user.id,
            username: session.user.username,
            name: session.user.name,
            email: session.user.email || `${session.user.username}@tipa.co.th`,
            department: session.user.department,
            departmentName: session.user.departmentName,
            role: session.user.role,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
      
      currentUser = fallbackUser;
    } else {
      // For normal users, look up in database
      currentUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      });

      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Check if user has access to this contract
    const isLegalUser = currentUser.department?.toUpperCase() === 'LEGAL' ||
                       currentUser.role === 'ADMIN' ||
                       ['GENERAL_DIRECTOR', 'GENERAL DIRECTOR', 'VICE_GENERAL_DIRECTOR', 'VICE GENERAL DIRECTOR', 'CHIEF_SPECIALIST', 'MANAGER', 'SENIOR_MANAGER', 'DIRECTOR'].includes(currentUser.role?.toUpperCase() || '');
    
    const hasAccess = 
      contract.project?.ownerId === currentUser.id ||
      contract.project?.members.some((member: any) => member.userId === currentUser.id) ||
      currentUser.role === 'ADMIN' ||
      isLegalUser;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Note: documentId is optional for contracts, we'll create comments without it if needed
    // The contractId will be used to link comments to the contract

    // Create the comment
    const comment = await prisma.documentComment.create({
      data: {
        documentId: contract.documentId || null, // Use null if no documentId
        contractId: contractId,
        legalReviewRequestId: legalReviewRequestId,
        content: content.trim(),
        authorId: currentUser.id,
        parentId: parentId || null,
        selectionStart: selectionStart || null,
        selectionEnd: selectionEnd || null,
        selectedText: selectedText || null,
        priority: priority as any,
        category: category as any,
        status: 'ACTIVE'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            role: true
          }
        },
        legalReviewRequest: {
          select: {
            id: true,
            status: true,
            requestedByUser: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true
              }
            },
            assignedToUser: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true
              }
            }
          }
        },
        replies: true
      }
    });

    return NextResponse.json({
      success: true,
      comment
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
