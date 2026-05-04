import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, User, Sparkles, FileText, FolderOpen, LogIn, LogOut, Settings } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { PageHeader, Panel } from "../components/ui";
import { useToast } from "../components/Toast";
import { timeAgo } from "../lib/utils";

const ACTION_ICONS: Record<string, any> = {
  login: LogIn, logout: LogOut, predict: Sparkles,
  create_case: FolderOpen, update_case: FileText,
  create_rule: Settings, retrain_models: Activity,
};

const ACTION_COLORS: Record<string, string> = {
  login: "#5AC8FA", logout: "#8A8A93", predict: "#C6F24E",
  create_case: "#FFB800", update_case: "#FFB800",
  create_rule: "#9D7FFF", retrain_models: "#FF8A00",
};

export function AuditPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/audit?limit=100").then((r) => setItems(r.data.items)).catch((e) => toast(formatApiError(e), "error"));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit trail"
        title="System activity log"
        subtitle="Every analyst action — logins, predictions, case updates, rule changes — timestamped and immutable."
      />

      <Panel padding="p-0">
        <div className="divide-y divide-white/5">
          {items.map((e, i) => {
            const Icon = ACTION_ICONS[e.action] || Activity;
            const color = ACTION_COLORS[e.action] || "#8A8A93";
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.015 }}
                className="flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors"
                data-testid={`audit-${e.id}`}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `${color}18`, color }}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white capitalize">{e.action.replace(/_/g, " ")}</span>
                    {e.target && <span className="font-mono text-xs text-[#8A8A93] tnum">· {e.target}</span>}
                  </div>
                  <p className="text-xs text-[#8A8A93]">
                    <span className="text-white font-medium">{e.actor}</span>
                    {e.ip && <span> · from {e.ip}</span>}
                  </p>
                </div>
                <span className="text-xs text-[#5A5A63] whitespace-nowrap font-mono tnum">
                  {timeAgo(e.created_at)}
                </span>
              </motion.div>
            );
          })}
          {items.length === 0 && (
            <p className="text-center text-[#8A8A93] py-16 text-sm">No activity recorded yet</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
