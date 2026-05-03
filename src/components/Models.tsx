import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle2, Settings, Terminal, TrendingDown, Clock, Cpu } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { TRAINING_HISTORY, GITHUB_REPO } from '../constants/data';
import { TiltCard } from './TiltCard';
import { toast } from './Toast';

const ModelCard = ({ name, type, description, params, onTrain, status, metrics }: any) => (
  <TiltCard>
    <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700">
          <Settings className="text-slate-600 dark:text-slate-300" size={20} />
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          status === 'trained' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
          status === 'training' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
          'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
        }`}>
          {status === 'trained' ? 'Trained' : status === 'training' ? 'Training...' : 'Ready'}
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{name}</h3>
      <p className="text-slate-400 dark:text-slate-500 text-[10px] font-medium mb-2 uppercase tracking-wider">{type}</p>
      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed flex-1">{description}</p>

      <div className="my-4 space-y-1.5">
        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Hyperparameters</h4>
        <div className="flex flex-wrap gap-1.5">
          {params.map((p: string) => (
            <span key={p} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg text-[10px] font-mono text-slate-600 dark:text-slate-300">
              {p}
            </span>
          ))}
        </div>
      </div>

      {status === 'trained' && metrics && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Accuracy</p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{(metrics.accuracy * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">ROC-AUC</p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{(metrics.rocAuc * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {status === 'training' && (
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Training progress</span>
            <span className="animate-pulse">Processing...</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <motion.div className="bg-blue-500 h-1.5 rounded-full" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 3, ease: 'linear' }} />
          </div>
        </div>
      )}

      <button
        onClick={onTrain}
        disabled={status === 'training' || status === 'trained'}
        className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs ${
          status === 'trained'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 cursor-default'
            : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700'
        }`}
      >
        {status === 'training' ? (
          <span className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />Training...</span>
        ) : status === 'trained' ? (
          <span className="flex items-center gap-2"><CheckCircle2 size={16} />Optimized</span>
        ) : (
          <span className="flex items-center gap-2"><Play size={14} fill="currentColor" />Start Training</span>
        )}
      </button>
    </div>
  </TiltCard>
);

export function Models() {
  const [statuses, setStatuses] = useState<Record<string, 'idle' | 'training' | 'trained'>>({
    knn: 'idle',
    lr: 'idle',
    svm: 'idle',
    dt: 'idle',
  });
  const [logs, setLogs] = useState<string[]>(['[INFO] Environment initialized', '[INFO] Awaiting training command...']);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-12), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const trainModel = (key: string, name: string, steps: string[], duration: number, metrics: any) => {
    setStatuses(prev => ({ ...prev, [key]: 'training' }));
    addLog(`Starting ${name} training...`);
    toast.info(`${name} training started`);

    steps.forEach((step, i) => {
      setTimeout(() => addLog(step), (duration / steps.length) * (i + 1));
    });

    setTimeout(() => {
      setStatuses(prev => ({ ...prev, [key]: 'trained' }));
      addLog(`${name} complete. Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
      toast.success(`${name} trained successfully`);
    }, duration);
  };

  const models = [
    {
      key: 'knn',
      name: 'K-Nearest Neighbors',
      type: 'Instance-based Learning',
      description: 'Classifies transactions based on proximity to known examples. Uses Euclidean distance with k=5 neighbors.',
      params: ['n_neighbors: 5', 'metric: euclidean', 'weights: uniform'],
      metrics: { accuracy: 0.9992, rocAuc: 0.93 },
      steps: ['Loading normalized features...', 'Building k-d tree index...', 'Computing pairwise distances...', 'Selecting k=5 nearest neighbors...'],
      duration: 2800,
    },
    {
      key: 'lr',
      name: 'Logistic Regression',
      type: 'Probabilistic Classifier',
      description: 'Uses a sigmoid function to model the probability of fraud. Fast but assumes linear separability.',
      params: ['C: 1.0', 'solver: lbfgs', 'max_iter: 1000'],
      metrics: { accuracy: 0.9754, rocAuc: 0.81 },
      steps: ['Initializing weight matrix...', 'Computing sigmoid activations...', 'Running gradient descent...', 'Convergence check...'],
      duration: 2200,
    },
    {
      key: 'svm',
      name: 'Support Vector Machine',
      type: 'Kernel-based Classifier',
      description: 'Finds the optimal hyperplane that maximally separates fraud from legitimate transactions.',
      params: ['kernel: rbf', 'C: 1.0', 'gamma: scale'],
      metrics: { accuracy: 0.9991, rocAuc: 0.90 },
      steps: ['Computing kernel matrix...', 'Finding support vectors...', 'Optimizing margin...', 'Finalizing decision boundary...'],
      duration: 3200,
    },
    {
      key: 'dt',
      name: 'Decision Tree',
      type: 'Tree-based Classifier',
      description: 'Recursively splits data based on feature thresholds. Highly interpretable but prone to overfitting.',
      params: ['criterion: gini', 'max_depth: none', 'min_samples_split: 2'],
      metrics: { accuracy: 0.9991, rocAuc: 0.91 },
      steps: ['Computing Gini impurities...', 'Selecting best splits...', 'Building tree structure...', 'Pruning branches...'],
      duration: 2600,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Model Training</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          Four algorithms from the{' '}
          <a href={GITHUB_REPO.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            reference repository
          </a>
          .
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {models.map(m => (
          <ModelCard
            key={m.key}
            name={m.name}
            type={m.type}
            description={m.description}
            params={m.params}
            status={statuses[m.key]}
            onTrain={() => trainModel(m.key, m.name, m.steps, m.duration, m.metrics)}
            metrics={statuses[m.key] === 'trained' ? m.metrics : null}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        <TiltCard>
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <TrendingDown size={16} className="text-blue-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Training Loss Curve</h3>
            </div>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TRAINING_HISTORY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="epoch" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 1]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="knn_loss" name="KNN" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="lr_loss" name="Logistic Reg" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="svm_loss" name="SVM" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="dt_loss" name="Decision Tree" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TiltCard>

        <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 overflow-hidden shadow-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-3 sm:mb-4 border-b border-slate-800 pb-3 sm:pb-4">
            <Terminal size={16} className="text-emerald-500" />
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Training Console</h3>
            <div className="ml-auto flex items-center gap-2 sm:gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><Cpu size={12} />4 cores</span>
              <span className="flex items-center gap-1"><Clock size={12} />~3s avg</span>
            </div>
          </div>
          <div className="font-mono text-[10px] sm:text-xs space-y-1 h-48 sm:h-64 overflow-y-auto">
            {logs.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 sm:gap-3">
                <span className="text-slate-600 shrink-0 w-4 sm:w-6">{i + 1}</span>
                <span className={log.includes('complete') ? 'text-emerald-400' : log.includes('Starting') ? 'text-blue-400' : 'text-slate-300'}>{log}</span>
              </motion.div>
            ))}
            {Object.values(statuses).some(s => s === 'training') && <div className="animate-pulse text-blue-400">_</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
