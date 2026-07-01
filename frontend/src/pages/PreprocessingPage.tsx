import { motion } from "framer-motion";
import { Scale, Shuffle, Layers, CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHeader, Panel } from "../components/ui";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";

const BEFORE_AFTER = [
  { stage: "Before SMOTE", legit: 23946, fraud: 54 },
  { stage: "After SMOTE", legit: 23946, fraud: 23946 },
];

export function PreprocessingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preprocessing"
        title="Scaling & SMOTE resampling"
        subtitle="Two critical steps turn raw imbalanced data into a production-ready training set: Standard Scaling and Synthetic Minority Oversampling."
      />

      {/* Pipeline steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            icon: Scale, title: "1. StandardScaler", accent: "#C6F24E",
            desc: "Distance-based algorithms (KNN, SVM) require features on the same scale. We fit StandardScaler on the training set only and apply to test.",
            code: `scaler = StandardScaler()\nX_train = scaler.fit_transform(X_train)\nX_test  = scaler.transform(X_test)`,
          },
          {
            icon: Shuffle, title: "2. SMOTE resampling", accent: "#5AC8FA",
            desc: "With only 0.17% fraud, accuracy is misleading. SMOTE synthesizes new fraud examples in feature space — never on the test set.",
            code: `smote = SMOTE(random_state=42)\nX_res, y_res = smote.fit_resample(\n    X_train, y_train\n)`,
          },
          {
            icon: Layers, title: "3. Train / test split", accent: "#FFB800",
            desc: "Stratified 80/20 split preserves the 0.17% fraud ratio in both sets so our hold-out evaluation stays truthful.",
            code: `train_test_split(\n  X, y, test_size=0.2,\n  stratify=y,\n  random_state=42\n)`,
          },
        ].map((step, i) => (
          <motion.div key={step.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Panel>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                     style={{ background: `${step.accent}18`, color: step.accent }}>
                  <step.icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <h3 className="font-display text-lg text-[var(--th-text)] font-medium">{step.title}</h3>
              </div>
              <p className="text-sm text-[var(--th-text-secondary)] leading-relaxed mb-4 min-h-[72px]">{step.desc}</p>
              <pre className="p-4 rounded-2xl bg-black/40 border border-[var(--th-border)] text-[11px] font-mono text-[#C6F24E] overflow-x-auto">
                {step.code}
              </pre>
            </Panel>
          </motion.div>
        ))}
      </div>

      {/* Before/After SMOTE */}
      <Panel>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--th-text-secondary)] font-bold mb-1">SMOTE impact</p>
            <h3 className="font-display text-2xl text-[var(--th-text)] font-medium">Class balance · Before vs After</h3>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C6F24E]/10 border border-[#C6F24E]/20 text-[#C6F24E] text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Applied on training only
          </span>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={BEFORE_AFTER}>
              <CartesianGrid stroke="var(--th-chart-grid)" vertical={false} />
              <XAxis dataKey="stage" stroke="var(--th-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--th-chart-axis)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="legit" fill="#5AC8FA" name="Legitimate" radius={[8, 8, 0, 0]} />
              <Bar dataKey="fraud" fill="#C6F24E" name="Fraud (after SMOTE)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-[var(--th-subtle)] border border-[var(--th-border)]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--th-text-secondary)] font-bold mb-1">Before</p>
            <p className="text-sm text-[var(--th-text)]">0.22% fraud · highly imbalanced · model biased to majority class</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#C6F24E]/[0.05] border border-[#C6F24E]/10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#C6F24E] font-bold mb-1">After</p>
            <p className="text-sm text-[var(--th-text)]">50 / 50 class split · synthetic samples interpolated in feature space</p>
          </div>
        </div>
      </Panel>

      {/* Caution */}
      <Panel padding="p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800] shrink-0">
            <AlertTriangle className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <h4 className="font-semibold text-[var(--th-text)] mb-1">Don't SMOTE the test set</h4>
            <p className="text-xs text-[var(--th-text-secondary)] leading-relaxed">
              Oversampling the test set inflates metrics and hides model weaknesses.
              We evaluate on the original, stratified hold-out split — so every metric here is honest.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
