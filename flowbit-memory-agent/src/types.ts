
export interface LineItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
  unit?: string; // e.g., "pcs", "kg"
  sku?: string;
}

export interface ExtractedInvoice {
  id: string;
  vendorName: string;
  date: string; // ISO string
  totalAmount: number;
  currency: string;
  lineItems: LineItem[];
  skonto?: string;
  poNumber?: string;
  rawText?: string; // For searching patterns like "Leistungsdatum"
  // Add other potential raw fields that might need normalization
  [key: string]: any; 
}

export interface NormalizedInvoice extends ExtractedInvoice {
  // Fields that might be added or standardized
  serviceDate?: string;
  dueDate?: string;
  taxAmount?: number;
  skonto?: string;
  poNumber?: string;
  isDuplicate?: boolean;
}

export interface ProposedCorrection {
  field: string;
  originalValue: any;
  newValue: any;
  reason: string;
  confidence: number;
  source: 'vendor_memory' | 'correction_memory' | 'default_rule';
}

export interface AuditLog {
  step: 'recall' | 'apply' | 'decide' | 'learn';
  timestamp: string;
  details: string;
}

export interface ProcessingResult {
  normalizedInvoice: NormalizedInvoice;
  proposedCorrections: ProposedCorrection[];
  requiresHumanReview: boolean;
  reasoning: string;
  confidenceScore: number;
  memoryUpdates: string[]; // Descriptions of what was learned
  auditTrail: AuditLog[];
}

// Memory Structures

export interface VendorMemory {
  vendorName: string;
  patterns: {
    [key: string]: { // e.g., "serviceDate"
      pattern: string; // regex or keyword e.g., "Leistungsdatum"
      confidence: number;
      frequency: number;
      lastSeen: string;
    }
  };
  defaults: {
    [key: string]: any; // e.g., currency: "EUR"
  };
}

export interface CorrectionMemory {
  context: string; // e.g., "qty=0" or "description=Seefracht"
  correction: string; // e.g., "set_qty_from_dn", "map_sku_FREIGHT"
  confidence: number;
  successCount: number;
  failCount: number;
}

export interface MemoryStore {
  vendors: { [vendorName: string]: VendorMemory };
  corrections: CorrectionMemory[];
  processedInvoices: string[]; // IDs of processed invoices to detect duplicates
  invoiceFingerprints: string[]; // "Vendor|Date|Amount" strings
}
