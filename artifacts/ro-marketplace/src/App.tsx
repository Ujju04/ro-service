import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/auth-context";

// Import Pages
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Booking from "@/pages/Booking";
import Products from "@/pages/Products";
import AmcPlans from "@/pages/AmcPlans";
import Chat from "@/pages/Chat";
import Pricing from "@/pages/Pricing";
import UserDashboard from "@/pages/user/Dashboard";
import TechnicianDashboard from "@/pages/technician/Dashboard";
import TechnicianJobs from "@/pages/technician/Jobs";
import TechnicianBills from "@/pages/technician/Bills";
import TechnicianProfile from "@/pages/technician/Profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Setup global fetch interceptor to inject JWT token from localStorage.
// Uses new Headers() to correctly copy any existing Headers object so that
// headers like Content-Type are preserved alongside the Authorization header.
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;

  if (typeof resource === 'string' && resource.includes('/api')) {
    const token = localStorage.getItem('ro_token');
    if (token) {
      const headers = new Headers(config?.headers);
      headers.set('Authorization', `Bearer ${token}`);
      config = { ...(config || {}), headers };
    }
  }
  return originalFetch(resource, config);
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/booking" component={Booking} />
      <Route path="/products" component={Products} />
      <Route path="/amc" component={AmcPlans} />
      <Route path="/chat" component={Chat} />
      <Route path="/pricing" component={Pricing} />

      {/* User dashboard */}
      <Route path="/dashboard" component={UserDashboard} />

      {/* Technician dashboard and sub-pages */}
      <Route path="/technician" component={TechnicianDashboard} />
      <Route path="/technician/jobs" component={TechnicianJobs} />
      <Route path="/technician/bills" component={TechnicianBills} />
      <Route path="/technician/profile" component={TechnicianProfile} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
