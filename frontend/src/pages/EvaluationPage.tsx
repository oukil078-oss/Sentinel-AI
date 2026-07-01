import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";
import { api, formatApiError } from "../lib/api";
import { PageHeader, Panel } from "../components/ui";
import { useToast } from "../components/Toast";

const MODEL_COLORS: Record<string, string> = {
  random_forest: "#C6F24E",
  knn: "#5AC8FA",
  logistic_regression: "#FFB800",
  decision_tree: "#FF8A00",
  svm: "#9D7FFF",
};

const MODEL_NAMES: Record<string, string> = {
  random_forest: "Random Forest",
  knn: "KNN",
  logistic_regression: "Logistic Reg.",
  decision_tree: "Decision Tree",
  svm: "SVM",
};

export function EvaluationPage() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/api/ml/metrics")
      .then((r) => setData(r.data))
      .catch((err) => toast(formatApiError(err), "error"));
  }, []);

  // Build unified ROC data
  const rocSeries: any[] = [];
  if (data?.roc_curves) {
    Object.entries(data.roc_curves).forEach(([model, pts]: any) => {
      pts.forEach((p: any) => {
        const existing = rocSeries.find((s) => s.fpr === p.fpr);
        if (existing) existing[model] = p.tpr;
        else rocSeries.push({ fpr: p.fpr, [model]: p.tpr });
      });
    });
    rocSeries.sort((a, b) => a.fpr - b.fpr);
  }

  // PR Curves
  const prSeries: any[] = [];
  if (data?.pr_curves) {
    Object.entries(data.pr_curves).forEach(([model, pts]: any) => {
      pts.forEach((p: any) => {
        const existing = prSeries.find((s) => s.recall === p.recall);
        if (existing) existing[model] = p.precision;
        else prSeries.push({ recall: p.recall, [model]: p.precision });
      });
    });
    prSeries.sort((a, b) => a.recall - b.recall);
  }

  // Radar data
  const radarData = data?.metrics ? [
    "accuracy", "precision", "recall", "f1", "roc_auc", "pr_auc",
  ].map((metric) => {
    const row: any = { metric: metric.replace("_", "-").toUpperCase() };
    Object.entries(data.metrics).forEach(([k, v]: any) => {
      row[k] = v[metric] * 100;
    });
    return row;
  }) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Model evaluation"
        title="Side-by-side comparison"
        subtitle="ROC curves, precision-recall, threshold sweep, and radar — the truth about which model wins, on actual hold-out data."
      />

      {/* ROC + PR */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Panel>
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--th-text-secondary)] font-bold mb-1">ROC curves</p>
            <h3 className="font-display text-xl text-[var(--th-text)] font-medium">True positive rate vs False positive rate</h3>
          </div>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocSeries}>
                <CartesianGrid stroke="var(--th-chart-grid)" />
                <XAxis dataKey="fpr" stroke="var(--th-chart-axis)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} type="number" />
                <YAxis stroke="var(--th-chart-axis)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} />
                <Tooltip />
                <Legend />
                {Object.keys(MODEL_COLORS).map((m) => (
                  <Line key={m} type="monotone" dataKey={m} stroke={MODEL_COLORS[m]} strokeWidth={2} dot={false} name={MODEL_NAMES[m]} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--th-text-secondary)] font-bold mb-1">Precision-Recall curves</p>
            <h3 className="font-display text-xl text-[var(--th-text)] font-medium">Better for imbalanced fraud data</h3>
          </div>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prSeries}>
                <CartesianGrid stroke="var(--th-chart-grid)" />
                <XAxis dataKey="recall" stroke="var(--th-chart-axis)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} type="number" />
                <YAxis stroke="var(--th-chart-axis)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} />
                <Tooltip />
                <Legend />
                {Object.keys(MODEL_COLORS).map((m) => (
                  <Line key={m} type="monotone" dataKey={m} stroke={MODEL_COLORS[m]} strokeWidth={2} dot={false} name={MODEL_NAMES[m]} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Radar comparison */}
      <Panel>
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--th-text-secondary)] font-bold mb-1">Unified view</p>
          <h3 className="font-display text-xl text-[var(--th-text)] font-medium">Performance radar across 6 metrics</h3>
        </div>
        <div className="h-[440px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--th-chart-grid)" />
              <PolarAngleAxis dataKey="metric" stroke="var(--th-text-secondary)" fontSize={11} />
              <PolarRadiusAxis stroke="var(--th-chart-axis)" fontSize={9} />
              <Tooltip />
              <Legend />
              {Object.keys(MODEL_COLORS).map((m) => (
                <Radar key={m} name={MODEL_NAMES[m]} dataKey={m} stroke={MODEL_COLORS[m]} fill={MODEL_COLORS[m]} fillOpacity={0.12} strokeWidth={2} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Threshold sweep */}
      <Panel>
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--th-text-secondary)] font-bold mb-1">Threshold tuning</p>
          <h3 className="font-display text-xl text-[var(--th-text)] font-medium">Precision / Recall / F1 vs classification threshold (RF)</h3>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.threshold_data || []}>
              <CartesianGrid stroke="var(--th-chart-grid)" />
              <XAxis dataKey="threshold" stroke="var(--th-chart-axis)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--th-chart-axis)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="precision" stroke="#C6F24E" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="recall" stroke="#5AC8FA" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="f1" stroke="#FFB800" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
