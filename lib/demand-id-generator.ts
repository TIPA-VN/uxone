import { prisma } from '@/lib/prisma';

/**
 * Generates the next demand ID in the format LR-YYYYMMDD-XXX
 * Where XXX is a 3-digit sequence number that resets daily
 */
export async function generateDemandId(): Promise<string> {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD format
  
  // Use a transaction to ensure atomic sequence increment
  const result = await prisma.$transaction(async (tx) => {
    // Try to find existing sequence for today
    let sequence = await tx.demandSequence.findUnique({
      where: { date: dateString }
    });

    if (sequence) {
      // Increment existing sequence
      sequence = await tx.demandSequence.update({
        where: { date: dateString },
        data: { sequence: sequence.sequence + 1 }
      });
    } else {
      // Create new sequence for today
      sequence = await tx.demandSequence.create({
        data: {
          date: dateString,
          sequence: 1
        }
      });
    }

    return sequence;
  });

  // Format the sequence number as 3-digit string with leading zeros
  const sequenceStr = result.sequence.toString().padStart(3, '0');
  
  // Return the formatted demand ID
  const demandId = `LR-${dateString}-${sequenceStr}`;
  
  // Double-check that this ID doesn't already exist (in case of race conditions)
  const existingDemand = await prisma.demand.findUnique({
    where: { id: demandId }
  });
  
  if (existingDemand) {
    // If ID already exists, try again (this should be very rare)
    console.warn(`Demand ID ${demandId} already exists, generating new one...`);
    return generateDemandId();
  }
  
  return demandId;
}

/**
 * Validates if a demand ID follows the correct format
 */
export function validateDemandId(id: string): boolean {
  const pattern = /^LR-\d{8}-\d{3}$/;
  return pattern.test(id);
}

/**
 * Extracts date from demand ID
 */
export function extractDateFromDemandId(id: string): string | null {
  const match = id.match(/^LR-(\d{8})-\d{3}$/);
  if (match) {
    const dateStr = match[1];
    // Convert YYYYMMDD to YYYY-MM-DD
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  return null;
}

/**
 * Gets the current date in YYYYMMDD format
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
} 