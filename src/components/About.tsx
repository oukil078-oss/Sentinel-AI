import { motion } from 'framer-motion';
import { Globe, GraduationCap, Code2, Database, Shield, BookOpen, Cpu, Layers, FileText, ArrowRight, ExternalLink } from 'lucide-react';
import { GITHUB_REPO } from '../constants/data';
import { TiltCard } from './TiltCard';
import { FloatingOrb } from './FloatingOrb';
import { toast } from './Toast';

export function About() {
  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">About the Project</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Based on the open-source repository with extended visualizations.</p>
      </motion.div>

      {/* Source Repo Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-700 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">Source Repository</p>
            <h3 className="text-lg sm:text-xl font-bold text-white">Credit Card Fraud Detection Using Machine Learning</h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">by {GITHUB_REPO.author} — Kaggle European Credit Card Fraud Dataset</p>
          </div>
          <a
            href={GITHUB_REPO.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-lg"
          >
            View on GitHub
            <ExternalLink size={14} />
          </a>
        </div>
      </motion.div>

      {/* Hero Image Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="relative rounded-2xl overflow-hidden h-40 sm:h-56"
      >
        <img src="/images/data-viz.jpg" alt="Data Visualization" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-900/40" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-blue-500/20 text-blue-300 text-[10px] sm:text-xs font-bold rounded-full border border-blue-500/30">University Project</span>
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs font-bold rounded-full border border-emerald-500/30">Data Science</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">Credit Card Fraud Detection</h3>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">Complete ML pipeline from raw data to production model</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        <TiltCard>
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm h-full">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <GraduationCap size={20} className="text-blue-600 dark:text-blue-400 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Project Rationale</h3>
                <p className="text-[10px] sm:text-xs text-slate-400">University Data Science Presentation</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
              Credit card fraud is a significant problem, with billions of dollars lost each year. This project develops
              a machine-learning model to detect credit card fraud by identifying patterns indicative of fraudulent transactions.
              The model is trained on a dataset of historical European credit card transactions and evaluated on unseen data.
            </p>
            <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3">
              <button
                onClick={() => toast.info('Dataset: European Credit Card Fraud (Kaggle, 284,808 rows)')}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Database size={13} />
                Dataset
              </button>
              <a
                href={GITHUB_REPO.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] sm:text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <FileText size={13} />
                Report
              </a>
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm h-full">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="p-2.5 sm:p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <Code2 size={20} className="text-emerald-600 dark:text-emerald-400 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Tech Stack</h3>
                <p className="text-[10px] sm:text-xs text-slate-400">From the reference repository</p>
              </div>
            </div>
            <div className="space-y-2.5 sm:space-y-3">
              {[
                { label: 'Core ML', value: 'Python / Scikit-Learn', color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Dataset', value: 'Kaggle (284,808 rows)', color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Algorithms', value: 'KNN, LR, SVM, Decision Tree', color: 'text-indigo-600 dark:text-indigo-400' },
                { label: 'Dashboard', value: 'React / Tailwind / Recharts', color: 'text-amber-600 dark:text-amber-400' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{item.label}</span>
                  <span className={`text-xs sm:text-sm font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </TiltCard>
      </div>

      {/* Pipeline Image with 3D cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative rounded-2xl overflow-hidden h-48 sm:h-64"
      >
        <img src="/images/ml-pipeline.jpg" alt="ML Pipeline" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <Shield size={18} className="text-blue-400" />
            <h3 className="text-lg sm:text-xl font-bold text-white">System Architecture</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {[
              { icon: Database, title: 'Ingestion', desc: '284K rows', color: 'bg-blue-500/20 text-blue-400' },
              { icon: Layers, title: 'Preprocess', desc: 'Scale + Split', color: 'bg-amber-500/20 text-amber-400' },
              { icon: Cpu, title: 'Training', desc: '4 Models', color: 'bg-emerald-500/20 text-emerald-400' },
              { icon: Globe, title: 'Evaluate', desc: 'Compare', color: 'bg-indigo-500/20 text-indigo-400' },
            ].map((item, i) => (
              <FloatingOrb key={i} delay={i * 0.2} yOffset={-3}>
                <motion.button
                  whileHover={{ y: -4, scale: 1.05 }}
                  onClick={() => toast.info(`${item.title}: ${item.desc}`)}
                  className="p-3 sm:p-4 bg-white/10 backdrop-blur rounded-xl border border-white/10 text-center hover:bg-white/15 transition-colors w-full"
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${item.color} flex items-center justify-center mx-auto mb-1.5 sm:mb-2`}>
                    <item.icon size={15} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm mb-0.5">{item.title}</h4>
                  <p className="text-[10px] sm:text-xs text-slate-400">{item.desc}</p>
                </motion.button>
              </FloatingOrb>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        <TiltCard>
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm h-full">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <BookOpen size={18} className="text-indigo-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Methodology</h3>
            </div>
            <ol className="space-y-3 sm:space-y-4">
              {[
                'Load creditcard.csv from Kaggle (284,808 rows)',
                'Inspect class distribution (0.17% fraud)',
                'Apply StandardScaler to Amount & Time',
                'Stratified 80/20 train-test split',
                'Train KNN (k=5) for distance-based classification',
                'Train Logistic Regression for probabilistic baseline',
                'Train SVM with RBF kernel for non-linear separation',
                'Train Decision Tree for interpretable rules',
                'Evaluate all four models with accuracy, precision, recall, F1',
                'Compare and select best model for deployment',
              ].map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="flex items-start gap-2.5 sm:gap-3"
                >
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{step}</span>
                </motion.li>
              ))}
            </ol>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm h-full">
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <FileText size={18} className="text-rose-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Limitations & Future Work</h3>
            </div>
            <div className="space-y-5 sm:space-y-6">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">Current Limitations</h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  {[
                    'PCA features (V1-V28) are not human-interpretable',
                    'No temporal modeling — fraud patterns may vary by time of day',
                    'Static model — does not adapt to evolving fraud tactics',
                    'Limited to binary classification (fraud vs legitimate)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      <span className="text-rose-400 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">Future Improvements</h4>
                <ul className="space-y-1.5 sm:space-y-2">
                  {[
                    'Add Random Forest and XGBoost ensemble comparison',
                    'Implement SMOTE for better class balancing',
                    'Add real-time streaming inference pipeline',
                    'Integrate SHAP values for model explainability',
                    'Merge telecom location data for geographic fraud detection',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      <span className="text-emerald-400 mt-1">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </TiltCard>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 sm:p-8 rounded-2xl text-white shadow-xl"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Ready to Explore?</h3>
            <p className="text-blue-100 text-xs sm:text-sm">Navigate through the platform to see the full fraud detection pipeline in action.</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => toast.info('Opening Model Training...')}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-blue-600 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-50 transition-colors shadow-lg"
            >
              Start Training
              <ArrowRight size={14} />
            </button>
            <a
              href={GITHUB_REPO.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-white/10 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-white/20 transition-colors border border-white/20"
            >
              View Source
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
