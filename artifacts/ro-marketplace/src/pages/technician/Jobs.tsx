import { useState } from "react";
import { TechLayout } from "@/components/layout";
import { Card, Button, FadeIn, Badge } from "@/components/ui/shared";
import { useGetTechnicianBookings, useAcceptBooking, useRejectBooking } from "@workspace/api-client-react";
import { MapPin, Clock, Wrench, CheckCircle, XCircle, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  pending: "warning",
  accepted: "success",
  in_progress: "default",
  completed: "success",
  rejected: "destructive",
  cancelled: "destructive",
};

export default function TechnicianJobs() {
  const [filter, setFilter] = useState<"pending" | "accepted" | "all">("all");
  const { data: bookings = [], isLoading, refetch } = useGetTechnicianBookings(
    filter !== "all" ? { status: filter } : {}
  );
  const accept = useAcceptBooking();
  const reject = useRejectBooking();

  const handleAccept = async (id: number) => {
    try {
      await accept.mutateAsync({ id });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await reject.mutateAsync({ id });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const filters = [
    { label: "All Jobs", value: "all" as const },
    { label: "Pending", value: "pending" as const },
    { label: "Accepted", value: "accepted" as const },
  ];

  return (
    <TechLayout>
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Available Jobs</h1>
          <p className="text-slate-500 text-sm mt-1">Browse and respond to job requests assigned to you</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === f.value
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <Card className="p-12 text-center bg-slate-50 border-dashed border-2">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No jobs found</p>
            <p className="text-slate-400 text-sm mt-1">Go online to start receiving job requests</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((job: any) => (
              <Card key={job.id} className={`p-5 shadow-sm border-l-4 ${
                job.status === "pending" ? "border-l-amber-400" :
                job.status === "accepted" ? "border-l-emerald-500" : "border-l-slate-300"
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={STATUS_COLORS[job.status] as any} className="capitalize text-xs">
                        {job.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-slate-400">#{job.id}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 capitalize">{job.serviceType} Service</h3>
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(job.createdAt), "dd MMM, hh:mm a")}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4 text-sm text-slate-600">
                  {job.userName && (
                    <p className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-slate-400 shrink-0" />
                      <span><span className="font-medium text-slate-900">Customer:</span> {job.userName}</span>
                      {job.userPhone && (
                        <a href={`tel:${job.userPhone}`} className="text-orange-500 flex items-center gap-1 ml-auto">
                          <Phone className="w-3.5 h-3.5" /> {job.userPhone}
                        </a>
                      )}
                    </p>
                  )}
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    {job.address}, {job.city}
                  </p>
                  {job.symptoms && (
                    <p className="flex items-start gap-2">
                      <Wrench className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="italic text-slate-500">{job.symptoms}</span>
                    </p>
                  )}
                  {job.bookingType === "scheduled" && job.scheduledAt && (
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      Scheduled: {format(new Date(job.scheduledAt), "dd MMM yyyy, hh:mm a")}
                    </p>
                  )}
                </div>

                {job.status === "pending" && (
                  <div className="flex gap-3">
                    <Button
                      variant="tech"
                      className="flex-1"
                      onClick={() => handleAccept(job.id)}
                      disabled={accept.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Accept Job
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-500 hover:bg-red-50"
                      onClick={() => handleReject(job.id)}
                      disabled={reject.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}

                {job.status === "accepted" && (
                  <div className="bg-emerald-50 text-emerald-700 rounded-lg px-4 py-2 text-sm font-medium text-center">
                    Job accepted — head to customer location
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </FadeIn>
    </TechLayout>
  );
}
