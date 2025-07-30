import { VNPTInvoiceParams, VNPTInvoiceResponse, VNPTConfig } from '@/types/invoice';

// HTTP-based SOAP client that doesn't use the problematic soap package
class VNPTInvoiceClientHTTP {
  private wsdlUrl: string;
  private config: VNPTConfig;
  private clientAvailable: boolean = true;

  constructor() {
    // Use environment variables with fallbacks
    this.wsdlUrl = process.env.VNPT_WSDL_URL || 'https://3601324879-999-tt78democadmin.vnpt-invoice.com.vn/PublishService.asmx?wsdl';
    this.config = {
      wsdlUrl: this.wsdlUrl,
      endpoint: process.env.VNPT_ENDPOINT || 'https://3601324879-999-tt78democadmin.vnpt-invoice.com.vn/PublishService.asmx',
      timeout: 30000,
      userAgent: 'UXOne Logistics Invoice Client'
    };
  }

  // Get default credentials from environment variables
  getDefaultCredentials(): Partial<VNPTInvoiceParams> {
    return {
      account: process.env.VNPT_ACCOUNT || '',
      acpass: process.env.VNPT_AC_PASSWORD || '',
      username: process.env.VNPT_USERNAME || '',
      password: process.env.VNPT_PASSWORD || '',
      // pattern and fkeys should be provided by user
      pattern: '',
      fkeys: ''
    };
  }

  // Check if environment variables are configured
  isConfigured(): boolean {
    const creds = this.getDefaultCredentials();
    return !!(creds.account && creds.acpass && creds.username && creds.password);
  }

  private createSOAPEnvelope(methodName: string, params: any): string {
    const soapBody = Object.entries(params)
      .map(([key, value]) => `<${key}>${value}</${key}>`)
      .join('');

    return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <${methodName} xmlns="http://tempuri.org/">
      ${soapBody}
    </${methodName}>
  </soap12:Body>
</soap12:Envelope>`;
  }

  private async makeSOAPRequest(methodName: string, params: any): Promise<any> {
    try {
      const soapEnvelope = this.createSOAPEnvelope(methodName, params);
      
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'User-Agent': this.config.userAgent,
          'Content-Length': Buffer.byteLength(soapEnvelope, 'utf8').toString(),
        },
        body: soapEnvelope,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlResponse = await response.text();
      return this.parseSOAPResponse(xmlResponse, methodName);
    } catch (error: any) {
      console.error('SOAP request failed:', error);
      throw error;
    }
  }

  private parseSOAPResponse(xmlResponse: string, methodName: string): any {
    try {
      // Simple XML parsing - extract the result from the SOAP response
      const resultMatch = xmlResponse.match(new RegExp(`<${methodName}Result>(.*?)</${methodName}Result>`, 's'));
      
      if (resultMatch) {
        const result = resultMatch[1].trim();
        
        // Try to parse as JSON if it looks like JSON
        if (result.startsWith('{') || result.startsWith('[')) {
          try {
            return JSON.parse(result);
          } catch {
            return result;
          }
        }
        
        return result;
      }
      
      // If no result found, return the full response for debugging
      return xmlResponse;
    } catch (error) {
      console.error('Error parsing SOAP response:', error);
      return xmlResponse;
    }
  }

  async getMCCQThueByFkeys(params: VNPTInvoiceParams): Promise<VNPTInvoiceResponse> {
    const { account, acpass, username, password, pattern, fkeys } = params;

    try {
      const soapParams = {
        Account: account,
        ACpass: acpass,
        username: username,
        password: password,
        pattern: pattern,
        fkeys: fkeys
      };

      console.log('Calling SOAP method with params:', { ...soapParams, ACpass: '***', password: '***' });

      const result = await this.makeSOAPRequest('GetMCCQThueByFkeys', soapParams);
      
      return {
        success: true,
        data: result,
        rawResult: result
      };

    } catch (error: any) {
      console.error('SOAP call failed:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown SOAP error',
        details: error
      };
    }
  }

  // Method to test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.config.endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': this.config.userAgent,
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Method to get available methods (simplified)
  async describeMethods(): Promise<{ methods: string[]; wsdl: any; services: any }> {
    try {
      const response = await fetch(this.wsdlUrl);
      const wsdlContent = await response.text();
      
      // Extract method names from WSDL with better regex patterns
      const methodPatterns = [
        /<wsdl:operation name="([^"]+)"/g,
        /<operation name="([^"]+)"/g,
        /<s:element name="([^"]+)"/g
      ];
      
      const methods: string[] = [];
      
      for (const pattern of methodPatterns) {
        const matches = wsdlContent.matchAll(pattern);
        for (const match of matches) {
          const methodName = match[1];
          if (methodName && !methods.includes(methodName) && methodName.length > 0) {
            methods.push(methodName);
          }
        }
      }
      
      // If no methods found with regex, try to extract from the WSDL structure
      if (methods.length === 0) {
        // Look for common SOAP method patterns
        const soapMethods = [
          'GetMCCQThueByFkeys',
          'GetInvoiceInfo',
          'ValidateInvoice',
          'CheckInvoice',
          'GetTaxInfo',
          'VerifyInvoice'
        ];
        
        // Check which methods are mentioned in the WSDL
        for (const method of soapMethods) {
          if (wsdlContent.includes(method)) {
            methods.push(method);
          }
        }
      }

      return {
        methods: methods.length > 0 ? methods : ['GetMCCQThueByFkeys'], // Default fallback
        wsdl: { definitions: { services: {} } },
        services: {}
      };
    } catch (error: any) {
      console.error('Error parsing WSDL:', error);
      // Return default method if parsing fails
      return {
        methods: ['GetMCCQThueByFkeys'],
        wsdl: { definitions: { services: {} } },
        services: {}
      };
    }
  }

  // Clean up
  close(): void {
    // No cleanup needed for HTTP client
  }

  // Check if available
  isAvailable(): boolean {
    return this.clientAvailable;
  }

  // Get installation instructions
  getInstallationInstructions(): string {
    return 'No additional packages required - uses built-in fetch API';
  }
}

// Create singleton instance
const vnptClientHTTP = new VNPTInvoiceClientHTTP();

export default vnptClientHTTP; 