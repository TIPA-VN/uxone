// VNPT Invoice System Types

export interface VNPTInvoiceParams {
  account: string;
  acpass: string;
  username: string;
  password: string;
  pattern: string;
  fkeys: string;
}

export interface VNPTInvoiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  faultCode?: string;
  rawResult?: any;
  rawError?: any;
  details?: any;
}

export interface VNPTInvoiceApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  faultCode?: string;
  metadata?: {
    timestamp: string;
    pattern: string;
    fkeys: string;
  };
  details?: any;
}

export interface SOAPMethodsResponse {
  success: boolean;
  data?: {
    methods: string[];
    wsdl: any;
    services: any;
  };
  message?: string;
}

export interface InvoiceCheckerFormData {
  account: string;
  acpass: string;
  username: string;
  password: string;
  pattern: string;
  fkeys: string;
}

export interface InvoiceValidationResult {
  isValid: boolean;
  invoiceNumber?: string;
  issueDate?: string;
  amount?: number;
  taxCode?: string;
  companyName?: string;
  details?: any;
  errors?: string[];
}

// Environment configuration
export interface VNPTConfig {
  wsdlUrl: string;
  endpoint: string;
  timeout: number;
  userAgent: string;
}

// Environment variables interface
export interface VNPTEnvVars {
  VNPT_ACCOUNT?: string;
  VNPT_AC_PASSWORD?: string;
  VNPT_USERNAME?: string;
  VNPT_PASSWORD?: string;
  VNPT_PATTERN?: string;
  VNPT_ENDPOINT?: string;
  VNPT_WSDL_URL?: string;
} 