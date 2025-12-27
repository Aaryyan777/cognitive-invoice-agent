import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Brain,
  History,
  Settings,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Search,
  Database,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Layers,
  FileText,
  Zap,
  LayoutDashboard,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:3001/api';

const App = () => {
  const [activeTab, setActiveTab] = useState('process');
  const [memory, setMemory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [invoiceInput, setInvoiceInput] = useState(JSON.stringify({
    id: "INV-2024-PDF-01",
    vendorName: "Supplier GmbH",
    date: "2024-01-12",
    totalAmount: 2975.0,
    currency: "EUR",
    lineItems: [{ description: "Widget", quantity: 100, price: 25.0, total: 2500.0, sku: "WIDGET-001" }],
    rawText: "Rechnungsnr: INV-2024-001\nLeistungsdatum: 01.01.2024"
  }, null, 2));

  useEffect(() => { fetchMemory(); }, []);

  const fetchMemory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/memory`);
      setMemory(res.data);
    } catch (err) { console.error(err); }
  };

  const handleProcess = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/process`, JSON.parse(invoiceInput));
      setResult(res.data);
      fetchMemory();
    } catch (err) { alert("Error: Analysis failed."); }
    finally { setLoading(false); }
  };

  const handleLearn = async () => {
    if (!result?.normalizedInvoice) return;
    try {
      await axios.post(`${API_BASE}/learn`, {
        originalInvoice: JSON.parse(invoiceInput),
        finalInvoice: result.normalizedInvoice
      });
      fetchMemory();
      alert("Neural patterns successfully persisted.");
    } catch (err) { console.error(err); }
  };

  const handleReset = async () => {
    if (confirm("Reset knowledge base?")) {
      await axios.post(`${API_BASE}/reset`);
      fetchMemory();
      setResult(null);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F172A] text-white flex flex-col z-20 shadow-xl shrink-0">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
          <div className="bg-indigo-500 text-white p-1.5 rounded-lg shadow-lg">
            <Brain size={20} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight">Flowbit Agent</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <SidebarLink icon={<LayoutDashboard size={18} />} label="Processor" active={activeTab === 'process'} onClick={() => setActiveTab('process')} />
          <SidebarLink icon={<Database size={18} />} label="Knowledge" active={activeTab === 'memory'} onClick={() => setActiveTab('memory')} />
          <SidebarLink icon={<History size={18} />} label="Audit Log" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
        </nav>

        <div className="p-4 border-t border-white/5">
           <button onClick={handleReset} className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition-colors w-full px-4 py-2 rounded-lg text-sm font-medium">
             <Trash2 size={16} />
             <span>System Reset</span>
           </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 uppercase tracking-widest">
            <span>Workspace</span>
            <ChevronRight size={14} className="opacity-30" />
            <span className="text-slate-900">{activeTab}</span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm font-bold text-slate-700">Enterprise Admin</span>
             <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs">AP</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8 w-full">
          <div className="w-full mx-auto h-full">
            <AnimatePresence mode="wait">
              
              {activeTab === 'process' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-12 gap-8 h-full">
                  
                  {/* Input Panel */}
                  <div className="col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-12rem)]">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                       <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-xs tracking-widest">Raw Input Stream</h3>
                       <button 
                        onClick={() => setInvoiceInput(JSON.stringify({
                          id: `INV-${Math.floor(Math.random()*1000)}`,
                          vendorName: "Supplier GmbH",
                          date: "2024-01-12",
                          totalAmount: 2975.0,
                          currency: "EUR",
                          lineItems: [{ description: "Widget", quantity: 100, price: 25.0, total: 2500.0, sku: "WIDGET-001" }],
                          rawText: "Rechnungsnr: INV-2024-001\nLeistungsdatum: 01.01.2024"
                        }, null, 2))}
                        className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors"
                       >
                         Load
                       </button>
                    </div>
                    <textarea 
                      className="flex-1 w-full p-6 font-mono text-sm text-slate-600 bg-transparent border-none focus:ring-0 resize-none leading-relaxed"
                      value={invoiceInput}
                      onChange={(e) => setInvoiceInput(e.target.value)}
                    />
                    <div className="p-4 border-t border-slate-100 bg-slate-50/80">
                        <button 
                          onClick={handleProcess}
                          disabled={loading}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 transform active:scale-[0.99]"
                        >
                          {loading ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} fill="currentColor" />}
                          INITIATE COGNITION
                        </button>
                    </div>
                  </div>

                  {/* Output Panel */}
                  <div className="col-span-7 flex flex-col h-[calc(100vh-12rem)]">
                    {!result ? (
                      <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 p-12 text-center">
                        <Brain size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest">Awaiting Data Stream</p>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full gap-6 overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4">
                           <div className={`p-5 rounded-2xl border shadow-sm ${result.requiresHumanReview ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'}`}>
                              <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Decision</div>
                              <div className="font-bold text-lg leading-tight">{result.requiresHumanReview ? 'Human Review' : 'Verified'}</div>
                           </div>
                           <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                              <div className="flex justify-between items-center mb-1">
                                 <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Certainty</div>
                                 <div className="font-bold text-slate-700 font-mono text-sm">{Math.round(result.confidenceScore * 100)}%</div>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-600" style={{ width: `${result.confidenceScore * 100}%` }}></div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Observation Reasoning</div>
                           <p className="text-slate-700 font-bold leading-tight">{result.reasoning}</p>
                        </div>

                        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
                           <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                              <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">Adjustments</h3>
                              <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded">{result.proposedCorrections.length}</span>
                           </div>
                           <div className="p-6 overflow-y-auto flex-1 space-y-3 min-h-0">
                                {result.proposedCorrections.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center h-full text-slate-300 text-xs font-bold uppercase">Aligned</div>
                                ) : (
                                  result.proposedCorrections.map((c: any, i: number) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                       <div className="flex justify-between items-center mb-2 font-bold text-[10px]">
                                          <span className="text-indigo-600 uppercase">{c.field}</span>
                                          <span className="text-slate-400 uppercase">{c.source}</span>
                                       </div>
                                       <div className="flex items-center gap-3 text-xs mb-2 bg-white p-2 rounded border border-slate-100 font-mono font-bold">
                                          <span className="line-through text-slate-300">{c.originalValue || 'null'}</span>
                                          <ArrowRight size={12} className="text-indigo-200" />
                                          <span className="text-slate-900">{c.newValue}</span>
                                       </div>
                                       <p className="text-[9px] text-slate-500 italic">{c.reason}</p>
                                    </div>
                                  ))
                                )}
                           </div>
                           <div className="p-4 border-t border-slate-100 bg-slate-50">
                               <button onClick={handleLearn} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-100">Commit Feedback</button>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'memory' && (
                <motion.div key="memory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <div className="flex justify-between items-end pb-6 border-b border-slate-200">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter">Intelligence Bank</h2>
                      <p className="text-slate-500 mt-1 text-sm font-medium">Persistent knowledge nodes verified by human feedback.</p>
                    </div>
                    <button onClick={fetchMemory} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 uppercase tracking-widest">Resync</button>
                  </div>
                  {!memory ? <p>Syncing...</p> : (
                    <div className="grid grid-cols-3 gap-8">
                       <div className="col-span-2 grid grid-cols-2 gap-6">
                          {Object.entries(memory.vendors).map(([name, data]: [string, any]) => (
                            <div key={name} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                               <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                  <h4 className="font-bold text-slate-800 text-xs uppercase">{name}</h4>
                                  <span className="text-[9px] font-black bg-white border border-slate-200 px-2 py-0.5 rounded">{Object.keys(data.patterns).length} Nodes</span>
                               </div>
                               <div className="p-4 space-y-3">
                                  {Object.entries(data.patterns).map(([field, p]: [string, any]) => (
                                    <div key={field} className="text-[10px] font-bold flex justify-between border-b border-slate-50 pb-1">
                                       <span className="text-slate-500 uppercase">{field}</span>
                                       <span className="text-emerald-600 font-mono">{Math.round(p.confidence * 100)}%</span>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          ))}
                       </div>
                       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Layers size={14} /> Global Heuristics</h3>
                          <div className="space-y-4">
                             {memory.corrections.map((c: any, i: number) => (
                               <div key={i} className="text-[10px] font-bold">
                                  <div className="flex justify-between mb-1">
                                     <span className="text-indigo-600 uppercase">Strategy {i+1}</span>
                                     <span className="text-slate-400">{Math.round(c.confidence*100)}%</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                                     <div className="h-full bg-indigo-500" style={{ width: `${c.confidence*100}%` }}></div>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}
                </motion.div>
              )}
              
              {activeTab === 'audit' && result && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto h-full">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 font-bold uppercase text-xs tracking-widest text-slate-400">Activity trace</div>
                        <div className="p-8 overflow-y-auto flex-1">
                            <div className="relative border-l border-slate-100 ml-4 space-y-8">
                               {result.auditTrail.map((log: any, i: number) => (
                                 <div key={i} className="relative pl-8">
                                    <div className="absolute -left-[4.5px] top-0 h-2 w-2 rounded-full bg-indigo-500 shadow-sm"></div>
                                    <div className="flex flex-col gap-1">
                                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{log.step}</span>
                                       <p className="text-sm font-bold text-slate-700 leading-tight">{log.details}</p>
                                    </div>
                                 </div>
                               ))}
                            </div>
                        </div>
                    </div>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarLink = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
  >
    {React.cloneElement(icon, { size: 18, strokeWidth: active ? 3 : 2 })}
    <span className="tracking-widest">{label}</span>
  </button>
);

export default App;