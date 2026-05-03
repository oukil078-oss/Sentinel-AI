import { motion } from 'framer-motion';
import { Layers, Zap, Scissors, Scale, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import { GITHUB_REPO } from '../constants/data';
import { TiltCard } from './TiltCard';
import { FloatingOrb } from './FloatingOrb';

const steps = [
  {
    icon: Scissors,
    title: 'Data Cleaning & Feature Selection',
    description: 'The dataset contains 31 attributes: Time, Amount, V1-V28 (PCA-transformed), and Class. Due to confidentiality, the original features were transformed using PCA, leaving 28 anonymous numeric variables.',
    items: ['PCA Features (V1-V28)', 'Time (seconds elapsed)', 'Amount (transaction value)', 'Class (0=Legit, 1=Fraud)'],
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Scale,
    title: 'Feature Scaling (Critical for KNN & SVM)',
    description: 'KNN uses Euclidean distance and SVM uses margin optimization — both are sensitive to feature scale. The Amount column (up to €25,691) would dominate V1-V28 (centered around 0) without scaling.',
    items: ['StandardScaler (Z-Score)', 'Mean = 0, Std = 1', 'Amount & Time normalized'],
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: Layers,
    title: 'Stratified Train-Test Split',
    description: 'With only 492 fraud cases in 284,808 transactions, random splitting could leave the test set with no fraud examples. Stratified splitting ensures both sets maintain the 0.17% fraud ratio.',
    items: ['test_size = 0.20', 'stratify = Class', 'random_state = 42'],
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Zap,
    title: 'Model-Specific Preparation',
    description: 'Each algorithm has unique requirements. KNN and SVM need scaled data. Logistic Regression benefits from normalized inputs. Decision Trees are scale-invariant but need careful depth control.',
    items: ['KNN: Scaled + k=5', 'SVM: Scaled + RBF kernel', 'LR: Normalized + lbfgs', 'DT: Gini + max_depth'],
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    textColor: 'text-indigo-600 dark:text-indigo-400',
  },
];

export function Preprocessing() {
  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Data Preprocessing</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          Pipeline based on the{' '}
          <a href={GITHUB_REPO.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            reference repository
          </a>
          .
        </p>
      </motion.div>

      <TiltCard>
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-12 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex gap-4 sm:gap-6"
              >
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shrink-0 shadow-lg`}>
                    <step.icon size={22} className="sm:w-6 sm:h-6" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex flex-col items-center my-2">
                      <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 rotate-90" />
                      <div className="w-0.5 h-10 sm:h-16 bg-slate-100 dark:bg-slate-700 my-1"></div>
                    </div>
                  )}
                </div>
                <div className="pb-8 sm:pb-10">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${step.bgColor} ${step.textColor}`}>
                      STEP {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">{step.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-3 sm:mb-4 max-w-2xl text-xs sm:text-sm leading-relaxed">{step.description}</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {step.items.map((item) => (
                      <span key={item} className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] sm:text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-600">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center"
          >
            <div className="shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
              <Shield size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Zero Data Leakage Guarantee</h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Scaling is applied <strong>only</strong> to the training set. The test set remains completely untouched until final evaluation, ensuring honest metrics across all four models.
              </p>
            </div>
            <CheckCircle2 size={28} className="text-emerald-500 shrink-0 hidden sm:block" />
          </motion.div>
        </div>
      </TiltCard>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: 'Training Set', fraud: 394, legit: 227846, ratio: '0.17%' },
          { label: 'Test Set', fraud: 98, legit: 56863, ratio: '0.17%' },
          { label: 'Total Dataset', fraud: 492, legit: 284316, ratio: '0.17%' },
        ].map((item, i) => (
          <FloatingOrb key={i} delay={i * 0.2} yOffset={-4}>
            <TiltCard>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
              >
                <h4 className="font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">{item.label}</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Fraud</span>
                    <span className="font-bold text-rose-500">{item.fraud.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 sm:h-2">
                    <div className="bg-rose-500 h-1.5 sm:h-2 rounded-full transition-all" style={{ width: `${(item.fraud / (item.fraud + item.legit)) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Legitimate</span>
                    <span className="font-bold text-emerald-500">{item.legit.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 sm:h-2">
                    <div className="bg-emerald-500 h-1.5 sm:h-2 rounded-full transition-all" style={{ width: `${(item.legit / (item.fraud + item.legit)) * 100}%` }} />
                  </div>
                  <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                    <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">Fraud Ratio</span>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">{item.ratio}</span>
                  </div>
                </div>
              </motion.div>
            </TiltCard>
          </FloatingOrb>
        ))}
      </div>
    </div>
  );
}
