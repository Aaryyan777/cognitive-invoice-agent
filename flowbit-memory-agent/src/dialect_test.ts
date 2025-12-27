
import { InvoiceAgent } from './agent';

const agent = new InvoiceAgent();

// This is the EXACT format from the PDF Appendix
const pdfFormatInvoice = {
  "invoiceId": "INV-A-001",
  "vendor": "Supplier GmbH",
  "fields": {
    "invoiceNumber": "INV-2024-001",
    "invoiceDate": "12.01.2024",
    "serviceDate": null,
    "currency": "EUR",
    "grossTotal": 2975.0,
    "lineItems": [{ "sku": "WIDGET-001", "qty": 100, "unitPrice": 25.0 }]
  },
  "rawText": "Leistungsdatum: 01.01.2024"
};

const testDialect = async () => {
    console.log("--- TESTING PDF DIALECT TRANSLATION ---");
    
    // We pass the raw PDF JSON directly!
    const result = await agent.processInvoice(pdfFormatInvoice);
    
    console.log("Resulting ID:", result.normalizedInvoice.id);
    console.log("Resulting Vendor:", result.normalizedInvoice.vendorName);
    console.log("Resulting Total:", result.normalizedInvoice.totalAmount);
    
    if (result.normalizedInvoice.vendorName === "Supplier GmbH") {
        console.log("\n✅ SUCCESS: The Agent automatically 'translated' the PDF format!");
    } else {
        console.log("\n❌ FAILED: The Agent didn't recognize the format.");
    }
};

testDialect().catch(console.error);
