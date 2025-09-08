import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  path: string;
  tags: string[];
  relevanceScore: number;
  matchedContent: string[];
  difficulty?: string;
}

// Enhanced search with relevance scoring
function calculateRelevanceScore(doc: any, searchTerms: string[]): { score: number; matches: string[] } {
  let score = 0;
  const matches: string[] = [];

  searchTerms.forEach(term => {
    const lowerTerm = term.toLowerCase();
    
    // Title matches (highest weight)
    if (doc.title.toLowerCase().includes(lowerTerm)) {
      score += 10;
      matches.push(`Title: "${doc.title}"`);
    }
    
    // Description matches (medium weight)
    if (doc.description.toLowerCase().includes(lowerTerm)) {
      score += 5;
      matches.push(`Description: "${doc.description.substring(0, 100)}..."`);
    }
    
    // Tag matches (medium weight)
    doc.tags.forEach((tag: string) => {
      if (tag.toLowerCase().includes(lowerTerm)) {
        score += 3;
        matches.push(`Tag: "${tag}"`);
      }
    });
    
    // Category matches (low weight)
    if (doc.category.toLowerCase().includes(lowerTerm)) {
      score += 2;
      matches.push(`Category: "${doc.category}"`);
    }
  });

  return { score, matches };
}

// Documentation content for full-text search (in a real app, this would be in a database or search index)
const documentationContent: { [key: string]: string } = {
  'contract-lifecycle-guide': `
    Complete Contract Lifecycle Guide
    Contract creation workflow approval process signing execution
    Hold management suspend resume terminate extend expiration
    Automated monitoring notifications cron jobs bulk operations
    Best practices troubleshooting status reference
  `,
  'contract-api-reference': `
    Contract Management API Reference
    REST API endpoints JSON authentication lifecycle operations
    POST GET lifecycle hold unhold terminate extend expiration
    Bulk operations monitoring notifications parameters responses
    Request body examples error codes status codes
  `,
  'expiration-monitoring': `
    Contract Expiration Monitoring Setup
    Automated monitoring cron jobs scheduled tasks notifications
    Warning periods renewal notices auto-renewal configuration
    System administration setup environment variables
    Troubleshooting monitoring logs error handling
  `,
  'user-permissions': `
    User Roles and Permissions
    Access control security roles permissions authentication
    User management admin manager approver creator
    Contract workflow permissions lifecycle actions
    Security best practices role-based access control
  `
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      }, { status: 400 });
    }

    // Get documentation registry (in a real app, this would be from database)
    const documentationRegistry = [
      {
        id: 'contract-lifecycle-guide',
        title: 'Complete Contract Lifecycle Guide',
        description: 'Comprehensive step-by-step guide covering the entire contract process from creation to completion, including holds, terminations, and automated monitoring.',
        category: 'contracts',
        path: '/lvm/documentation/contracts/lifecycle-guide',
        tags: ['contracts', 'lifecycle', 'workflow', 'automation', 'holds', 'termination', 'expiration'],
        difficulty: 'beginner'
      },
      {
        id: 'contract-api-reference',
        title: 'Contract Management API Reference',
        description: 'Complete API documentation for contract lifecycle operations, including endpoints for holds, terminations, and expiration monitoring.',
        category: 'api',
        path: '/lvm/documentation/api/contracts',
        tags: ['api', 'contracts', 'endpoints', 'reference', 'rest', 'json'],
        difficulty: 'intermediate'
      },
      {
        id: 'expiration-monitoring',
        title: 'Contract Expiration Monitoring Setup',
        description: 'How to configure and use automated contract expiration monitoring, including cron job setup and notification management.',
        category: 'system',
        path: '/lvm/documentation/system/expiration-monitoring',
        tags: ['monitoring', 'automation', 'notifications', 'cron', 'system', 'setup'],
        difficulty: 'advanced'
      },
      {
        id: 'user-permissions',
        title: 'User Roles and Permissions',
        description: 'Understanding user roles, permissions, and access control in the contract management system.',
        category: 'user-guides',
        path: '/lvm/documentation/user-guides/permissions',
        tags: ['users', 'permissions', 'roles', 'security', 'access-control'],
        difficulty: 'beginner'
      }
    ];

    // Parse search query
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
    
    // Perform search with relevance scoring
    const searchResults: SearchResult[] = [];

    for (const doc of documentationRegistry) {
      // Apply filters
      if (category && category !== 'all' && doc.category !== category) continue;
      if (difficulty && doc.difficulty !== difficulty) continue;

      // Calculate relevance score
      const { score, matches } = calculateRelevanceScore(doc, searchTerms);
      
      // Also search in content
      const content = documentationContent[doc.id] || '';
      let contentScore = 0;
      const contentMatches: string[] = [];
      
      searchTerms.forEach(term => {
        if (content.toLowerCase().includes(term)) {
          contentScore += 1;
          // Find the sentence containing the term
          const sentences = content.split(/[.!?]+/);
          const matchingSentence = sentences.find(sentence => 
            sentence.toLowerCase().includes(term)
          );
          if (matchingSentence) {
            contentMatches.push(matchingSentence.trim());
          }
        }
      });

      const totalScore = score + contentScore;
      
      if (totalScore > 0) {
        searchResults.push({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          category: doc.category,
          path: doc.path,
          tags: doc.tags,
          relevanceScore: totalScore,
          matchedContent: [...matches, ...contentMatches].slice(0, 3), // Limit to 3 matches
          difficulty: doc.difficulty
        });
      }
    }

    // Sort by relevance score (descending)
    searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply limit
    const limitedResults = searchResults.slice(0, limit);

    // Generate search suggestions
    const suggestions = generateSearchSuggestions(query, searchResults);

    return NextResponse.json({
      success: true,
      query,
      results: limitedResults,
      totalResults: searchResults.length,
      suggestions,
      searchTime: Date.now() // In a real app, calculate actual search time
    });

  } catch (error) {
    console.error('Error in documentation search:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

function generateSearchSuggestions(query: string, results: SearchResult[]): string[] {
  const suggestions: string[] = [];
  
  // Common search terms based on available documentation
  const commonTerms = [
    'contract lifecycle', 'hold contract', 'terminate contract', 'expiration monitoring',
    'API reference', 'user permissions', 'bulk operations', 'automated monitoring',
    'workflow', 'approval process', 'notifications', 'troubleshooting'
  ];

  // Find similar terms
  const queryLower = query.toLowerCase();
  commonTerms.forEach(term => {
    if (term.includes(queryLower) || queryLower.includes(term.split(' ')[0])) {
      if (term !== queryLower && !suggestions.includes(term)) {
        suggestions.push(term);
      }
    }
  });

  // Add suggestions based on tags from search results
  results.slice(0, 3).forEach(result => {
    result.tags.forEach(tag => {
      if (!suggestions.includes(tag) && tag !== queryLower) {
        suggestions.push(tag);
      }
    });
  });

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

// Auto-complete endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: []
      });
    }

    // Generate auto-complete suggestions
    const allTerms = [
      'contract', 'lifecycle', 'hold', 'terminate', 'expiration', 'monitoring',
      'API', 'reference', 'user', 'permissions', 'roles', 'workflow',
      'approval', 'signing', 'execution', 'notifications', 'automation',
      'bulk operations', 'troubleshooting', 'setup', 'configuration'
    ];

    const suggestions = allTerms
      .filter(term => term.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Error in auto-complete:', error);
    return NextResponse.json(
      { error: 'Auto-complete failed' },
      { status: 500 }
    );
  }
}
