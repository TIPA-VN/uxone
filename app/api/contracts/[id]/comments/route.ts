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
    const hasAccess = 
      contract.project?.ownerId === session.user.id ||
      contract.project?.members.some((member: any) => member.userId === session.user.id) ||
      session.user.role === 'ADMIN';

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
      category = 'GENERAL'
    } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

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
    const hasAccess = 
      contract.project?.ownerId === session.user.id ||
      contract.project?.members.some((member: any) => member.userId === session.user.id) ||
      session.user.role === 'ADMIN';

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the document ID from the contract
    if (!contract.documentId) {
      return NextResponse.json(
        { error: 'Contract has no associated document' },
        { status: 400 }
      );
    }

    // Create the comment
    const comment = await prisma.documentComment.create({
      data: {
        documentId: contract.documentId,
        contractId: id,
        content: content.trim(),
        authorId: session.user.id,
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
