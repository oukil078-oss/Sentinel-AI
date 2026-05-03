import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, BarChart2, Info, Target, TrendingUp, Award, ExternalLink } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Cell
} from 'recharts';
import {
  MODEL_METRICS, ROC_CURVE_DATA, PR_CURVE_DATA, RADAR_DATA,
  FEATURE_IMPORTANCE, CONFUSION_MATRIX_KNN, CONFUSION_MATRIX_LR,
  CONFUSION_MATRIX_SVM, CONFUSION_MATRIX_DT, ALL_MODELS_COMPARISON, GITHUB_REPO
} from '../constants/data';
import { TiltCard } from './TiltCard';
import { FloatingOrb } from './FloatingOrb';

const MetricCard = ({ label, value, description }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-slate-50 dark:bg-slate-700/50 p-4 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-600"
  >
    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1 uppercase tracking-wider">{label}</div>
    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{(value * 100).toFixed(1)}<span className="text-base sm:text-lg">%</span></div>
    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 sm:mt-2 leading-relaxed">{description}</p>
  </motion.div>
);

const ConfusionHeatmap = ({ matrix, title }: any) => {
  const maxVal = Math.max(...matrix.flat());
  const getIntensity = (val: number) => {
    const intensity = val / maxVal;
    return `rgba(${val === matrix[1][1] || val === matrix[0][0] ? '16, 185, 129' : '239, 68, 68'}, ${intensity * 0.15 + 0.05})`;
  };
  const getTextColor = (val: number) => {
    const intensity = val / maxVal;
    return intensity > 0.5 ? `rgba(${val === matrix[1][1] || val === matrix[0][0] ? '6, 95, 70' : '153, 27, 27'}, 1)` : '#64748b';
  };
  const labels = [['True Negative', 'False Positive'], ['False Negative', 'True Positive']];
  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
      <h4 className="font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 text-center text-sm">{title}</h4>
      <div className="grid grid-cols-2 gap-2 max-w-[200px] sm:max-w-xs mx-auto">
        {matrix.map((row: number[], i: number) =>
          row.map((val: number, j: number) => (
            <div
              key={`${i}-${j}`}
              className="aspect-square rounded-lg flex flex-col items-center justify-center transition-all hover:scale-105"
              style={{ backgroundColor: getIntensity(val) }}
            >
              <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">{labels[i][j]}</span>
              <span className="text-base sm:text-xl font-black" style={{ color: getTextColor(val) }}>{val.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const modelKeys = ['knn', 'logisticRegression', 'svm', 'decisionTree'] as const;
type ModelKey = typeof modelKeys[number];

const modelLabels: Record<ModelKey, string> = {
  knn: 'KNN',
  logisticRegression: 'Logistic Regression',
  svm: 'SVM',
  decisionTree: 'Decision Tree',
};

const modelColors: Record<ModelKey, string> = {
  knn: '#3b82f6',
  logisticRegression: '#f59e0b',
  svm: '#8b5cf6',
  decisionTree: '#10b981',
};

const confusionMatrices: Record<ModelKey, number[][]> = {
  knn: CONFUSION_MATRIX_KNN,
  logisticRegression: CONFUSION_MATRIX_LR,
  svm: CONFUSION_MATRIX_SVM,
  decisionTree: CONFUSION_MATRIX_DT,
};

export function ModelEvaluation() {
  const [selectedModel, setSelectedModel] = useState<ModelKey>('knn');
  const metrics = MODEL_METRICS[selectedModel];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Model Evaluation</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Four-model comparison based on the GitHub repo analysis.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl overflow-x-auto max-w-full">
          {modelKeys.map(m => (
            <button
              key={m}
              onClick={() => setSelectedModel(m)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                selectedModel === m
                  ? 'bg-white dark:bg-slate-600 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              style={selectedModel === m ? { color: modelColors[m] } : {}}
            >
              {modelLabels[m]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Model Comparison Bar Chart */}
      <TiltCard>
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <BarChart2 size={16} className="text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">All Models Comparison</h3>
          </div>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ALL_MODELS_COMPARISON} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="model" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="accuracy" name="Accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="precision" name="Precision" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="recall" name="Recall" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="f1" name="F1 Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </TiltCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard label="Accuracy" value={metrics.accuracy} description="Overall correctness" />
        <MetricCard label="Precision" value={metrics.precision} description="Fewer false alarms" />
        <MetricCard label="Recall" value={metrics.recall} description="Catches more fraud" />
        <MetricCard label="F1 Score" value={metrics.f1} description="Harmonic mean" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 space-y-4 sm:space-y-8">
          <TiltCard>
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Target size={16} className="text-blue-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">ROC Curve — All Models</h3>
                <span className="ml-auto text-[10px] sm:text-xs text-slate-400">Higher = better</span>
              </div>
              <div className="h-56 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'False Positive Rate', position: 'bottom', fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis dataKey="tpr" type="number" domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line data={ROC_CURVE_DATA.knn} dataKey="tpr" name="KNN (0.93)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line data={ROC_CURVE_DATA.logisticRegression} dataKey="tpr" name="Logistic Reg (0.81)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line data={ROC_CURVE_DATA.svm} dataKey="tpr" name="SVM (0.90)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    <Line data={ROC_CURVE_DATA.decisionTree} dataKey="tpr" name="Decision Tree (0.91)" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <TrendingUp size={16} className="text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Precision-Recall Curve</h3>
                <span className="ml-auto text-[10px] sm:text-xs text-slate-400">Critical for imbalanced data</span>
              </div>
              <div className="h-56 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="recall" type="number" domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Recall', position: 'bottom', fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis dataKey="precision" type="number" domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Precision', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line data={PR_CURVE_DATA.knn} dataKey="precision" name="KNN (0.83)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line data={PR_CURVE_DATA.logisticRegression} dataKey="precision" name="Logistic Reg (0.07)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line data={PR_CURVE_DATA.svm} dataKey="precision" name="SVM (0.79)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    <Line data={PR_CURVE_DATA.decisionTree} dataKey="precision" name="Decision Tree (0.74)" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TiltCard>
        </div>

        <div className="space-y-4 sm:space-y-8">
          <ConfusionHeatmap matrix={confusionMatrices[selectedModel]} title={`${metrics.name} — Confusion Matrix`} />

          <TiltCard>
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 text-sm">Radar Comparison</h4>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={RADAR_DATA}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <Radar name="KNN" dataKey="knn" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Logistic Reg" dataKey="lr" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="SVM" dataKey="svm" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Decision Tree" dataKey="dt" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        <TiltCard>
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <BarChart2 size={16} className="text-indigo-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Feature Importance (Decision Tree)</h3>
            </div>
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ left: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={35} />
                  <Tooltip formatter={(val: any) => `${(val * 100).toFixed(1)}%`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={14}>
                    {FEATURE_IMPORTANCE.map((_, i) => (
                      <Cell key={i} fill={i < 3 ? '#3b82f6' : i < 6 ? '#60a5fa' : '#93c5fd'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TiltCard>

        <FloatingOrb delay={0.2} yOffset={-4}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 sm:p-8 rounded-2xl text-white shadow-xl h-full">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <Award size={18} className="text-yellow-400" />
              <h3 className="text-lg sm:text-xl font-bold">Model Recommendation</h3>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="font-bold text-blue-400 mb-2 text-sm">KNN — Best Overall</h4>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" /> Highest accuracy: 99.92%</li>
                  <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" /> Best ROC-AUC: 0.93</li>
                  <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" /> Strong precision-recall balance</li>
                </ul>
              </div>

              <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="font-bold text-amber-400 mb-2 text-sm">Logistic Regression — Caution</h4>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2"><XCircle size={13} className="text-rose-400 mt-0.5 shrink-0" /> Only 9% precision — many false alarms</li>
                  <li className="flex items-start gap-2"><XCircle size={13} className="text-rose-400 mt-0.5 shrink-0" /> Struggles with linear separability on PCA data</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={16} />
                <span>Deploy KNN for production</span>
              </div>

              <a
                href={GITHUB_REPO.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-blue-400 transition-colors mt-2"
              >
                <ExternalLink size={14} />
                Source: {GITHUB_REPO.author}/Credit-Card-Fraud-Detection
              </a>
            </div>
          </div>
        </FloatingOrb>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-3 sm:gap-4 items-center"
      >
        <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
          <Info size={18} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Why Accuracy is Misleading</h4>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            A naive classifier predicting "legitimate" always achieves 99.83% accuracy. That's why we optimize for <strong>Recall</strong> — missing fraud costs far more than a false alarm.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
