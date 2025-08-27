import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ContractAddendumManager from '@/components/contracts/ContractAddendumManager';

interface AddendumPageProps {
  params: {
    id: string;
  };
}

export default async function AddendumPage({ params }: AddendumPageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    notFound();
  }

  const projectId = params.id;
  
  if (!projectId) {
    notFound();
  }

  // Fetch the project with contract details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      contractDetails: {
        include: {
          currentApprover: true,
          approvalHistory: {
            include: {
              approver: true
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      },
      creator: true,
      team: {
        include: {
          user: true
        }
      }
    }
  });

  if (!project) {
    notFound();
  }

  // Check if this is a contract project
  if (project.projectType !== 'CONTRACT' || !project.contractDetails) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ContractAddendumManager project={project} />
      </div>
    </div>
  );
}
