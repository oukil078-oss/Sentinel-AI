import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Sliders, Shield, MapPin, Clock, Store, DollarSign, Trash2 } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { PageHeader, Panel, Button, StatusPill } from "../components/ui";
import { formatNumber } from "../lib/utils";
import { useToast } from "../components/Toast";

const TYPE_ICONS: Record<string, any> = {
  amount: DollarSign, velocity: Clock, geo: MapPin, time: Clock, merchant: Store,
};

export function RulesPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", rule_type: "amount" as const,
    condition: "", threshold: 0, action: "flag" as const, severity: "medium" as const, active: true,
  });

  const load = async () => {
    try {
      const { data } = await api.get("/api/rules");
      setItems(data.items);
    } catch (err: any) { toast(formatApiError(err), "error"); }
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (r: any) => {
    try {
      await api.patch(`/api/rules/${r.id}`, { active: !r.active });
      load();
      toast(`Rule ${!r.active ? "activated" : "paused"}`, "success");
    } catch (err: any) { toast(formatApiError(err), "error"); }
  };

  const removeRule = async (id: string) => {
    try { await api.delete(`/api/rules/${id}`); load(); toast("Rule deleted", "success"); }
    catch (err: any) { toast(formatApiError(err), "error"); }
  };

  const createRule = async () => {
    try {
      await api.post("/api/rules", form);
      setModalOpen(false);
      setForm({ name: "", description: "", rule_type: "amount", condition: "", threshold: 0, action: "flag", severity: "medium", active: true });
      load();
      toast("Rule created", "success");
    } catch (err: any) { toast(formatApiError(err), "error"); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rules engine"
        title="Decision rules"
        subtitle="Layer explainable business rules on top of the ML model. Flag, review, or block in real time."
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)} testid="create-rule-btn">
            <Plus className="w-4 h-4" strokeWidth={2.5} /> New rule
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((r) => {
          const Icon = TYPE_ICONS[r.rule_type] || Sliders;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              data-testid={`rule-card-${r.name.replace(/\s/g, "-")}`}
            >
              <Panel>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#C6F24E]/10 flex items-center justify-center text-[#C6F24E]">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold">{r.rule_type}</p>
                      <h3 className="text-sm font-semibold text-white">{r.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={r.severity} />
                  </div>
                </div>

                <p className="text-xs text-[#8A8A93] leading-relaxed mb-4 min-h-[36px]">{r.description}</p>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#5A5A63] font-bold mb-1">Condition</p>
                  <code className="text-xs font-mono text-[#C6F24E]">{r.condition}</code>
                </div>

                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="text-[#8A8A93]">Action: <span className="text-white font-semibold capitalize">{r.action}</span></span>
                  <span className="text-[#8A8A93]">Hits: <span className="font-mono text-white tnum font-semibold">{formatNumber(r.hits || 0)}</span></span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={r.active ? "primary" : "secondary"}
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleActive(r)}
                    testid={`rule-toggle-${r.name.replace(/\s/g, "-")}`}
                  >
                    {r.active ? "● Active" : "○ Paused"}
                  </Button>
                  <button
                    onClick={() => removeRule(r.id)}
                    data-testid={`rule-delete-${r.name.replace(/\s/g, "-")}`}
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#8A8A93] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 hover:border-[#FF3B30]/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                </div>
              </Panel>
            </motion.div>
          );
        })}
      </div>

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-[#151518] border border-white/10 rounded-[24px] p-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#C6F24E] font-bold mb-1.5">New rule</p>
                <h2 className="font-display text-2xl text-white font-medium">Create a detection rule</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold">Name</label>
                <input
                  type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="new-rule-name"
                  className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-[#C6F24E]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold">Description</label>
                <input
                  type="text" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  data-testid="new-rule-desc"
                  className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-[#C6F24E]/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold">Type</label>
                  <select
                    value={form.rule_type}
                    onChange={(e) => setForm({ ...form, rule_type: e.target.value as any })}
                    className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-[#C6F24E]/50 focus:outline-none"
                  >
                    {["amount", "velocity", "geo", "time", "merchant"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold">Action</label>
                  <select
                    value={form.action}
                    onChange={(e) => setForm({ ...form, action: e.target.value as any })}
                    className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-[#C6F24E]/50 focus:outline-none"
                  >
                    {["flag", "review", "block"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold">Condition</label>
                  <input
                    type="text" value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    placeholder="e.g. amount > 5000"
                    className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:border-[#C6F24E]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold">Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value as any })}
                    className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-[#C6F24E]/50 focus:outline-none"
                  >
                    {["low", "medium", "high", "critical"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-8">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={createRule} testid="submit-rule-btn">Create rule</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
