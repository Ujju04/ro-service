import { MainLayout } from "@/components/layout";
import { Card, Button, FadeIn, Badge } from "@/components/ui/shared";
import { useGetAmcPlans, useSubscribeAmcPlan } from "@workspace/api-client-react";
import { CheckCircle2, Shield } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";

export default function AmcPlans() {
  const { data: plans, isLoading } = useGetAmcPlans();
  const subscribe = useSubscribeAmcPlan();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubscribe = async (planId: number) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }
    try {
      await subscribe.mutateAsync({ data: { planId } });
      alert("Successfully subscribed! View in dashboard.");
      setLocation('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <div className="bg-slate-50 min-h-screen py-20 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="default" className="mb-4"><Shield className="w-3 h-3 mr-1"/> Annual Maintenance Contracts</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Peace of Mind for a Full Year</h1>
            <p className="text-lg text-muted-foreground">Keep your water purifier running smoothly with our comprehensive AMC plans. No hidden charges, guaranteed service.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {isLoading ? (
               [1,2,3].map(n => <Card key={n} className="h-[500px] animate-pulse bg-slate-200" />)
            ) : plans?.map((plan, i) => {
              const isPopular = plan.name.toLowerCase().includes('standard') || i === 1;
              return (
                <FadeIn key={plan.id} delay={i * 0.1}>
                  <Card className={`relative h-full flex flex-col p-8 transition-transform duration-300 hover:-translate-y-2 ${isPopular ? 'border-2 border-primary shadow-2xl shadow-primary/20 scale-105 z-10' : 'border border-border shadow-lg'}`}>
                    {isPopular && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                        Most Popular
                      </div>
                    )}
                    
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm h-10">{plan.description}</p>
                    
                    <div className="my-6">
                      <span className="text-4xl font-bold text-foreground">₹{plan.price}</span>
                      <span className="text-muted-foreground">/yr</span>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm font-medium">{plan.servicesIncluded} Free Service Visits</span>
                      </li>
                      {plan.features?.map((f, j) => (
                        <li key={j} className="flex items-start gap-3 text-muted-foreground">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                          <span className="text-sm">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      variant={isPopular ? 'primary' : 'outline'} 
                      size="lg" 
                      className="w-full"
                      onClick={() => handleSubscribe(plan.id)}
                      isLoading={subscribe.isPending}
                    >
                      Subscribe Now
                    </Button>
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
