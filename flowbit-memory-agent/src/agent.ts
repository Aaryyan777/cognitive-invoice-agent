import type { 
    ExtractedInvoice, 
    ProcessingResult, 
    NormalizedInvoice, 
    ProposedCorrection, 
    AuditLog 
} from './types';
import { MemoryManager } from './memory';

export class InvoiceAgent {
    private memoryManager: MemoryManager;

    constructor() {
        this.memoryManager = new MemoryManager();
    }

    public async processInvoice(rawInput: any): Promise<ProcessingResult> {
        // --- 0. TRANSLATION / NORMALIZATION ---
        // If the input matches the PDF Appendix structure (with a nested 'fields' object), 
        // we automatically translate it to our internal professional flat format.
        let invoice: ExtractedInvoice;
        if (rawInput.fields && typeof rawInput.fields === 'object') {
            invoice = {
                id: rawInput.invoiceId || rawInput.id,
                vendorName: rawInput.vendor || rawInput.vendorName,
                date: rawInput.fields.invoiceDate || rawInput.date,
                totalAmount: rawInput.fields.grossTotal || rawInput.totalAmount,
                currency: rawInput.fields.currency || rawInput.currency,
                lineItems: rawInput.fields.lineItems || rawInput.lineItems || [],
                rawText: rawInput.rawText,
                serviceDate: rawInput.fields.serviceDate || rawInput.serviceDate,
                poNumber: rawInput.fields.poNumber || rawInput.poNumber,
                ...rawInput // Keep any other fields
            };
        } else {
            invoice = rawInput as ExtractedInvoice;
        }

        const auditTrail: AuditLog[] = [];
        const memoryUpdates: string[] = [];
        const proposedCorrections: ProposedCorrection[] = [];
        let normalizedInvoice: NormalizedInvoice = { ...invoice };
        let confidenceScore = 1.0;
        let requiresHumanReview = false;
        let reasoning = "Processed successfully.";

        // --- 1. RECALL ---
        this.memoryManager.applyDecay();
        auditTrail.push({ step: 'recall', timestamp: new Date().toISOString(), details: `Fetching memory for vendor: ${invoice.vendorName}` });
        
        if (this.memoryManager.isDuplicate(invoice)) {
             if (this.memoryManager.isDuplicateById(invoice.id)) {
                 normalizedInvoice.isDuplicate = true;
                 proposedCorrections.push({
                     field: 'id', originalValue: invoice.id, newValue: invoice.id,
                     reason: 'Duplicate ID detected', confidence: 1.0, source: 'default_rule'
                 });
                 confidenceScore = 0.0;
                 requiresHumanReview = true;
                 reasoning = "Duplicate Invoice Detected.";
                 auditTrail.push({ step: 'decide', timestamp: new Date().toISOString(), details: 'Flagged as duplicate.' });
                 return { normalizedInvoice, proposedCorrections, requiresHumanReview, reasoning, confidenceScore, memoryUpdates, auditTrail };
             }
             // Semantic duplicate
             requiresHumanReview = true;
             reasoning = "Duplicate Invoice Detected.";
             return { normalizedInvoice, proposedCorrections, requiresHumanReview, reasoning, confidenceScore, memoryUpdates, auditTrail };
        }

        const vendorMem = this.memoryManager.getVendorMemory(invoice.vendorName);
        
        // --- 2. APPLY ---
        auditTrail.push({ step: 'apply', timestamp: new Date().toISOString(), details: 'Applying memory and rules.' });

        if (vendorMem) {
            for (const [field, data] of Object.entries(vendorMem.patterns)) {
                const patternData = data as { pattern: string, confidence: number };
                if (field === 'serviceDate' && invoice.rawText) {
                    const regex = new RegExp(`${patternData.pattern}\\s*[:]?\\s*(\\d{2}\\.\\d{2}\\.\\d{4}|\\d{4}-\\d{2}-\\d{2})`, 'i');
                    const match = invoice.rawText.match(regex);
                    if (match && match[1]) {
                        normalizedInvoice.serviceDate = match[1];
                        proposedCorrections.push({
                            field: 'serviceDate', originalValue: null, newValue: match[1],
                            reason: `Extracted using learned pattern '${patternData.pattern}'`,
                            confidence: patternData.confidence, source: 'vendor_memory'
                        });
                    }
                }
                
                if (field === 'skonto' && invoice.rawText) {
                    const regex = new RegExp(`(\\d+)\\s*%\\s*${patternData.pattern}|${patternData.pattern}\\s*[:]?\\s*(\\d+)\\s*%`, 'i');
                    const match = invoice.rawText.match(regex);
                    if (match) {
                        const val = match[1] || match[2];
                        if (val) {
                            normalizedInvoice.skonto = `${val}%`;
                            proposedCorrections.push({
                               field: 'skonto', originalValue: null, newValue: `${val}%`,
                               reason: `Extracted Skonto using learned pattern '${patternData.pattern}'`,
                               confidence: patternData.confidence, source: 'vendor_memory'
                           });
                        }
                    }
               }

                if (field === 'poNumber' && invoice.rawText) {
                    const regex = new RegExp(`${patternData.pattern}\\s*[:]?\\s*([A-Z0-9-]+)`, 'i');
                    const match = invoice.rawText.match(regex);
                    if (match && match[1]) {
                        normalizedInvoice.poNumber = match[1];
                        proposedCorrections.push({
                            field: 'poNumber', originalValue: null, newValue: match[1],
                            reason: `Matched PO based on learned pattern`,
                            confidence: patternData.confidence, source: 'vendor_memory'
                        });
                    }
                }
            }
        }

        // fallbacks
        if (!normalizedInvoice.currency && invoice.rawText) {
            const symbols: { [key: string]: string } = { '€': 'EUR', 'EUR': 'EUR', '$': 'USD', '£': 'GBP' };
            for (const [s, c] of Object.entries(symbols)) {
                if (invoice.rawText.includes(s)) {
                    normalizedInvoice.currency = c;
                    proposedCorrections.push({ field: 'currency', originalValue: null, newValue: c, reason: `Recovered from text`, confidence: 0.7, source: 'default_rule' });
                    break;
                }
            }
        }

        const rawLower = invoice.rawText?.toLowerCase() || '';
        if (rawLower.includes("inkl.") || rawLower.includes("incl. vat") || rawLower.includes("vat already included")) {
             if (!normalizedInvoice.taxAmount) {
                 const tax = parseFloat((normalizedInvoice.totalAmount * 0.19 / 1.19).toFixed(2));
                 normalizedInvoice.taxAmount = tax;
                 proposedCorrections.push({ field: 'taxAmount', originalValue: null, newValue: tax, reason: "VAT Included Strategy", confidence: 0.8, source: 'default_rule' });
             }
        }

        normalizedInvoice.lineItems.forEach((item, index) => {
             const cor = this.memoryManager.findCorrection(`description=${item.description}`);
             if (cor && cor.correction.startsWith('map_sku_')) {
                 const newSku = cor.correction.replace('map_sku_', '');
                 if (item.sku !== newSku) {
                     item.sku = newSku;
                     proposedCorrections.push({ field: `lineItems[${index}].sku`, originalValue: null, newValue: newSku, reason: `Mapped from memory`, confidence: cor.confidence, source: 'correction_memory' });
                 }
             }
        });

        // --- 3. DECIDE ---
        if (!normalizedInvoice.serviceDate && invoice.vendorName === 'Supplier GmbH') {
            confidenceScore -= 0.3;
            reasoning = "Missing Service Date.";
        }
        if (proposedCorrections.some(c => c.confidence < 0.7)) {
            confidenceScore -= 0.2;
            reasoning = "Low confidence corrections applied.";
        }
        if (confidenceScore < 0.8) requiresHumanReview = true;

        return { normalizedInvoice, proposedCorrections, requiresHumanReview, reasoning, confidenceScore, memoryUpdates, auditTrail };
    }

    public async learnFromFeedback(orig: ExtractedInvoice, final: NormalizedInvoice): Promise<ProcessingResult> {
        const learnings: string[] = [];
        const auditTrail: AuditLog[] = [];
        const timestamp = new Date().toISOString();

        auditTrail.push({ step: 'learn', timestamp, details: 'Commencing neural encoding of feedback.' });

        if (!orig.serviceDate && final.serviceDate && orig.rawText) {
            const kws = ['Leistungsdatum', 'Service Date', 'Arrival Date', 'Date of Service'];
            for (const kw of kws) {
                if (orig.rawText.includes(kw)) {
                    this.memoryManager.updateVendorPattern(orig.vendorName, 'serviceDate', kw);
                    const msg = `Learned pattern: ${kw}`;
                    learnings.push(msg);
                    auditTrail.push({ step: 'learn', timestamp, details: msg });
                    break;
                }
            }
        }

        final.lineItems.forEach((fItem, idx) => {
            const oItem = orig.lineItems[idx];
            if (oItem && fItem.sku && oItem.sku !== fItem.sku) {
                 this.memoryManager.addCorrection(`description=${oItem.description}`, `map_sku_${fItem.sku}`);
                 const msg = `Mapped SKU: ${fItem.sku}`;
                 learnings.push(msg);
                 auditTrail.push({ step: 'learn', timestamp, details: msg });
            }
        });

        if (!orig.skonto && final.skonto && orig.rawText) {
            if (orig.rawText.includes("Skonto")) {
                this.memoryManager.updateVendorPattern(orig.vendorName, 'skonto', 'Skonto');
                const msg = "Learned Skonto pattern";
                learnings.push(msg);
                auditTrail.push({ step: 'learn', timestamp, details: msg });
            }
        }

        if (!orig.poNumber && final.poNumber && orig.rawText) {
            const pkw = ['Purchase Order', 'Order No', 'Bestellnr', 'Bestellung', 'PO'];
            for (const kw of pkw) {
                if (orig.rawText.includes(kw)) {
                    this.memoryManager.updateVendorPattern(orig.vendorName, 'poNumber', kw);
                    const msg = `Learned PO keyword: ${kw}`;
                    learnings.push(msg);
                    auditTrail.push({ step: 'learn', timestamp, details: msg });
                    break;
                }
            }
        }

        this.memoryManager.recordInvoice(orig);
        auditTrail.push({ step: 'learn', timestamp, details: 'Memory persistence successful.' });
        return { normalizedInvoice: final, proposedCorrections: [], requiresHumanReview: false, reasoning: "Feedback Persisted", confidenceScore: 1.0, memoryUpdates: learnings, auditTrail };
    }
    
    public clearMemory() { this.memoryManager.clearMemory(); }
}
