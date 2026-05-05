import { motion } from "framer-motion";
import { Database, Cpu, Shield, ExternalLink, BookOpen, Code2, Sparkles } from "lucide-react";
import { PageHeader, Panel, Button } from "../components/ui";

export function AboutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="About Sentinel AI"
        title="A real-time fraud detection platform, built from first principles."
        subtitle="Based on academic research and the Kaggle creditcardfraud dataset. Trained using SMOTE-balanced scikit-learn models."
      />

      {/* Mission */}
      <Panel padding="p-8 sm:p-10" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#C6F24E]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#C6F24E] font-bold mb-4">The problem</p>
          <h2 className="font-display text-3xl sm:text-4xl text-white font-light leading-[1.15] tracking-tight mb-5 text-balance">
            Credit card fraud loses the industry <span className="text-[#C6F24E]">$32 billion</span> every year.
            Only 0.17% of transactions are fraudulent — and missing one costs real people.
          </h2>
          <p className="text-base text-[#8A8A93] leading-relaxed">
            Sentinel AI pairs a production-grade Random Forest with SMOTE class balancing, five baseline
            models, explainable rules, and a full analyst workflow — so every transaction gets scored,
            every alert gets triaged, and nothing falls through the cracks.
          </p>
        </div>
      </Panel>

      {/* Stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Database, title: "Dataset", desc: "Kaggle mlg-ulb/creditcardfraud · 284K European tx · 0.17% fraud", color: "#5AC8FA" },
          { icon: Cpu, title: "Models", desc: "Random Forest · KNN · Logistic Reg. · Decision Tree · SVM — all trained with SMOTE", color: "#C6F24E" },
          { icon: Shield, title: "Security", desc: "JWT analyst auth · bcrypt hashing · brute-force protection · audit log", color: "#FFB800" },
          { icon: Sparkles, title: "Stack", desc: "React 19 · Vite · Tailwind v4 · FastAPI · scikit-learn · MongoDB", color: "#9D7FFF" },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Panel padding="p-5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background: `${s.color}18`, color: s.color }}>
                <s.icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <p className="text-sm font-semibold text-white mb-1">{s.title}</p>
              <p className="text-xs text-[#8A8A93] leading-relaxed">{s.desc}</p>
            </Panel>
          </motion.div>
        ))}
      </div>

      {/* References */}
      <Panel>
        <h3 className="font-display text-xl text-white font-medium mb-5 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#C6F24E]" strokeWidth={2} /> References
        </h3>
        <div className="space-y-3">
          {[
            {
              url: "https://www.pinterest.com/pin/1096485840541234713/",
              label: "UI / UX reference: dark fintech dashboard with lime accents (Pinterest)",
              icon: Sparkles,
            },
            {
              url: "https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud",
              label: "Dataset: ULB Machine Learning Group · creditcardfraud on Kaggle",
              icon: Database,
            },
            {
              url: "https://scikit-learn.org/",
              label: "scikit-learn · machine learning in Python",
              icon: Code2,
            },
            {
              url: "https://imbalanced-learn.org/",
              label: "imbalanced-learn · SMOTE implementation",
              icon: Code2,
            },
          ].map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
              data-testid={`ref-link-${r.url}`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#C6F24E]/10 flex items-center justify-center text-[#C6F24E]">
                <r.icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <p className="flex-1 text-sm text-white group-hover:text-[#C6F24E] transition-colors">{r.label}</p>
              <ExternalLink className="w-4 h-4 text-[#5A5A63] group-hover:text-white transition-colors" strokeWidth={2} />
            </a>
          ))}
        </div>
      </Panel>

      {/* How it works */}
      <Panel>
        <h3 className="font-display text-xl text-white font-medium mb-5">Presentation script</h3>
        <blockquote className="border-l-2 border-[#C6F24E] pl-6 text-[#8A8A93] leading-relaxed space-y-3 text-sm">
          <p>"Credit card fraud represents billions in annual losses. Our dataset contains 284,808 European credit card transactions — but only 492 are fraudulent. That's <span className="text-white font-semibold">0.17%</span>."</p>
          <p>"We applied <span className="text-white font-semibold">StandardScaler</span> to normalize features because distance-based models (KNN, SVM) can't handle raw amount magnitudes. Then <span className="text-white font-semibold">SMOTE</span> balanced the training set without touching test data."</p>
          <p>"We trained five scikit-learn models side-by-side: <span className="text-white font-semibold">Random Forest</span> won on ROC-AUC and PR-AUC — two metrics that matter more than accuracy for imbalanced data."</p>
          <p>"The Prediction Lab lets us test any 30-dimensional feature vector in real time. When V14 drops below -2, the ensemble flags the transaction with high confidence."</p>
          <p>"This is the complete fraud operations pipeline: exploration → preprocessing → training → evaluation → deployment → case management → audit."</p>
        </blockquote>
      </Panel>
    </div>
  );
}
