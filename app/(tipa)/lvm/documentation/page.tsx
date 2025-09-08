"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Search, 
  FileText, 
  Settings, 
  Code, 
  Users,
  ChevronRight,
  Clock,
  Star,
  ExternalLink,
  Home,
  Filter
} from 'lucide-react';
import Link from 'next/link';

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
}

export default function DocumentationHomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [docs, setDocs] = useState<DocumentationItem[]>([]);

  // Sample documentation structure
  useEffect(() => {
    const sampleDocs: DocumentationItem[] = [
      {
        id: 'contract-lifecycle-guide',
        title: 'Complete Contract Lifecycle Guide',
        description: 'Comprehensive step-by-step guide covering the entire contract process from creation to completion, including holds, terminations, and automated monitoring.',
        category: 'contracts',
        path: '/lvm/documentation/contracts/lifecycle-guide',
        lastUpdated: '2025-01-30',
        tags: ['contracts', 'lifecycle', 'workflow', 'automation'],
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
        tags: ['api', 'contracts', 'endpoints', 'reference'],
        difficulty: 'intermediate'
      },
      {
        id: 'expiration-monitoring',
        title: 'Contract Expiration Monitoring Setup',
        description: 'How to configure and use automated contract expiration monitoring, including cron job setup and notification management.',
        category: 'system',
        path: '/lvm/documentation/system/expiration-monitoring',
        lastUpdated: '2025-01-30',
        tags: ['monitoring', 'automation', 'notifications', 'cron'],
        difficulty: 'advanced'
      },
      {
        id: 'user-permissions',
        title: 'User Roles and Permissions',
        description: 'Understanding user roles, permissions, and access control in the contract management system.',
        category: 'user-guides',
        path: '/lvm/documentation/user-guides/permissions',
        lastUpdated: '2025-01-30',
        tags: ['users', 'permissions', 'roles', 'security'],
        difficulty: 'beginner'
      }
    ];
    setDocs(sampleDocs);
  }, []);

  const categories = [
    { id: 'all', name: 'All Documentation', icon: BookOpen, count: docs.length },
    { id: 'contracts', name: 'Contract Management', icon: FileText, count: docs.filter(d => d.category === 'contracts').length },
    { id: 'api', name: 'API Reference', icon: Code, count: docs.filter(d => d.category === 'api').length },
    { id: 'system', name: 'System Administration', icon: Settings, count: docs.filter(d => d.category === 'system').length },
    { id: 'user-guides', name: 'User Guides', icon: Users, count: docs.filter(d => d.category === 'user-guides').length }
  ];

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredDocs = docs.filter(doc => doc.featured);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">UXOne Documentation</h1>
                    <p className="text-gray-600">Knowledge base and user guides</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link href="/lvm" className="flex items-center text-gray-600 hover:text-gray-900">
                  <Home className="w-4 h-4 mr-2" />
                  Back to LVM
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search documentation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Featured Documentation */}
        {featuredDocs.length > 0 && selectedCategory === 'all' && !searchTerm && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Star className="w-5 h-5 text-yellow-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Featured Documentation</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredDocs.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-blue-600" />
                          {doc.title}
                          <Star className="w-4 h-4 ml-2 text-yellow-500" />
                        </CardTitle>
                        <p className="text-gray-600 text-sm">{doc.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {doc.difficulty && (
                          <Badge className={getDifficultyColor(doc.difficulty)}>
                            {doc.difficulty}
                          </Badge>
                        )}
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(doc.lastUpdated)}
                        </div>
                      </div>
                      <Link href={doc.path}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Read Guide
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {doc.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {doc.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{doc.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documentation List */}
          <div className="lg:col-span-3">
            {filteredDocs.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedCategory === 'all' ? 'All Documentation' : 
                     categories.find(c => c.id === selectedCategory)?.name}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {filteredDocs.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 mr-2">
                                {doc.title}
                              </h3>
                              {doc.featured && <Star className="w-4 h-4 text-yellow-500" />}
                            </div>
                            <p className="text-gray-600 mb-3">{doc.description}</p>
                            
                            <div className="flex items-center space-x-4 mb-3">
                              {doc.difficulty && (
                                <Badge className={getDifficultyColor(doc.difficulty)}>
                                  {doc.difficulty}
                                </Badge>
                              )}
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                Updated {formatDate(doc.lastUpdated)}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {doc.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            <Link href={doc.path}>
                              <Button size="sm" variant="outline">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documentation found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 
                      `No documentation matches "${searchTerm}". Try different keywords or browse categories.` :
                      'No documentation available in this category.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
