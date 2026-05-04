import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Database, Cpu, BarChart3, ShieldAlert, Info,
  Shield, Bell, Search, LogOut, Play, Menu, X, Activity,
  FileText, Sliders, FolderOpen, Sparkles, TrendingUp, Layers, ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

const PRIMARY_NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, testid: "nav-overview" },
  { to: "/transactions", label: "Transactions", icon: FileText, testid: "nav-transactions" },
  { to: "/cases", label: "Cases", icon: FolderOpen, testid: "nav-cases" },
  { to: "/prediction", label: "Predict", icon: ShieldAlert, testid: "nav-prediction" },
];

const SIDEBAR_NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, group: "Monitor" },
  { to: "/transactions", label: "Transactions", icon: FileText, group: "Monitor" },
  { to: "/cases", label: "Cases", icon: FolderOpen, group: "Monitor" },
  { to: "/rules", label: "Rules Engine", icon: Sliders, group: "Monitor" },
  { to: "/analysis", label: "Data Analysis", icon: Database, group: "Research" },
  { to: "/preprocessing", label: "Preprocessing", icon: Layers, group: "Research" },
  { to: "/models", label: "Model Training", icon: Cpu, group: "Research" },
  { to: "/evaluation", label: "Evaluation", icon: BarChart3, group: "Research" },
  { to: "/prediction", label: "Prediction Lab", icon: ShieldAlert, group: "Research" },
  { to: "/audit", label: "Audit Log", icon: Activity, group: "System" },
  { to: "/about", label: "About", icon: Info, group: "System" },
];

function GroupedSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const groups = SIDEBAR_NAV.reduce((acc: any, item) => {
    acc[item.group] = acc[item.group] || [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(groups).map(([group, items]: [string, any]) => (
        <div key={group}>
          <p className="px-3 text-[10px] uppercase tracking-[0.25em] text-[#5A5A63] font-bold mb-2">
            {group}
          </p>
          <nav className="flex flex-col gap-0.5">
            {items.map((item: any) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                end={item.to === "/"}
                data-testid={`sidebar-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    isActive
                      ? "bg-[#C6F24E]/10 text-[#C6F24E]"
                      : "text-[#8A8A93] hover:text-white hover:bg-white/5"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      strokeWidth={isActive ? 2.2 : 1.6}
                      className={cn("w-[18px] h-[18px] shrink-0 transition-colors",
                        isActive ? "text-[#C6F24E]" : "text-[#8A8A93] group-hover:text-white")}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="w-1 h-5 rounded-full bg-[#C6F24E]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
    </div>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen w-full bg-[#0B0B0D] text-white relative">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-[#C6F24E]/[0.04] blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#C6F24E]/[0.03] blur-[120px] rounded-full" />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-[280px] bg-[#0B0B0D] z-[70] flex flex-col border-r border-white/5 overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C6F24E] flex items-center justify-center text-[#0B0B0D]">
                    <Shield strokeWidth={2.5} className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="font-display text-base font-medium text-white">Sentinel AI</p>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#8A8A93] font-semibold">Fraud Ops</p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-[#8A8A93] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 p-6 pt-0">
                <GroupedSidebar onNavigate={() => setMobileOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-white/5 bg-[#0B0B0D]/95 backdrop-blur-xl z-40">
        <div className="flex items-center gap-3 p-6 pb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#C6F24E] flex items-center justify-center text-[#0B0B0D]">
            <Shield strokeWidth={2.5} className="w-5 h-5" />
          </div>
          <div>
            <p className="font-display text-base font-medium text-white tracking-tight">Sentinel AI</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#8A8A93] font-semibold">Fraud Ops</p>
          </div>
        </div>

        <div className="flex-1 px-4 py-2 overflow-y-auto">
          <GroupedSidebar />
        </div>

        {/* Bottom system status */}
        <div className="p-4 border-t border-white/5">
          <div className="p-3 rounded-2xl bg-[#151518] border border-white/5 flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C6F24E] pulse-dot" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-white">5 Models Online</p>
              <p className="text-[10px] text-[#8A8A93]">RF · KNN · LR · DT · SVM</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Top header */}
      <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex items-center gap-4 justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              data-testid="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 rounded-full bg-[#151518] border border-white/10 flex items-center justify-center text-white hover:bg-white/5"
            >
              <Menu className="w-4 h-4" strokeWidth={2} />
            </button>

            {/* Pill top nav (inspired by reference) */}
            <div className="hidden md:flex items-center gap-1 p-1.5 bg-[#151518]/80 backdrop-blur-xl rounded-full border border-white/5 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
              {PRIMARY_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  data-testid={item.testid}
                  className={({ isActive }) =>
                    cn(
                      "relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors",
                      isActive ? "text-[#0B0B0D]" : "text-[#8A8A93] hover:text-white"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="pill-nav-active"
                          className="absolute inset-0 bg-[#C6F24E] rounded-full shadow-[0_0_24px_rgba(198,242,78,0.4)]"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <item.icon className="relative w-4 h-4" strokeWidth={2} />
                      <span className="relative">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              data-testid="search-btn"
              onClick={() => navigate("/transactions")}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-[#151518] border border-white/5 text-[#8A8A93] hover:text-white hover:border-white/10 transition-all text-xs"
            >
              <Search className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden lg:inline">Search transactions…</span>
              <kbd className="hidden lg:inline ml-4 px-1.5 py-0.5 text-[10px] bg-white/5 rounded-md border border-white/10 font-mono">⌘ K</kbd>
            </button>

            <button
              data-testid="present-mode-btn"
              onClick={() => navigate("/present")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C6F24E] text-[#0B0B0D] font-semibold text-xs hover:bg-[#D4F475] transition-all shadow-[0_4px_20px_rgba(198,242,78,0.2)] hover:shadow-[0_4px_30px_rgba(198,242,78,0.4)]"
            >
              <Play className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="hidden sm:inline">Present</span>
            </button>

            <button
              data-testid="notifications-btn"
              className="relative w-10 h-10 rounded-full bg-[#151518] border border-white/5 flex items-center justify-center text-white hover:border-white/10"
              onClick={() => navigate("/cases")}
            >
              <Bell className="w-4 h-4" strokeWidth={1.8} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF3B30] border-2 border-[#0B0B0D] pulse-dot" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                data-testid="user-menu-btn"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-[#151518] border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#C6F24E] to-[#9FC63B] flex items-center justify-center text-[#0B0B0D] text-xs font-bold">
                      {user?.name?.[0] || "A"}
                    </div>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[11px] font-semibold text-white leading-tight truncate max-w-[110px]">{user?.name || "Analyst"}</p>
                  <p className="text-[9px] uppercase tracking-[0.18em] text-[#8A8A93] font-bold">{user?.role || "analyst"}</p>
                </div>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#151518] border border-white/10 shadow-2xl p-2 z-50"
                  >
                    <div className="px-3 py-3 border-b border-white/5 mb-2">
                      <p className="text-xs text-[#8A8A93]">Signed in as</p>
                      <p className="text-sm text-white font-medium truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => navigate("/about")}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[#8A8A93] hover:text-white hover:bg-white/5"
                    >
                      <Info className="w-4 h-4" strokeWidth={1.8} /> About Sentinel
                    </button>
                    <button
                      data-testid="logout-btn"
                      onClick={logout}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[#FF3B30] hover:bg-[#FF3B30]/10"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={1.8} /> Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="lg:ml-64 pt-24 pb-10 px-4 sm:px-6 lg:px-8 relative z-10 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
            className="max-w-[1600px] mx-auto"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>

        <footer className="max-w-[1600px] mx-auto mt-16 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#5A5A63]">
          <p>© 2026 Sentinel AI. Built on Kaggle creditcardfraud — SMOTE-trained models.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6F24E] pulse-dot" />
              All systems operational
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span className="font-mono">v2.0.0</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
