import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area
} from 'recharts';
import { Search, Filter, Download, Eye, Database, BarChart2, PieChart as PieIcon, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';
import { CLASS_DISTRIBUTION, CORRELATION_DATA, AMOUNT_DISTRIBUTION } from '../constants/data';
import { TiltCard } from './TiltCard';
import { toast } from './Toast';

const sampleRows = [
  { time: 0, v1: -1.36, v2: -0.07, v3: 2.53, v4: 1.37, v5: -0.33, amount: 149.62, class: 0 },
  { time: 0, v1: 1.19, v2: 0.26, v3: 0.16, v4: 0.44, v5: 0.06, amount: 2.69, class: 0 },
  { time: 1, v1: -1.35, v2: -1.34, v3: 1.77, v4: 0.37, v5: -0.50, amount: 378.66, class: 0 },
  { time: 1, v1: -0.96, v2: -0.18, v3: 1.79, v4: 0.41, v5: 0.09, amount: 123.50, class: 0 },
  { time: 2, v1: -1.15, v2: 0.87, v3: -2.27, v4: 1.29, v5: -1.15, amount: 69.99, class: 0 },
  { time: 2, v1: -0.42, v2: 0.96, v3: 1.10, v4: -0.24, v5: 0.59, amount: 3.67, class: 0 },
  { time: 4, v1: 1.22, v2: -0.24, v3: 0.41, v4: 0.41, v5: -0.16, amount: 4.99, class: 0 },
  { time: 7, v1: -0.64, v2: 1.41, v3: -0.73, v4: -0.06, v5: -0.46, amount: 40.80, class: 0 },
  { time: 7, v1: -0.62, v2: -0.73, v3: 2.10, v4: 1.15, v5: 0.40, amount: 93.20, class: 0 },
  { time: 9, v1: -0.53, v2: -0.17, v3: 0.31, v4: 0.41, v5: -0.26, amount: 3.68, class: 0 },
  { time: 10, v1: 1.25, v2: -1.22, v3: -0.65, v4: -0.10, v5: 0.29, amount: 7.80, class: 0 },
  { time: 10, v1: -0.64, v2: 1.41, v3: -0.73, v4: -0.06, v5: -0.46, amount: 14.00, class: 0 },
  { time: 10, v1: -0.99, v2: 0.12, v3: -1.11, v4: 0.13, v5: 0.14, amount: 3.51, class: 0 },
  { time: 11, v1: -0.31, v2: 0.81, v3: -0.16, v4: 0.41, v5: -0.14, amount: 3.13, class: 0 },
  { time: 12, v1: 1.25, v2: -0.58, v3: 0.12, v4: 0.23, v5: -0.14, amount: 15.99, class: 0 },
];

const fraudRows = [
  { time: 406, v1: -2.31, v2: 1.94, v3: -2.73, v4: 1.29, v5: -0.63, amount: 529.00, class: 1 },
  { time: 472, v1: -3.04, v2: -3.05, v3: 1.19, v4: 1.88, v5: -0.63, amount: 239.93, class: 1 },
  { time: 4462, v1: -2.30, v2: 1.79, v3: -0.18, v4: 0.38, v5: -0.23, amount: 59.00, class: 1 },
  { time: 5828, v1: -3.04, v2: -2.20, v3: 1.21, v4: 1.88, v5: -0.63, amount: 1.00, class: 1 },
];

function downloadCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${filename}`);
}

export function EDA() {
  const [showFraudOnly, setShowFraudOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const displayRows = showFraudOnly ? fraudRows : sampleRows;

  const sortedRows = useMemo(() => {
    let rows = displayRows.filter(r =>
      r.time.toString().includes(searchTerm) ||
      r.amount.toString().includes(searchTerm) ||
      r.v1.toString().includes(searchTerm)
    );
    if (sortCol) {
      rows = [...rows].sort((a: any, b: any) => {
        const diff = a[sortCol] - b[sortCol];
        return sortAsc ? diff : -diff;
      });
    }
    return rows;
  }, [displayRows, searchTerm, sortCol, sortAsc]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'distribution', label: 'Distributions', icon: PieIcon },
    { id: 'table', label: 'Data Explorer', icon: Database },
  ];

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <ChevronDown size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortAsc ? <ChevronDown size={12} className="text-blue-500" /> : <ChevronUp size={12} className="text-blue-500" />;
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Exploratory Data Analysis</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Uncovering patterns and distribution characteristics.</p>
      </motion.div>

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl w-fit overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <TiltCard>
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Class Distribution</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Extreme imbalance: 99.83% vs 0.17%</p>
                </div>
                <button
                  onClick={() => downloadCSV([{ class: 'Legitimate', count: 284315 }, { class: 'Fraudulent', count: 492 }], 'class_distribution.csv')}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="h-56 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={CLASS_DISTRIBUTION} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={8} dataKey="value">
                      {CLASS_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => value.toLocaleString()} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                  <strong>Critical:</strong> Standard accuracy is misleading. A naive classifier predicting "legitimate" every time achieves 99.83% accuracy.
                </p>
              </div>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Feature Correlation</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Top 10 PCA features vs fraud</p>
                </div>
                <button
                  onClick={() => downloadCSV(CORRELATION_DATA, 'correlation_data.csv')}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="h-56 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CORRELATION_DATA} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={30} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="correlation" radius={[0, 4, 4, 0]} barSize={16}>
                      {CORRELATION_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.correlation > 0 ? '#3b82f6' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                  <strong>Insight:</strong> V17, V14, and V12 show strongest negative correlation with fraud.
                </p>
              </div>
            </div>
          </TiltCard>
        </motion.div>
      )}

      {activeTab === 'distribution' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 sm:space-y-8">
          <TiltCard>
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Transaction Amount Distribution</h3>
                <button
                  onClick={() => downloadCSV(AMOUNT_DISTRIBUTION, 'amount_distribution.csv')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={AMOUNT_DISTRIBUTION}>
                    <defs>
                      <linearGradient id="amountGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#amountGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TiltCard>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { label: 'Mean Amount', value: '$88.34', desc: 'Average transaction' },
              { label: 'Max Amount', value: '$25,691', desc: 'Largest transaction' },
              { label: 'Fraud Avg', value: '$122.21', desc: 'Avg fraudulent amt' },
            ].map((stat, i) => (
              <TiltCard key={i}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => toast.info(`${stat.label}: ${stat.value} — ${stat.desc}`)}
                >
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">{stat.desc}</p>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'table' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Dataset Explorer</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Sample rows from creditcard.csv</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="relative flex-1 sm:flex-none">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-44"
                />
              </div>
              <button
                onClick={() => setShowFraudOnly(!showFraudOnly)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  showFraudOnly
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Filter size={13} />
                <span className="hidden sm:inline">{showFraudOnly ? 'Show All' : 'Fraud Only'}</span>
              </button>
              <button
                onClick={() => downloadCSV(sortedRows, 'creditcard_sample.csv')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                <FileSpreadsheet size={13} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 text-left">
                  {[
                    { key: 'time', label: 'Time' },
                    { key: 'v1', label: 'V1' },
                    { key: 'v2', label: 'V2' },
                    { key: 'v3', label: 'V3' },
                    { key: 'v4', label: 'V4' },
                    { key: 'v5', label: 'V5' },
                    { key: 'amount', label: 'Amt' },
                    { key: 'class', label: 'Cls' },
                  ].map(h => (
                    <th key={h.key} className="px-3 sm:px-6 py-2.5 sm:py-3 font-semibold text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">
                      <button onClick={() => handleSort(h.key)} className="flex items-center gap-1 group">
                        {h.label}
                        <SortIcon col={h.key} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, i) => (
                  <>
                    <tr
                      key={i}
                      className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                    >
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-slate-900 dark:text-white font-mono">{row.time}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-slate-600 dark:text-slate-300 font-mono">{row.v1.toFixed(2)}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-slate-600 dark:text-slate-300 font-mono">{row.v2.toFixed(2)}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-slate-600 dark:text-slate-300 font-mono">{row.v3.toFixed(2)}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-slate-600 dark:text-slate-300 font-mono">{row.v4.toFixed(2)}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-slate-600 dark:text-slate-300 font-mono">{row.v5.toFixed(2)}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-slate-900 dark:text-white font-bold">${row.amount.toFixed(2)}</td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3">
                        <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                          row.class === 1
                            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          <Eye size={10} className="hidden sm:inline" />
                          {row.class === 1 ? 'Fraud' : 'Legit'}
                        </span>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedRow === i && (
                        <motion.tr
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td colSpan={8} className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-700/30">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs">
                              <div>
                                <span className="text-slate-400">V6-V10:</span>
                                <span className="ml-2 font-mono text-slate-600 dark:text-slate-300">{row.v1.toFixed(2)}, {row.v2.toFixed(2)}, {row.v3.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Risk:</span>
                                <span className={`ml-2 font-bold ${row.class === 1 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {row.class === 1 ? 'High' : 'Low'}
                                </span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); toast.info(`Row ${i + 1} selected for analysis`); }}
                                className="ml-auto px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                              >
                                Analyze
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
              Showing {sortedRows.length} of {showFraudOnly ? '492 fraud' : '284,807 total'} records
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => toast.info('Previous page')} className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Prev
              </button>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 px-2">1 / 18,987</span>
              <button onClick={() => toast.info('Next page')} className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Next
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
