import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../../middleware';

export const runtime = 'nodejs';

// GET - Get single approval with full details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'approvals:read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { id: approvalId } = await params;
    
    // Fetch approval with decisions
    const approval = await prisma.serviceApproval.findFirst({
      where: {
        id: approvalId,
        serviceId: authContext.serviceId,
      },
      include: {
        decisions: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true,
              },
            },
          },
          orderBy: { level: 'asc' },
        },
      },
    });
    
    if (!approval) {
      return NextResponse.json(
        { error: 'Approval not found or access denied' },
        { status: 404 }
      );
    }
    
    // Transform the data to include workflow information
    const approvers = approval.approvers as any[];
    const decisions = approval.decisions;
    
    const workflow = {
      currentLevel: approval.currentLevel,
      totalLevels: approval.totalLevels,
      approvers: approvers.map((approver: any) => ({
        userId: approver.userId,
        level: approver.level,
        role: approver.role,
        department: approver.department,
        decision: decisions.find(d => d.approverId === approver.userId && d.level === approver.level)?.decision || 'PENDING',
        decisionDate: decisions.find(d => d.approverId === approver.userId && d.level === approver.level)?.decisionDate,
        comments: decisions.find(d => d.approverId === approver.userId && d.level === approver.level)?.comments,
      })),
      nextApprover: approvers.find((a: any) => a.level === approval.currentLevel),
      isComplete: approval.currentLevel > approval.totalLevels,
    };
    
    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'GET', `/api/service/approvals/${approvalId}`, 200, responseTime);
    
    return NextResponse.json({
      success: true,
      data: {
        id: approval.id,
        serviceId: approval.serviceId,
        serviceType: approval.serviceType,
        approvalType: approval.approvalType,
        externalId: approval.externalId,
        title: approval.title,
        description: approval.description,
        status: approval.status,
        priority: approval.priority,
        urgency: approval.urgency,
        dueDate: approval.dueDate,
        currentLevel: approval.currentLevel,
        totalLevels: approval.totalLevels,
        metadata: approval.metadata,
        createdAt: approval.createdAt,
        updatedAt: approval.updatedAt,
        workflow,
        decisions: decisions.map(decision => ({
          id: decision.id,
          approverId: decision.approverId,
          approver: decision.approver,
          level: decision.level,
          decision: decision.decision,
          comments: decision.comments,
          decisionDate: decision.decisionDate,
        })),
      },
    });
    
  } catch (error) {
    console.error('Error fetching approval:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to fetch approval' },
      { status: 500 }
    );
  }
}

// PATCH - Update single approval
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'approvals:update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { id: approvalId } = await params;
    const body = await request.json();
    
    // Validate that approval belongs to this service
    const existingApproval = await prisma.serviceApproval.findFirst({
      where: {
        id: approvalId,
        serviceId: authContext.serviceId,
      },
    });
    
    if (!existingApproval) {
      return NextResponse.json(
        { error: 'Approval not found or access denied' },
        { status: 404 }
      );
    }
    
    // Validate updates
    const {
      title,
      description,
      priority,
      urgency,
      dueDate,
      metadata,
    } = body;
    
    const updates: any = {};
    
    if (title !== undefined) {
      if (!title || typeof title !== 'string') {
        return NextResponse.json(
          { error: 'Title must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.title = title;
    }
    
    if (description !== undefined) {
      updates.description = description;
    }
    
    if (priority !== undefined) {
      const validPriorities = ['HIGH', 'NORMAL', 'LOW'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority. Must be one of: HIGH, NORMAL, LOW' },
          { status: 400 }
        );
      }
      updates.priority = priority;
    }
    
    if (urgency !== undefined) {
      const validUrgencies = ['URGENT', 'NORMAL', 'LOW'];
      if (!validUrgencies.includes(urgency)) {
        return NextResponse.json(
          { error: 'Invalid urgency. Must be one of: URGENT, NORMAL, LOW' },
          { status: 400 }
        );
      }
      updates.urgency = urgency;
    }
    
    if (dueDate !== undefined) {
      updates.dueDate = dueDate ? new Date(dueDate) : null;
    }
    
    if (metadata !== undefined) {
      updates.metadata = metadata;
    }
    
    // Update approval
    const updatedApproval = await prisma.serviceApproval.update({
      where: {
        id: approvalId,
        serviceId: authContext.serviceId,
      },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        decisions: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true,
              },
            },
          },
          orderBy: { level: 'asc' },
        },
      },
    });
    
    // Transform response
    const approvers = updatedApproval.approvers as any[];
    const decisions = updatedApproval.decisions;
    
    const workflow = {
      currentLevel: updatedApproval.currentLevel,
      totalLevels: updatedApproval.totalLevels,
      approvers: approvers.map((approver: any) => ({
        userId: approver.userId,
        level: approver.level,
        role: approver.role,
        department: approver.department,
        decision: decisions.find(d => d.approverId === approver.userId && d.level === approver.level)?.decision || 'PENDING',
        decisionDate: decisions.find(d => d.approverId === approver.userId && d.level === approver.level)?.decisionDate,
        comments: decisions.find(d => d.approverId === approver.userId && d.level === approver.level)?.comments,
      })),
      nextApprover: approvers.find((a: any) => a.level === updatedApproval.currentLevel),
      isComplete: updatedApproval.currentLevel > updatedApproval.totalLevels,
    };
    
    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'PATCH', `/api/service/approvals/${approvalId}`, 200, responseTime);
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedApproval.id,
        serviceId: updatedApproval.serviceId,
        serviceType: updatedApproval.serviceType,
        approvalType: updatedApproval.approvalType,
        externalId: updatedApproval.externalId,
        title: updatedApproval.title,
        description: updatedApproval.description,
        status: updatedApproval.status,
        priority: updatedApproval.priority,
        urgency: updatedApproval.urgency,
        dueDate: updatedApproval.dueDate,
        currentLevel: updatedApproval.currentLevel,
        totalLevels: updatedApproval.totalLevels,
        metadata: updatedApproval.metadata,
        createdAt: updatedApproval.createdAt,
        updatedAt: updatedApproval.updatedAt,
        workflow,
        decisions: decisions.map(decision => ({
          id: decision.id,
          approverId: decision.approverId,
          approver: decision.approver,
          level: decision.level,
          decision: decision.decision,
          comments: decision.comments,
          decisionDate: decision.decisionDate,
        })),
      },
    });
    
  } catch (error) {
    console.error('Error updating approval:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to update approval' },
      { status: 500 }
    );
  }
}

// DELETE - Delete single approval
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'approvals:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { id: approvalId } = await params;
    
    // Validate that approval belongs to this service
    const existingApproval = await prisma.serviceApproval.findFirst({
      where: {
        id: approvalId,
        serviceId: authContext.serviceId,
      },
    });
    
    if (!existingApproval) {
      return NextResponse.json(
        { error: 'Approval not found or access denied' },
        { status: 404 }
      );
    }
    
    // Delete approval (decisions will be deleted via cascade)
    await prisma.serviceApproval.delete({
      where: {
        id: approvalId,
        serviceId: authContext.serviceId,
      },
    });
    
    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'DELETE', `/api/service/approvals/${approvalId}`, 200, responseTime);
    
    return NextResponse.json({
      success: true,
      message: 'Approval deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting approval:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to delete approval' },
      { status: 500 }
    );
  }
} 