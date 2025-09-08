"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  Home,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Pause,
  Play,
  X,
  Calendar,
  Settings,
  Users,
  Eye,
  Download,
  ExternalLink,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
  children?: TableOfContentsItem[];
}

export default function ContractLifecycleGuidePage() {
  const [activeSection, setActiveSection] = useState('introduction');

  const tableOfContents: TableOfContentsItem[] = [
    { id: 'introduction', title: 'Introduction', level: 1 },
    { 
      id: 'phase1', 
      title: 'Phase 1: Contract Creation', 
      level: 1,
      children: [
        { id: 'step1', title: 'Create New Contract', level: 2 },
        { id: 'contract-settings', title: 'Contract Settings', level: 2 }
      ]
    },
    { 
      id: 'phase2', 
      title: 'Phase 2: Contract Development', 
      level: 1,
      children: [
        { id: 'step2', title: 'Draft Contract Content', level: 2 },
        { id: 'step3', title: 'Collaboration & Revisions', level: 2 }
      ]
    },
    { 
      id: 'phase3', 
      title: 'Phase 3: Review & Approval Process', 
      level: 1,
      children: [
        { id: 'step4', title: 'Submit for Review', level: 2 },
        { id: 'step5', title: 'Multi-Level Approval', level: 2 }
      ]
    },
    { 
      id: 'phase4', 
      title: 'Phase 4: Contract Execution', 
      level: 1,
      children: [
        { id: 'step6', title: 'Contract Signing', level: 2 },
        { id: 'step7', title: 'Begin Execution', level: 2 }
      ]
    },
    { 
      id: 'phase5', 
      title: 'Phase 5: Active Contract Management', 
      level: 1,
      children: [
        { id: 'step8', title: 'Ongoing Monitoring', level: 2 },
        { id: 'lifecycle-manager', title: 'Lifecycle Manager', level: 2 }
      ]
    },
    { 
      id: 'phase6', 
      title: 'Phase 6: Contract Hold Management', 
      level: 1,
      children: [
        { id: 'step9', title: 'Putting Contract on Hold', level: 2 },
        { id: 'step10', title: 'Managing Held Contracts', level: 2 }
      ]
    },
    { 
      id: 'phase7', 
      title: 'Phase 7: Contract Extensions', 
      level: 1,
      children: [
        { id: 'step11', title: 'Extending Expiration', level: 2 },
        { id: 'bulk-extensions', title: 'Bulk Extensions', level: 2 }
      ]
    },
    { 
      id: 'phase8', 
      title: 'Phase 8: Contract Termination', 
      level: 1,
      children: [
        { id: 'step12', title: 'Early Termination', level: 2 }
      ]
    },
    { 
      id: 'phase9', 
      title: 'Phase 9: Natural Completion', 
      level: 1,
      children: [
        { id: 'step13', title: 'Completing Contracts', level: 2 }
      ]
    },
    { 
      id: 'automation', 
      title: 'Automated Monitoring', 
      level: 1,
      children: [
        { id: 'notifications', title: 'Smart Notifications', level: 2 },
        { id: 'cron-setup', title: 'Cron Job Setup', level: 2 }
      ]
    },
    { id: 'best-practices', title: 'Best Practices', level: 1 },
    { id: 'troubleshooting', title: 'Troubleshooting', level: 1 },
    { id: 'status-reference', title: 'Status Reference', level: 1 }
  ];

  const contractStatuses = [
    { status: 'DRAFT', description: 'Being created/edited', color: 'bg-yellow-100 text-yellow-800', actions: ['Send for Review', 'Edit', 'Delete'] },
    { status: 'REVIEW', description: 'Under approval process', color: 'bg-blue-100 text-blue-800', actions: ['Approve', 'Reject', 'Comment'] },
    { status: 'APPROVED', description: 'Approved, ready to sign', color: 'bg-green-100 text-green-800', actions: ['Sign', 'Reopen for Editing'] },
    { status: 'SIGNED', description: 'Signed, ready to execute', color: 'bg-indigo-100 text-indigo-800', actions: ['Start Execution'] },
    { status: 'EXECUTING', description: 'Currently active', color: 'bg-purple-100 text-purple-800', actions: ['Complete', 'Hold', 'Terminate'] },
    { status: 'ON_HOLD', description: 'Temporarily suspended', color: 'bg-yellow-100 text-yellow-800', actions: ['Resume', 'Terminate'] },
    { status: 'COMPLETED', description: 'Successfully finished', color: 'bg-gray-100 text-gray-800', actions: ['View Only (Archive)'] },
    { status: 'TERMINATED', description: 'Ended early', color: 'bg-red-100 text-red-800', actions: ['View Only (Archive)'] }
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderTOCItem = (item: TableOfContentsItem) => (
    <div key={item.id}>
      <button
        onClick={() => scrollToSection(item.id)}
        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
          activeSection === item.id 
            ? 'bg-blue-100 text-blue-700 font-medium' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        } ${item.level === 2 ? 'ml-4' : ''}`}
      >
        {item.title}
      </button>
      {item.children && (
        <div className="ml-2">
          {item.children.map(child => renderTOCItem(child))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/lvm/documentation" className="flex items-center text-gray-600 hover:text-gray-900">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Documentation
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Contract Lifecycle Guide</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Table of Contents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  <div className="space-y-1 p-4">
                    {tableOfContents.map(item => renderTOCItem(item))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="prose prose-lg max-w-none">
              {/* Introduction */}
              <section id="introduction" className="mb-12">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-8 mb-8">
                  <h1 className="text-3xl font-bold mb-4 text-white">Complete Contract Lifecycle Guide</h1>
                  <p className="text-xl text-blue-100 mb-6">
                    A comprehensive step-by-step guide covering the entire contract process from creation to completion, 
                    including holds, terminations, and automated monitoring.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-500 hover:bg-blue-400 text-white">Beginner Friendly</Badge>
                    <Badge className="bg-blue-500 hover:bg-blue-400 text-white">Complete Workflow</Badge>
                    <Badge className="bg-blue-500 hover:bg-blue-400 text-white">Best Practices</Badge>
                  </div>
                </div>

                <Card className="mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <Lightbulb className="w-6 h-6 text-yellow-500 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">What You'll Learn</h3>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Complete contract lifecycle from creation to completion</li>
                          <li>• How to manage contract holds, extensions, and terminations</li>
                          <li>• Setting up automated expiration monitoring</li>
                          <li>• Best practices for compliance and audit trails</li>
                          <li>• Troubleshooting common issues</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Phase 1: Contract Creation */}
              <section id="phase1" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                  Phase 1: Contract Creation 📝
                </h2>

                <div id="step1" className="mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-blue-600" />
                        Step 1: Create New Contract
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-3 text-gray-700">
                        <li className="flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                          Navigate to the <strong>Contracts</strong> section
                        </li>
                        <li className="flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                          Click <strong>"New Contract"</strong> button
                        </li>
                        <li className="flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">3</span>
                          Fill in the Contract Form with required information
                        </li>
                        <li className="flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">4</span>
                          Click <strong>"Create Contract"</strong>
                        </li>
                      </ol>
                      
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
                          <div>
                            <strong className="text-green-800">Result:</strong>
                            <span className="text-green-700 ml-1">Contract created with status <Badge className="bg-yellow-100 text-yellow-800">DRAFT</Badge></span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div id="contract-settings" className="mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-blue-600" />
                        Required Contract Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                          <ul className="space-y-2 text-gray-700">
                            <li>✓ Contract Title</li>
                            <li>✓ Contract Type</li>
                            <li>✓ Counterparty Information</li>
                            <li>✓ Contract Value & Currency</li>
                            <li>✓ Start Date & Expiration Date</li>
                            <li>✓ Department Assignment</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Optional Settings</h4>
                          <ul className="space-y-2 text-gray-700">
                            <li>• Enable Auto Renewal</li>
                            <li>• Expiration Warning Days (default: 30)</li>
                            <li>• Renewal Notice Days (default: 60)</li>
                            <li>• Payment Terms</li>
                            <li>• Special Milestones</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Phase 6: Contract Hold Management */}
              <section id="phase6" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">6</div>
                  Phase 6: Contract Hold Management ⏸️
                </h2>

                <div id="step9" className="mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Pause className="w-5 h-5 mr-2 text-yellow-600" />
                        Step 9: Putting Contract on Hold
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">When to Hold a Contract:</h4>
                        <ul className="space-y-1 text-gray-700 ml-4">
                          <li>• Contract disputes requiring resolution</li>
                          <li>• Legal reviews or compliance issues</li>
                          <li>• Payment or billing problems</li>
                          <li>• Force majeure events</li>
                          <li>• Counterparty performance issues</li>
                        </ul>
                      </div>

                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">How to Put a Contract on Hold:</h4>
                        
                        <div className="space-y-4">
                          <div className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Method A: Lifecycle Manager</h5>
                            <ol className="space-y-2 text-gray-700">
                              <li>1. Go to contract → <strong>ContractLifecycleManager</strong></li>
                              <li>2. Click <strong>"Actions"</strong> tab</li>
                              <li>3. Click <strong>"Put on Hold"</strong> (yellow pause button)</li>
                              <li>4. <strong>Enter reason</strong> (required): "Pending legal review of clause 5.2"</li>
                              <li>5. Click <strong>"Put on Hold"</strong></li>
                            </ol>
                          </div>

                          <div className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">Method B: Workflow Actions</h5>
                            <ol className="space-y-2 text-gray-700">
                              <li>1. In <strong>ContractWorkflowActions</strong> section</li>
                              <li>2. Click <strong>"Put on Hold"</strong> button</li>
                              <li>3. Enter reason and confirm</li>
                            </ol>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                          <div>
                            <strong className="text-blue-800">What Happens When You Hold:</strong>
                            <ul className="text-blue-700 mt-2 space-y-1">
                              <li>• Status changes to <Badge className="bg-yellow-100 text-yellow-800">ON_HOLD</Badge></li>
                              <li>• Notifications sent to contract owner and approvers</li>
                              <li>• Hold information recorded with reason, date, and user</li>
                              <li>• Lifecycle event created for audit trail</li>
                              <li>• Yellow badge displayed showing hold status</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div id="step10" className="mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Play className="w-5 h-5 mr-2 text-green-600" />
                        Step 10: Managing Held Contracts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">While Contract is on Hold:</h4>
                          <ul className="space-y-1 text-gray-700 ml-4">
                            <li>• Contract execution is suspended</li>
                            <li>• Hold reason displayed prominently in UI</li>
                            <li>• Hold duration is tracked automatically</li>
                            <li>• Regular hold review reminders (optional)</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Resuming a Held Contract:</h4>
                          <ol className="space-y-2 text-gray-700">
                            <li>1. <strong>Resolve the issue</strong> that caused the hold</li>
                            <li>2. Click <strong>"Resume"</strong> button (green play icon)</li>
                            <li>3. Add resume comments (optional)</li>
                            <li>4. Contract returns to <Badge className="bg-purple-100 text-purple-800">EXECUTING</Badge> status</li>
                          </ol>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
                          <div>
                            <strong className="text-green-800">Result:</strong>
                            <span className="text-green-700 ml-1">Hold status removed, execution continues normally</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Status Reference Table */}
              <section id="status-reference" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Eye className="w-6 h-6 mr-2 text-blue-600" />
                  Quick Reference - Contract Statuses 📊
                </h2>

                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {contractStatuses.map((status, index) => (
                            <tr key={status.status} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={status.color}>{status.status}</Badge>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">{status.description}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {status.actions.join(', ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Best Practices */}
              <section id="best-practices" className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Lightbulb className="w-6 h-6 mr-2 text-yellow-500" />
                  Best Practices & Tips 💡
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">For Contract Creators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                          Set realistic expiration dates with buffer time
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                          Enable auto-renewal for routine contracts only
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                          Use clear, descriptive titles for easy identification
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                          Set appropriate warning periods (30-60 days typical)
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">For Contract Managers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                          Monitor expiration dashboard regularly
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                          Review held contracts weekly
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                          Use bulk operations for efficiency
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-1 mr-2 flex-shrink-0" />
                          Maintain audit trails for compliance
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                <Link href="/lvm/documentation" className="flex items-center text-blue-600 hover:text-blue-700">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Documentation
                </Link>
                <div className="flex items-center space-x-4">
                  <Link href="/lvm/documentation/api/contracts" className="flex items-center text-blue-600 hover:text-blue-700">
                    Next: API Reference
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
