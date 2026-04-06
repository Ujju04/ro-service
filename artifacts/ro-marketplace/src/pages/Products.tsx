import { MainLayout } from "@/components/layout";
import { Card, Button, FadeIn, Badge } from "@/components/ui/shared";
import { useGetProducts } from "@workspace/api-client-react";
import { Star, Filter, ShoppingCart } from "lucide-react";
import { useState } from "react";

export default function Products() {
  const [category, setCategory] = useState<string>('');
  const { data: products, isLoading } = useGetProducts({ category: category || undefined });

  const categories = ["All", "Water Purifier", "Filters", "Accessories", "Spare Parts"];

  return (
    <MainLayout>
      <div className="bg-slate-50 min-h-screen pb-24">
        {/* Header */}
        <div className="bg-slate-900 text-white py-16 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Genuine RO Products</h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">100% genuine products and spare parts with warranty.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="bg-white rounded-xl shadow-lg p-2 flex overflow-x-auto gap-2 mb-12 hide-scrollbar border border-border">
            <div className="flex items-center px-4 text-muted-foreground border-r border-border font-medium">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </div>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c === 'All' ? '' : c)}
                className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  (category === c) || (c === 'All' && !category) 
                    ? 'bg-primary text-white shadow-md' 
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1,2,3,4,5,6].map(n => (
                <Card key={n} className="h-96 animate-pulse bg-slate-200 border-none" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products?.map((p, i) => (
                <FadeIn key={p.id} delay={i * 0.05}>
                  <Card className="h-full flex flex-col group card-hover bg-white border-slate-200">
                    <div className="h-56 bg-slate-100 relative p-6 flex items-center justify-center">
                      {!p.inStock && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                          <Badge variant="destructive" className="text-sm px-4 py-1">Out of Stock</Badge>
                        </div>
                      )}
                      <img 
                        src={p.imageUrl || "https://images.unsplash.com/photo-1629838048201-92cd1dce3e7d?w=800&q=80"} 
                        alt={p.name} 
                        className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="default">{p.category}</Badge>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs font-bold text-primary tracking-wider uppercase">{p.brand || 'AquaFix'}</div>
                        <div className="flex items-center gap-1 text-sm font-bold">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500"/> {p.rating || 4.5}
                        </div>
                      </div>
                      <h3 className="font-bold text-lg leading-tight mb-2 flex-1">{p.name}</h3>
                      <ul className="text-xs text-muted-foreground mb-4 space-y-1">
                        {p.features?.slice(0,2).map((f, j) => <li key={j} className="flex gap-1.5"><span className="text-primary">•</span>{f}</li>)}
                      </ul>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                        <span className="text-2xl font-bold text-foreground">₹{p.price.toLocaleString()}</span>
                        <Button size="icon" variant="primary" disabled={!p.inStock} className="rounded-full shadow-md">
                          <ShoppingCart className="w-5 h-5"/>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
