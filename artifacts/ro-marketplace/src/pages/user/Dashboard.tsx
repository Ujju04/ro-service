import { MainLayout } from "@/components/layout";
import { Card, Button, FadeIn, Badge } from "@/components/ui/shared";
import { useGetUserBookings } from "@workspace/api-client-react";
import { Calendar, Clock, MapPin, Wrench, ChevronRight, Activity } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function UserDashboard() {
  const { data: bookings, isLoading } = useGetUserBookings();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'success';
      case 'in_progress': case 'accepted': return 'tech';
      case 'cancelled': case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <MainLayout>
      <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
                <p className="text-muted-foreground">Manage your services and AMC plans.</p>
              </div>
              <Link href="/booking">
                <Button>Book New Service</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - Bookings */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="text-primary"/> Service History</h2>
                
                {isLoading ? (
                  <Card className="p-8 text-center text-muted-foreground animate-pulse">Loading bookings...</Card>
                ) : bookings?.length === 0 ? (
                  <Card className="p-12 text-center border-dashed border-2">
                    <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-6">You haven't requested any services so far.</p>
                    <Link href="/booking"><Button variant="outline">Book your first service</Button></Link>
                  </Card>
                ) : (
                  bookings?.map((booking) => (
                    <Card key={booking.id} className="p-6 hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={getStatusColor(booking.status) as any}>{getStatusLabel(booking.status)}</Badge>
                            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{booking.serviceType}</span>
                          </div>
                          <h3 className="font-bold text-lg">Booking #{booking.id}</h3>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{booking.finalAmount ? `₹${booking.finalAmount}` : (booking.estimatedCost ? `Est. ₹${booking.estimatedCost}` : 'Pending')}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(booking.createdAt || ''), 'MMM d, yyyy')}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-6">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0"/>
                          <div>
                            <span className="font-semibold block text-slate-900">Schedule</span>
                            {booking.bookingType === 'instant' ? 'Instant Service' : format(new Date(booking.scheduledAt || ''), 'PPP at p')}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0"/>
                          <div className="truncate">
                            <span className="font-semibold block text-slate-900">Address</span>
                            {booking.address}, {booking.city}
                          </div>
                        </div>
                      </div>

                      {booking.technicianName && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-tech/20 text-tech flex items-center justify-center font-bold text-xs">
                              {booking.technicianName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Assigned Technician</p>
                              <p className="font-semibold text-sm">{booking.technicianName}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <Button variant="outline" size="sm" className="gap-1">View Details <ChevronRight className="w-4 h-4"/></Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Sidebar Content */}
              <div className="space-y-6">
                <Card className="p-6 bg-gradient-to-br from-primary to-secondary text-white border-none shadow-xl shadow-primary/20 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                  <h3 className="font-bold text-xl mb-2 relative z-10">Active AMC Plan</h3>
                  <p className="text-primary-foreground/80 text-sm mb-6 relative z-10">You do not have an active Annual Maintenance Contract.</p>
                  <Link href="/amc" className="relative z-10">
                    <Button className="w-full bg-white text-primary hover:bg-slate-50 shadow-lg">View Plans</Button>
                  </Link>
                </Card>

                <Card className="p-6 border-slate-200">
                  <h3 className="font-bold mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <Link href="/pricing" className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors border border-transparent hover:border-slate-200">
                      Parts Pricing <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                    <Link href="/products" className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors border border-transparent hover:border-slate-200">
                      Shop Genuine Filters <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                    <Link href="/chat" className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors border border-transparent hover:border-slate-200">
                      Support Chat <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </MainLayout>
  );
}
