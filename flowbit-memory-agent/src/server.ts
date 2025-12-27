
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { InvoiceAgent } from './agent';
import { ExtractedInvoice, NormalizedInvoice } from './types';

const app = express();
const PORT = 3001;
const agent = new InvoiceAgent();

app.use(cors());
app.use(bodyParser.json());

// 1. Process an Invoice
app.post('/api/process', async (req, res) => {
    try {
        const invoice: ExtractedInvoice = req.body;
        console.log(`Processing invoice: ${invoice.id}`);
        const result = await agent.processInvoice(invoice);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. Learn from Feedback
app.post('/api/learn', async (req, res) => {
    try {
        const { originalInvoice, finalInvoice } = req.body;
        if (!originalInvoice || !finalInvoice) {
            return res.status(400).json({ error: 'Missing invoice data' });
        }
        console.log(`Learning from correction for invoice: ${originalInvoice.id}`);
        const result = await agent.learnFromFeedback(originalInvoice, finalInvoice);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3. Get Current Memory State (for Dashboard)
app.get('/api/memory', (req, res) => {
    const memoryPath = path.resolve(process.cwd(), 'memory.json');
    if (fs.existsSync(memoryPath)) {
        const data = fs.readFileSync(memoryPath, 'utf-8');
        res.json(JSON.parse(data));
    } else {
        res.json({ vendors: {}, corrections: [], processedInvoices: [] });
    }
});

// 4. Reset Memory
app.post('/api/reset', (req, res) => {
    agent.clearMemory();
    res.json({ success: true, message: 'Memory cleared' });
});

app.listen(PORT, () => {
    console.log(`🧠 Flowbit Memory Agent API running on http://localhost:${PORT}`);
});
