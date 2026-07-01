import { useState, FormEvent } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Lock, Mail, Sparkles, TrendingUp, Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export function LoginPage() {
  const { login, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("analyst@sentinel.ai");
  const [password, setPassword] = useState("Sentinel2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    const from = (location.state as any)?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      toast("Welcome back, Zakarya", "success");
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed");
      toast(err.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--th-bg)] overflow-hidden relative">
      {/* Animated orb */}
      <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-[#C6F24E]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 -right-40 w-[600px] h-[600px] bg-[#C6F24E]/5 blur-[140px] rounded-full" />

      <div className="relative min-h-screen grid lg:grid-cols-2">
        {/* Left — brand panel */}
        <div className="relative hidden lg:flex flex-col p-12 xl:p-16 border-r border-[var(--th-border)]">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#C6F24E] flex items-center justify-center text-[#0B0B0D]">
                <Shield strokeWidth={2.5} className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-xl font-medium text-[var(--th-text)] tracking-tight">Sentinel AI</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--th-text-secondary)] font-semibold">Fraud Detection Platform</p>
              </div>
            </div>

            <div className="mt-24 max-w-xl">
              <p className="text-xs uppercase tracking-[0.25em] text-[#C6F24E] font-bold mb-6">
                v2.0 · ML-powered
              </p>
              <h1 className="font-display text-5xl xl:text-6xl font-light tracking-tight leading-[1.05] text-[var(--th-text)] text-balance mb-8">
                Stop fraud before it costs your business a cent.
              </h1>
              <p className="text-lg text-[var(--th-text-secondary)] leading-relaxed max-w-lg">
                Real-time scoring on 284K+ transactions using Random Forest, KNN, and SMOTE.
                Built by analysts, for analysts.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg">
              {[
                { icon: Activity, label: "Accuracy", value: "99.98%" },
                { icon: Sparkles, label: "Models", value: "5" },
                { icon: TrendingUp, label: "ROC-AUC", value: "0.999" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="border-t border-[var(--th-border-strong)] pt-4"
                >
                  <s.icon className="w-4 h-4 text-[#C6F24E] mb-3" strokeWidth={2} />
                  <p className="font-mono font-light text-2xl text-[var(--th-text)] tnum">{s.value}</p>
                  <p className="text-xs text-[var(--th-text-secondary)] mt-1 font-medium">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-auto pt-8 text-xs text-[var(--th-text-dim)] font-mono">
            <p>Kaggle creditcardfraud · 284,807 tx · 0.17% fraud · SMOTE-resampled</p>
          </div>
        </div>

        {/* Right — form */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            {/* mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-2xl bg-[#C6F24E] flex items-center justify-center text-[#0B0B0D]">
                <Shield strokeWidth={2.5} className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display text-xl font-medium text-[var(--th-text)] tracking-tight">Sentinel AI</p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--th-text-secondary)] font-semibold">Fraud Detection</p>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--th-text-secondary)] font-bold mb-3">Analyst Login</p>
              <h2 className="font-display text-4xl font-light text-[var(--th-text)] mb-3 tracking-tight">
                Sign in to your<br />workstation.
              </h2>
              <p className="text-[var(--th-text-secondary)] text-sm mb-10">
                Use your pre-seeded demo credentials below.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-[var(--th-text-secondary)] font-bold mb-2.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--th-text-dim)]" strokeWidth={2} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="login-email-input"
                      className="w-full bg-[var(--th-surface)] border border-[var(--th-border-strong)] rounded-2xl pl-11 pr-4 py-4 text-[var(--th-text)] text-sm placeholder:text-[var(--th-text-dim)] focus:border-[#C6F24E]/50 focus:outline-none focus:ring-2 focus:ring-[#C6F24E]/20 transition-all"
                      placeholder="analyst@sentinel.ai"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-[var(--th-text-secondary)] font-bold mb-2.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--th-text-dim)]" strokeWidth={2} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="login-password-input"
                      className="w-full bg-[var(--th-surface)] border border-[var(--th-border-strong)] rounded-2xl pl-11 pr-4 py-4 text-[var(--th-text)] text-sm placeholder:text-[var(--th-text-dim)] focus:border-[#C6F24E]/50 focus:outline-none focus:ring-2 focus:ring-[#C6F24E]/20 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-2xl p-4 text-sm text-[#FF3B30]"
                    data-testid="login-error"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="login-submit-btn"
                  className="w-full bg-[#C6F24E] hover:bg-[#D4F475] text-[#0B0B0D] font-semibold rounded-full py-4 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed group shadow-lg hover:shadow-[0_0_40px_rgba(198,242,78,0.4)]"
                >
                  {loading ? "Authenticating…" : (
                    <>
                      Sign in securely
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 p-5 rounded-2xl bg-[var(--th-surface)] border border-[var(--th-border)]">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--th-text-secondary)] font-bold mb-3">Demo Credentials</p>
                <div className="space-y-1.5 font-mono text-xs text-[var(--th-text)] tnum">
                  <p><span className="text-[var(--th-text-secondary)]">email:</span> analyst@sentinel.ai</p>
                  <p><span className="text-[var(--th-text-secondary)]">pass:</span> Sentinel2026!</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
