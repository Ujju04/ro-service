import { useState } from "react";
import { TechLayout } from "@/components/layout";
import { Card, Button, FadeIn, Badge } from "@/components/ui/shared";
import { useGetTechnicianBookings, useGenerateBill, useGetPricingParts } from "@workspace/api-client-react";
import { FileText, IndianRupee, Wrench, Plus, Minus, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function TechnicianBills() {
  const { data: bookings = [], isLoading, refetch } = useGetTechnicianBookings({ status: "accepted" });
  const { data: allParts = [] } = useGetPricingParts();
  const generateBill = useGenerateBill();

  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);
  const [selectedParts, setSelectedParts] = useState<Record<number, number>>({});
  const [serviceCharge, setServiceCharge] = useState(199);
  const [notes, setNotes] = useState("");
  const [billGenerated, setBillGenerated] = useState<number | null>(null);

  const addPart = (partId: number) => {
    setSelectedParts(prev => ({ ...prev, [partId]: (prev[partId] || 0) + 1 }));
  };

  const removePart = (partId: number) => {
    setSelectedParts(prev => {
      const next = { ...prev };
      if (next[partId] <= 1) delete next[partId];
      else next[partId]--;
      return next;
    });
  };

  const partsTotal = Object.entries(selectedParts).reduce((sum, [partId, qty]) => {
    const part = (allParts as any[]).find((p: any) => p.id === Number(partId));
    return sum + (parseFloat(part?.maxPrice || "0") * qty);
  }, 0);

  const handleGenerateBill = async () => {
    if (!selectedBooking) return;
    try {
      const parts = Object.entries(selectedParts).map(([partId, quantity]) => ({
        partId: Number(partId),
        quantity,
      }));
      await generateBill.mutateAsync({
        id: selectedBooking,
        data: { parts, serviceCharge, notes },
      });
      setBillGenerated(selectedBooking);
      setSelectedBooking(null);
      setSelectedParts({});
      setNotes("");
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <TechLayout>
      <FadeIn>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Bills</h1>
          <p className="text-slate-500 text-sm mt-1">Generate bills for completed jobs by selecting parts used</p>
        </div>

        {billGenerated && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-emerald-800 font-semibold">Bill generated for Booking #{billGenerated}!</p>
              <p className="text-emerald-600 text-sm">Job marked as completed and payment recorded.</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <Card className="p-12 text-center bg-slate-50 border-dashed border-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No accepted jobs to bill</p>
            <p className="text-slate-400 text-sm mt-1">Accept a job first, then generate the bill here after service</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {(bookings as any[]).map((job: any) => (
              <Card key={job.id} className="p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 capitalize">{job.serviceType} — #{job.id}</h3>
                    <p className="text-sm text-slate-500">{job.address}, {job.city}</p>
                    {job.userName && <p className="text-sm text-slate-600 mt-1">Customer: <span className="font-medium">{job.userName}</span></p>}
                  </div>
                  <Badge variant="warning">Accepted</Badge>
                </div>

                {selectedBooking === job.id ? (
                  <div className="border-t border-slate-100 pt-4 mt-4">
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-orange-500" /> Select Parts Used
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 max-h-64 overflow-y-auto pr-1">
                      {(allParts as any[]).map((part: any) => (
                        <div key={part.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{part.name}</p>
                            <p className="text-xs text-orange-600 font-semibold">
                              ₹{part.minPrice === part.maxPrice ? part.minPrice : `${part.minPrice}–${part.maxPrice}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedParts[part.id] ? (
                              <>
                                <button onClick={() => removePart(part.id)} className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-bold text-slate-800 w-4 text-center">{selectedParts[part.id]}</span>
                                <button onClick={() => addPart(part.id)} className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => addPart(part.id)} className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-orange-100 hover:text-orange-600 transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Service Charge (₹)</label>
                      <input
                        type="number"
                        value={serviceCharge}
                        onChange={e => setServiceCharge(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Any remarks about the service..."
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 mb-4 text-white">
                      <h5 className="text-sm font-semibold text-slate-300 mb-2">Bill Summary</h5>
                      {Object.entries(selectedParts).map(([partId, qty]) => {
                        const part = (allParts as any[]).find((p: any) => p.id === Number(partId));
                        if (!part) return null;
                        const price = parseFloat(part.maxPrice) * qty;
                        return (
                          <div key={partId} className="flex justify-between text-sm py-1 border-b border-slate-700">
                            <span>{part.name} × {qty}</span>
                            <span>₹{price.toFixed(0)}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between text-sm py-1 border-b border-slate-700">
                        <span>Service Charge</span>
                        <span>₹{serviceCharge}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base pt-2">
                        <span>Total</span>
                        <span className="text-orange-400">₹{(partsTotal + serviceCharge).toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="tech" className="flex-1" onClick={handleGenerateBill} disabled={generateBill.isPending}>
                        <IndianRupee className="w-4 h-4 mr-1" /> Generate Bill & Complete
                      </Button>
                      <Button variant="outline" onClick={() => { setSelectedBooking(null); setSelectedParts({}); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="tech" className="w-full mt-3" onClick={() => { setSelectedBooking(job.id); setSelectedParts({}); }}>
                    <FileText className="w-4 h-4 mr-2" /> Generate Bill
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </FadeIn>
    </TechLayout>
  );
}
