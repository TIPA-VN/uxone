import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Hash, 
  Shield,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FinalizedDocumentOverviewCard from '@/components/contracts/FinalizedDocumentOverviewCard';

async function getFinalizedDocuments() {
  const finalizedDocs = await prisma.finalizedDocument.findMany({
    include: {
      originalDocument: {
        include: {
          contractDetails: true
        }
      },
      archivedByUser: true
    },
    orderBy: {
      finalizationDate: 'desc'
    }
  });

  return finalizedDocs;
}

export default async function FinalizedContractsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const finalizedDocs = await getFinalizedDocuments();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (base64String: string | null) => {
    if (!base64String) return '0 Bytes';
    const bytes = Math.ceil((base64String.length * 3) / 4);
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSignatureStatus = (signature: string | null) => {
    if (!signature) return { status: 'unsigned', label: 'Not Signed', color: 'bg-gray-100 text-gray-800' };
    
    try {
      const sigData = JSON.parse(signature);
      if (sigData.signature && sigData.hash) {
        return { status: 'verified', label: 'Verified', color: 'bg-green-100 text-green-800' };
      }
      return { status: 'invalid', label: 'Invalid', color: 'bg-red-100 text-red-800' };
    } catch {
      return { status: 'invalid', label: 'Invalid', color: 'bg-red-100 text-red-800' };
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header with Search and Filters */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">All Finalized Documents</h2>
            <p className="text-sm text-gray-600 mt-1">
              {finalizedDocs.length} document{finalizedDocs.length !== 1 ? 's' : ''} finalized
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                className="pl-10 w-64"
              />
            </div>
            
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unsigned">Unsigned Only</SelectItem>
                <SelectItem value="legally-binding">Legally Binding</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {finalizedDocs.map((doc) => {
          const signatureStatus = getSignatureStatus(doc.digitalSignature);
          
          return (
            <FinalizedDocumentOverviewCard
              key={doc.id}
              doc={doc}
              signatureStatus={signatureStatus}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {finalizedDocs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Finalized Documents</h3>
          <p className="text-gray-500 mb-6">
            No contracts have been finalized yet. Complete the approval workflow to generate finalized documents.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {finalizedDocs.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{finalizedDocs.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Verified</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {finalizedDocs.filter(doc => getSignatureStatus(doc.digitalSignature).status === 'verified').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <User className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Approvers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {finalizedDocs.reduce((total, doc) => total + doc.approvedBy.length, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {finalizedDocs.filter(doc => {
                      const monthAgo = new Date();
                      monthAgo.setMonth(monthAgo.getMonth() - 1);
                      return doc.finalizationDate > monthAgo;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
