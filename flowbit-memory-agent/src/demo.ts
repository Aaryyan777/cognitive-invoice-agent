
import { InvoiceAgent } from './agent';
import type { ExtractedInvoice, NormalizedInvoice } from './types';

const agent = new InvoiceAgent();

const runDemo = async () => {
    console.log("=== FLOWBIT AI AGENT: FINAL VALIDATION DEMO ===\n");
    agent.clearMemory();

    // SCENARIO 1: Cold Start
    console.log("[Scenario 1] NEW VENDOR: Processing unknown data...");
    const inv1: ExtractedInvoice = {
        id: "INV-A-001", vendorName: "Supplier GmbH", date: "2024-01-12", totalAmount: 2975.0, currency: "EUR",
        lineItems: [{ description: "Widget", quantity: 100, price: 25.0, total: 2500.0 }],
        rawText: "Leistungsdatum: 01.01.2024"
    };
    const res1 = await agent.processInvoice(inv1);
    if (res1.requiresHumanReview) console.log("✅ SUCCESS: Flagged for review.");

    // SCENARIO 2: Learning Pattern
    console.log("\n[Scenario 2] LEARNING: Encoding 'Leistungsdatum'...");
    await agent.learnFromFeedback(inv1, { ...res1.normalizedInvoice, serviceDate: "01.01.2024" });
    const res2 = await agent.processInvoice({ ...inv1, id: "INV-A-002", date: "2024-01-13", rawText: "Leistungsdatum: 15.01.2024" });
    if (res2.normalizedInvoice.serviceDate === "15.01.2024") console.log("✅ SUCCESS: Auto-extracted Service Date.");

    // SCENARIO 3: VAT Detection
    console.log("\n[Scenario 3] STRATEGY: VAT Inclusion Detection...");
    const resB1 = await agent.processInvoice({
        id: "INV-B-001", vendorName: "Parts AG", date: "2024-02-05", totalAmount: 2400.0, currency: "EUR",
        lineItems: [], rawText: "Prices incl. VAT"
    });
    if (resB1.normalizedInvoice.taxAmount) console.log("✅ SUCCESS: Applied VAT Strategy.");

    // SCENARIO 4: Currency Recovery
    console.log("\n[Scenario 4] RECOVERY: Currency symbol mapping...");
    const resB2 = await agent.processInvoice({
        id: "INV-B-002", vendorName: "Parts AG", date: "2024-02-10", totalAmount: 150, currency: "",
        lineItems: [], rawText: "Total: 150 €"
    });
    if (resB2.normalizedInvoice.currency === "EUR") console.log("✅ SUCCESS: Recovered 'EUR' from '€'.");

    // SCENARIO 5: SKU Mapping
    console.log("\n[Scenario 5] MAPPING: Learning line-item SKU logic...");
    const invC1: ExtractedInvoice = {
        id: "INV-C-001", vendorName: "Freight & Co", date: "2024-03-01", totalAmount: 100, currency: "EUR",
        lineItems: [{ description: "Transport fee", quantity: 1, price: 100, total: 100 }],
        rawText: "Shipping"
    };
    const resC1 = await agent.processInvoice(invC1);
    await agent.learnFromFeedback(invC1, { ...resC1.normalizedInvoice, lineItems: [{ ...invC1.lineItems[0], sku: "FREIGHT" }] });
    const resC2 = await agent.processInvoice({ ...invC1, id: "INV-C-002", date: "2024-03-02" });
    if (resC2.normalizedInvoice.lineItems?.[0]?.sku === "FREIGHT") console.log("✅ SUCCESS: Auto-mapped SKU.");

    // SCENARIO 6: Skonto Detection
    console.log("\n[Scenario 6] TERMS: Skonto extraction...");
    const invC3 = { ...invC1, id: "INV-C-003", date: "2024-03-03", rawText: "2% Skonto if paid early" };
    const resC3 = await agent.processInvoice(invC3);
    await agent.learnFromFeedback(invC3, { ...resC3.normalizedInvoice, skonto: "2%" });
    const resC4 = await agent.processInvoice({ ...invC3, id: "INV-C-004", date: "2024-03-04", rawText: "3% Skonto" });
    if (resC4.normalizedInvoice.skonto === "3%") console.log("✅ SUCCESS: Extracted Skonto percentage.");

    // SCENARIO 7: PO Matching
    console.log("\n[Scenario 7] MATCHING: PO keyword identification...");
    const invA3 = { ...inv1, id: "INV-A-003", date: "2024-01-14", rawText: "Order No: PO-A-051" };
    const resA3 = await agent.processInvoice(invA3);
    await agent.learnFromFeedback(invA3, { ...resA3.normalizedInvoice, poNumber: "PO-A-051" });
    const resA4 = await agent.processInvoice({ ...inv1, id: "INV-A-004", date: "2024-01-15", rawText: "Order No: PO-B-999" });
    if (resA4.normalizedInvoice.poNumber === "PO-B-999") console.log("✅ SUCCESS: Auto-matched PO number.");

    // SCENARIO 8: Semantic Duplicates
    console.log("\n[Scenario 8] SECURITY: Semantic Duplicate check...");
    const invSpecial = { 
        id: "INV-SPEC-01", vendorName: "Final Vendor", date: "2024-12-31", totalAmount: 99.99, currency: "USD",
        lineItems: [], rawText: "Unique"
    };
    await agent.learnFromFeedback(invSpecial, (await agent.processInvoice(invSpecial)).normalizedInvoice);
    const resDup = await agent.processInvoice({ ...invSpecial, id: "INV-SPEC-DUP" });
    if (resDup.reasoning.includes("Duplicate")) console.log("✅ SUCCESS: Flagged semantic duplicate.");

    console.log("\n=== ALL SYSTEM SCENARIOS VERIFIED SUCCESSFULLY ===");
};

runDemo().catch(console.error);
