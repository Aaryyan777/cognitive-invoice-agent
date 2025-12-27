import fs from 'fs';
import path from 'path';
import type { MemoryStore, VendorMemory, CorrectionMemory } from './types';

const MEMORY_FILE = 'memory.json';

export class MemoryManager {
  private memory: MemoryStore;
  private filePath: string;

  constructor() {
    this.filePath = path.resolve(process.cwd(), MEMORY_FILE);
    this.memory = this.loadMemory();
  }

  private loadMemory(): MemoryStore {
    if (fs.existsSync(this.filePath)) {
      try {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(data);
        return {
            vendors: parsed.vendors || {},
            corrections: parsed.corrections || [],
            processedInvoices: parsed.processedInvoices || [],
            invoiceFingerprints: parsed.invoiceFingerprints || []
        };
      } catch (error) {
        console.error("Memory load error", error);
      }
    }
    return { vendors: {}, corrections: [], processedInvoices: [], invoiceFingerprints: [] };
  }

  public saveMemory(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.memory, null, 2));
  }

  public getVendorMemory(vendorName: string): VendorMemory | null {
    return this.memory.vendors[vendorName] || null;
  }

  public updateVendorPattern(vendorName: string, field: string, pattern: string) {
    if (!this.memory.vendors[vendorName]) {
      this.memory.vendors[vendorName] = { vendorName, patterns: {}, defaults: {} };
    }
    const vendorMem = this.memory.vendors[vendorName];
    if (!vendorMem.patterns[field]) {
      vendorMem.patterns[field] = { pattern, confidence: 0.5, frequency: 1, lastSeen: new Date().toISOString() };
    } else {
      const p = vendorMem.patterns[field];
      if (p.pattern === pattern) {
        p.frequency++;
        p.confidence = Math.min(0.99, p.confidence + 0.1);
        p.lastSeen = new Date().toISOString();
      } else {
         vendorMem.patterns[field] = { pattern, confidence: 0.5, frequency: 1, lastSeen: new Date().toISOString() };
      }
    }
    this.saveMemory();
  }

  public applyDecay() {
      const DECAY_RATE = 0.01;
      const now = new Date().getTime();
      for (const vendor of Object.values(this.memory.vendors)) {
          for (const pattern of Object.values(vendor.patterns)) {
              const lastSeen = new Date(pattern.lastSeen).getTime();
              const daysPassed = (now - lastSeen) / (1000 * 60 * 60 * 24);
              if (daysPassed > 1) pattern.confidence = Math.max(0.1, pattern.confidence - (DECAY_RATE * daysPassed));
          }
      }
      this.saveMemory();
  }

  public recordResolution(context: string, success: boolean) {
      const mem = this.findCorrection(context);
      if (mem) {
          if (success) {
              mem.successCount++;
              mem.confidence = Math.min(0.99, mem.confidence + 0.05);
          } else {
              mem.failCount++;
              mem.confidence = Math.max(0.0, mem.confidence - 0.2);
          }
          this.saveMemory();
      }
  }

  public updateVendorDefault(vendorName: string, field: string, value: any) {
     if (!this.memory.vendors[vendorName]) {
      this.memory.vendors[vendorName] = { vendorName, patterns: {}, defaults: {} };
    }
    this.memory.vendors[vendorName].defaults[field] = value;
    this.saveMemory();
  }

  public findCorrection(context: string): CorrectionMemory | undefined {
    return this.memory.corrections.find(c => c.context === context);
  }

  public addCorrection(context: string, correction: string) {
    let mem = this.findCorrection(context);
    if (mem) {
      if (mem.correction === correction) {
        mem.successCount++;
        mem.confidence = Math.min(0.99, mem.confidence + 0.05);
      } else {
         mem.correction = correction; 
         mem.confidence = 0.5; 
      }
    } else {
      this.memory.corrections.push({ context, correction, confidence: 0.5, successCount: 1, failCount: 0 });
    }
    this.saveMemory();
  }
  
  public isDuplicateById(id: string): boolean {
      return this.memory.processedInvoices.includes(id);
  }

  public isDuplicate(invoice: any): boolean {
      if (this.isDuplicateById(invoice.id)) return true;
      const fingerprint = `${invoice.vendorName}|${invoice.date}|${invoice.totalAmount}`;
      return this.memory.invoiceFingerprints.includes(fingerprint);
  }
  
  public recordInvoice(invoice: any) {
      if (!this.memory.processedInvoices.includes(invoice.id)) this.memory.processedInvoices.push(invoice.id);
      const fingerprint = `${invoice.vendorName}|${invoice.date}|${invoice.totalAmount}`;
      if (!this.memory.invoiceFingerprints.includes(fingerprint)) this.memory.invoiceFingerprints.push(fingerprint);
      this.saveMemory();
  }
  
  public clearMemory() {
      this.memory = { vendors: {}, corrections: [], processedInvoices: [], invoiceFingerprints: [] };
      this.saveMemory();
  }
}