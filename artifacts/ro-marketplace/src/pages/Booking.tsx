import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { Card, Input, Button, FadeIn, Badge } from "@/components/ui/shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Calendar, Clock, AlertTriangle, Droplet, Wrench, Shield, CheckCircle } from "lucide-react";
import { useCreateBooking } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { useLocation, Link } from "wouter";

const bookingSchema = z.object({
  serviceType: z.enum(['repair', 'installation', 'amc', 'inspection']),
  bookingType: z.enum(['instant', 'scheduled']),
  address: z.string().min(10, "Please provide full address"),
  city: z.string().min(2, "City is required"),
  symptoms: z.string().optional(),
  scheduledAt: z.string().optional()
});

export default function Booking() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const createBooking = useCreateBooking();
  const [success, setSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceType: 'repair' as const,
      bookingType: 'instant' as const,
      address: '',
      city: '',
      symptoms: '',
      scheduledAt: ''
    }
  });

  const bookingType = form.watch('bookingType');
  const serviceType = form.watch('serviceType');

  const commonSymptoms = ["Water leakage", "Making noise", "Bad taste", "Not turning on", "Low water flow", "Filter change needed"];

  const toggleSymptom = (sym: string) => {
    const current = form.getValues('symptoms') || '';
    if (current.includes(sym)) {
      form.setValue('symptoms', current.replace(sym + ", ", "").replace(sym, ""));
    } else {
      form.setValue('symptoms', current ? `${current}, ${sym}` : sym);
    }
  };

  const onSubmit = async (data: any) => {
    if (!isAuthenticated) {
      setLocation('/auth');
      return;
    }
    
    // Default location for demo purposes if browser geolocation fails
    data.lat = 28.6139;
    data.lng = 77.2090;

    if (data.bookingType === 'scheduled' && data.scheduledAt) {
      data.scheduledAt = new Date(data.scheduledAt).toISOString();
    } else {
      delete data.scheduledAt;
    }

    try {
      await createBooking.mutateAsync({ data });
      setSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (success) {
    return (
      <MainLayout>
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <FadeIn>
            <Card className="max-w-md p-10 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Booking Confirmed!</h2>
              <p className="text-muted-foreground mb-8">
                {bookingType === 'instant' 
                  ? "We are assigning the nearest technician to your location."
                  : "Your service has been scheduled. A technician will arrive at the selected time."}
              </p>
              <Link href="/dashboard">
                <Button className="w-full">Track Booking</Button>
              </Link>
            </Card>
          </FadeIn>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4">
          <FadeIn>
            <h1 className="text-4xl font-bold mb-2 text-foreground">Book RO Service</h1>
            <p className="text-muted-foreground mb-8 text-lg">Fast, reliable, and transparent service at your doorstep.</p>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="p-6 md:p-8 space-y-8 shadow-xl shadow-primary/5">
                
                {/* Service Type */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Wrench className="w-5 h-5 text-primary"/> 1. Select Service</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'repair', label: 'Repair', icon: <Wrench/> },
                      { id: 'installation', label: 'Install', icon: <Droplet/> },
                      { id: 'amc', label: 'AMC', icon: <Shield/> },
                      { id: 'inspection', label: 'Inspect', icon: <AlertTriangle/> }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => form.setValue('serviceType', type.id as any)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${serviceType === type.id ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'}`}
                      >
                        <div className="mb-2">{type.icon}</div>
                        <span className="font-semibold text-sm">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />

                {/* Booking Type */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> 2. When do you need it?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => form.setValue('bookingType', 'instant')}
                      className={`text-left p-5 rounded-xl border-2 transition-all ${bookingType === 'instant' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                    >
                      <Badge variant="success" className="mb-2">Recommended</Badge>
                      <h4 className="font-bold text-lg mb-1 text-foreground">Instant Service</h4>
                      <p className="text-sm text-muted-foreground">Find nearest tech within 30 mins</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => form.setValue('bookingType', 'scheduled')}
                      className={`text-left p-5 rounded-xl border-2 transition-all ${bookingType === 'scheduled' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                    >
                      <Badge variant="default" className="mb-2">Plan Ahead</Badge>
                      <h4 className="font-bold text-lg mb-1 text-foreground">Schedule Later</h4>
                      <p className="text-sm text-muted-foreground">Pick a specific date and time</p>
                    </button>
                  </div>
                  
                  {bookingType === 'scheduled' && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-4">
                      <Input 
                        type="datetime-local" 
                        icon={<Calendar className="w-5 h-5"/>}
                        {...form.register('scheduledAt')}
                        error={form.formState.errors.scheduledAt?.message as string}
                      />
                    </div>
                  )}
                </div>

                <hr className="border-border" />

                {/* Location */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary"/> 3. Where?</h3>
                  <div className="space-y-4">
                    <Input 
                      placeholder="City (e.g. Delhi, Mumbai)" 
                      {...form.register('city')}
                      error={form.formState.errors.city?.message as string}
                    />
                    <textarea 
                      placeholder="Complete Address (House No, Building, Area, Pincode)"
                      className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 resize-none h-24"
                      {...form.register('address')}
                    ></textarea>
                    {form.formState.errors.address && <p className="text-xs text-destructive font-medium">{form.formState.errors.address.message as string}</p>}
                  </div>
                </div>

                {/* Symptoms (Only for repair) */}
                {serviceType === 'repair' && (
                  <>
                    <hr className="border-border" />
                    <div>
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-primary"/> 4. What's wrong? (Optional)</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {commonSymptoms.map(sym => {
                          const isSelected = form.watch('symptoms')?.includes(sym);
                          return (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => toggleSymptom(sym)}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${isSelected ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/50'}`}
                            >
                              {sym}
                            </button>
                          );
                        })}
                      </div>
                      <Input 
                        placeholder="Or describe the issue in detail..." 
                        {...form.register('symptoms')}
                      />
                    </div>
                  </>
                )}

                {/* Estimates preview */}
                <div className="bg-slate-100 p-5 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-foreground">Estimated Visit Charge</h4>
                    <p className="text-sm text-muted-foreground">Parts extra as per transparent pricing</p>
                  </div>
                  <div className="text-2xl font-bold text-foreground">₹299</div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full text-lg"
                  isLoading={createBooking.isPending}
                >
                  {isAuthenticated ? 'Confirm Booking' : 'Login to Book'}
                </Button>
              </Card>
            </form>
          </FadeIn>
        </div>
      </div>
    </MainLayout>
  );
}
