import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { getDocumentVersion } from '@/lib/historyService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId, version: versionStr } = await params
    const version = parseInt(versionStr)
    
    if (isNaN(version)) {
      return NextResponse.json({ error: 'Invalid version number' }, { status: 400 })
    }

    const documentVersion = await getDocumentVersion(documentId, version)
    
    if (!documentVersion) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      version: documentVersion
    })

  } catch (error) {
    console.error('Error fetching document version:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document version' }, 
      { status: 500 }
    )
  }
}
