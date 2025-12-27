# Flowbit AI Memory Agent (Enterprise Suite)

This project implements a sophisticated AI Agent with **"Learned Memory"** for document automation. Unlike traditional systems that treat every document as a new entry, this agent improves over time by remembering past human corrections, vendor-specific patterns, and resolution histories.

##  Features

### Core Intelligence
- **4-Step Cognitive Loop**: Explicit `Recall` -> `Apply` -> `Decide` -> `Learn` architecture.
- **Vendor Specific Memory**: Automatically learns patterns (e.g., mapping "Leistungsdatum" to "Service Date").
- **Global Correction Heuristics**: Learns from repeated manual fixes (e.g., SKU mapping for line-item descriptions).
- **Purchase Order (PO) Matching**: Learns to extract and link PO numbers based on vendor-specific keywords (e.g., "Order No").
- **Dynamic Currency Recovery**: Recovers missing currency codes from raw text symbols (e.g., € -> EUR).
- **Input Normalization Layer**: Automatically translates varying JSON structures (like the PDF Appendix format) into standard internal schemas, ensuring robustness against different extraction engines.
- **Confidence Evolution**: Implements **Reinforcement** (confidence grows with usage) and **Decay** (unused patterns weaken over time).
- **Duplicate Detection**: Advanced checking using **Semantic Fingerprinting** (Vendor + Date + Amount) to identify duplicates even if they have different internal IDs.

### Enterprise UI (AI Command Center)
- **Modern Enterprise HUD**: A high-end, sophisticated interface using a professional Indigo/Slate palette.
- **Side-by-Side Analysis**: Real-time visualization comparing raw extraction against the agent's neural corrections.
- **Knowledge Base Inspector**: A visual dashboard to explore the agent's internal "Brain State," including learned patterns and confidence scores.
- **Transaction Audit Trace**: Detailed, timestamped logs of every internal step for full auditability and transparency.

## 🛠️ Tech Stack
- **Backend**: Node.js, TypeScript (Strict Mode), Express.js.
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion (Animations), Lucide Icons.
- **Persistence**: File-based JSON storage (`memory.json`).

##  Design & Logic Architecture

The suite is built on the principle of **"Human-in-the-Loop Intelligence,"** where the system acts as an apprentice that observes human corrections and encodes them into permanent corporate knowledge.

### 1. Design Philosophy
- **Data-Centric Robustness**: Instead of relying on rigid, hardcoded rules, the agent treats the raw text of an invoice as a "discovery zone," learning which keywords signal important data points dynamically.
- **Explainable AI (XAI)**: In enterprise environments, automation must be auditable. Our agent provides a detailed `reasoning` string and a full `auditTrail` for every single field it modifies.
- **Resilience to Change**: By using an **Input Normalization Layer**, the system remains decoupled from the specific JSON format of the extraction engine, allowing it to work with the provided PDF Appendix or any other industry-standard schema.

### 2. The Cognitive Loop (The "How")
The agent's "thinking" process follows a standardized four-stage pipeline:
- **Recall**: The agent first queries the `MemoryManager`. It doesn't just look for "exact matches" but retrieves a contextual profile for the vendor, applying a **Temporal Decay** algorithm to ensure that older, potentially obsolete corrections don't override fresh patterns.
- **Apply**: The agent applies learned regex patterns to the `rawText`. For example, if a human previously tagged "Leistungsdatum" as the `serviceDate`, the agent identifies that keyword, extracts the date following it, and standardizes the format. It simultaneously runs **Global Heuristics** (e.g., VAT strategies) that are reinforced across all vendors.
- **Decide**: This is the gatekeeper stage. The agent calculates a **Weighted Confidence Score**. If the score falls below the 0.8 threshold, or if a critical field (like `serviceDate` for specific vendors) is missing, it intelligently flags the invoice for human review rather than risking a "silent failure."
- **Learn**: This is the reinforcement stage. By comparing the initial raw data with the final human-approved data, the agent identifies the "Neural Delta." It then encodes this delta as a new pattern, ensuring the next similar invoice is handled with higher confidence and less manual effort.

### 3. Memory Persistence & Evolution
- **Neural Reinforcement**: Confidence isn't static. Every successful automation (learned pattern matches correctly and is accepted by a human) increases a pattern's `confidence` score and frequency in `memory.json` 
- **Confidence Decay**: To prevent the system from becoming "stuck" on old patterns, a linear decay algorithm is implemented. Patterns not seen for a long period or rejections (failures) are penalized heavily (gradually lose confidence until they are overridden by newer data) 
- **Semantic Fingerprinting**: We go beyond simple ID checking. By generating a unique signature (hash) from `Vendor + Date + Amount`, the system prevents "hidden duplicates" that often bypass traditional ID-only checks. 
### 4. Input Normalization Layer
The system features a **Translation Middleware** that automatically detects the incoming JSON dialect. It can ingest the complex nested structure found in the **PDF Appendix** and flatten it into a professional, internal schema without user intervention.


##  Scenario Coverage
1.  **Scenario 1: Cold Start**: Correctly flags unknown vendors for human review.
2.  **Scenario 2: Pattern Learning**: Learns "Leistungsdatum" -> `serviceDate` after one human correction.
3.  **Scenario 3: VAT Strategy**: Automatically handles tax recalculation for inclusive totals.
4.  **Scenario 4: Currency Recovery**: Maps raw symbols (e.g., $, €) back to standard ISO codes.
5.  **Scenario 5: SKU Mapping**: Remembers manual description-to-SKU transformations.
6.  **Scenario 6: Skonto Detection**: Learns and extracts specific payment discount terms.
7.  **Scenario 7: PO Matching**: Identifies and links Purchase Order numbers via learned keywords.
8.  **Scenario 8: Semantic Duplicates**: Flags invoices with identical Vendor/Date/Amount, even with different system IDs.

##  Getting Started

### Prerequisites
- Node.js (v16+)
- npm

### Installation
1. Install root dependencies (Backend):
   ```bash
   npm install
   ```
2. Install dashboard dependencies (Frontend):
   ```bash
   cd dashboard
   npm install
   cd ..
   ```

### Running the Suite

#### Option A: Automated Start (Windows)
Double-click the `start_demo.bat` file in the root directory. This will launch both the API and the Dashboard in separate windows.

#### Option B: Manual Start
1. **Start Backend API**:
   ```bash
   npx ts-node src/server.ts
   ```
   *Runs on http://localhost:3001*

2. **Start Dashboard**:
   ```bash
   cd dashboard
   npm run dev
   ```
   *Runs on http://localhost:5173*

##  Project Structure
- `start_demo.bat`: double click automatically launches the Backend API and the Frontend UI. 
- `src/agent.ts`: Core AI logic and the 4-step cognitive loop.
- `src/memory.ts`: Persistence layer with decay, reinforcement, and fingerprinting.
- `src/server.ts`: REST API backend.
- `src/demo.ts`: Main CLI validator for the 8 PDF scenarios.
- `src/custom_check.ts`: Test script for custom, non-appendix vendors.
- `src/manual_test.ts`: Interactive script for ad-hoc JSON testing.
- `src/dialect_test.ts`: Validator for the Input Normalization (PDF format) layer.
- `dashboard/`: React frontend source code.
- `memory.json`: Persistent database file.

##  Output Contract
Every invoice processing request returns a standardized JSON structure:
```json
{
  "normalizedInvoice": { ... },
  "proposedCorrections": [ { "field": "...", "newValue": "...", "reason": "..." } ],
  "requiresHumanReview": boolean,
  "reasoning": "Explain why memory was applied and why actions were taken",
  "confidenceScore": 0.0-1.0,
  "memoryUpdates": [ "List of learned insights if feedback was provided" ],
  "auditTrail": [ { "step": "...", "timestamp": "...", "details": "..." } ]
}
```
