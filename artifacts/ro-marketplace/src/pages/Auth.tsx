import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { Card, Input, Button, FadeIn } from "@/components/ui/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User as UserIcon, Phone, MapPin, Building, Briefcase } from "lucide-react";
import { useRegisterUser, useLoginUser, useRegisterTechnician, useLoginTechnician } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";

// Local Zod schemas matching API requirements
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const userRegSchema = loginSchema.extend({
  name: z.string().min(2),
  phone: z.string().min(10),
  city: z.string().optional()
});

const techRegSchema = userRegSchema.extend({
  city: z.string().min(2), // Required for techs
  experience: z.coerce.number().min(0).optional()
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'user' | 'technician'>('user');
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const userLogin = useLoginUser();
  const userReg = useRegisterUser();
  const techLogin = useLoginTechnician();
  const techReg = useRegisterTechnician();

  const form = useForm({
    resolver: zodResolver(
      isLogin ? loginSchema : (role === 'user' ? userRegSchema : techRegSchema)
    ),
    defaultValues: { email: '', password: '', name: '', phone: '', city: '', experience: 0 }
  });

  const onSubmit = async (data: any) => {
    try {
      let res;
      if (isLogin) {
        if (role === 'user') res = await userLogin.mutateAsync({ data });
        else res = await techLogin.mutateAsync({ data });
      } else {
        if (role === 'user') res = await userReg.mutateAsync({ data });
        else res = await techReg.mutateAsync({ data });
      }
      
      login(res.token, res.role);
      setLocation(res.role === 'technician' ? '/technician' : '/dashboard');
    } catch (err) {
      console.error("Auth error", err);
      // In a real app, use toast here
    }
  };

  const isLoading = userLogin.isPending || userReg.isPending || techLogin.isPending || techReg.isPending;

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 bg-slate-50 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent" />
        
        <FadeIn className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {role === 'user' ? 'Manage your RO services easily.' : 'Join as a professional technician.'}
            </p>
          </div>

          <Card className="p-8 shadow-2xl shadow-primary/5">
            {/* Role Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${role === 'user' ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('technician')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${role === 'technician' ? 'bg-white shadow text-tech' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Technician
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!isLogin && (
                <>
                  <Input 
                    placeholder="Full Name" 
                    icon={<UserIcon className="w-5 h-5"/>} 
                    {...form.register('name')}
                    error={form.formState.errors.name?.message as string}
                  />
                  <Input 
                    placeholder="Phone Number" 
                    icon={<Phone className="w-5 h-5"/>} 
                    {...form.register('phone')}
                    error={form.formState.errors.phone?.message as string}
                  />
                  {(role === 'technician' || !isLogin) && (
                    <Input 
                      placeholder="City" 
                      icon={<Building className="w-5 h-5"/>} 
                      {...form.register('city')}
                      error={form.formState.errors.city?.message as string}
                    />
                  )}
                  {role === 'technician' && !isLogin && (
                    <Input 
                      type="number"
                      placeholder="Years of Experience" 
                      icon={<Briefcase className="w-5 h-5"/>} 
                      {...form.register('experience')}
                      error={form.formState.errors.experience?.message as string}
                    />
                  )}
                </>
              )}
              
              <Input 
                type="email"
                placeholder="Email Address" 
                icon={<Mail className="w-5 h-5"/>} 
                {...form.register('email')}
                error={form.formState.errors.email?.message as string}
              />
              <Input 
                type="password"
                placeholder="Password" 
                icon={<Lock className="w-5 h-5"/>} 
                {...form.register('password')}
                error={form.formState.errors.password?.message as string}
              />

              <Button 
                type="submit" 
                className="w-full mt-6" 
                size="lg"
                variant={role === 'technician' ? 'tech' : 'primary'}
                isLoading={isLoading}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); form.reset(); }} 
                className={`font-semibold hover:underline ${role === 'technician' ? 'text-tech' : 'text-primary'}`}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </Card>
        </FadeIn>
      </div>
    </MainLayout>
  );
}
