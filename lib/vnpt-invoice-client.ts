import { VNPTInvoiceParams, VNPTInvoiceResponse, VNPTConfig } from '@/types/invoice';

// Simplified SOAP client that works without problematic dependencies
class VNPTInvoiceClient {
  private wsdlUrl: string;
  private client: any;
  private config: VNPTConfig;
  private isSoapAvailable: boolean = false;

  constructor() {
    this.wsdlUrl = 'https://3601324879-999-tt78democadmin.vnpt-invoice.com.vn/PublishService.asmx?wsdl';
    this.client = null;
    this.config = {
      wsdlUrl: this.wsdlUrl,
      endpoint: 'https://3601324879-999-tt78democadmin.vnpt-invoice.com.vn/PublishService.asmx',
      timeout: 30000,
      userAgent: 'UXOne Logistics Invoice Client'
    };
    
    // Check if SOAP is available
    this.checkSoapAvailability();
  }

  private async checkSoapAvailability(): Promise<void> {
    try {
      // Try to import soap with error handling
      const soap = await import('soap');
      this.isSoapAvailable = true;
    } catch (error: any) {
      console.warn('SOAP package not available or has dependency issues:', error.message);
      this.isSoapAvailable = false;
    }
  }

  async getClient(): Promise<any> {
    if (!this.isSoapAvailable) {
      throw new Error('SOAP package not available or has dependency issues. Please install: npm install soap xml2js');
    }

    if (this.client) {
      return this.client;
    }

    try {
      // Dynamic import with simplified options
      const soap = await import('soap');
      
      // Create SOAP client with minimal options to avoid dependency issues
      this.client = await soap.createClientAsync(this.wsdlUrl, {
        endpoint: this.config.endpoint,
        envelopeKey: 'soap12',
        forceSoap12Headers: true
      } as any);

      // SOAP client created successfully
      return this.client;
    } catch (error: any) {
      console.error('Error creating SOAP client:', error);
      
      // Provide helpful error message for missing dependencies
      if (error.message?.includes('Cannot find module') || error.message?.includes('Module not found')) {
        throw new Error(`SOAP dependencies not installed. Please run: npm install soap xml2js`);
      }
      
      throw new Error(`Failed to create SOAP client: ${error.message}`);
    }
  }

  async getMCCQThueByFkeys(params: VNPTInvoiceParams): Promise<VNPTInvoiceResponse> {
    if (!this.isSoapAvailable) {
      return {
        success: false,
        error: 'SOAP package not available or has dependency issues.',
        details: 'Please install: npm install soap xml2js'
      };
    }

    const { account, acpass, username, password, pattern, fkeys } = params;

    try {
      const client = await this.getClient();

      // Prepare arguments
      const args = {
        Account: account,
        ACpass: acpass,
        username: username,
        password: password,
        pattern: pattern,
        fkeys: fkeys
      };

      // Calling SOAP method

      // Call SOAP method
      const [result] = await client.GetMCCQThueByFkeysAsync(args);
      
      return {
        success: true,
        data: result.GetMCCQThueByFkeysResult,
        rawResult: result
      };

    } catch (error: any) {
      console.error('SOAP call failed:', error);
      
      // Parse SOAP fault if available
      if (error.body) {
        try {
          const faultString = error.body.match(/<faultstring>(.*?)<\/faultstring>/)?.[1];
          const faultCode = error.body.match(/<faultcode>(.*?)<\/faultcode>/)?.[1];
          
          return {
            success: false,
            error: faultString || 'SOAP fault occurred',
            faultCode: faultCode,
            rawError: error.body
          };
        } catch (parseError) {
          console.error('Error parsing SOAP fault:', parseError);
        }
      }

      return {
        success: false,
        error: error.message || 'Unknown SOAP error',
        details: error
      };
    }
  }

  // Method to get available SOAP methods (useful for debugging)
  async describeMethods(): Promise<{ methods: string[]; wsdl: any; services: any }> {
    if (!this.isSoapAvailable) {
      throw new Error('SOAP package not available or has dependency issues.');
    }

    try {
      const client = await this.getClient();
      return {
        methods: Object.keys(client),
        wsdl: client.wsdl?.definitions || {},
        services: client.wsdl?.definitions?.services || {}
      };
    } catch (error: any) {
      throw new Error(`Failed to describe methods: ${error.message}`);
    }
  }

  // Clean up client connection
  close(): void {
    this.client = null;
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    if (!this.isSoapAvailable) {
      return false;
    }

    try {
      await this.getClient();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Check if SOAP is available
  isAvailable(): boolean {
    return this.isSoapAvailable;
  }

  // Get installation instructions
  getInstallationInstructions(): string {
    return 'npm install soap xml2js';
  }
}

// Create singleton instance
const vnptClient = new VNPTInvoiceClient();

export default vnptClient; 