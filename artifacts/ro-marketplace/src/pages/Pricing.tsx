import { MainLayout } from "@/components/layout";
import { Card, FadeIn } from "@/components/ui/shared";
import { useGetPricingParts } from "@workspace/api-client-react";
import { Info, Gavel, CreditCard, Shield } from "lucide-react";

export default function Pricing() {
  const { data: parts, isLoading } = useGetPricingParts();

  return (
    <MainLayout>
      <div className="bg-white min-h-screen py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 text-foreground">Transparent Parts Pricing</h1>
              <p className="text-muted-foreground text-lg">No hidden costs. Know exactly what you're paying for 100% genuine spare parts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
               <Card className="p-6 bg-slate-50 border-none text-center">
                  <Gavel className="w-8 h-8 mx-auto text-primary mb-3"/>
                  <h3 className="font-bold mb-1">Standard Visit</h3>
                  <p className="text-2xl font-bold text-primary">₹299</p>
               </Card>
               <Card className="p-6 bg-slate-50 border-none text-center">
                  <Shield className="w-8 h-8 mx-auto text-primary mb-3"/>
                  <h3 className="font-bold mb-1">Warranty</h3>
                  <p className="font-medium text-foreground">3 Months on Parts</p>
               </Card>
               <Card className="p-6 bg-slate-50 border-none text-center">
                  <CreditCard className="w-8 h-8 mx-auto text-primary mb-3"/>
                  <h3 className="font-bold mb-1">Payment</h3>
                  <p className="font-medium text-foreground">Post Service</p>
               </Card>
            </div>

            <Card className="overflow-hidden border border-slate-200 shadow-xl shadow-black/5">
              <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                <h2 className="font-bold text-lg flex items-center gap-2">Spare Parts List</h2>
                <div className="text-sm bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <Info className="w-4 h-4"/> Prices are estimates
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 font-semibold text-sm text-slate-600 uppercase tracking-wider">Part Name</th>
                      <th className="p-4 font-semibold text-sm text-slate-600 uppercase tracking-wider">Category</th>
                      <th className="p-4 font-semibold text-sm text-slate-600 uppercase tracking-wider text-right">Price Range (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr><td colSpan={3} className="p-8 text-center text-muted-foreground animate-pulse">Loading parts data...</td></tr>
                    ) : (
                      parts?.map((part) => (
                        <tr key={part.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-medium text-foreground">{part.name}</td>
                          <td className="p-4 text-sm text-muted-foreground">{part.category || 'General'}</td>
                          <td className="p-4 font-bold text-right text-primary">
                            {part.minPrice === part.maxPrice 
                              ? `₹${part.minPrice}`
                              : `₹${part.minPrice} - ₹${part.maxPrice}`
                            }
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-200 text-sm text-muted-foreground text-center">
                * Final price may vary slightly based on specific RO brand and model. Service charge is extra.
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>
    </MainLayout>
  );
}
