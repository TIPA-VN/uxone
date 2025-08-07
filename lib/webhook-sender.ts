// Webhook sender for TIPA Mobile integration
// This module handles sending notifications from UXOne to TIPA Mobile via webhooks

interface WebhookNotification {
  notificationId: string
  title: string
  message: string
  type: string
  userId: string
  priority?: string
  actionUrl?: string
  metadata?: Record<string, unknown>
  timestamp: string
}

interface WebhookResponse {
  success: boolean
  notificationId?: string
  message?: string
  error?: string
}

// Send notification to TIPA Mobile via webhook
export async function sendWebhookToTIPA(notification: WebhookNotification): Promise<WebhookResponse> {
  const webhookUrl = process.env.TIPA_MOBILE_WEBHOOK_URL || 'http://localhost:3001/api/notifications/webhook'
  const webhookSecret = process.env.WEBHOOK_SECRET || 'tipa-mobile-webhook-secret-2024'
  
  try {
    console.log(`📤 UXOne: Sending webhook to TIPA Mobile for notification: ${notification.notificationId}`)
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhookSecret,
        'X-Source': 'uxone'
      },
      body: JSON.stringify(notification)
    })

    const responseData = await response.json()

    if (response.ok) {
      console.log(`✅ UXOne: Webhook sent successfully to TIPA Mobile`)
      console.log(`📊 UXOne: TIPA Mobile response:`, responseData)
      return {
        success: true,
        notificationId: responseData.notificationId,
        message: responseData.message
      }
    } else {
      console.error(`❌ UXOne: Webhook failed with status ${response.status}`)
      console.error(`📊 UXOne: TIPA Mobile error response:`, responseData)
      return {
        success: false,
        error: `HTTP ${response.status}: ${responseData.error || 'Unknown error'}`
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ UXOne: Webhook error:`, errorMessage)
    return {
      success: false,
      error: errorMessage
    }
  }
}

// Transform UXOne notification to webhook format
export function transformNotificationForWebhook(
  notification: Record<string, unknown>,
  targetUserId: string
): WebhookNotification {
  return {
    notificationId: notification.id as string,
    title: notification.title as string,
    message: notification.message as string,
    type: (notification.type as string) || 'info',
          userId: targetUserId, // This should be the emp_code, not the database userId
    priority: (notification.priority as string) || 'medium',
    actionUrl: notification.link as string,
    metadata: {
      source: 'uxone',
      originalId: notification.id,
      createdAt: notification.createdAt,
      ...(notification.metadata as Record<string, unknown> || {})
    },
    timestamp: new Date().toISOString()
  }
}

// Send notification to TIPA Mobile with retry logic
export async function sendWebhookWithRetry(
  notification: Record<string, unknown>,
  targetUserId: string,
  maxRetries: number = 3
): Promise<WebhookResponse> {
  const webhookNotification = transformNotificationForWebhook(notification, targetUserId)
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 UXOne: Webhook attempt ${attempt}/${maxRetries}`)
    
    const result = await sendWebhookToTIPA(webhookNotification)
    
    if (result.success) {
      return result
    }
    
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s, 8s
      console.log(`⏳ UXOne: Retrying webhook in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  console.error(`❌ UXOne: Webhook failed after ${maxRetries} attempts`)
  return {
    success: false,
    error: `Failed after ${maxRetries} attempts`
  }
}

// Batch send notifications to TIPA Mobile
export async function sendBatchWebhooks(
  notifications: Record<string, unknown>[],
  targetUserId: string
): Promise<{
  total: number
  successful: number
  failed: number
  errors: string[]
}> {
  const results = {
    total: notifications.length,
    successful: 0,
    failed: 0,
    errors: [] as string[]
  }

  console.log(`📤 UXOne: Sending batch of ${notifications.length} notifications to TIPA Mobile`)

  for (const notification of notifications) {
    try {
      const result = await sendWebhookWithRetry(notification, targetUserId)
      
      if (result.success) {
        results.successful++
      } else {
        results.failed++
        results.errors.push(`Notification ${notification.id}: ${result.error}`)
      }
    } catch (error) {
      results.failed++
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.errors.push(`Notification ${notification.id}: ${errorMessage}`)
    }
  }

  console.log(`📊 UXOne: Batch webhook results: ${results.successful} successful, ${results.failed} failed`)
  
  return results
}

// Health check for TIPA Mobile webhook endpoint
export async function checkTIPAWebhookHealth(): Promise<{
  healthy: boolean
  responseTime: number
  error?: string
}> {
  const webhookUrl = process.env.TIPA_MOBILE_WEBHOOK_URL || 'http://localhost:3001/api/notifications/webhook'
  
  try {
    const startTime = Date.now()
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET || 'tipa-mobile-webhook-secret-2024',
        'X-Source': 'uxone'
      },
      body: JSON.stringify({
        notificationId: 'health-check',
        title: 'Health Check',
        message: 'Testing webhook connectivity',
        type: 'info',
        userId: '22023312', // Use real user ID for health check
        timestamp: new Date().toISOString()
      })
    })

    const responseTime = Date.now() - startTime

    if (response.ok) {
      return {
        healthy: true,
        responseTime
      }
    } else {
      return {
        healthy: false,
        responseTime,
        error: `HTTP ${response.status}`
      }
    }
  } catch (error) {
    return {
      healthy: false,
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 