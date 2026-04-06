import { useState } from "react";
import { Link } from "wouter";
import { TechLayout } from "@/components/layout";
import { Card, Button, FadeIn, Badge } from "@/components/ui/shared";
import { useGetTechnicianEarnings, useGetTechnicianBookings, useUpdateAvailability, useAcceptBooking, useRejectBooking } from "@workspace/api-client-react";
import { Wallet, CheckCircle, Clock, MapPin, Navigation, IndianRupee, Wrench } from "lucide-react";
import { format } from "date-fns";

export default function TechnicianDashboard() {
  const { data: earnings, isLoading: earningsLoading } = useGetTechnicianEarnings();
  const { data: bookings, isLoading: bookingsLoading, refetch } = useGetTechnicianBookings();
  const toggleAvail = useUpdateAvailability();
  const accept = useAcceptBooking();
  const reject = useRejectBooking();

  const [isOnline, setIsOnline] = useState(true); // Should read from tech profile in real app

  const handleToggleOnline = async () => {
    try {
      await toggleAvail.mutateAsync({ data: { isAvailable: !isOnline }});
      setIsOnline(!isOnline);
    } catch (e) { console.error(e); }
  };

  const handleAccept = async (id: number) => {
    await accept.mutateAsync({ id });
    refetch();
  };

  const handleReject = async (id: number) => {
    await reject.mutateAsync({ id });
    refetch();
  };

  const pendingBookings = bookings?.filter(b => b.status === 'pending') || [];
  const activeBookings = bookings?.filter(b => b.status === 'accepted' || b.status === 'in_progress') || [];

  return (
    <TechLayout>
      <FadeIn>
        {/* Top Bar / Online Toggle */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 text-sm">Here's your job summary for today.</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="font-bold text-sm text-slate-700 w-16">{isOnline ? 'Online' : 'Offline'}</span>
            <button 
              onClick={handleToggleOnline}
              disabled={toggleAvail.isPending}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${isOnline ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="p-6 border-none shadow-md bg-white border-l-4 border-l-tech rounded-l-none">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Today's Earnings</p>
                <h3 className="text-3xl font-black text-slate-900">₹{earnings?.thisMonthEarnings || 0}</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-tech/10 flex items-center justify-center text-tech">
                <IndianRupee className="w-5 h-5"/>
              </div>
            </div>
          </Card>
          <Card className="p-6 border-none shadow-md bg-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Total Jobs</p>
                <h3 className="text-3xl font-black text-slate-900">{earnings?.totalJobs || 0}</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <CheckCircle className="w-5 h-5"/>
              </div>
            </div>
          </Card>
          <Card className="p-6 border-none shadow-md bg-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Pending Requests</p>
                <h3 className="text-3xl font-black text-slate-900">{earnings?.pendingJobs || 0}</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                <Clock className="w-5 h-5"/>
              </div>
            </div>
          </Card>
          <Card className="p-6 border-none shadow-md bg-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Total Earnings</p>
                <h3 className="text-3xl font-black text-slate-900">₹{earnings?.totalEarnings || 0}</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Wallet className="w-5 h-5"/>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* New Job Requests */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tech animate-pulse"></span> New Job Requests
            </h2>
            <div className="space-y-4">
              {pendingBookings.length === 0 ? (
                <Card className="p-8 text-center bg-slate-50 border-dashed border-2 text-slate-500">
                  No new job requests at the moment. Keep yourself 'Online' to receive instant bookings.
                </Card>
              ) : (
                pendingBookings.map(job => (
                  <Card key={job.id} className="p-5 border border-slate-200 hover:border-tech/50 transition-colors shadow-sm bg-white">
                    <div className="flex justify-between mb-3">
                      <Badge variant="warning">{job.bookingType === 'instant' ? 'Instant Request' : 'Scheduled'}</Badge>
                      <span className="text-sm font-bold text-slate-700">₹{job.estimatedCost || 299}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{job.serviceType.toUpperCase()} Service</h3>
                    <div className="text-sm text-slate-600 space-y-2 mb-4 mt-3">
                      <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"/> {job.address}, {job.city}</p>
                      <p className="flex items-start gap-2"><Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"/> {job.bookingType === 'instant' ? 'ASAP (Within 30 mins)' : format(new Date(job.scheduledAt||''), 'PP p')}</p>
                      {job.symptoms && <p className="bg-slate-50 p-2 rounded-md italic border border-slate-100">"{job.symptoms}"</p>}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="tech" className="flex-1" onClick={() => handleAccept(job.id)} isLoading={accept.isPending}>Accept Job</Button>
                      <Button variant="outline" className="flex-1" onClick={() => handleReject(job.id)} isLoading={reject.isPending}>Reject</Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Active Jobs */}
          <div>
             <h2 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-slate-500"/> Active Jobs
            </h2>
            <div className="space-y-4">
               {activeBookings.length === 0 ? (
                <Card className="p-8 text-center bg-slate-50 border-dashed border-2 text-slate-500">
                  You have no active jobs right now.
                </Card>
              ) : (
                activeBookings.map(job => (
                  <Card key={job.id} className="p-5 border-l-4 border-l-emerald-500 shadow-md bg-white">
                    <div className="flex justify-between mb-3 border-b border-slate-100 pb-3">
                      <div>
                        <Badge variant="success" className="mb-2 uppercase text-[10px]">{job.status}</Badge>
                        <h3 className="font-bold text-lg text-slate-900">Booking #{job.id}</h3>
                      </div>
                      <Button size="icon" variant="outline" className="rounded-full bg-slate-50 h-10 w-10 border-slate-200">
                        <Navigation className="w-4 h-4 text-slate-600"/>
                      </Button>
                    </div>
                    
                    <div className="text-sm text-slate-600 space-y-2 mb-4">
                      <p><span className="font-medium text-slate-900">Customer:</span> {job.userName || 'Customer'} ({job.userPhone || 'Hidden'})</p>
                      <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"/> {job.address}, {job.city}</p>
                    </div>
                    
                    <Link href={`/technician/jobs/${job.id}`}>
                      <Button variant="outline" className="w-full border-slate-300">View Details & Generate Bill</Button>
                    </Link>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </FadeIn>
    </TechLayout>
  );
}
