import { NextRequest, NextResponse } from 'next/server';
import { createJDEService } from '@/lib/jde-connector';

export async function GET(request: NextRequest) {
  try {
    const jdeService = createJDEService();
    const glClasses = await jdeService.getInventoryGLClasses();
    
    return NextResponse.json({
      success: true,
      data: {
        glClasses: glClasses
      }
    });
  } catch (error) {
    console.error('Error fetching GL classes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch GL classes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 