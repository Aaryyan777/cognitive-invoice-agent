import {
    InvoiceAgent
} from './agent';
import type { ExtractedInvoice } from './types';

const agent = new InvoiceAgent();

// --- EDIT THIS JSON TO TEST ANY INVOICE ---
const manualInvoice: ExtractedInvoice = {
    id: "MANUAL-TEST-999",
    vendorName: "Supplier GmbH",
    date: "2024-12-26",
    totalAmount: 5000.0,
    currency: "EUR",
    lineItems: [
        { description: "Server Hardware", quantity: 1, price: 5000, total: 5000 }
    ],
    rawText: "Rechnungsnr: 2024-999\nLeistungsdatum: 20.12.2024\nPurchase Order: PO-ALPHA-1"
};

const runManual = async () => {
    console.log("--- STARTING MANUAL AGENT ANALYSIS ---\n");
    
    // First, process it
    const result = await agent.processInvoice(manualInvoice);
    
    console.log("AGENT RESPONSE:");
    console.log(JSON.stringify(result, null, 2));
    
    console.log("\n--------------------------------------");
    console.log("Decision:", result.requiresHumanReview ? "⚠️ NEEDS REVIEW" : "✅ AUTO-APPROVED");
    console.log("Reasoning:", result.reasoning);
};

runManual().catch(console.error);
