import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../../../middleware';

export const runtime = 'nodejs';

// GET /api/service/tasks/[id]/comments - List task comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'tasks:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: taskId } = await params;

    // Verify task belongs to this service
    const serviceTask = await prisma.serviceTask.findFirst({
      where: {
        taskId,
        serviceId: authContext.serviceId,
      },
    });

    if (!serviceTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch task comments
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            departmentName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'GET', `/api/service/tasks/${taskId}/comments`, 200, responseTime);

    return NextResponse.json(comments);

  } catch (error) {
    console.error('Error fetching task comments:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'GET', `/api/service/tasks/${params.id}/comments`, 500, responseTime);
    
    return NextResponse.json(
      { error: 'Failed to fetch task comments' },
      { status: 500 }
    );
  }
}

// POST /api/service/tasks/[id]/comments - Add comment to task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'tasks:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: taskId } = await params;
    const body = await request.json();
    const { content, authorId } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Verify task belongs to this service
    const serviceTask = await prisma.serviceTask.findFirst({
      where: {
        taskId,
        serviceId: authContext.serviceId,
      },
    });

    if (!serviceTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Validate author exists if provided
    let finalAuthorId = authorId;
    if (authorId) {
      const author = await prisma.user.findUnique({
        where: { id: authorId },
      });
      if (!author) {
        return NextResponse.json(
          { error: 'Author not found' },
          { status: 400 }
        );
      }
    } else {
      // If no author provided, we need to create a system user or use a default
      // For now, we'll require an author ID
      return NextResponse.json(
        { error: 'Author ID is required for service comments' },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.taskComment.create({
      data: {
        content,
        authorId: finalAuthorId,
        taskId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true,
            departmentName: true,
          },
        },
      },
    });

    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'POST', `/api/service/tasks/${taskId}/comments`, 201, responseTime);

    return NextResponse.json(comment, { status: 201 });

  } catch (error) {
    console.error('Error creating task comment:', error);
    const responseTime = Date.now() - startTime;
    logServiceRequest('unknown', 'POST', `/api/service/tasks/${params.id}/comments`, 500, responseTime);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid reference. Please check author ID.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
} 