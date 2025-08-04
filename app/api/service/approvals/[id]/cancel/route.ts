import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../../../middleware';

export const runtime = 'nodejs';

// POST - Cancel approval
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'approvals:manage')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { id: approvalId } = await params;
    const body = await request.json();
    const { comments } = body;
    
    // Fetch approval
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
    
    // Check if approval is already completed
    if (approval.status === 'APPROVED' || approval.status === 'REJECTED' || approval.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Approval is already completed' },
        { status: 409 }
      );
    }
    
    // Mark approval as cancelled
    await prisma.serviceApproval.update({
      where: { id: approvalId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });
    
    // Add cancellation comment to current level decision if it exists
    const currentDecision = approval.decisions.find(d => d.level === approval.currentLevel);
    if (currentDecision) {
      await prisma.serviceApprovalDecision.update({
        where: { id: currentDecision.id },
        data: {
          comments: comments || 'Approval cancelled by service',
          decisionDate: new Date(),
        },
      });
    }
    
    // Fetch updated approval
    const updatedApproval = await prisma.serviceApproval.findFirst({
      where: { id: approvalId },
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
    
    if (!updatedApproval) {
      return NextResponse.json(
        { error: 'Failed to update approval' },
        { status: 500 }
      );
    }
    
    // Transform response
    const updatedApprovers = updatedApproval.approvers as any[];
    const decisions = updatedApproval.decisions;
    
    const workflow = {
      currentLevel: updatedApproval.currentLevel,
      totalLevels: updatedApproval.totalLevels,
      approvers: updatedApprovers.map((approver: any) => ({
        userId: approver.userId,
        level: approver.level,
        role: approver.role,
        department: approver.department,
        decision: decisions.find(d => d.approverId === approver.userId && d.level === approver.level)?.decision || 'PENDING',
        decisionDate: decisions.find(d => d.approverId === approver.userId && d.level === approver.level)?.decisionDate,
        comments: decisions.find(d => d.approverId === approver.userId && d.level === approver.level)?.comments,
      })),
      nextApprover: updatedApprovers.find((a: any) => a.level === updatedApproval.currentLevel),
      isComplete: updatedApproval.status === 'CANCELLED',
    };
    
    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'POST', `/api/service/approvals/${approvalId}/cancel`, 200, responseTime);
    
    return NextResponse.json({
      success: true,
      message: 'Approval cancelled successfully',
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
    console.error('Error cancelling approval:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to cancel approval' },
      { status: 500 }
    );
  }
} 