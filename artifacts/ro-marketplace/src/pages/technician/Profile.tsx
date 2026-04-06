import { useState, useEffect } from "react";
import { TechLayout } from "@/components/layout";
import { Card, Button, FadeIn } from "@/components/ui/shared";
import { useGetTechnicianProfile, useUpdateTechnicianProfile, useUpdateAvailability } from "@workspace/api-client-react";
import { User, Phone, MapPin, Briefcase, Star, CheckCircle, ToggleLeft, ToggleRight } from "lucide-react";

export default function TechnicianProfile() {
  const { data: profile, isLoading, refetch } = useGetTechnicianProfile();
  const updateProfile = useUpdateTechnicianProfile();
  const updateAvailability = useUpdateAvailability();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: (profile as any).name || "",
        phone: (profile as any).phone || "",
        city: (profile as any).city || "",
        address: (profile as any).address || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ data: form });
      setSaved(true);
      setEditing(false);
      refetch();
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      await updateAvailability.mutateAsync({
        data: { isAvailable: !(profile as any)?.isAvailable }
      });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const p = profile as any;

  return (
    <TechLayout>
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your personal details and availability</p>
        </div>

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-emerald-800 font-semibold">Profile updated successfully!</p>
          </div>
        )}

        {isLoading ? (
          <Card className="p-8 animate-pulse">
            <div className="h-16 w-16 bg-slate-200 rounded-full mb-4" />
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Stats Card */}
            <Card className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 border-2 border-orange-400 flex items-center justify-center text-orange-300 text-2xl font-bold">
                  {p?.name?.charAt(0) || "T"}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{p?.name}</h2>
                  <p className="text-slate-400 text-sm">{p?.email}</p>
                  <p className="text-slate-400 text-sm">{p?.city}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400">{p?.totalJobs || 0}</p>
                  <p className="text-xs text-slate-400">Total Jobs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400 flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 fill-orange-400" />{parseFloat(p?.rating || "0").toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-400">Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400">{p?.experience || 0}yr</p>
                  <p className="text-xs text-slate-400">Experience</p>
                </div>
              </div>
            </Card>

            {/* Availability Toggle */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Availability Status</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Toggle to start or stop receiving job requests</p>
                </div>
                <button
                  onClick={handleToggleAvailability}
                  disabled={updateAvailability.isPending}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                    p?.isAvailable
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {p?.isAvailable ? (
                    <><ToggleRight className="w-5 h-5" /> Online</>
                  ) : (
                    <><ToggleLeft className="w-5 h-5" /> Offline</>
                  )}
                </button>
              </div>
            </Card>

            {/* Profile Details */}
            <Card className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900">Personal Details</h3>
                {!editing ? (
                  <Button variant="outline" onClick={() => setEditing(true)} className="text-sm">
                    Edit Profile
                  </Button>
                ) : null}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <textarea
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="tech" onClick={handleSave} disabled={updateProfile.isPending} className="flex-1">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-slate-700">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{p?.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{p?.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{p?.address ? `${p.address}, ` : ""}{p?.city}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{p?.experience} year{p?.experience !== 1 ? "s" : ""} experience</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </FadeIn>
    </TechLayout>
  );
}
