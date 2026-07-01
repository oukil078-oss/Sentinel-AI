import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, Filter, X, RefreshCw, Plus } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { PageHeader, Panel, StatusPill, Button, Chip } from "../components/ui";
import { formatCurrency, timeAgo } from "../lib/utils";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";

export function TransactionsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "fraud" | "legitimate">("all");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modal & Case Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [casePriority, setCasePriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [caseNote, setCaseNote] = useState("");
  const [submittingCase, setSubmittingCase] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (q) params.q = q;
      if (amountMin) params.min_amount = parseFloat(amountMin);
      if (amountMax) params.max_amount = parseFloat(amountMax);
      const { data } = await api.get("/api/transactions", { params });
      setItems(data.items);
      if (data.items.length && !selectedId) setSelectedId(data.items[0].tx_id);
    } catch (err: any) {
      toast(formatApiError(err), "error");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(load, 180);
    return () => clearTimeout(t);
  }, [q, statusFilter, amountMin, amountMax]);

  const selected = useMemo(() => items.find((x) => x.tx_id === selectedId), [items, selectedId]);

  // Sync details when a transaction is selected
  useEffect(() => {
    if (selected) {
      setCaseTitle(`Suspicious ${formatCurrency(selected.amount)} charge at ${selected.merchant}`);
      setCaseDescription(
        `Transaction flagged with ${(selected.fraud_score * 100).toFixed(1)}% fraud probability. Cardholder: ${selected.cardholder}. Location: ${selected.location}.`
      );
      setCasePriority(selected.risk_level === "critical" ? "critical" : selected.risk_level === "high" ? "high" : "medium");
      setCaseNote("");
      setIsCreatingCase(false);
    }
  }, [selected]);

  const exportCsv = () => {
    const headers = ["tx_id", "timestamp", "amount", "merchant", "cardholder", "card", "location", "fraud_score", "predicted_fraud"];
    const rows = items.map((i) =>
      [i.tx_id, i.timestamp, i.amount, i.merchant, i.cardholder, `${i.card_brand} ${i.card_last4}`, i.location, i.fraud_score, i.predicted_fraud]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `transactions-${Date.now()}.csv`; a.click();
    toast(`Exported ${items.length} rows`, "success");
  };

  const submitCase = async () => {
    if (!selected) return;
    setSubmittingCase(true);
    try {
      await api.post("/api/cases", {
        tx_id: selected.tx_id,
        title: caseTitle,
        description: caseDescription,
        amount: selected.amount,
        priority: casePriority,
        risk_score: selected.fraud_score,
        note: caseNote.trim() ? caseNote.trim() : undefined,
      });
      toast("Case created successfully", "success");
      setIsModalOpen(false);
      navigate("/cases");
    } catch (err: any) {
      toast(formatApiError(err), "error");
    } finally {
      setSubmittingCase(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="All transactions"
        title="Transaction explorer"
        subtitle="Real-time ledger of every card-present / card-not-present transaction scored by our production Random Forest."
        actions={
          <>
            <Button variant="secondary" size="md" onClick={load} testid="refresh-btn">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="primary" size="md" onClick={exportCsv} testid="export-csv-btn">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </>
        }
      />

      {/* Filters row */}
      <Panel padding="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[var(--th-subtle)] rounded-full">
            <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")} testid="filter-all">All</Chip>
            <Chip active={statusFilter === "fraud"} onClick={() => setStatusFilter("fraud")} testid="filter-fraud">Fraud</Chip>
            <Chip active={statusFilter === "legitimate"} onClick={() => setStatusFilter("legitimate")} testid="filter-legit">Legit</Chip>
          </div>

          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--th-text-dim)]" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search tx, merchant, cardholder..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              data-testid="tx-search-input"
              className="w-full bg-[var(--th-subtle)] border border-[var(--th-border)] rounded-full pl-10 pr-10 py-2 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-dim)] focus:border-[#C6F24E]/40 focus:outline-none"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--th-text-secondary)] hover:text-[var(--th-text)]">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min $"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              data-testid="tx-min-amount-input"
              className="w-24 bg-[var(--th-subtle)] border border-[var(--th-border)] rounded-full px-4 py-2 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-dim)] focus:border-[#C6F24E]/40 focus:outline-none font-mono tnum"
            />
            <span className="text-[var(--th-text-dim)]">—</span>
            <input
              type="number"
              placeholder="Max $"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              data-testid="tx-max-amount-input"
              className="w-24 bg-[var(--th-subtle)] border border-[var(--th-border)] rounded-full px-4 py-2 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-dim)] focus:border-[#C6F24E]/40 focus:outline-none font-mono tnum"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 text-xs text-[var(--th-text-secondary)]">
            <Filter className="w-3.5 h-3.5" />
            <span>{items.length} matching</span>
          </div>
        </div>
      </Panel>

      {/* Full width table */}
      <Panel padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--th-border)]">
                {["Transaction", "Amount", "Merchant", "Risk", "Status", "Time"].map((h) => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-[0.2em] text-[var(--th-text-secondary)] font-bold py-4 px-5 first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((tx) => (
                <tr
                  key={tx.tx_id}
                  onClick={() => {
                    setSelectedId(tx.tx_id);
                    setIsModalOpen(true);
                  }}
                  data-testid={`tx-row-${tx.tx_id}`}
                  className={`tx-row cursor-pointer border-b border-[var(--th-border)] transition-colors ${
                    selectedId === tx.tx_id && isModalOpen ? "bg-[#C6F24E]/[0.04]" : "hover:bg-[var(--th-subtle)]"
                  }`}
                >
                  <td className="py-4 px-5 pl-6">
                    <div className="flex items-center gap-3">
                      <img src={tx.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--th-text)]">{tx.cardholder}</p>
                        <p className="text-[10px] text-[var(--th-text-dim)] font-mono tnum">{tx.tx_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 font-mono text-sm text-[var(--th-text)] tnum font-light">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-4 px-5 text-sm text-[var(--th-text-secondary)]">{tx.merchant}</td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1 rounded-full bg-[var(--th-subtle-hover)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${tx.fraud_score * 100}%`,
                            background: tx.fraud_score > 0.5 ? "#FF3B30" : tx.fraud_score > 0.3 ? "#FFB800" : "#C6F24E",
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs text-[var(--th-text-secondary)] tnum">
                        {(tx.fraud_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <StatusPill status={tx.predicted_fraud ? "fraud" : "legitimate"} />
                  </td>
                  <td className="py-4 px-5 text-xs text-[var(--th-text-secondary)] whitespace-nowrap">{timeAgo(tx.timestamp)}</td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr><td colSpan={6} className="text-center py-16 text-[var(--th-text-secondary)] text-sm">No transactions match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {isModalOpen && selected && (
          <div className="fixed inset-0 z-[100] bg-[var(--th-overlay)] backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-[var(--th-surface)] border border-[var(--th-border-strong)] rounded-[24px] overflow-hidden flex flex-col relative max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-[var(--th-border)] shrink-0">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--th-text-secondary)] font-bold mb-1.5">
                    {isCreatingCase ? "Create Case from Transaction" : "Transaction Detail"}
                  </p>
                  <h3 className="font-mono text-lg text-[var(--th-text)] tnum">{selected.tx_id}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={selected.predicted_fraud ? "fraud" : "legitimate"} />
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-9 h-9 rounded-full bg-[var(--th-subtle)] flex items-center justify-center text-[var(--th-text-secondary)] hover:text-[var(--th-text)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!isCreatingCase ? (
                  <>
                    {/* Cardholder Info */}
                    <div className="flex items-center gap-3 pb-6 border-b border-[var(--th-border)]">
                      <img src={selected.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--th-text)] truncate">{selected.cardholder}</p>
                        <p className="text-xs text-[var(--th-text-secondary)] font-mono">
                          {selected.card_brand} {selected.card_last4} · {selected.location}
                        </p>
                      </div>
                    </div>

                    {/* Table Details */}
                    <div className="space-y-3">
                      {[
                        ["Amount", formatCurrency(selected.amount)],
                        ["Merchant", selected.merchant],
                        ["Category", selected.category],
                        ["Location", selected.location],
                        ["Risk score", `${(selected.fraud_score * 100).toFixed(2)}%`],
                        ["Risk level", selected.risk_level],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-xs text-[var(--th-text-secondary)]">{k}</span>
                          <span className="text-sm text-[var(--th-text)] font-medium font-mono tnum">{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Fraud score card */}
                    <div className="p-5 rounded-2xl bg-[var(--th-subtle)] border border-[var(--th-border)]">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--th-text-secondary)] font-bold mb-2">Fraud score</p>
                      <div className="flex items-baseline gap-2">
                        <p className="font-mono text-3xl font-light text-[var(--th-text)] tnum">
                          {(selected.fraud_score * 100).toFixed(1)}
                        </p>
                        <span className="text-sm text-[var(--th-text-secondary)]">%</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-[var(--th-subtle)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${selected.fraud_score * 100}%`,
                            background: selected.fraud_score > 0.5 ? "#FF3B30" : selected.fraud_score > 0.3 ? "#FFB800" : "#C6F24E",
                          }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Case creation form */
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--th-text-secondary)] font-bold">Case Title</label>
                      <input
                        type="text"
                        value={caseTitle}
                        onChange={(e) => setCaseTitle(e.target.value)}
                        className="w-full mt-1.5 bg-[var(--th-subtle)] border border-[var(--th-border-strong)] rounded-2xl px-4 py-3 text-sm text-[var(--th-text)] focus:border-[#C6F24E]/50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--th-text-secondary)] font-bold">Description</label>
                      <textarea
                        value={caseDescription}
                        onChange={(e) => setCaseDescription(e.target.value)}
                        rows={3}
                        className="w-full mt-1.5 bg-[var(--th-subtle)] border border-[var(--th-border-strong)] rounded-2xl px-4 py-3 text-sm text-[var(--th-text)] focus:border-[#C6F24E]/50 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--th-text-secondary)] font-bold">Priority</label>
                        <select
                          value={casePriority}
                          onChange={(e) => setCasePriority(e.target.value as any)}
                          className="w-full mt-1.5 bg-[var(--th-subtle)] border border-[var(--th-border-strong)] rounded-2xl px-4 py-3 text-sm text-[var(--th-text)] focus:border-[#C6F24E]/50 focus:outline-none"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--th-text-secondary)] font-bold">Amount</label>
                        <div className="w-full mt-1.5 bg-[var(--th-subtle)] border border-[var(--th-border-strong)] rounded-2xl px-4 py-3 text-sm text-[var(--th-text-secondary)] font-mono">
                          {formatCurrency(selected.amount)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--th-text-secondary)] font-bold">Initial Investigation Note</label>
                      <textarea
                        value={caseNote}
                        onChange={(e) => setCaseNote(e.target.value)}
                        placeholder="Add investigation notes, reasons for flag, or action items..."
                        rows={3}
                        className="w-full mt-1.5 bg-[var(--th-subtle)] border border-[var(--th-border-strong)] rounded-2xl px-4 py-3 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-dim)] focus:border-[#C6F24E]/50 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-[var(--th-border)] flex gap-2 justify-end shrink-0">
                {!isCreatingCase ? (
                  <>
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                      Close
                    </Button>
                    <Button variant="primary" onClick={() => setIsCreatingCase(true)}>
                      <Plus className="w-4 h-4" strokeWidth={2.5} /> Create case
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => setIsCreatingCase(false)}>
                      Back
                    </Button>
                    <Button variant="primary" onClick={submitCase} disabled={submittingCase}>
                      {submittingCase ? "Creating..." : "Confirm & Open Case"}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
