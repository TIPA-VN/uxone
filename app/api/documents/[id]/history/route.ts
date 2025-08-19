import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { getDocumentHistory } from '@/lib/historyService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const history = await getDocumentHistory(documentId, limit)

    return NextResponse.json({
      success: true,
      history
    })

  } catch (error) {
    console.error('Error fetching document history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document history' }, 
      { status: 500 }
    )
  }
}
