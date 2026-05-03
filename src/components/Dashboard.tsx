import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, AlertTriangle, Activity, ShieldCheck,
  ArrowUpRight, TrendingUp, Clock, Zap, Users, Play, Pause
} from 'lucide-react';
import { DATASET_STATS, LIVE_TRANSACTIONS, GITHUB_REPO } from '../constants/data';
import { AnimatedCounter } from './AnimatedCounter';
import { TiltCard } from './TiltCard';
import { FloatingOrb } from './FloatingOrb';
import { ParticleField } from './ParticleField';
import { toast } from './Toast';

const KPICard = ({ title, value, suffix, subtitle, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="h-full"
  >
    <TiltCard className="h-full">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all cursor-pointer h-full flex flex-col p-5"
        onClick={() => toast.info(`${title}: ${value.toLocaleString()}${suffix || ''}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${color} shadow-md shrink-0`}>
            <Icon size={20} className="text-white" />
          </div>
          <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded-full">
            <ArrowUpRight size={10} className="mr-0.5" />
            Live
          </span>
        </div>
        <div className="flex-1 flex flex-col justify-end">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
            <AnimatedCounter value={value} suffix={suffix || ''} decimals={suffix === '%' ? 1 : 0} />
          </p>
          {subtitle && <p className="text-[10px] text-slate-400 mt-1.5">{subtitle}</p>}
        </div>
      </div>
    </TiltCard>
  </motion.div>
);

const TransactionRow = ({ tx, index }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.06 }}
    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
    onClick={() => toast.info(`${tx.id}: $${tx.amount} — ${tx.status === 'fraud' ? 'Fraudulent' : 'Legitimate'}`)}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <div className={`w-2 h-2 rounded-full shrink-0 ${tx.status === 'fraud' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{tx.id}</p>
        <p className="text-[10px] text-slate-400">{tx.time}</p>
      </div>
    </div>
    <div className="text-right shrink-0 ml-3">
      <p className="text-xs font-bold text-slate-900 dark:text-white">${tx.amount.toFixed(2)}</p>
      <p className={`text-[10px] font-bold ${tx.status === 'fraud' ? 'text-rose-500' : 'text-emerald-500'}`}>
        {tx.status === 'fraud' ? 'Fraud' : 'Legit'}
      </p>
    </div>
  </motion.div>
);

export function Dashboard() {
  const [feedRunning, setFeedRunning] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0">
          <img
            src="/images/hero-bg.jpg"
            alt=""
            className="w-full h-full object-cover opacity-50 dark:opacity-30"
            style={{ animation: 'slowZoom 20s ease-in-out infinite alternate' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/75 to-slate-900/50 dark:from-slate-950/95 dark:via-slate-950/85 dark:to-slate-950/70" />
        </div>
        <ParticleField />
        <div className="relative p-6 sm:p-8 lg:p-10" style={{ zIndex: 2 }}>
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 bg-blue-500/15 text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wider border border-blue-500/25">
                Based on GitHub Repo
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Systems Online
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1] mb-3">
              Credit Card Fraud
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Detection Platform
              </span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-lg mb-5">
              End-to-end ML pipeline comparing KNN, Logistic Regression, SVM, and Decision Tree
              on 284,808 European credit card transactions.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
              </span>
              <span className="hidden sm:inline w-px h-3 bg-slate-600" />
              <span className="flex items-center gap-1.5">
                <TrendingUp size={12} />
                <span>4 Models</span>
              </span>
              <span className="hidden sm:inline w-px h-3 bg-slate-600" />
              <span className="flex items-center gap-1.5">
                <Activity size={12} />
                <span>31 Features</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Transactions" value={DATASET_STATS.totalTransactions} subtitle="Processed" icon={CreditCard} color="bg-gradient-to-br from-blue-500 to-blue-600" delay={0} />
        <KPICard title="Fraud Cases" value={DATASET_STATS.fraudulentCount} subtitle="Detected" icon={AlertTriangle} color="bg-gradient-to-br from-rose-500 to-rose-600" delay={0.08} />
        <KPICard title="Fraud Ratio" value={DATASET_STATS.fraudPercentage} suffix="%" subtitle="Highly Imbalanced" icon={Activity} color="bg-gradient-to-br from-amber-500 to-amber-600" delay={0.16} />
        <KPICard title="Best Accuracy" value={99.92} suffix="%" subtitle="KNN Model" icon={ShieldCheck} color="bg-gradient-to-br from-emerald-500 to-emerald-600" delay={0.24} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Column */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
          <TiltCard className="h-full">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm h-full flex flex-col">
              <div className="p-5 sm:p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Zap size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Project Objective</h3>
                    <p className="text-[11px] text-slate-400">From the reference repository</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                  Credit card fraud is a significant problem, with billions of dollars lost each year.
                  This platform implements four machine learning algorithms — KNN, Logistic Regression,
                  SVM, and Decision Tree — to detect fraudulent transactions in a highly imbalanced dataset
                  where fraud represents only 0.17% of all transactions.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {[
                    { icon: AlertTriangle, title: 'Imbalance', desc: '492 frauds in 284K rows', color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' },
                    { icon: TrendingUp, title: '4 Algorithms', desc: 'KNN, LR, SVM, DT', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
                    { icon: ShieldCheck, title: 'Best Model', desc: 'KNN at 99.92%', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -2 }}
                      className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-600 cursor-pointer hover:border-slate-200 dark:hover:border-slate-500 transition-all"
                      onClick={() => toast.info(item.desc)}
                    >
                      <div className={`p-1.5 rounded-lg w-fit mb-2 ${item.color}`}>
                        <item.icon size={15} />
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{item.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <a
                  href={GITHUB_REPO.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium mb-4"
                >
                  View source repository
                  <ArrowUpRight size={12} />
                </a>
              </div>

              <div className="relative h-44 sm:h-48 overflow-hidden rounded-b-2xl">
                <img src="/images/ml-pipeline.jpg" alt="ML Pipeline" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">ML Pipeline Architecture</p>
                    <p className="text-slate-300 text-[11px]">From raw data to production model</p>
                  </div>
                  <button
                    onClick={() => toast.info('Pipeline: Ingest → Preprocess → Train (4 models) → Evaluate → Compare')}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white/15 backdrop-blur text-white text-[11px] font-medium rounded-lg hover:bg-white/25 transition-colors"
                  >
                    Details
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Right Column — Live Feed */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <TiltCard className="h-full">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm h-full flex flex-col">
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Live Feed</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setFeedRunning(!feedRunning)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    {feedRunning ? <Pause size={13} className="text-slate-400" /> : <Play size={13} className="text-slate-400" />}
                  </button>
                  <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-1 rounded-full font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {feedRunning ? 'Live' : 'Paused'}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="p-2 max-h-[340px] overflow-y-auto">
                  <AnimatePresence>
                    {LIVE_TRANSACTIONS.map((tx, i) => (
                      <TransactionRow key={tx.id} tx={tx} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>
      </div>

      {/* Why This Matters */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0">
          <img src="/images/data-viz.jpg" alt="" className="w-full h-full object-cover opacity-[0.08]" />
        </div>
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <Users size={18} className="text-blue-400" />
            <h3 className="text-lg sm:text-xl font-bold">Why This Matters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { num: '01', title: 'Scale Matters', desc: 'KNN requires strict Standard Scaling because Euclidean distance is dominated by large-magnitude features like Amount.' },
              { num: '02', title: 'Algorithm Choice', desc: 'Four different approaches reveal which technique best captures fraud patterns in PCA-transformed data.' },
              { num: '03', title: 'Real Impact', desc: 'With 2.8 billion credit card users worldwide, even a 0.1% improvement in fraud detection saves millions.' },
            ].map((item) => (
              <FloatingOrb key={item.num} delay={parseInt(item.num) * 0.2} yOffset={-4}>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors h-full flex flex-col"
                  onClick={() => toast.info(item.desc)}
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center mb-3">
                    <span className="text-blue-400 font-bold text-sm">{item.num}</span>
                  </div>
                  <p className="font-bold text-sm mb-1.5">{item.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              </FloatingOrb>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
