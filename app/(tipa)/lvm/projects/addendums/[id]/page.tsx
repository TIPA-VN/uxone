import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ContractAddendumManager from '@/components/contracts/ContractAddendumManager';

interface AddendumPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AddendumPage({ params }: AddendumPageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    notFound();
  }

  const { id: projectId } = await params;
  
  if (!projectId) {
    notFound();
  }

  // Fetch the project with contract details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      contractDetails: {
        include: {
          parentContract: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          currentApprover: true,
          approvalHistory: {
            include: {
              approver: true
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      },
      owner: true
    }
  });

  if (!project) {
    notFound();
  }

  // Check if this is a contract project
  if (project.projectType !== 'CONTRACT' || !project.contractDetails) {
    notFound();
  }

  // Serialize the project data for client component
  const serializedProject = {
    ...project,
    contractDetails: project.contractDetails ? {
      ...project.contractDetails,
      value: project.contractDetails.value ? Number(project.contractDetails.value) : null,
      parentContract: project.contractDetails.parentContract ? {
        ...project.contractDetails.parentContract,
        value: project.contractDetails.parentContract.value ? Number(project.contractDetails.parentContract.value) : null,
      } : null
    } : null
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ContractAddendumManager project={serializedProject} />
      </div>
    </div>
  );
}
