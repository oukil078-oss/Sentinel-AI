import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie,
} from "recharts";
import { Database, TrendingDown, TrendingUp, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { api, formatApiError } from "../lib/api";
import { PageHeader, Panel } from "../components/ui";
import { useToast } from "../components/Toast";
import { formatNumber } from "../lib/utils";

export function DataAnalysisPage() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/api/ml/metrics").then((r) => setData(r.data)).catch((e) => toast(formatApiError(e), "error"));
  }, []);

  const total = (data?.class_distribution || []).reduce((s: number, c: any) => s + c.value, 0);
  const fraudCount = (data?.class_distribution || []).find((c: any) => c.name === "Fraudulent")?.value || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exploratory data analysis"
        title="Dataset at a glance"
        subtitle="The Kaggle creditcardfraud dataset — 30K transactions sampled from 284K European card transactions — is notoriously imbalanced."
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Transactions", value: formatNumber(total), icon: Database, color: "#C6F24E" },
          { label: "Fraud cases", value: formatNumber(fraudCount), icon: TrendingDown, color: "#FF3B30" },
          { label: "Fraud rate", value: `${total ? ((fraudCount / total) * 100).toFixed(2) : 0}%`, icon: TrendingUp, color: "#FFB800" },
          { label: "Features", value: "30", icon: Layers, color: "#5AC8FA" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <Panel padding="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}18`, color: k.color }}>
                  <k.icon className="w-4 h-4" strokeWidth={2} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#5A5A63] font-bold">V1–V28 PCA</span>
              </div>
              <p className="font-mono text-3xl text-white tnum font-light">{k.value}</p>
              <p className="text-xs text-[#8A8A93] mt-1">{k.label}</p>
            </Panel>
          </motion.div>
        ))}
      </div>

      {/* Class distribution + Correlations */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <Panel className="lg:col-span-2">
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8A8A93] font-bold mb-1">Imbalance problem</p>
            <h3 className="font-display text-xl text-white font-medium">Class distribution</h3>
          </div>
          <div className="h-[280px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.class_distribution || []}
                  dataKey="value" nameKey="name"
                  innerRadius={70} outerRadius={110}
                  paddingAngle={2} strokeWidth={0}
                >
                  {(data?.class_distribution || []).map((c: any, i: number) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="font-mono text-3xl text-white tnum font-light">{((fraudCount / total) * 100).toFixed(2)}%</p>
              <p className="text-xs text-[#8A8A93] uppercase tracking-wider font-bold">Fraud rate</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs">
            {(data?.class_distribution || []).map((c: any) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                <span className="text-[#8A8A93]">{c.name}</span>
                <span className="font-mono text-white tnum font-semibold">{formatNumber(c.value)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-3">
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8A8A93] font-bold mb-1">Feature × Class</p>
            <h3 className="font-display text-xl text-white font-medium">Correlation with fraud label</h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.correlations || []} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="#5A5A63" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="feature" type="category" stroke="#8A8A93" fontSize={11} tickLine={false} axisLine={false} width={50} />
                <Tooltip />
                <Bar dataKey="correlation" radius={[0, 8, 8, 0]}>
                  {(data?.correlations || []).map((c: any, i: number) => (
                    <Cell key={i} fill={c.correlation < 0 ? "#FF3B30" : "#C6F24E"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Feature importance + Amount distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <Panel className="lg:col-span-3">
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8A8A93] font-bold mb-1">Random Forest</p>
            <h3 className="font-display text-xl text-white font-medium">Feature importance (top 15)</h3>
          </div>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.feature_importance || []} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="#5A5A63" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="feature" type="category" stroke="#8A8A93" fontSize={11} tickLine={false} axisLine={false} width={60} />
                <Tooltip />
                <Bar dataKey="importance" fill="#C6F24E" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8A8A93] font-bold mb-1">Right-skewed</p>
            <h3 className="font-display text-xl text-white font-medium">Amount distribution</h3>
          </div>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.amount_distribution || []}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="range" stroke="#8A8A93" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5A5A63" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#5AC8FA" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
