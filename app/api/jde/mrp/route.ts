import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemNumber = searchParams.get('itemNumber');
    const messageType = searchParams.get('messageType');
    
    const jdeService = createJDEService();
    
    // Get MRP Messages
    const mrpMessages = await jdeService.getMrpMessages(itemNumber || undefined);
    
    // Filter by message type if specified
    const filteredMessages = messageType 
      ? mrpMessages.filter(msg => msg.MMMSG === messageType)
      : mrpMessages;
    
    await jdeService.disconnect();

    return NextResponse.json({
      success: true,
      data: {
        mrpMessages: filteredMessages,
        summary: {
          totalMessages: filteredMessages.length,
          messageTypes: [...new Set(filteredMessages.map(msg => msg.MMMSG))],
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('JDE MRP Messages fetch error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        mrpMessages: [],
        summary: {
          totalMessages: 0,
          messageTypes: [],
          timestamp: new Date().toISOString()
        }
      }
    }, { status: 500 });
  }
} 