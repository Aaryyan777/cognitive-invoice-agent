import {
    InvoiceAgent
} from './agent';
import {
    ExtractedInvoice
} from './types';
import * as fs from 'fs';
import * as path from 'path';

const agent = new InvoiceAgent();

const allInvoices: ExtractedInvoice[] = [
    {
        id: "INV-A-001",
        vendorName: "Supplier GmbH",
        date: "2024-01-12",
        totalAmount: 2975.0,
        currency: "EUR",
        lineItems: [{
            description: "Widget",
            quantity: 100,
            price: 25.0,
            total: 2500.0
        }],
        rawText: "Rechnungsnr: INV-2024-001\nLeistungsdatum: 01.01.2024\nBestellnr: PO-A-050"
    },
    {
        id: "INV-A-002",
        vendorName: "Supplier GmbH",
        date: "2024-01-18",
        totalAmount: 2826.25,
        currency: "EUR",
        lineItems: [{
            description: "Widget",
            quantity: 95,
            price: 25.0,
            total: 2375.0
        }],
        rawText: "Rechnungsnr: INV-2024-002\nLeistungsdatum: 15.01.2024\nBestellnr: PO-A-050\nHinweis: Teillieferung"
    },
    {
        id: "INV-A-003",
        vendorName: "Supplier GmbH",
        date: "2024-01-25",
        totalAmount: 595.0,
        currency: "EUR",
        lineItems: [{
            description: "Widget Pro",
            quantity: 20,
            price: 25.0,
            total: 500.0
        }],
        rawText: "Rechnungsnr: INV-2024-003\nLeistungsdatum: 20.01.2024\nBestellung: (keine Angabe)\nReferenz: Lieferung Januar"
    },
    {
        id: "INV-A-004",
        vendorName: "Supplier GmbH",
        date: "2024-01-26",
        totalAmount: 595.0,
        currency: "EUR",
        lineItems: [{
            description: "Widget Pro",
            quantity: 20,
            price: 25.0,
            total: 500.0
        }],
        rawText: "Rechnungsnr: INV-2024-003\nLeistungsdatum: 20.01.2024\nHinweis: erneute Zusendung"
    },
    {
        id: "INV-B-001",
        vendorName: "Parts AG",
        date: "2024-02-05",
        totalAmount: 2400.0,
        currency: "EUR",
        lineItems: [{
            description: "Bolts",
            quantity: 200,
            price: 10.0,
            total: 2000.0
        }],
        rawText: "Invoice No: PA-7781\nPO: PO-B-110\nPrices incl. VAT (MwSt. inkl.)\nTotal: 2380.00 EUR"
    },
    {
        id: "INV-B-002",
        vendorName: "Parts AG",
        date: "2024-02-20",
        totalAmount: 1785.0,
        currency: "EUR",
        lineItems: [{
            description: "Bolts",
            quantity: 150,
            price: 10.0,
            total: 1500.0
        }],
        rawText: "Invoice No: PA-7799\nPO: PO-B-110\nMwSt. inkl."
    },
    {
        id: "INV-B-003",
        vendorName: "Parts AG",
        date: "2024-03-03",
        totalAmount: 1190.0,
        currency: "",
        lineItems: [{
            description: "Nuts",
            quantity: 500,
            price: 2.0,
            total: 1000.0
        }],
        rawText: "Invoice No: PA-7810\nPO: PO-B-111\nCurrency: EUR"
    },
    {
        id: "INV-B-004",
        vendorName: "Parts AG",
        date: "2024-03-04",
        totalAmount: 1190.0,
        currency: "EUR",
        lineItems: [{
            description: "Nuts",
            quantity: 500,
            price: 2.0,
            total: 1000.0
        }],
        rawText: "Duplicate submission of PA-7810"
    },
    {
        id: "INV-C-001",
        vendorName: "Freight & Co",
        date: "2024-03-01",
        totalAmount: 1190.0,
        currency: "EUR",
        lineItems: [{
            description: "Transport charges",
            quantity: 1,
            price: 1000.0,
            total: 1000.0
        }],
        rawText: "Invoice: FC-1001\nPO: PO-C-900\n2% Skonto if paid within 10 days"
    },
    {
        id: "INV-C-002",
        vendorName: "Freight & Co",
        date: "2024-03-10",
        totalAmount: 1190.0,
        currency: "EUR",
        lineItems: [{
            description: "Seefracht / Shipping",
            quantity: 1,
            price: 1000.0,
            total: 1000.0
        }],
        rawText: "Invoice: FC-1002\nPO: PO-C-900\nService: Seefracht"
    },
    {
        id: "INV-C-003",
        vendorName: "Freight & Co",
        date: "2024-03-20",
        totalAmount: 1213.8,
        currency: "EUR",
        lineItems: [{
            description: "Transport charges",
            quantity: 1,
            price: 1020.0,
            total: 1020.0
        }],
        rawText: "Invoice: FC-1003\nPO: PO-C-901\nSlight fuel surcharge applied"
    },
    {
        id: "INV-C-004",
        vendorName: "Freight & Co",
        date: "2024-03-28",
        totalAmount: 1213.8,
        currency: "EUR",
        lineItems: [{
            description: "Transport charges",
            quantity: 1,
            price: 1020.0,
            total: 1020.0
        }],
        rawText: "Invoice: FC-1004\nPO: PO-C-901\nNote: delivery confirmation pending"
    }
];

async function runTest() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'all';

    console.log("=== FLOWBIT AI AGENT: 12 INVOICES PDF TEST ===\n");

    if (mode === 'all') {
        for (const inv of allInvoices) {
            await processAndLog(inv);
            console.log("\n" + "=".repeat(50) + "\n");
        }
    } else {
        const inv = allInvoices.find(i => i.id === mode);
        if (inv) {
            await processAndLog(inv);
        } else {
            console.error(`Error: Invoice with ID ${mode} not found.`);
            console.log("Available IDs:", allInvoices.map(i => i.id).join(", "));
        }
    }
}

async function processAndLog(inv: ExtractedInvoice) {
    console.log(`Processing ${inv.id} (${inv.vendorName})...`);
    const result = await agent.processInvoice(inv);
    console.log(JSON.stringify(result, null, 2));

    // Simulate human feedback if it requires review to facilitate learning for the next invoices
    if (result.requiresHumanReview) {
        console.log(`\n[LEARN] Simulating human correction for ${inv.id}...`);
        // Here we could apply logic to "correct" the invoice based on PDF knowledge
        // For demonstration, we'll just accept the normalized version or apply key corrections
        let corrected = { ...result.normalizedInvoice };
        
        if (inv.id === "INV-A-001") corrected.serviceDate = "2024-01-01";
        if (inv.id === "INV-A-003") corrected.poNumber = "PO-A-051";
        if (inv.vendorName === "Freight & Co") {
            corrected.lineItems = corrected.lineItems?.map(item => ({ ...item, sku: "FREIGHT" }));
        }

        await agent.learnFromFeedback(inv, corrected);
        console.log(`✅ Memory updated for ${inv.vendorName}.`);
    }
}

runTest().catch(console.error);
