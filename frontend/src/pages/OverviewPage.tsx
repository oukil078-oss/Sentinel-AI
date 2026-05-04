import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight, TrendingUp, ShieldCheck, AlertTriangle, Activity,
  Clock, Sparkles, Plus, DollarSign,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, LineChart, Line, CartesianGrid,
} from "recharts";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Panel, Button, StatusPill } from "../components/ui";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { formatCurrency, formatNumber, timeAgo } from "../lib/utils";
import { cn } from "../lib/utils";

const AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&q=70",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&q=70",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&q=70",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&q=70",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&q=70",
];

export function OverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<"all" | "fraud" | "legit">("all");

  useEffect(() => {
    api.get("/api/dashboard/stats").then((r) => setStats(r.data));
    api.get("/api/live/feed?limit=12").then((r) => setFeed(r.data.items));
    const id = setInterval(() => {
      api.get("/api/live/feed?limit=12").then((r) => setFeed(r.data.items));
    }, 12000);
    return () => clearInterval(id);
  }, []);

  const filteredFeed = feed.filter((t) => {
    if (selectedTab === "fraud") return t.predicted_fraud;
    if (selectedTab === "legit") return !t.predicted_fraud;
    return true;
  }).slice(0, 6);

  const hourly = stats?.hourly_series || [];
  const avatarGroup1 = AVATARS.slice(0, 3);
  const avatarGroup2 = AVATARS.slice(2, 5);

  return (
    <div className="space-y-6">
      {/* ============= HEADER ============= */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#C6F24E] font-bold mb-3">
            Fraud operations / {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-light text-white tracking-[-0.03em] leading-[0.95]">
            Hello, <span className="text-[#C6F24E]">{user?.name?.split(" ")[0] || "Analyst"}</span>.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => navigate("/cases")} testid="create-case-btn">
            <Plus className="w-4 h-4" strokeWidth={2.2} />
            New case
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate("/prediction")} testid="run-prediction-btn">
            <Sparkles className="w-4 h-4" strokeWidth={2.2} />
            Run prediction
          </Button>
        </div>
      </div>

      {/* ============= KPI HERO ROW (2 big cards like reference) ============= */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* LEFT: Main dark hero card with KPIs */}
        <Panel className="lg:col-span-3 p-7 sm:p-9" padding="">
          <div className="flex items-start justify-between mb-10">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#8A8A93] font-bold mb-2">
                Fraud prevented · Last 72h
              </p>
              <h2 className="font-mono font-light text-5xl sm:text-6xl text-white tnum tracking-tight">
                <AnimatedCounter
                  value={stats?.amount_saved || 0}
                  prefix="$"
                  decimals={0}
                />
              </h2>
              <p className="mt-2 text-sm text-[#8A8A93]">
                Across <span className="text-white font-semibold">{formatNumber(stats?.fraud_detected || 0)}</span> flagged transactions.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C6F24E]/10 border border-[#C6F24E]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6F24E] pulse-dot" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C6F24E] font-bold">Live</span>
            </div>
          </div>

          {/* mini progress bars with avatars (mimics reference) */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8A8A93] font-medium">Total tx</span>
                <span className="font-mono text-[13px] text-white tnum font-light">
                  {formatNumber(stats?.total_transactions || 0)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "78%" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full bg-[#C6F24E] rounded-full shadow-[0_0_10px_rgba(198,242,78,0.4)]"
                />
              </div>
              <div className="mt-3 flex -space-x-2">
                {avatarGroup1.map((a, i) => (
                  <img key={i} src={a} alt="" className="w-7 h-7 rounded-full border-2 border-[#151518] object-cover" />
                ))}
                <div className="w-7 h-7 rounded-full border-2 border-[#151518] bg-white/10 flex items-center justify-center text-[9px] text-white font-bold">
                  +{Math.max(0, (stats?.total_transactions || 0) - 3)}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#8A8A93] font-medium">Fraud rate</span>
                <span className="font-mono text-[13px] text-white tnum font-light">
                  {(stats?.fraud_rate || 0).toFixed(2)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (stats?.fraud_rate || 0) * 10)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                  className="h-full bg-[#FF3B30] rounded-full"
                />
              </div>
              <div className="mt-3 flex -space-x-2">
                {avatarGroup2.map((a, i) => (
                  <img key={i} src={a} alt="" className="w-7 h-7 rounded-full border-2 border-[#151518] object-cover" />
                ))}
              </div>
            </div>
          </div>
        </Panel>

        {/* RIGHT: Best model card (mimics payment method card from reference) */}
        <Panel className="lg:col-span-2 p-7 sm:p-9 relative" padding="">
          <div className="flex items-start justify-between mb-7">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#8A8A93] font-bold mb-2">
                Best model in prod
              </p>
              <h2 className="font-mono font-light text-4xl text-white tnum tracking-tight">
                {stats?.best_model?.accuracy
                  ? (stats.best_model.accuracy * 100).toFixed(2) + "%"
                  : "—"}
              </h2>
              <p className="mt-1 text-xs text-[#8A8A93]">Accuracy on hold-out set</p>
            </div>
            <button
              onClick={() => navigate("/evaluation")}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#C6F24E] hover:text-[#0B0B0D] hover:border-[#C6F24E] transition-all"
              data-testid="view-models-btn"
            >
              <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* Model chips */}
          <div className="flex items-end gap-2.5 mb-5">
            {["KNN", "LR", "DT", "SVM"].map((m) => (
              <div key={m} className="flex-1 bg-white/5 rounded-2xl p-3 text-center border border-white/5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold">{m}</p>
                <p className="font-mono text-sm text-white mt-1 tnum font-light">
                  {m === "KNN" ? "99.9%" : m === "LR" ? "97.5%" : m === "DT" ? "99.9%" : "99.9%"}
                </p>
              </div>
            ))}
            <div className="flex-1 bg-[#C6F24E] rounded-2xl p-3 text-center shadow-[0_0_24px_rgba(198,242,78,0.35)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#0B0B0D]/70 font-bold">RF</p>
              <p className="font-mono text-sm text-[#0B0B0D] mt-1 tnum font-semibold">
                {stats?.best_model?.accuracy ? (stats.best_model.accuracy * 100).toFixed(1) : "99.9"}%
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full !bg-white !text-[#0B0B0D] !border-none hover:!bg-[#F0F0F0] font-semibold"
            onClick={() => navigate("/prediction")}
            testid="run-prediction-card-btn"
          >
            Run prediction now
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
          </Button>
        </Panel>
      </div>

      {/* ============= SECONDARY KPI GRID ============= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: "Total volume", value: stats?.total_amount || 0, prefix: "$", color: "#C6F24E", decimals: 0 },
          { icon: AlertTriangle, label: "Fraud detected", value: stats?.fraud_detected || 0, color: "#FF3B30" },
          { icon: ShieldCheck, label: "Cases resolved", value: stats?.cases?.resolved || 0, color: "#C6F24E" },
          { icon: Activity, label: "New cases", value: stats?.cases?.new || 0, color: "#5AC8FA" },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Panel padding="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center")}
                     style={{ background: `${kpi.color}18`, color: kpi.color }}>
                  <kpi.icon className="w-4 h-4" strokeWidth={2} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#5A5A63] font-bold">72h</span>
              </div>
              <p className="font-mono text-3xl text-white tnum font-light tracking-tight">
                <AnimatedCounter value={kpi.value} prefix={kpi.prefix || ""} decimals={kpi.decimals ?? 0} />
              </p>
              <p className="text-xs text-[#8A8A93] mt-1.5">{kpi.label}</p>
            </Panel>
          </motion.div>
        ))}
      </div>

      {/* ============= CHART + CASES ============= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel className="lg:col-span-2 p-6" padding="">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#8A8A93] font-bold mb-1.5">
                Last 24h activity
              </p>
              <h3 className="font-display text-xl text-white font-medium">Fraud vs total by hour</h3>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C6F24E]" /> <span className="text-[#8A8A93]">Total</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF3B30]" /> <span className="text-[#8A8A93]">Fraud</span></span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly}>
                <defs>
                  <linearGradient id="g-total" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C6F24E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#C6F24E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-fraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF3B30" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FF3B30" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="hour" stroke="#5A5A63" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#5A5A63" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#C6F24E" strokeWidth={2} fill="url(#g-total)" />
                <Area type="monotone" dataKey="fraud" stroke="#FF3B30" strokeWidth={2} fill="url(#g-fraud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#8A8A93] font-bold mb-1.5">Cases queue</p>
              <h3 className="font-display text-xl text-white font-medium">Open alerts</h3>
            </div>
            <button
              onClick={() => navigate("/cases")}
              data-testid="view-all-cases-btn"
              className="text-[#C6F24E] text-xs font-semibold hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {[
              { label: "New", count: stats?.cases?.new || 0, color: "#5AC8FA" },
              { label: "In review", count: stats?.cases?.in_review || 0, color: "#FFB800" },
              { label: "Resolved", count: stats?.cases?.resolved || 0, color: "#C6F24E" },
            ].map((c) => (
              <div key={c.label} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-sm text-white font-medium">{c.label}</span>
                </div>
                <span className="font-mono font-light text-2xl text-white tnum">
                  {formatNumber(c.count)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ============= SPLIT: LIGHT/DARK FEED (matches reference) ============= */}
      <Panel light padding="p-0" className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT: light side with recent list */}
          <div className="p-7 sm:p-8 lg:p-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#5A5A63] font-bold mb-1.5">Live feed</p>
                <h3 className="font-display text-2xl sm:text-3xl text-[#0B0B0D] font-medium">Recent transactions</h3>
              </div>
              <button
                onClick={() => navigate("/transactions")}
                className="w-9 h-9 rounded-full border border-[#0B0B0D]/10 flex items-center justify-center text-[#0B0B0D] hover:bg-[#0B0B0D] hover:text-white transition-all"
                data-testid="view-all-transactions-btn"
              >
                <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            {/* Segmented filter (mirrors reference exact look) */}
            <div className="flex items-center gap-1 p-1 bg-[#F1F1F3] rounded-full w-fit mb-6">
              {[
                { k: "all", label: "All" },
                { k: "legit", label: "Legit" },
                { k: "fraud", label: "Fraud" },
              ].map((t) => (
                <button
                  key={t.k}
                  onClick={() => setSelectedTab(t.k as any)}
                  data-testid={`feed-filter-${t.k}`}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                    selectedTab === t.k
                      ? "bg-[#C6F24E] text-[#0B0B0D] shadow-[0_0_20px_rgba(198,242,78,0.3)]"
                      : "text-[#8A8A93] hover:text-[#0B0B0D]"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredFeed.map((tx) => (
                <motion.div
                  key={tx.tx_id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => navigate("/transactions")}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-[#0B0B0D]/[0.03] cursor-pointer transition-colors group"
                  data-testid={`feed-tx-${tx.tx_id}`}
                >
                  <img
                    src={tx.avatar || AVATARS[0]}
                    alt={tx.cardholder}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0B0B0D] truncate">{tx.merchant}</p>
                    <p className="text-xs text-[#8A8A93] truncate">{tx.cardholder} · {timeAgo(tx.timestamp)}</p>
                  </div>
                  <StatusPill status={tx.predicted_fraud ? "fraud" : "legitimate"} />
                  <p className="font-mono text-base text-[#0B0B0D] font-medium tnum min-w-[80px] text-right">
                    {formatCurrency(tx.amount)}
                  </p>
                </motion.div>
              ))}
              {filteredFeed.length === 0 && (
                <p className="text-center text-[#8A8A93] py-10 text-sm">No transactions in this filter</p>
              )}
            </div>
          </div>

          {/* RIGHT: nested dark card */}
          <div className="p-5 lg:p-8 bg-white flex items-stretch">
            <div className="flex-1 rounded-[24px] bg-[#0B0B0D] p-7 sm:p-8 text-white flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#8A8A93] font-bold mb-1">Today's top alert</p>
                  <h4 className="font-display text-2xl font-light text-white">Critical review</h4>
                </div>
                <StatusPill status="critical" />
              </div>

              {filteredFeed.find((t) => t.predicted_fraud) && (() => {
                const tx = filteredFeed.find((t) => t.predicted_fraud)!;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <img src={tx.avatar || AVATARS[0]} alt="" className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-white">{tx.cardholder}</p>
                        <p className="text-xs text-[#8A8A93] font-mono">{tx.card_brand} {tx.card_last4}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {[
                        { l: "Amount", v: formatCurrency(tx.amount) },
                        { l: "Merchant", v: tx.merchant },
                        { l: "Risk", v: `${(tx.fraud_score * 100).toFixed(0)}%` },
                      ].map((s) => (
                        <div key={s.l} className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold">{s.l}</p>
                          <p className="font-mono text-sm text-white mt-1 tnum truncate">{s.v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center gap-2">
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={() => navigate("/cases")}
                        testid="open-case-btn"
                      >
                        Open case
                        <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                      </Button>
                      <Button variant="secondary" onClick={() => navigate("/transactions")}>
                        Details
                      </Button>
                    </div>
                  </>
                );
              })()}

              {!filteredFeed.find((t) => t.predicted_fraud) && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <ShieldCheck className="w-10 h-10 text-[#C6F24E] mb-4" strokeWidth={1.5} />
                  <p className="text-sm text-[#8A8A93]">No critical alerts right now</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
