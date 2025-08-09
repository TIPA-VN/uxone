import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendNotification } from "./stream/route";
import { sendWebhookWithRetry } from "@/lib/webhook-sender";

export const runtime = 'nodejs'

type DbUser = { id: string; username: string; }

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Authentication required" }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Use Prisma ORM instead of raw SQL to prevent injection
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        hidden: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('connect')) {
      return NextResponse.json(
        { error: 'Database connection failed' }, 
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Authentication required" }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const body = await req.json();
    const { broadcast = false, ...notificationData } = body;

    if (broadcast) {
      // Fetch all users using Prisma ORM
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true
        }
      });

      // Create notifications for all users
      const now = new Date();
      try {
        // Try using createMany
        await prisma.notification.createMany({
          data: users.map((user: DbUser) => ({
            userId: user.id,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type || 'broadcast',
            link: notificationData.link,
            read: false,
            createdAt: now,
          }))
        });

        // Fetch created notifications for SSE
        const createdNotifications = await prisma.notification.findMany({
          where: {
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type || 'broadcast',
            createdAt: now
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: users.length
        });

        for (const notification of createdNotifications) {
          await sendNotification(notification, notification.userId);
          
          // Get user's username for webhook
          const user = await prisma.user.findUnique({
            where: { id: notification.userId },
            select: { username: true }
          });
          
          // Send webhook to TIPA Mobile with username (async)
          const targetUserId = user?.username || notification.userId;
          sendWebhookWithRetry(notification, targetUserId).catch(error => {
            console.error(`❌ UXOne: Failed to send webhook to TIPA Mobile for user ${targetUserId}:`, error);
          });
        }
        
        return NextResponse.json({ 
          count: users.length, 
          notifications: createdNotifications.length 
        });
      } catch (error) {
        console.error('Error in createMany, falling back to transaction:', error);
        
        // Fallback: use $transaction with multiple create calls
        await prisma.$transaction(
          users.map((user: DbUser) =>
            prisma.notification.create({
              data: {
                userId: user.id,
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type || 'broadcast',
                link: notificationData.link,
                read: false,
                createdAt: now,
              }
            })
          )
        );

        // Fetch created notifications for SSE
        const createdNotifications = await prisma.notification.findMany({
          where: {
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type || 'broadcast',
            createdAt: now
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: users.length
        });

        for (const notification of createdNotifications) {
          await sendNotification(notification, notification.userId);
          
          // Get user's username for webhook
          const user = await prisma.user.findUnique({
            where: { id: notification.userId },
            select: { username: true }
          });
          
          // Send webhook to TIPA Mobile with username (async)
          const targetUserId = user?.username || notification.userId;
          sendWebhookWithRetry(notification, targetUserId).catch(error => {
            console.error(`❌ UXOne: Failed to send webhook to TIPA Mobile for user ${targetUserId}:`, error);
          });
        }
        
        return NextResponse.json({ 
          count: users.length, 
          notifications: createdNotifications.length 
        });
      }
    } else {
      // Upsert user if not exists using Prisma ORM
      const sessionUserId = session.user.id;
      const sessionUsername = session.user.username || `user_${session.user.id}`;
      const sessionName = session.user.name || session.user.id;
      const sessionEmail = session.user.email || '';
      const sessionDepartment = session.user.department || '';
      const sessionDepartmentName = session.user.departmentName || '';
      const sessionRole = session.user.role || '';

      // Upsert user using Prisma ORM
      await prisma.user.upsert({
        where: { id: sessionUserId },
        update: {
          name: sessionName,
          email: sessionEmail,
          username: sessionUsername,
          department: sessionDepartment,
          departmentName: sessionDepartmentName,
          role: sessionRole,
          updatedAt: new Date()
        },
        create: {
          id: sessionUserId,
          name: sessionName,
          email: sessionEmail,
          username: sessionUsername,
          department: sessionDepartment,
          departmentName: sessionDepartmentName,
          role: sessionRole,
          hashedPassword: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Insert notification using Prisma ORM
      const now = new Date();
      const notification = await prisma.notification.create({
        data: {
          userId: sessionUserId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'notification',
          link: notificationData.link,
          read: false,
          createdAt: now,
        }
      });
      
      // Get user's username for webhook
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { username: true }
      });
      
      // Send notification to UXOne SSE clients
      await sendNotification(notification, sessionUserId);
      
      // Send webhook to TIPA Mobile with username (async, don't wait for response)
      const targetUserId = user?.username || sessionUserId;
      sendWebhookWithRetry(notification, targetUserId).catch(error => {
        console.error('❌ UXOne: Failed to send webhook to TIPA Mobile:', error);
      });
      
      return NextResponse.json(notification);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('connect')) {
      return NextResponse.json(
        { error: 'Database connection failed' }, 
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create notification' }, 
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Authentication required" }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 });
    }
    
    // Verify notification ownership using Prisma ORM
    const existing = await prisma.notification.findFirst({
      where: {
        id: body.id,
        userId: session.user.id
      }
    });
    
    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    
    // If body.hidden === true, set hidden=true
    if (body.hidden === true) {
      const updated = await prisma.notification.update({
        where: { id: body.id },
        data: { hidden: true }
      });
      
      // Send update via SSE
      await sendNotification({
        ...updated,
        type: 'notification_update',
        updateType: 'hidden'
      }, session.user.id);
      
      return NextResponse.json(updated);
    }
    
    // Update notification as read using Prisma ORM
    const updated = await prisma.notification.update({
      where: { id: body.id },
      data: { read: true }
    });
    
    // Send read status update via SSE
    await sendNotification({
      ...updated,
      type: 'notification_update',
      updateType: 'read'
    }, session.user.id);
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating notification:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('connect')) {
      return NextResponse.json(
        { error: 'Database connection failed' }, 
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update notification' }, 
      { status: 500 }
    );
  }
} 