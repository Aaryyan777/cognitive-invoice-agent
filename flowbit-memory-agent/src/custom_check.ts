
import { InvoiceAgent } from './agent';
import type { ExtractedInvoice, NormalizedInvoice } from './types';

const agent = new InvoiceAgent();

const runCustomCheck = async () => {
    console.log("=== FLOWBIT AI AGENT: CUSTOM VENDOR CHALLENGE ===\n");
    
    // We don't clear memory here to show it can handle new vendors alongside existing ones
    // but for a clean trace, let's just focus on the new one.

    const vendor = "Skyline Logistics";

    // 1. First interaction: Completely unknown vendor
    console.log(`[Step 1] Processing First ${vendor} Invoice...`);
    const inv1: ExtractedInvoice = {
        id: "SKY-001",
        vendorName: vendor,
        date: "2024-05-01",
        totalAmount: 850.0,
        currency: "USD",
        lineItems: [{ description: "International Air Freight", quantity: 1, price: 850, total: 850 }],
        rawText: "Skyline Logistics Hub\nArrival Date: 28.04.2024\nRef: 850 USD"
    };

    const res1 = await agent.processInvoice(inv1);
    console.log(`Initial Status: ${res1.requiresHumanReview ? 'Needs Review' : 'Verified'}`);
    console.log(`Reasoning: ${res1.reasoning}`);

    // 2. Human Correction: Teach the agent two things:
    // a) "Arrival Date" means serviceDate
    // b) "International Air Freight" maps to SKU "AIR-LOG-99"
    console.log(`\n[Step 2] Applying Human Corrections...`);
    const corrected1: NormalizedInvoice = {
        ...res1.normalizedInvoice,
        serviceDate: "28.04.2024",
        lineItems: [{ ...res1.normalizedInvoice.lineItems[0], sku: "AIR-LOG-99" }]
    };

    const learnResult = await agent.learnFromFeedback(inv1, corrected1);
    console.log("Agent Learned:", learnResult.memoryUpdates);

    // 3. Second interaction: Same vendor, different data
    console.log(`\n[Step 3] Processing Second ${vendor} Invoice (Testing Automation)...`);
    const inv2: ExtractedInvoice = {
        id: "SKY-002",
        vendorName: vendor,
        date: "2024-06-10",
        totalAmount: 1200.0,
        currency: "USD",
        lineItems: [{ description: "International Air Freight", quantity: 1, price: 1200, total: 1200 }],
        rawText: "Skyline Logistics Hub\nArrival Date: 05.06.2024\nTotal: 1200 USD"
    };

    const res2 = await agent.processInvoice(inv2);
    
    console.log("--- FINAL AGENT OUTPUT ---");
    console.log(JSON.stringify(res2, null, 2));

    // VALIDATION
    const extractedDate = res2.normalizedInvoice.serviceDate;
    const mappedSku = res2.normalizedInvoice.lineItems[0].sku;

    if (extractedDate === "05.06.2024" && mappedSku === "AIR-LOG-99") {
        console.log("\n✅ CUSTOM CHECK SUCCESSFUL:");
        console.log(`- Auto-extracted Arrival Date: ${extractedDate}`);
        console.log(`- Auto-mapped SKU: ${mappedSku}`);
        console.log("- Decision: " + (res2.requiresHumanReview ? "Still needs review (low confidence)" : "Verified (Auto-Approved)"));
    } else {
        console.log("\n❌ CUSTOM CHECK FAILED: Logic did not apply correctly.");
    }
};

runCustomCheck().catch(console.error);
