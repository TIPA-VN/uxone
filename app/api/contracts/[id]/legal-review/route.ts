import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// POST /api/contracts/[id]/legal-review - Start legal review process
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('POST /api/contracts/[id]/legal-review - Route called');
  try {
    const session = await auth();
    console.log('Session check:', { hasSession: !!session, hasUser: !!session?.user, userId: session?.user?.id });
    if (!session?.user?.id) {
      console.log('Returning 401 - No session or user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('Contract ID from params:', id);
    
    const body = await request.json();
    const { action, comment } = body;
    console.log('Request body:', { action, comment });

    // Check if this is a fallback authentication user
    const isFallbackAuth = (session.user as any).isFallbackAuth;
    
    let currentUser;
    let isLegalUser = false;
    
    if (isFallbackAuth) {
      console.log('Processing fallback auth user:', {
        id: session.user.id,
        username: session.user.username,
        department: session.user.department,
        role: session.user.role
      });
      
      // For fallback auth, create or find the user in database
      let fallbackUser = await prisma.user.findUnique({
        where: { username: session.user.username }
      });
      
      if (!fallbackUser) {
        console.log('Creating fallback user in database...');
        // Create the fallback user in database
        fallbackUser = await prisma.user.create({
          data: {
            id: session.user.id,
            username: session.user.username,
            name: session.user.name,
            email: session.user.email || `${session.user.username}@tipa.co.th`,
            department: session.user.department,
            departmentName: session.user.departmentName,
            role: session.user.role,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log('Fallback user created:', fallbackUser.id);
      } else {
        console.log('Found existing fallback user:', fallbackUser.id);
      }
      
      currentUser = fallbackUser;
      
      console.log('Fallback user details:', {
        sessionUserId: session.user.id,
        databaseUserId: currentUser.id,
        username: currentUser.username,
        department: currentUser.department,
        role: currentUser.role
      });
      
      // Check if user is in legal department or has appropriate role
      isLegalUser = currentUser.department?.toUpperCase() === 'LEGAL' ||
                   currentUser.role === 'ADMIN' ||
                   ['GENERAL_DIRECTOR', 'GENERAL DIRECTOR', 'VICE_GENERAL_DIRECTOR', 'VICE GENERAL DIRECTOR', 'CHIEF_SPECIALIST', 'MANAGER', 'SENIOR_MANAGER', 'DIRECTOR'].includes(currentUser.role?.toUpperCase() || '');
    } else {
      // For normal users, look up in database
      currentUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      });

      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if user is LEGAL department Chief_Specialist (restricted access)
      isLegalUser = currentUser.department?.toUpperCase() === 'LEGAL' && 
                   currentUser.role?.toUpperCase() === 'CHIEF_SPECIALIST';
      
      // Allow ADMIN access for system management
      if (currentUser.role === 'ADMIN') {
        isLegalUser = true;
      }
    }

    if (!isLegalUser) {
      return NextResponse.json({ 
        error: 'Access denied. Only Chief_Specialist from LEGAL department can perform legal review.' 
      }, { status: 403 });
    }

    // Note: documentId is optional, so we'll create comments without it if needed
    // The contractId will be used to link comments to the contract

    // Get contract details - try both ContractDetails ID and Document ID
    console.log('Looking up contract by ID:', id);
    let contract;
    let contractId = id; // Use a mutable variable for the contract ID
    
    try {
      // First, try to find by ContractDetails ID
      console.log('Attempting database query for ContractDetails ID:', id);
      contract = await prisma.contractDetails.findUnique({
        where: { id },
        include: {
          project: {
            include: {
              members: true
            }
          },
          document: true
        }
      });
      console.log('Database query completed, result:', contract ? 'Found' : 'Not found');
      
      if (contract) {
        console.log('Contract found by ContractDetails ID');
      } else {
        console.log('Contract not found by ContractDetails ID, trying Document ID');
        // If not found by ContractDetails ID, try to find by Document ID
        const document = await prisma.document.findUnique({
          where: { id },
          include: {
            contractDetails: {
              include: {
                project: {
                  include: {
                    members: true
                  }
                }
              }
            }
          }
        });

        if (document?.contractDetails) {
          contract = document.contractDetails;
          // Update the contract ID to use the ContractDetails ID for operations
          contractId = contract?.id;
          console.log('Contract found by Document ID, ContractDetails ID:', contractId);
        }
      }
      
      console.log('Final contract lookup result:', contract ? 'Found' : 'Not found');
    } catch (dbError) {
      console.error('Database error during contract lookup:', dbError);
      return NextResponse.json({ error: 'Database error', details: dbError.message }, { status: 500 });
    }

    if (!contract) {
      console.log('Contract not found, returning 404');
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    
    console.log('Contract found:', { id: contract.id, contractStatus: contract.contractStatus });

    switch (action) {
      case 'START_REVIEW':
        // Check if there's already an open legal review request for this contract
        const existingReview = await prisma.legalReviewRequest.findUnique({
          where: { contractId: contractId },
          include: {
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    department: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        });

        if (existingReview && ['PENDING', 'IN_REVIEW', 'CHANGES_REQUESTED'].includes(existingReview.status)) {
          return NextResponse.json({
            error: 'A legal review request is already open for this contract',
            existingReview: {
              id: existingReview.id,
              status: existingReview.status,
              createdAt: existingReview.createdAt,
              comments: existingReview.comments
            }
          }, { status: 400 });
        }

        // Create new legal review request
        const legalReviewRequest = await prisma.legalReviewRequest.create({
          data: {
            contractId: contractId,
            status: 'PENDING',
            requestedBy: currentUser.id,
            assignedTo: isLegalUser ? currentUser.id : null,
            initialComment: comment || null,
            startedAt: isLegalUser ? new Date() : null
          },
          include: {
            requestedByUser: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true
              }
            },
            assignedToUser: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true
              }
            }
          }
        });

        // Move contract to REVIEW status
        const updatedContract = await prisma.contractDetails.update({
          where: { id: contractId },
          data: {
            contractStatus: 'REVIEW',
            currentApproverId: currentUser.id,
            updatedAt: new Date()
          }
        });

        // Create initial comment if provided
        if (comment) {
          await prisma.documentComment.create({
            data: {
              documentId: contract.documentId || null,
              contractId: contractId,
              legalReviewRequestId: legalReviewRequest.id,
              content: comment,
              authorId: currentUser.id,
              category: 'LEGAL',
              priority: 'HIGH',
              status: 'ACTIVE'
            }
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Legal review request created',
          contract: updatedContract,
          legalReviewRequest: legalReviewRequest
        });

      case 'COMPLETE_REVIEW':
        // Find the current legal review request
        const currentReview = await prisma.legalReviewRequest.findUnique({
          where: { contractId: contractId },
          include: {
            comments: {
              where: {
                category: 'LEGAL',
                isResolved: false,
                status: 'ACTIVE'
              }
            }
          }
        });

        if (!currentReview) {
          return NextResponse.json({
            error: 'No legal review request found for this contract'
          }, { status: 404 });
        }

        if (currentReview.status !== 'IN_REVIEW') {
          return NextResponse.json({
            error: `Cannot complete review. Current status is ${currentReview.status}`
          }, { status: 400 });
        }

        // Check if all legal comments are resolved
        if (currentReview.comments.length > 0) {
          return NextResponse.json({
            error: `Cannot complete review. ${currentReview.comments.length} legal comments are still unresolved.`,
            unresolvedComments: currentReview.comments.length
          }, { status: 400 });
        }

        // Update the legal review request
        const completedReview = await prisma.legalReviewRequest.update({
          where: { id: currentReview.id },
          data: {
            status: 'APPROVED',
            finalComment: comment || null,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Move contract to VERIFIED status (not approved yet)
        const finalContract = await prisma.contractDetails.update({
          where: { id: contractId },
          data: {
            contractStatus: 'VERIFIED',
            updatedAt: new Date()
          }
        });

        // Create a system comment indicating legal review is complete
        await prisma.documentComment.create({
          data: {
            documentId: contract.documentId || null,
            contractId: contractId,
            legalReviewRequestId: currentReview.id,
            content: `Legal review completed and contract verified${comment ? `: ${comment}` : ''}`,
            authorId: currentUser.id,
            category: 'LEGAL',
            priority: 'NORMAL',
            status: 'ACTIVE'
          }
        });

        // Send notification to AGD/GD for final approval
        const executives = await prisma.user.findMany({
          where: {
            OR: [
              { role: 'GENERAL_DIRECTOR' },
              { role: 'GENERAL DIRECTOR' },
              { role: 'ASSISTANT_GENERAL_DIRECTOR' },
              { role: 'ASSISTANT GENERAL DIRECTOR' }
            ]
          }
        });

        for (const executive of executives) {
          await prisma.notification.create({
            data: {
              userId: executive.id,
              title: 'Contract Ready for Final Approval',
              message: `Contract ${contract.contractNumber || 'N/A'} has been verified by legal and is ready for final approval`,
              type: 'CONTRACT_FINAL_APPROVAL',
              link: `/lvm/projects/${contract.projectId}?tab=CONTRACT`,
              read: false
            }
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Legal review completed and contract verified. Ready for final approval by AGD/GD.',
          contract: finalContract,
          legalReviewRequest: completedReview
        });

      case 'REQUEST_CHANGES':
        // Find the current legal review request
        const reviewForChanges = await prisma.legalReviewRequest.findUnique({
          where: { contractId: contractId }
        });

        if (!reviewForChanges) {
          return NextResponse.json({
            error: 'No legal review request found for this contract'
          }, { status: 404 });
        }

        if (reviewForChanges.status !== 'IN_REVIEW') {
          return NextResponse.json({
            error: `Cannot request changes. Current status is ${reviewForChanges.status}`
          }, { status: 400 });
        }

        // Update the legal review request
        const updatedReview = await prisma.legalReviewRequest.update({
          where: { id: reviewForChanges.id },
          data: {
            status: 'CHANGES_REQUESTED',
            finalComment: comment || null,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Move contract back to DRAFT and notify original author
        const draftContract = await prisma.contractDetails.update({
          where: { id: contractId },
          data: {
            contractStatus: 'DRAFT',
            currentApprovalLevel: 1, // Reset to first level
            currentApproverId: contract.project?.ownerId || null,
            updatedAt: new Date()
          }
        });

        // Create a high-priority comment with change requests
        if (comment) {
          await prisma.documentComment.create({
            data: {
              documentId: contract.documentId || null,
              contractId: contractId,
              legalReviewRequestId: reviewForChanges.id,
              content: `Legal review - Changes requested: ${comment}`,
              authorId: currentUser.id,
              category: 'LEGAL',
              priority: 'URGENT',
              status: 'ACTIVE'
            }
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Contract returned for changes. Legal department has requested modifications.',
          contract: draftContract,
          legalReviewRequest: updatedReview
        });

      case 'ASSIGN_REVIEW':
        // Legal user assigns themselves to a pending review
        const pendingReview = await prisma.legalReviewRequest.findUnique({
          where: { contractId: contractId }
        });

        if (!pendingReview) {
          return NextResponse.json({
            error: 'No legal review request found for this contract'
          }, { status: 404 });
        }

        if (pendingReview.status !== 'PENDING') {
          return NextResponse.json({
            error: `Cannot assign review. Current status is ${pendingReview.status}`
          }, { status: 400 });
        }

        const assignedReview = await prisma.legalReviewRequest.update({
          where: { id: pendingReview.id },
          data: {
            status: 'IN_REVIEW',
            assignedTo: currentUser.id,
            startedAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            requestedByUser: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true
              }
            },
            assignedToUser: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true
              }
            }
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Legal review assigned and started',
          legalReviewRequest: assignedReview
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Supported actions: START_REVIEW, ASSIGN_REVIEW, COMPLETE_REVIEW, REQUEST_CHANGES'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in legal review process:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError'
    });
    
    // Check if this is a 404 error
    if (error instanceof Error && error.message.includes('404')) {
      console.error('404 error detected, returning 404 response');
      return NextResponse.json(
        { 
          error: 'Not Found',
          details: error.message 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process legal review action',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET /api/contracts/[id]/legal-review - Get legal review status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get contract details - first try to find by ContractDetails ID
    let contract = await prisma.contractDetails.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true
          }
        },
        document: true
      }
    });

    let contractId = id; // Use a mutable variable for the contract ID

    // If not found by ContractDetails ID, try to find by Document ID
    if (!contract) {
      console.log('Contract not found by ContractDetails ID, trying Document ID:', id);
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          contractDetails: {
            include: {
              project: {
                include: {
                  members: true
                }
              }
            }
          }
        }
      });

      if (document?.contractDetails) {
        contract = document.contractDetails;
        // Update the contract ID to use the ContractDetails ID for operations
        contractId = contract?.id;
      }
    }

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get legal review request
    const legalReviewRequest = await prisma.legalReviewRequest.findUnique({
      where: { contractId: contractId },
      include: {
        requestedByUser: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true
          }
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                department: true
              }
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    department: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Get all legal comments for this contract (including those not in a review request)
    const allLegalComments = await prisma.documentComment.findMany({
      where: {
        contractId: contractId,
        category: 'LEGAL',
        status: 'ACTIVE'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            department: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const unresolvedCount = allLegalComments.filter(comment => !comment.isResolved).length;
    const resolvedCount = allLegalComments.filter(comment => comment.isResolved).length;

    return NextResponse.json({
      success: true,
      reviewStatus: {
        contractStatus: contract.contractStatus,
        currentApprovalLevel: contract.currentApprovalLevel,
        totalApprovalLevels: contract.totalApprovalLevels,
        isInReview: contract.contractStatus === 'REVIEW',
        legalReviewRequest: legalReviewRequest,
        legalComments: {
          total: allLegalComments.length,
          resolved: resolvedCount,
          unresolved: unresolvedCount
        },
        comments: allLegalComments
      }
    });

  } catch (error) {
    console.error('Error fetching legal review status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal review status' },
      { status: 500 }
    );
  }
}
