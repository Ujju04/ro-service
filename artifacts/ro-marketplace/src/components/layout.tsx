import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Droplet, Wrench, Settings, LogOut, User as UserIcon, MessageSquare, Shield, Activity, FileText } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Book Service", href: "/booking" },
    { label: "Products", href: "/products" },
    { label: "AMC Plans", href: "/amc" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 glass-panel border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Droplet className="text-white w-6 h-6" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-foreground">
              Aqua<span className="text-primary">Fix</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={clsx(
                  "text-sm font-semibold transition-colors hover:text-primary relative py-2",
                  location === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
                {location === item.href && (
                  <motion.div 
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/chat" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-colors relative">
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full animate-pulse" />
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {role === 'technician' ? (
                   <Link href="/technician" className="text-sm font-semibold text-tech hover:underline">Tech Dashboard</Link>
                ) : (
                   <Link href="/dashboard" className="text-sm font-semibold hover:text-primary flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                       <UserIcon className="w-4 h-4" />
                     </div>
                     {user?.name?.split(' ')[0] || 'Dashboard'}
                   </Link>
                )}
                <button onClick={logout} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/auth" className="px-6 py-2.5 rounded-full font-semibold bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all shadow-md hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5">
                Sign In
              </Link>
            )}
          </div>

          <button className="md:hidden p-2 text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-panel border-b border-border absolute top-20 left-0 right-0 z-40 overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-4">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className="p-3 rounded-lg hover:bg-primary/5 text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              <Link href="/chat" className="p-3 rounded-lg hover:bg-primary/5 text-foreground font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <MessageSquare className="w-5 h-5 text-primary" /> AI Assistant
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href={role === 'technician' ? "/technician" : "/dashboard"} className="p-3 rounded-lg hover:bg-primary/5 text-foreground font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <UserIcon className="w-5 h-5" /> Dashboard
                  </Link>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="p-3 rounded-lg text-left text-destructive font-medium flex items-center gap-2">
                    <LogOut className="w-5 h-5" /> Sign Out
                  </button>
                </>
              ) : (
                <Link href="/auth" className="p-3 text-center rounded-lg bg-primary text-primary-foreground font-medium mt-2" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Droplet className="text-primary w-6 h-6" />
              <span className="font-display font-bold text-2xl text-white">AquaFix</span>
            </div>
            <p className="text-sm text-slate-400">Premium RO service marketplace. Clean water, guaranteed repairs, transparent pricing.</p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/booking" className="hover:text-primary transition-colors">RO Repair</Link></li>
              <li><Link href="/booking" className="hover:text-primary transition-colors">Installation</Link></li>
              <li><Link href="/amc" className="hover:text-primary transition-colors">AMC Plans</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Parts Pricing</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors">Shop</Link></li>
              <li><Link href="/auth" className="hover:text-primary transition-colors">Join as Technician</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/chat" className="hover:text-primary transition-colors text-primary flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Talk to AI</Link></li>
              <li>Support: 1800-AQUA-FIX</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function TechLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/technician", icon: Activity },
    { label: "Available Jobs", href: "/technician/jobs", icon: Wrench },
    { label: "My Bills", href: "/technician/bills", icon: FileText },
    { label: "Profile", href: "/technician/profile", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-50 sticky top-0">
         <Link href="/technician" className="font-display font-bold text-xl flex items-center gap-2 text-white">
            <Wrench className="text-tech" /> TechPanel
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
      </div>

      {/* Sidebar */}
      <aside className={clsx(
        "w-64 bg-slate-900 text-slate-300 flex-col transition-all z-40 fixed md:sticky top-0 h-screen",
        mobileMenuOpen ? "flex" : "hidden md:flex"
      )}>
        <div className="p-6 border-b border-slate-800 hidden md:block">
          <Link href="/technician" className="font-display font-bold text-2xl flex items-center gap-2 text-white">
            <Wrench className="text-tech w-6 h-6" /> Tech<span className="text-tech">Panel</span>
          </Link>
        </div>
        
        <div className="p-6 flex items-center gap-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-full bg-tech/20 flex items-center justify-center text-tech font-bold">
            {user?.name?.charAt(0) || 'T'}
          </div>
          <div>
            <p className="text-white font-medium text-sm">{user?.name || 'Technician'}</p>
            <p className="text-xs text-tech flex items-center gap-1"><Shield className="w-3 h-3"/> Verified</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== '/technician');
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                  isActive ? "bg-tech/10 text-tech" : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className={clsx("w-5 h-5", isActive ? "text-tech" : "text-slate-400")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors w-full text-left text-sm font-medium"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
