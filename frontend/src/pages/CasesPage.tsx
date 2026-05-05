import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, MessageSquare, ArrowUpRight, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { PageHeader, Panel, Button, StatusPill, Chip } from "../components/ui";
import { formatCurrency, timeAgo, cn } from "../lib/utils";
import { useToast } from "../components/Toast";

const STATUSES = ["new", "in_review", "escalated", "resolved", "false_positive"] as const;

export function CasesPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<any>(null);
  const [note, setNote] = useState("");

  const load = async () => {
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const { data } = await api.get("/api/cases", { params });
      setItems(data.items);
      if (!selected && data.items.length) setSelected(data.items[0]);
    } catch (err: any) { toast(formatApiError(err), "error"); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (caseId: string, status: string) => {
    try {
      const { data } = await api.patch(`/api/cases/${caseId}`, { status });
      setSelected(data);
      load();
      toast(`Case moved to ${status.replace("_", " ")}`, "success");
    } catch (err: any) { toast(formatApiError(err), "error"); }
  };

  const addNote = async () => {
    if (!note.trim() || !selected) return;
    try {
      const { data } = await api.patch(`/api/cases/${selected.id}`, { note });
      setSelected(data);
      setNote("");
      toast("Note added", "success");
    } catch (err: any) { toast(formatApiError(err), "error"); }
  };

  const counts = {
    all: items.length,
    new: items.filter((c) => c.status === "new").length,
    in_review: items.filter((c) => c.status === "in_review").length,
    escalated: items.filter((c) => c.status === "escalated").length,
    resolved: items.filter((c) => c.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Case management"
        title="Fraud alert queue"
        subtitle="Every case auto-generated from high-confidence fraud predictions. Triage, assign, and resolve in one place."
      />

      <Panel padding="p-5">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-white/5 rounded-full w-fit">
          {[
            { k: "all", label: `All (${counts.all})` },
            { k: "new", label: `New (${counts.new})` },
            { k: "in_review", label: `In review (${counts.in_review})` },
            { k: "escalated", label: `Escalated (${counts.escalated})` },
            { k: "resolved", label: `Resolved (${counts.resolved})` },
          ].map((t) => (
            <Chip
              key={t.k}
              active={statusFilter === t.k}
              onClick={() => setStatusFilter(t.k)}
              testid={`case-filter-${t.k}`}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* List */}
        <div className="xl:col-span-2 space-y-3">
          {items.map((c) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelected(c)}
              data-testid={`case-card-${c.case_id}`}
              className={`w-full text-left rounded-[20px] p-5 border transition-all ${
                selected?.id === c.id
                  ? "bg-[#C6F24E]/[0.06] border-[#C6F24E]/30"
                  : "bg-[#151518] border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <StatusPill status={c.status} />
                <StatusPill status={c.priority} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{c.title}</h3>
              <p className="text-[10px] font-mono text-[#5A5A63] tnum mb-3">{c.case_id}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8A8A93]">{timeAgo(c.created_at)}</span>
                <span className="font-mono text-sm text-white tnum font-light">{formatCurrency(c.amount)}</span>
              </div>
            </motion.button>
          ))}
          {items.length === 0 && (
            <Panel><p className="text-center text-[#8A8A93] py-10 text-sm">No cases match this filter</p></Panel>
          )}
        </div>

        {/* Detail — WHITE for split-feel like home */}
        <div className="xl:col-span-3">
          {selected ? (
            <Panel light className="!text-[#0B0B0D]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <StatusPill status={selected.status} />
                    <StatusPill status={selected.priority} />
                  </div>
                  <h2 className="font-display text-2xl text-[#0B0B0D] font-medium mb-2 text-balance">{selected.title}</h2>
                  <p className="text-xs font-mono text-[#5A5A63] tnum">{selected.case_id} · assigned to {selected.assignee}</p>
                </div>
              </div>

              <p className="text-sm text-[#5A5A63] leading-relaxed mb-6 pb-6 border-b border-black/5">
                {selected.description}
              </p>

              {/* nested DARK metric strip — like reference image */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-[#0B0B0D]">
                {[
                  ["Amount", formatCurrency(selected.amount)],
                  ["Risk score", `${(selected.risk_score * 100).toFixed(1)}%`],
                  ["TX ID", selected.tx_id],
                  ["Created", timeAgo(selected.created_at)],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold">{k}</p>
                    <p className="text-sm font-mono text-white mt-1 tnum truncate">{v as any}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <p className="text-xs text-[#5A5A63] mr-2">Move to:</p>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    data-testid={`case-action-${s}`}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all",
                      selected.status === s
                        ? "bg-[#C6F24E] text-[#0B0B0D] shadow-[0_4px_20px_rgba(198,242,78,0.35)]"
                        : "bg-black/5 text-[#5A5A63] hover:bg-[#0B0B0D] hover:text-white"
                    )}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>

              {/* Notes */}
              <div className="border-t border-black/5 pt-6">
                <h4 className="font-semibold text-[#0B0B0D] mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#9FC63B]" strokeWidth={2} />
                  Analyst notes ({selected.notes?.length || 0})
                </h4>
                <div className="space-y-3 mb-4 max-h-[240px] overflow-y-auto">
                  {(selected.notes || []).map((n: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-black/[0.03] border border-black/5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-[#0B0B0D]">{n.author}</span>
                        <span className="text-[10px] text-[#8A8A93]">{timeAgo(n.created_at)}</span>
                      </div>
                      <p className="text-sm text-[#5A5A63] leading-relaxed">{n.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add an investigation note..."
                    data-testid="case-note-input"
                    className="flex-1 bg-black/[0.03] border border-black/10 rounded-full px-5 py-2.5 text-sm text-[#0B0B0D] placeholder:text-[#8A8A93] focus:border-[#9FC63B]/50 focus:outline-none"
                    onKeyDown={(e) => e.key === "Enter" && addNote()}
                  />
                  <Button variant="primary" onClick={addNote} testid="add-note-btn">
                    Add note
                  </Button>
                </div>
              </div>
            </Panel>
          ) : (
            <Panel><p className="text-center text-[#8A8A93] py-16">Select a case to review</p></Panel>
          )}
        </div>
      </div>
    </div>
  );
}
