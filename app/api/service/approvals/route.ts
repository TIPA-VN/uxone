import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../middleware';

export const runtime = 'nodejs';

// GET - List approvals with filtering and pagination
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Filtering parameters
    const serviceType = searchParams.get('serviceType');
    const approvalType = searchParams.get('approvalType');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const urgency = searchParams.get('urgency');
    const externalId = searchParams.get('externalId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build where clause
    const where: any = {
      serviceId: authContext.serviceId,
    };
    
    if (serviceType) where.serviceType = serviceType;
    if (approvalType) where.approvalType = approvalType;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (urgency) where.urgency = urgency;
    if (externalId) where.externalId = externalId;
    
    // Date range filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Fetch approvals with decisions
    const [approvals, total] = await Promise.all([
      prisma.serviceApproval.findMany({
        where,
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
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.serviceApproval.count({ where }),
    ]);
    
    // Transform the data to include workflow information
    const transformedApprovals = approvals.map(approval => {
      const approvalApprovers = approval.approvers as any[];
      const decisions = approval.decisions;
      
      // Calculate workflow status
      const workflow = {
        currentLevel: approval.currentLevel,
        totalLevels: approval.totalLevels,
        approvers: approvalApprovers.map((approver: any) => ({
          userId: approver.userId,
          level: approver.level,
          role: approver.role,
          department: approver.department,
          decision: decisions.find(d => d.approverId === approver.userId && d.level === approver.level)?.decision || 'PENDING',
          decisionDate: decisions.find(d => d.approverId === approver.userId && d.level === approver.level)?.decisionDate,
          comments: decisions.find(d => d.approverId === approver.userId && d.level === approver.level)?.comments,
        })),
        nextApprover: approvalApprovers.find((a: any) => a.level === approval.currentLevel),
        isComplete: approval.currentLevel > approval.totalLevels,
      };
      
      return {
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
      };
    });
    
    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'GET', '/api/service/approvals', 200, responseTime);
    
    return NextResponse.json({
      success: true,
      data: transformedApprovals,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
    
  } catch (error) {
    console.error('Error fetching approvals:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}

// POST - Create new approval request
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate service token
    const authContext = await validateServiceToken(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Invalid or missing service token' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(authContext.permissions, 'approvals:create')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    const body = await request.json();
    const {
      title,
      description,
      approvalType,
      externalId,
      priority = 'NORMAL',
      urgency = 'NORMAL',
      dueDate,
      approvers,
      metadata,
    } = body;
    
    // Validate required fields
    if (!title || !approvalType || !approvers || !Array.isArray(approvers) || approvers.length === 0) {
      return NextResponse.json(
        { error: 'Title, approval type, and approvers are required' },
        { status: 400 }
      );
    }
    
    // Validate approval type
    const validApprovalTypes = ['TASK', 'DOCUMENT', 'PROJECT', 'CUSTOM'];
    if (!validApprovalTypes.includes(approvalType)) {
      return NextResponse.json(
        { error: 'Invalid approval type. Must be one of: TASK, DOCUMENT, PROJECT, CUSTOM' },
        { status: 400 }
      );
    }
    
    // Validate priority and urgency
    const validPriorities = ['HIGH', 'NORMAL', 'LOW'];
    const validUrgencies = ['URGENT', 'NORMAL', 'LOW'];
    
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: HIGH, NORMAL, LOW' },
        { status: 400 }
      );
    }
    
    if (!validUrgencies.includes(urgency)) {
      return NextResponse.json(
        { error: 'Invalid urgency. Must be one of: URGENT, NORMAL, LOW' },
        { status: 400 }
      );
    }
    
    // Validate approvers structure
    for (const approver of approvers) {
      if (!approver.userId || !approver.level || typeof approver.level !== 'number') {
        return NextResponse.json(
          { error: 'Each approver must have userId and level (number)' },
          { status: 400 }
        );
      }
      
      // Verify approver exists
      const userExists = await prisma.user.findUnique({
        where: { id: approver.userId },
      });
      
      if (!userExists) {
        return NextResponse.json(
          { error: `Approver with ID ${approver.userId} not found` },
          { status: 400 }
        );
      }
    }
    
    // Sort approvers by level and validate levels
    const sortedApprovers = approvers.sort((a: any, b: any) => a.level - b.level);
    const levels = sortedApprovers.map((a: any) => a.level);
    
    if (levels[0] !== 1 || levels[levels.length - 1] !== levels.length) {
      return NextResponse.json(
        { error: 'Approval levels must be sequential starting from 1' },
        { status: 400 }
      );
    }
    
    // Create approval with workflow
    const result = await prisma.$transaction(async (tx) => {
      const approval = await tx.serviceApproval.create({
        data: {
          service: {
            connect: { id: authContext.serviceId }
          },
          serviceType: 'api', // Default service type for API-based approvals
          approvalType,
          externalId,
          title,
          description,
          priority,
          urgency,
          dueDate: dueDate ? new Date(dueDate) : null,
          currentLevel: 1,
          totalLevels: sortedApprovers.length,
          approvers: sortedApprovers,
          metadata: metadata || {
            source: 'service-api',
            serviceName: authContext.serviceName,
          },
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
          },
        },
      });
      
      // Create initial pending decisions for all approvers
      const decisions = await Promise.all(
        sortedApprovers.map((approver: any) =>
          tx.serviceApprovalDecision.create({
            data: {
              approvalId: approval.id,
              approverId: approver.userId,
              level: approver.level,
              decision: 'PENDING',
            },
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
          })
        )
      );
      
      return { approval, decisions };
    });
    
    // Transform response
    const approvalApprovers = result.approval.approvers as any[];
    const workflow = {
      currentLevel: result.approval.currentLevel,
      totalLevels: result.approval.totalLevels,
      approvers: approvalApprovers.map((approver: any) => ({
        userId: approver.userId,
        level: approver.level,
        role: approver.role,
        department: approver.department,
        decision: 'PENDING',
        decisionDate: null,
        comments: null,
      })),
      nextApprover: approvalApprovers.find((a: any) => a.level === 1),
      isComplete: false,
    };
    
    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'POST', '/api/service/approvals', 201, responseTime);
    
    return NextResponse.json({
      success: true,
      data: {
        id: result.approval.id,
        serviceId: result.approval.serviceId,
        serviceType: result.approval.serviceType,
        approvalType: result.approval.approvalType,
        externalId: result.approval.externalId,
        title: result.approval.title,
        description: result.approval.description,
        status: result.approval.status,
        priority: result.approval.priority,
        urgency: result.approval.urgency,
        dueDate: result.approval.dueDate,
        currentLevel: result.approval.currentLevel,
        totalLevels: result.approval.totalLevels,
        metadata: result.approval.metadata,
        createdAt: result.approval.createdAt,
        updatedAt: result.approval.updatedAt,
        workflow,
        decisions: result.decisions.map(decision => ({
          id: decision.id,
          approverId: decision.approverId,
          approver: decision.approver,
          level: decision.level,
          decision: decision.decision,
          comments: decision.comments,
          decisionDate: decision.decisionDate,
        })),
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating approval:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to create approval' },
      { status: 500 }
    );
  }
}

// PATCH - Bulk update approvals
export async function PATCH(request: NextRequest) {
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
    const body = await request.json();
    const { approvalIds, updates } = body;
    
    if (!approvalIds || !Array.isArray(approvalIds) || approvalIds.length === 0) {
      return NextResponse.json(
        { error: 'Approval IDs are required' },
        { status: 400 }
      );
    }
    
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Updates object is required' },
        { status: 400 }
      );
    }
    
    // Validate that all approvals belong to this service
    const existingApprovals = await prisma.serviceApproval.findMany({
      where: {
        id: { in: approvalIds },
        serviceId: authContext.serviceId,
      },
      select: { id: true },
    });
    
    if (existingApprovals.length !== approvalIds.length) {
      return NextResponse.json(
        { error: 'Some approvals not found or access denied' },
        { status: 404 }
      );
    }
    
    // Update approvals
    const updatedApprovals = await prisma.serviceApproval.updateMany({
      where: {
        id: { in: approvalIds },
        serviceId: authContext.serviceId,
      },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });
    
    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'PATCH', '/api/service/approvals', 200, responseTime);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedApprovals.count} approvals`,
      count: updatedApprovals.count,
    });
    
  } catch (error) {
    console.error('Error updating approvals:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to update approvals' },
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete approvals
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const approvalIds = searchParams.get('approvalIds');
    
    if (!approvalIds) {
      return NextResponse.json(
        { error: 'Approval IDs are required' },
        { status: 400 }
      );
    }
    
    const ids = approvalIds.split(',').map(id => id.trim());
    
    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one approval ID is required' },
        { status: 400 }
      );
    }
    
    // Validate that all approvals belong to this service
    const existingApprovals = await prisma.serviceApproval.findMany({
      where: {
        id: { in: ids },
        serviceId: authContext.serviceId,
      },
      select: { id: true },
    });
    
    if (existingApprovals.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some approvals not found or access denied' },
        { status: 404 }
      );
    }
    
    // Delete approvals (decisions will be deleted via cascade)
    const deletedApprovals = await prisma.serviceApproval.deleteMany({
      where: {
        id: { in: ids },
        serviceId: authContext.serviceId,
      },
    });
    
    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'DELETE', '/api/service/approvals', 200, responseTime);
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedApprovals.count} approvals`,
      count: deletedApprovals.count,
    });
    
  } catch (error) {
    console.error('Error deleting approvals:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to delete approvals' },
      { status: 500 }
    );
  }
} 