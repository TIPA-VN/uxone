import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/contracts/[id]/comments/[commentId] - Update a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, commentId } = await params;
    const body = await request.json();
    const {
      content,
      status,
      priority,
      category,
      isResolved
    } = body;

    // Get the comment to verify access
    const existingComment = await prisma.documentComment.findUnique({
      where: { id: commentId },
      include: {
        contract: {
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

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user has access to this contract
    const hasAccess = 
      existingComment.contract?.project?.ownerId === session.user.id ||
      existingComment.contract?.project?.members.some((member: any) => member.userId === session.user.id) ||
      session.user.role === 'ADMIN' ||
      existingComment.authorId === session.user.id; // Comment author can always edit

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (content !== undefined) {
      updateData.content = content.trim();
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (category !== undefined) {
      updateData.category = category;
    }

    if (isResolved !== undefined) {
      updateData.isResolved = isResolved;
      if (isResolved) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = session.user.id;
      } else {
        updateData.resolvedAt = null;
        updateData.resolvedBy = null;
      }
    }

    // Update the comment
    const updatedComment = await prisma.documentComment.update({
      where: { id: commentId },
      data: updateData,
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
      }
    });

    return NextResponse.json({
      success: true,
      comment: updatedComment
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/[id]/comments/[commentId] - Delete a comment (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, commentId } = await params;

    // Get the comment to verify access
    const existingComment = await prisma.documentComment.findUnique({
      where: { id: commentId },
      include: {
        contract: {
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

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user has access to this contract
    const hasAccess = 
      existingComment.contract?.project?.ownerId === session.user.id ||
      existingComment.contract?.project?.members.some((member: any) => member.userId === session.user.id) ||
      session.user.role === 'ADMIN' ||
      existingComment.authorId === session.user.id; // Comment author can always delete

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Soft delete the comment and all its replies
    await prisma.documentComment.updateMany({
      where: {
        OR: [
          { id: commentId },
          { parentId: commentId }
        ]
      },
      data: {
        status: 'DELETED',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
