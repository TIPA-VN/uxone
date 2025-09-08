import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

interface DocumentationItem {
  id: string;
  title: string;
  description: string;
  category: string;
  path: string;
  lastUpdated: string;
  tags: string[];
  featured?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  content?: string;
  tableOfContents?: TOCItem[];
}

interface TOCItem {
  id: string;
  title: string;
  level: number;
  children?: TOCItem[];
}

// Documentation registry - in a real app, this could be stored in a database
const documentationRegistry: DocumentationItem[] = [
  {
    id: 'contract-lifecycle-guide',
    title: 'Complete Contract Lifecycle Guide',
    description: 'Comprehensive step-by-step guide covering the entire contract process from creation to completion, including holds, terminations, and automated monitoring.',
    category: 'contracts',
    path: '/lvm/documentation/contracts/lifecycle-guide',
    lastUpdated: '2025-01-30',
    tags: ['contracts', 'lifecycle', 'workflow', 'automation', 'holds', 'termination', 'expiration'],
    featured: true,
    difficulty: 'beginner'
  },
  {
    id: 'contract-api-reference',
    title: 'Contract Management API Reference',
    description: 'Complete API documentation for contract lifecycle operations, including endpoints for holds, terminations, and expiration monitoring.',
    category: 'api',
    path: '/lvm/documentation/api/contracts',
    lastUpdated: '2025-01-30',
    tags: ['api', 'contracts', 'endpoints', 'reference', 'rest', 'json'],
    difficulty: 'intermediate'
  },
  {
    id: 'expiration-monitoring',
    title: 'Contract Expiration Monitoring Setup',
    description: 'How to configure and use automated contract expiration monitoring, including cron job setup and notification management.',
    category: 'system',
    path: '/lvm/documentation/system/expiration-monitoring',
    lastUpdated: '2025-01-30',
    tags: ['monitoring', 'automation', 'notifications', 'cron', 'system', 'setup'],
    difficulty: 'advanced'
  },
  {
    id: 'user-permissions',
    title: 'User Roles and Permissions',
    description: 'Understanding user roles, permissions, and access control in the contract management system.',
    category: 'user-guides',
    path: '/lvm/documentation/user-guides/permissions',
    lastUpdated: '2025-01-30',
    tags: ['users', 'permissions', 'roles', 'security', 'access-control'],
    difficulty: 'beginner'
  },
  {
    id: 'contract-hold-management',
    title: 'Contract Hold Management',
    description: 'Detailed guide on how to put contracts on hold, manage held contracts, and resume contract execution.',
    category: 'contracts',
    path: '/lvm/documentation/contracts/hold-management',
    lastUpdated: '2025-01-30',
    tags: ['contracts', 'holds', 'suspension', 'workflow', 'management'],
    difficulty: 'beginner'
  },
  {
    id: 'bulk-operations',
    title: 'Bulk Contract Operations',
    description: 'How to perform bulk operations on multiple contracts, including extensions, notifications, and status updates.',
    category: 'user-guides',
    path: '/lvm/documentation/user-guides/bulk-operations',
    lastUpdated: '2025-01-30',
    tags: ['bulk', 'operations', 'efficiency', 'contracts', 'management'],
    difficulty: 'intermediate'
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting Common Issues',
    description: 'Solutions to common problems in contract management, including workflow issues, notification problems, and system errors.',
    category: 'system',
    path: '/lvm/documentation/system/troubleshooting',
    lastUpdated: '2025-01-30',
    tags: ['troubleshooting', 'issues', 'problems', 'solutions', 'support'],
    difficulty: 'intermediate'
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const id = searchParams.get('id');

    if (action === 'get' && id) {
      // Get specific documentation item
      const doc = documentationRegistry.find(d => d.id === id);
      if (!doc) {
        return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        document: doc
      });
    }

    if (action === 'search' && search) {
      // Search documentation
      const searchTerm = search.toLowerCase();
      const results = documentationRegistry.filter(doc => {
        return doc.title.toLowerCase().includes(searchTerm) ||
               doc.description.toLowerCase().includes(searchTerm) ||
               doc.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      });

      return NextResponse.json({
        success: true,
        results,
        count: results.length,
        searchTerm: search
      });
    }

    // List documentation with filters
    let filteredDocs = documentationRegistry;

    if (category && category !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.category === category);
    }

    if (featured === 'true') {
      filteredDocs = filteredDocs.filter(doc => doc.featured);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredDocs = filteredDocs.filter(doc => {
        return doc.title.toLowerCase().includes(searchTerm) ||
               doc.description.toLowerCase().includes(searchTerm) ||
               doc.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      });
    }

    // Get categories with counts
    const categories = [
      { id: 'all', name: 'All Documentation', count: documentationRegistry.length },
      { id: 'contracts', name: 'Contract Management', count: documentationRegistry.filter(d => d.category === 'contracts').length },
      { id: 'api', name: 'API Reference', count: documentationRegistry.filter(d => d.category === 'api').length },
      { id: 'system', name: 'System Administration', count: documentationRegistry.filter(d => d.category === 'system').length },
      { id: 'user-guides', name: 'User Guides', count: documentationRegistry.filter(d => d.category === 'user-guides').length }
    ];

    return NextResponse.json({
      success: true,
      documents: filteredDocs,
      categories,
      totalCount: documentationRegistry.length,
      filteredCount: filteredDocs.length
    });

  } catch (error) {
    console.error('Error in documentation API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documentation' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      // Create new documentation (this would typically save to database)
      const newDoc: DocumentationItem = {
        id: `doc-${Date.now()}`,
        title: body.title,
        description: body.description,
        category: body.category,
        path: body.path,
        lastUpdated: new Date().toISOString().split('T')[0],
        tags: body.tags || [],
        featured: body.featured || false,
        difficulty: body.difficulty || 'beginner'
      };

      // In a real implementation, save to database
      documentationRegistry.push(newDoc);

      return NextResponse.json({
        success: true,
        document: newDoc,
        message: 'Documentation created successfully'
      });
    }

    if (action === 'update') {
      // Update existing documentation
      const { id } = body;
      const docIndex = documentationRegistry.findIndex(d => d.id === id);
      
      if (docIndex === -1) {
        return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
      }

      documentationRegistry[docIndex] = {
        ...documentationRegistry[docIndex],
        ...body,
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      return NextResponse.json({
        success: true,
        document: documentationRegistry[docIndex],
        message: 'Documentation updated successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error creating/updating documentation:', error);
    return NextResponse.json(
      { error: 'Failed to process documentation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Documentation ID required' }, { status: 400 });
    }

    const docIndex = documentationRegistry.findIndex(d => d.id === id);
    
    if (docIndex === -1) {
      return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
    }

    // Remove from registry (in real implementation, delete from database)
    documentationRegistry.splice(docIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Documentation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting documentation:', error);
    return NextResponse.json(
      { error: 'Failed to delete documentation' },
      { status: 500 }
    );
  }
}
