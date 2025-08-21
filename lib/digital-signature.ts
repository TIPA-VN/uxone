import crypto from 'crypto';

export interface DigitalSignatureData {
  content: string;
  signerId: string;
  signerName: string;
  timestamp: Date;
  contractNumber?: string;
}

export interface DigitalSignature {
  signature: string;
  signerId: string;
  signerName: string;
  timestamp: Date;
  hash: string;
  publicKey?: string;
}

export async function generateDigitalSignature(data: DigitalSignatureData): Promise<DigitalSignature> {
  try {
    // Create a hash of the content
    const contentHash = crypto.createHash('sha256').update(data.content).digest('hex');
    
    // Create a signature using the hash and signer information
    const signatureData = {
      contentHash,
      signerId: data.signerId,
      signerName: data.signerName,
      timestamp: data.timestamp.toISOString(),
      contractNumber: data.contractNumber || 'N/A'
    };
    
    // Create a unique signature string
    const signatureString = JSON.stringify(signatureData, Object.keys(signatureData).sort());
    const signature = crypto.createHash('sha256').update(signatureString).digest('hex');
    
    return {
      signature,
      signerId: data.signerId,
      signerName: data.signerName,
      timestamp: data.timestamp,
      hash: contentHash
    };
  } catch (error) {
    console.error('Error generating digital signature:', error);
    throw new Error('Failed to generate digital signature');
  }
}

export async function verifyDigitalSignature(
  content: string,
  signature: DigitalSignature
): Promise<boolean> {
  try {
    // Recreate the hash of the content
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Verify the hash matches
    return contentHash === signature.hash;
  } catch (error) {
    console.error('Error verifying digital signature:', error);
    return false;
  }
}

export async function generateSignatureHash(content: string, signerId: string): Promise<string> {
  try {
    const timestamp = new Date().toISOString();
    const data = `${content}:${signerId}:${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch (error) {
    console.error('Error generating signature hash:', error);
    throw new Error('Failed to generate signature hash');
  }
}
