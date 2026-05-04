import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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

  const createCaseFromTx = async (tx: any) => {
    try {
      await api.post("/api/cases", {
        tx_id: tx.tx_id,
        title: `Suspicious ${formatCurrency(tx.amount)} charge at ${tx.merchant}`,
        description: `Transaction flagged with ${(tx.fraud_score * 100).toFixed(1)}% fraud probability. Cardholder: ${tx.cardholder}. Location: ${tx.location}.`,
        amount: tx.amount,
        priority: tx.risk_level === "critical" ? "critical" : tx.risk_level === "high" ? "high" : "medium",
        risk_score: tx.fraud_score,
      });
      toast("Case created successfully", "success");
      navigate("/cases");
    } catch (err: any) {
      toast(formatApiError(err), "error");
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
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full">
            <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")} testid="filter-all">All</Chip>
            <Chip active={statusFilter === "fraud"} onClick={() => setStatusFilter("fraud")} testid="filter-fraud">Fraud</Chip>
            <Chip active={statusFilter === "legitimate"} onClick={() => setStatusFilter("legitimate")} testid="filter-legit">Legit</Chip>
          </div>

          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A63]" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search tx, merchant, cardholder..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              data-testid="tx-search-input"
              className="w-full bg-white/5 border border-white/5 rounded-full pl-10 pr-10 py-2 text-sm text-white placeholder:text-[#5A5A63] focus:border-[#C6F24E]/40 focus:outline-none"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A93] hover:text-white">
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
              className="w-24 bg-white/5 border border-white/5 rounded-full px-4 py-2 text-sm text-white placeholder:text-[#5A5A63] focus:border-[#C6F24E]/40 focus:outline-none font-mono tnum"
            />
            <span className="text-[#5A5A63]">—</span>
            <input
              type="number"
              placeholder="Max $"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              data-testid="tx-max-amount-input"
              className="w-24 bg-white/5 border border-white/5 rounded-full px-4 py-2 text-sm text-white placeholder:text-[#5A5A63] focus:border-[#C6F24E]/40 focus:outline-none font-mono tnum"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 text-xs text-[#8A8A93]">
            <Filter className="w-3.5 h-3.5" />
            <span>{items.length} matching</span>
          </div>
        </div>
      </Panel>

      {/* Split: table + detail */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Transactions table */}
        <Panel padding="p-0" className="xl:col-span-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Transaction", "Amount", "Merchant", "Risk", "Status", "Time"].map((h) => (
                    <th key={h} className="text-left text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold py-4 px-5 first:pl-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((tx) => (
                  <tr
                    key={tx.tx_id}
                    onClick={() => setSelectedId(tx.tx_id)}
                    data-testid={`tx-row-${tx.tx_id}`}
                    className={`tx-row cursor-pointer border-b border-white/5 transition-colors ${
                      selectedId === tx.tx_id ? "bg-[#C6F24E]/[0.04]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="py-4 px-5 pl-6">
                      <div className="flex items-center gap-3">
                        <img src={tx.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-white">{tx.cardholder}</p>
                          <p className="text-[10px] text-[#5A5A63] font-mono tnum">{tx.tx_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono text-sm text-white tnum font-light">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-4 px-5 text-sm text-[#8A8A93]">{tx.merchant}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${tx.fraud_score * 100}%`,
                              background: tx.fraud_score > 0.5 ? "#FF3B30" : tx.fraud_score > 0.3 ? "#FFB800" : "#C6F24E",
                            }}
                          />
                        </div>
                        <span className="font-mono text-xs text-[#8A8A93] tnum">
                          {(tx.fraud_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <StatusPill status={tx.predicted_fraud ? "fraud" : "legitimate"} />
                    </td>
                    <td className="py-4 px-5 text-xs text-[#8A8A93] whitespace-nowrap">{timeAgo(tx.timestamp)}</td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr><td colSpan={6} className="text-center py-16 text-[#8A8A93] text-sm">No transactions match your filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Detail panel */}
        <div className="xl:col-span-1 space-y-5 xl:sticky xl:top-24 xl:self-start">
          {selected ? (
            <Panel>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#8A8A93] font-bold mb-1.5">Transaction detail</p>
                  <h3 className="font-mono text-lg text-white tnum">{selected.tx_id}</h3>
                </div>
                <StatusPill status={selected.predicted_fraud ? "fraud" : "legitimate"} />
              </div>

              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                <img src={selected.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white truncate">{selected.cardholder}</p>
                  <p className="text-xs text-[#8A8A93] font-mono">{selected.card_brand} {selected.card_last4} · {selected.location}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  ["Amount", formatCurrency(selected.amount)],
                  ["Merchant", selected.merchant],
                  ["Category", selected.category],
                  ["Location", selected.location],
                  ["Risk score", `${(selected.fraud_score * 100).toFixed(2)}%`],
                  ["Risk level", selected.risk_level],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex items-center justify-between">
                    <span className="text-xs text-[#8A8A93]">{k}</span>
                    <span className="text-sm text-white font-medium font-mono tnum">{v as any}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold mb-2">Fraud score</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono text-3xl font-light text-white tnum">{(selected.fraud_score * 100).toFixed(1)}</p>
                  <span className="text-sm text-[#8A8A93]">%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${selected.fraud_score * 100}%`,
                      background: selected.fraud_score > 0.5 ? "#FF3B30" : selected.fraud_score > 0.3 ? "#FFB800" : "#C6F24E",
                    }}
                  />
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => createCaseFromTx(selected)}
                testid="create-case-from-tx-btn"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} /> Create case from this tx
              </Button>
            </Panel>
          ) : (
            <Panel>
              <p className="text-center text-[#8A8A93] py-12 text-sm">Select a transaction to inspect</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
