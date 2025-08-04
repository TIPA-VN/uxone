import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateServiceToken, hasPermission, logServiceRequest } from '../../middleware';

export const runtime = 'nodejs';

// GET - Get approval statistics
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
    
    // Date range parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build where clause
    const where: any = {
      serviceId: authContext.serviceId,
    };
    
    // Date range filtering
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    // Get basic counts
    const [
      totalApprovals,
      pendingApprovals,
      approvedApprovals,
      rejectedApprovals,
      cancelledApprovals,
      highPriorityApprovals,
      urgentApprovals,
      overdueApprovals,
    ] = await Promise.all([
      // Total approvals
      prisma.serviceApproval.count({ where }),
      
      // Pending approvals
      prisma.serviceApproval.count({
        where: { ...where, status: 'PENDING' },
      }),
      
      // Approved approvals
      prisma.serviceApproval.count({
        where: { ...where, status: 'APPROVED' },
      }),
      
      // Rejected approvals
      prisma.serviceApproval.count({
        where: { ...where, status: 'REJECTED' },
      }),
      
      // Cancelled approvals
      prisma.serviceApproval.count({
        where: { ...where, status: 'CANCELLED' },
      }),
      
      // High priority approvals
      prisma.serviceApproval.count({
        where: { ...where, priority: 'HIGH' },
      }),
      
      // Urgent approvals
      prisma.serviceApproval.count({
        where: { ...where, urgency: 'URGENT' },
      }),
      
      // Overdue approvals (due date passed and still pending)
      prisma.serviceApproval.count({
        where: {
          ...where,
          status: 'PENDING',
          dueDate: { lt: new Date() },
        },
      }),
    ]);
    
    // Get approval type distribution
    const approvalTypeStats = await prisma.serviceApproval.groupBy({
      by: ['approvalType'],
      where,
      _count: {
        approvalType: true,
      },
    });
    
    // Get priority distribution
    const priorityStats = await prisma.serviceApproval.groupBy({
      by: ['priority'],
      where,
      _count: {
        priority: true,
      },
    });
    
    // Get urgency distribution
    const urgencyStats = await prisma.serviceApproval.groupBy({
      by: ['urgency'],
      where,
      _count: {
        urgency: true,
      },
    });
    
    // Get recent approvals (last 7 days)
    const recentApprovals = await prisma.serviceApproval.findMany({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        urgency: true,
        createdAt: true,
        currentLevel: true,
        totalLevels: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    // Get average approval time for completed approvals
    const completedApprovals = await prisma.serviceApproval.findMany({
      where: {
        ...where,
        status: { in: ['APPROVED', 'REJECTED'] },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });
    
    const averageApprovalTime = completedApprovals.length > 0
      ? completedApprovals.reduce((total, approval) => {
          const duration = approval.updatedAt.getTime() - approval.createdAt.getTime();
          return total + duration;
        }, 0) / completedApprovals.length
      : 0;
    
    // Get approval level distribution
    const levelStats = await prisma.serviceApproval.groupBy({
      by: ['totalLevels'],
      where,
      _count: {
        totalLevels: true,
      },
    });
    
    // Calculate approval rate
    const totalCompleted = approvedApprovals + rejectedApprovals;
    const approvalRate = totalCompleted > 0 ? (approvedApprovals / totalCompleted) * 100 : 0;
    
    // Calculate average levels
    const averageLevels = levelStats.length > 0
      ? levelStats.reduce((total, stat) => total + (stat.totalLevels * stat._count.totalLevels), 0) / totalApprovals
      : 0;
    
    const responseTime = Date.now() - startTime;
    logServiceRequest(authContext.serviceId, 'GET', '/api/service/approvals/stats', 200, responseTime);
    
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total: totalApprovals,
          pending: pendingApprovals,
          approved: approvedApprovals,
          rejected: rejectedApprovals,
          cancelled: cancelledApprovals,
          approvalRate: Math.round(approvalRate * 100) / 100,
        },
        priority: {
          high: highPriorityApprovals,
          normal: totalApprovals - highPriorityApprovals - (await prisma.serviceApproval.count({
            where: { ...where, priority: 'LOW' },
          })),
          low: await prisma.serviceApproval.count({
            where: { ...where, priority: 'LOW' },
          }),
        },
        urgency: {
          urgent: urgentApprovals,
          normal: totalApprovals - urgentApprovals - (await prisma.serviceApproval.count({
            where: { ...where, urgency: 'LOW' },
          })),
          low: await prisma.serviceApproval.count({
            where: { ...where, urgency: 'LOW' },
          }),
        },
        performance: {
          overdue: overdueApprovals,
          averageApprovalTime: Math.round(averageApprovalTime / (1000 * 60 * 60 * 24) * 100) / 100, // in days
          averageLevels: Math.round(averageLevels * 100) / 100,
        },
        distribution: {
          byType: approvalTypeStats.map(stat => ({
            type: stat.approvalType,
            count: stat._count.approvalType,
            percentage: Math.round((stat._count.approvalType / totalApprovals) * 100 * 100) / 100,
          })),
          byPriority: priorityStats.map(stat => ({
            priority: stat.priority,
            count: stat._count.priority,
            percentage: Math.round((stat._count.priority / totalApprovals) * 100 * 100) / 100,
          })),
          byUrgency: urgencyStats.map(stat => ({
            urgency: stat.urgency,
            count: stat._count.urgency,
            percentage: Math.round((stat._count.urgency / totalApprovals) * 100 * 100) / 100,
          })),
          byLevels: levelStats.map(stat => ({
            levels: stat.totalLevels,
            count: stat._count.totalLevels,
            percentage: Math.round((stat._count.totalLevels / totalApprovals) * 100 * 100) / 100,
          })),
        },
        recent: recentApprovals.map(approval => ({
          id: approval.id,
          title: approval.title,
          status: approval.status,
          priority: approval.priority,
          urgency: approval.urgency,
          progress: `${approval.currentLevel}/${approval.totalLevels}`,
          createdAt: approval.createdAt,
        })),
        timeRange: {
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
      },
    });
    
  } catch (error) {
    console.error('Error fetching approval statistics:', error);
    const responseTime = Date.now() - startTime;
    // Note: authContext is not available in catch block scope
    return NextResponse.json(
      { error: 'Failed to fetch approval statistics' },
      { status: 500 }
    );
  }
} 