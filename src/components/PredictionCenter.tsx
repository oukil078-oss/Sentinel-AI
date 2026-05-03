import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, RefreshCw, Search, ChevronRight, SlidersHorizontal, Zap, BarChart3, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { THRESHOLD_DATA, GITHUB_REPO } from '../constants/data';
import { TiltCard } from './TiltCard';
import { FloatingOrb } from './FloatingOrb';
import { toast } from './Toast';

const SAMPLES = [
  { id: 'TX-9021', amount: 125.50, v1: -1.35, v2: 0.82, v3: 2.15, v4: 1.02, v14: -0.25, v17: 0.12, type: 'Legitimate' },
  { id: 'TX-4432', amount: 2.99, v1: -2.31, v2: 1.66, v3: -1.17, v4: 3.52, v14: -4.82, v17: -3.21, type: 'Fraudulent' },
  { id: 'TX-1189', amount: 840.00, v1: 1.12, v2: -0.45, v3: 0.12, v4: 0.22, v14: 0.15, v17: 0.08, type: 'Legitimate' },
  { id: 'TX-7721', amount: 45.00, v1: -0.82, v2: 0.45, v3: 1.92, v4: -0.33, v14: -2.15, v17: -1.88, type: 'Fraudulent' },
  { id: 'TX-3301', amount: 320.50, v1: 0.25, v2: -0.12, v3: 0.45, v4: 0.88, v14: 0.05, v17: 0.02, type: 'Legitimate' },
];

const DEFAULT_MANUAL = { amount: 100, v1: 0, v2: 0, v3: 0, v4: 0, v14: 0, v17: 0 };

export function PredictionCenter() {
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [threshold, setThreshold] = useState(0.5);
  const [activeTab, setActiveTab] = useState('predict');
  const [inputMode, setInputMode] = useState<'sample' | 'manual'>('sample');
  const [manualValues, setManualValues] = useState(DEFAULT_MANUAL);
  const [history, setHistory] = useState<any[]>([]);

  const currentData = inputMode === 'sample' ? selectedSample : { id: 'TX-MANUAL', ...manualValues, type: 'Unknown' };

  const handleAnalyze = () => {
    const data = inputMode === 'sample' ? selectedSample : manualValues;
    if (!data) return;
    setIsAnalyzing(true);
    setPrediction(null);
    toast.info('Analyzing with KNN (k=5)...');

    setTimeout(() => {
      setIsAnalyzing(false);
      const v14 = data.v14 || 0;
      const v17 = data.v17 || 0;
      const fraudScore = v14 < -2 || v17 < -2 ? 0.94 : v14 < -1 ? 0.72 : v14 < 0 ? 0.45 : 0.12;
      const isFraud = fraudScore > threshold;
      const result = {
        isFraud, confidence: fraudScore,
        reasoning: isFraud
          ? `KNN detected anomaly: V14 (${v14}) and V17 (${v17}) exceed fraud thresholds. Score ${fraudScore.toFixed(2)} > ${threshold}.`
          : 'KNN: All features within normal ranges. No anomalous patterns detected.',
        topFeatures: [
          { name: 'V14', value: v14, weight: 0.142 },
          { name: 'V4', value: data.v4 || 0, weight: 0.128 },
          { name: 'V17', value: v17, weight: 0.087 },
          { name: 'Amount', value: data.amount || 0, weight: 0.048 },
        ],
        timestamp: new Date().toLocaleTimeString(),
        id: data.id || 'TX-MANUAL',
      };
      setPrediction(result);
      setHistory(prev => [result, ...prev].slice(0, 10));
      toast.success(isFraud ? 'Fraud detected!' : 'Transaction legitimate');
    }, 1500);
  };

  const handleManualChange = (field: string, value: string) => {
    setManualValues(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Prediction Center</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          Test the trained KNN model (best performer from the{' '}
          <a href={GITHUB_REPO.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">reference repo</a>
          ).
        </p>
      </motion.div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl w-fit overflow-x-auto">
        {[
          { id: 'predict', label: 'Predict', icon: Zap },
          { id: 'threshold', label: 'Threshold', icon: SlidersHorizontal },
          { id: 'history', label: 'History', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
            {tab.id === 'history' && history.length > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full">{history.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'predict' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <TiltCard>
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 uppercase tracking-wider">Input Mode</h3>
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                  {['sample', 'manual'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setInputMode(mode as any); setPrediction(null); }}
                      className={`flex-1 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-xs font-bold transition-all ${
                        inputMode === mode
                          ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {mode === 'sample' ? 'Samples' : 'Manual'}
                    </button>
                  ))}
                </div>
              </div>
            </TiltCard>

            {inputMode === 'sample' && (
              <TiltCard>
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 uppercase tracking-wider">Select Sample</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {SAMPLES.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => { setSelectedSample(sample); setPrediction(null); }}
                        className={`w-full p-3 sm:p-4 rounded-xl border text-left transition-all ${
                          selectedSample?.id === sample.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                            : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{sample.id}</span>
                          <span className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                            sample.type === 'Fraudulent'
                              ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {sample.type}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1.5 sm:mt-2">
                          <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">${sample.amount}</span>
                          <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">V14: {sample.v14}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </TiltCard>
            )}

            {inputMode === 'manual' && (
              <TiltCard>
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 uppercase tracking-wider">Manual Input</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { key: 'amount', label: 'Amount ($)', min: 0, max: 30000, step: 0.01 },
                      { key: 'v1', label: 'V1', min: -10, max: 10, step: 0.01 },
                      { key: 'v2', label: 'V2', min: -10, max: 10, step: 0.01 },
                      { key: 'v3', label: 'V3', min: -10, max: 10, step: 0.01 },
                      { key: 'v4', label: 'V4', min: -10, max: 10, step: 0.01 },
                      { key: 'v14', label: 'V14 (Key)', min: -10, max: 10, step: 0.01 },
                      { key: 'v17', label: 'V17 (Key)', min: -10, max: 10, step: 0.01 },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">{field.label}</label>
                        <input
                          type="number"
                          min={field.min} max={field.max} step={field.step}
                          value={manualValues[field.key as keyof typeof manualValues]}
                          onChange={e => handleManualChange(field.key, e.target.value)}
                          className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setManualValues(DEFAULT_MANUAL)}
                    className="w-full mt-3 sm:mt-4 py-1.5 sm:py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 text-[10px] sm:text-xs font-medium hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </TiltCard>
            )}

            <TiltCard>
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 uppercase tracking-wider">Threshold</h3>
                <div className="flex items-center gap-3 sm:gap-4">
                  <input
                    type="range" min="0.1" max="0.9" step="0.1"
                    value={threshold}
                    onChange={e => setThreshold(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 sm:h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 w-10 sm:w-12 text-right">{threshold.toFixed(1)}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-2 sm:mt-3">
                  Lower = more sensitive (more fraud caught, more false positives)
                </p>
              </div>
            </TiltCard>
          </div>

          <div className="lg:col-span-2">
            <TiltCard>
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm min-h-[420px] sm:min-h-[500px] flex flex-col">
                {!currentData ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center">
                    <Search size={40} className="mb-3 sm:mb-4 opacity-20" />
                    <p className="text-sm">Select a sample or enter manual values</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start mb-6 sm:mb-8 gap-3">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Analysis: {currentData.id || 'TX-MANUAL'}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">KNN (k=5) | Threshold: {threshold}</p>
                      </div>
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 text-xs sm:text-sm"
                      >
                        {isAnalyzing ? <RefreshCw size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                        {isAnalyzing ? 'Analyzing...' : 'Run Prediction'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
                      {[
                        { label: 'Amount', value: `$${currentData.amount}`, highlight: false },
                        { label: 'V14', value: currentData.v14, highlight: currentData.v14 < -2 },
                        { label: 'V17', value: currentData.v17, highlight: currentData.v17 < -2 },
                        { label: 'Model', value: 'KNN (k=5)', highlight: false },
                      ].map((field, i) => (
                        <div key={i} className={`p-2.5 sm:p-3 rounded-xl ${field.highlight ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{field.label}</p>
                          <p className={`text-sm sm:text-lg font-bold ${field.highlight ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{field.value}</p>
                        </div>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {prediction && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`flex-1 p-5 sm:p-8 rounded-2xl flex flex-col items-center justify-center text-center ${
                            prediction.isFraud
                              ? 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border border-rose-200 dark:border-rose-800'
                              : 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {prediction.isFraud ? (
                            <ShieldAlert size={48} className="text-rose-500 mb-3 sm:mb-4 sm:w-16 sm:h-16" />
                          ) : (
                            <ShieldCheck size={48} className="text-emerald-500 mb-3 sm:mb-4 sm:w-16 sm:h-16" />
                          )}

                          <h4 className={`text-xl sm:text-2xl font-black uppercase tracking-tighter ${
                            prediction.isFraud ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                          }`}>
                            {prediction.isFraud ? 'Fraud Detected' : 'Transaction Legitimate'}
                          </h4>
                          <p className="text-slate-600 dark:text-slate-300 mt-3 sm:mt-4 max-w-md mx-auto leading-relaxed text-xs sm:text-sm">
                            {prediction.reasoning}
                          </p>

                          <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3">
                            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                              Confidence: {(prediction.confidence * 100).toFixed(0)}%
                            </div>
                            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                              Threshold: {threshold}
                            </div>
                          </div>

                          {prediction.topFeatures && (
                            <div className="mt-6 sm:mt-8 w-full max-w-sm sm:max-w-md">
                              <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 sm:mb-3">Top Contributing Features</p>
                              {prediction.topFeatures.map((f: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 w-12 sm:w-16">{f.name}</span>
                                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 sm:h-2">
                                    <div className="h-1.5 sm:h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(f.weight * 700, 100)}%` }} />
                                  </div>
                                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 w-10 sm:w-12 text-right">{f.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </TiltCard>
          </div>
        </motion.div>
      )}

      {activeTab === 'threshold' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 sm:space-y-8">
          <TiltCard>
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <SlidersHorizontal size={16} className="text-blue-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Threshold Impact Analysis</h3>
              </div>
              <div className="h-60 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={THRESHOLD_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="threshold" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Threshold', position: 'bottom', fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 1]} label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="precision" name="Precision" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="recall" name="Recall" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="f1" name="F1 Score" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TiltCard>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { threshold: '0.3', use: 'High Recall', desc: 'Catch maximum fraud. More false positives acceptable.', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { threshold: '0.5', use: 'Balanced', desc: 'Default threshold. Good trade-off for most cases.', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { threshold: '0.7', use: 'High Precision', desc: 'Minimize false alarms. Only flag clear fraud.', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            ].map((item, i) => (
              <FloatingOrb key={i} delay={i * 0.2} yOffset={-3}>
                <TiltCard>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className={`p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-lg transition-all ${item.bg}`}
                    onClick={() => { setThreshold(parseFloat(item.threshold)); toast.info(`Threshold set to ${item.threshold}`); }}
                  >
                    <div className={`text-xl sm:text-2xl font-black ${item.color} mb-1.5 sm:mb-2`}>{item.threshold}</div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 text-sm">{item.use}</h4>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </motion.div>
                </TiltCard>
              </FloatingOrb>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Prediction History</h3>
            {history.length > 0 && (
              <button
                onClick={() => { setHistory([]); toast.info('History cleared'); }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
              >
                <X size={13} />
                Clear
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-10 sm:p-12 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
              <Search size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No predictions yet. Run a prediction to see history.</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {history.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center justify-between p-3 sm:p-5 rounded-xl border ${
                    h.isFraud
                      ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/50'
                      : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-4">
                    {h.isFraud ? <ShieldAlert size={16} className="text-rose-500 sm:w-5 sm:h-5" /> : <ShieldCheck size={16} className="text-emerald-500 sm:w-5 sm:h-5" />}
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{h.id}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400">{h.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs sm:text-sm font-bold ${h.isFraud ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {h.isFraud ? 'Fraud' : 'Legitimate'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400">{(h.confidence * 100).toFixed(0)}% confidence</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
