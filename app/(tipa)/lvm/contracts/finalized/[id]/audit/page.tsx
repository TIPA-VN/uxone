import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  CheckCircle, 
  Download, 
  FileText, 
  Shield, 
  Clock, 
  User, 
  Hash, 
  Archive,
  Eye,
  Calendar,
  Lock,
  Verified
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import FinalizedDocumentAuditActions from '@/components/contracts/FinalizedDocumentAuditActions';

interface FinalizedDocumentAuditPageProps {
  params: Promise<{ id: string }>;
}

interface UserInfo {
  id: string;
  name: string | null;
  username: string;
  email: string | null;
}

interface FinalizedDocumentWithUsers {
  approverUsers: Map<string, UserInfo>;
}

async function getFinalizedDocument(id: string): Promise<FinalizedDocumentWithUsers | null> {
  const finalizedDoc = await prisma.finalizedDocument.findUnique({
    where: { id },
    include: {
      originalDocument: {
        include: {
          project: true,
          contractDetails: true
        }
      },
      archivedByUser: true,
      archives: {
        orderBy: { archiveDate: 'desc' }
      }
    }
  });

  if (!finalizedDoc) {
    return null;
  }

  // Fetch user information for approvers
  const approverUsers = await prisma.user.findMany({
    where: {
      id: {
        in: finalizedDoc.approvedBy
      }
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true
    }
  });

  // Create a map of user ID to user info
  const userMap = new Map(approverUsers.map(user => [user.id, user]));

  return {
    ...finalizedDoc,
    approverUsers: userMap
  };
}

export default async function FinalizedDocumentAuditPage({ params }: FinalizedDocumentAuditPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const { id } = await params;
  const finalizedDoc = await getFinalizedDocument(id) as FinalizedDocumentWithUsers;

  if (!finalizedDoc) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
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

  const signatureStatus = getSignatureStatus(finalizedDoc.digitalSignature);

    return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
              {/* Print Header - Only visible when printing */}
        <div className="hidden print-block print-header">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Audit Report</h1>
          <p className="text-sm text-gray-600 mb-1">Contract: {finalizedDoc.contractNumber || 'N/A'}</p>
          <p className="text-sm text-gray-600 mb-1">Title: {finalizedDoc.title}</p>
          <p className="text-sm text-gray-600">Generated: {new Date().toLocaleString()}</p>
        </div>
        
        {/* Header */}
        <div className="mb-8 print-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Audit Report</h1>
            <p className="text-lg text-gray-600 mt-2">
              Comprehensive audit trail for {finalizedDoc.title}
            </p>
          </div>
          <div className="no-print">
            <FinalizedDocumentAuditActions
              contractId={finalizedDoc.originalDocument.contractDetails?.id || ''}
              title={finalizedDoc.title}
              checksum={finalizedDoc.checksum}
            />
          </div>
        </div>
        
        <div className="mt-4 flex items-center space-x-4 no-print">
          <Badge variant="secondary" className="text-sm">
            <FileText className="w-4 h-4 mr-2" />
            Version {finalizedDoc.version}.{finalizedDoc.revisionNumber}
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Shield className="w-4 h-4 mr-2" />
            {finalizedDoc.isLegallyBinding ? 'Legally Binding' : 'Draft'}
          </Badge>
          <Badge className={signatureStatus.color}>
            <Verified className="w-4 h-4 mr-2" />
            {signatureStatus.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Information */}
          <Card className="audit-section">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="text-sm text-gray-900 mt-1">{finalizedDoc.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contract Number</label>
                  <p className="text-sm text-gray-900 mt-1">{finalizedDoc.contractNumber || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Version</label>
                  <p className="text-sm text-gray-900 mt-1">{finalizedDoc.version}.{finalizedDoc.revisionNumber}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Expiration Date</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {finalizedDoc.originalDocument.contractDetails?.expirationDate ? 
                     formatDate(finalizedDoc.originalDocument.contractDetails.expirationDate) : 'N/A'}
                  </p>
                </div>
              </div>
              
              {finalizedDoc.finalizationNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Finalization Notes</label>
                  <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-md">
                    {finalizedDoc.finalizationNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contract Dates */}
          <Card className="audit-section">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Contract Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {finalizedDoc.originalDocument.contractDetails?.startDate ? 
                     formatDate(finalizedDoc.originalDocument.contractDetails.startDate) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Effective Date</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {finalizedDoc.originalDocument.contractDetails?.effectiveDate ? 
                     formatDate(finalizedDoc.originalDocument.contractDetails.effectiveDate) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Expiration Date</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {finalizedDoc.originalDocument.contractDetails?.expirationDate ? 
                     formatDate(finalizedDoc.originalDocument.contractDetails.expirationDate) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Finalization Date</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(finalizedDoc.finalizationDate)}
                  </p>
                </div>
              </div>
              
              {/* Contract Status */}
              <div>
                <label className="text-sm font-medium text-gray-500">Contract Status</label>
                <div className="mt-2">
                  <Badge variant={
                    finalizedDoc.originalDocument.contractDetails?.contractStatus === 'COMPLETED' ? 'default' :
                    finalizedDoc.originalDocument.contractDetails?.contractStatus === 'EXECUTING' ? 'secondary' :
                    finalizedDoc.originalDocument.contractDetails?.contractStatus === 'APPROVED' ? 'outline' :
                    'secondary'
                  }>
                    {finalizedDoc.originalDocument.contractDetails?.contractStatus || 'N/A'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Details */}
          <Card className="audit-section">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hash className="w-5 h-5 mr-2" />
                Content & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Content Length</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {finalizedDoc.finalizedContent.length.toLocaleString()} characters
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">PDF Size</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatFileSize(finalizedDoc.finalizedPdf)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Checksum</label>
                  <p className="text-sm text-gray-900 mt-1 font-mono text-xs break-all">
                    {finalizedDoc.checksum}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Digital Signature</label>
                  <p className="text-sm text-gray-900 mt-1 font-mono text-xs break-all">
                    {finalizedDoc.digitalSignature || 'Not available'}
                  </p>
                </div>
              </div>
              

            </CardContent>
          </Card>

          {/* Approval History */}
          <Card className="audit-section">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Approval History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Final Approval</p>
                      <p className="text-xs text-gray-500">
                        Approved by {finalizedDoc.approvedBy.length} user{finalizedDoc.approvedBy.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{formatDate(finalizedDoc.approvedAt)}</p>
                    <p className="text-xs text-gray-500">Approval Date</p>
                  </div>
                </div>
                
                {finalizedDoc.approvedBy.map((approverId, index) => {
                  const user = finalizedDoc.approverUsers.get(approverId);
                  const displayName = user?.name || user?.username || `Approver ${index + 1}`;
                  const displayEmail = user?.email || `User ID: ${approverId}`;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 break-words">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500 break-words">
                            {displayEmail}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Approved
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Archive History */}
          {finalizedDoc.archives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Archive className="w-5 h-5 mr-2" />
                  Archive History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {finalizedDoc.archives.map((archive) => (
                    <div key={archive.id} className="p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Archive className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            Archive #{archive.archiveNumber}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {archive.accessLevel}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(archive.archiveDate)}
                        </div>
                        <div>
                          <span className="font-medium">Reason:</span> {archive.archiveReason}
                        </div>
                        <div>
                          <span className="font-medium">Storage:</span> {archive.storagePath}
                        </div>
                        <div>
                          <span className="font-medium">Retention:</span> {archive.retentionPolicy}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Document Created</p>
                    <p className="text-xs text-gray-500">{formatDate(finalizedDoc.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Finalized</p>
                    <p className="text-xs text-gray-500">{formatDate(finalizedDoc.finalizationDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Approved</p>
                    <p className="text-xs text-gray-500">{formatDate(finalizedDoc.approvedAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Archived By</p>
                    <p className="text-xs text-gray-500">
                      {finalizedDoc.archivedByUser?.name || finalizedDoc.archivedByUser?.username || finalizedDoc.archivedBy}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Digital Signature</span>
                  <Badge className={signatureStatus.color}>
                    {signatureStatus.label}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Checksum</span>
                  <Badge variant="outline" className="text-xs">
                    <Hash className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Legal Binding</span>
                  <Badge variant={finalizedDoc.isLegallyBinding ? "default" : "secondary"}>
                    {finalizedDoc.isLegallyBinding ? 'Yes' : 'No'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage Security</span>
                  <Badge variant="outline" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    {finalizedDoc.storageType}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
}
