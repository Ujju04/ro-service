import { Link } from "wouter";
import { MainLayout } from "@/components/layout";
import { Button, FadeIn, Card } from "@/components/ui/shared";
import { ArrowRight, Wrench, CalendarCheck, ShieldCheck, MapPin, Star, MessageSquare } from "lucide-react";
import { useGetProducts } from "@workspace/api-client-react";

export default function Home() {
  const { data: products } = useGetProducts({ category: "Water Purifier" });

  const features = [
    { icon: <MapPin className="w-6 h-6 text-primary"/>, title: "Find Nearby Techs", desc: "Instantly connect with verified technicians in your area." },
    { icon: <ShieldCheck className="w-6 h-6 text-primary"/>, title: "Verified Experts", desc: "All our technicians are background checked and highly trained." },
    { icon: <CalendarCheck className="w-6 h-6 text-primary"/>, title: "Easy Scheduling", desc: "Book instantly or schedule a service at your convenience." },
    { icon: <Wrench className="w-6 h-6 text-primary"/>, title: "Genuine Parts", desc: "We use only 100% genuine RO spare parts with transparent pricing." }
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Clean Water Background" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 border border-primary/20 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              India's #1 RO Service Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Pure Water, <br/>
              <span className="text-gradient">Zero Hassle.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              Book expert RO repair, installation, and AMC services in minutes. Talk to our AI assistant to diagnose issues instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/booking">
                <Button size="lg" className="w-full sm:w-auto text-lg gap-2">
                  Book Service <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg gap-2 glass-panel">
                  <MessageSquare className="w-5 h-5 text-primary" /> Ask AI Assistant
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose AquaFix?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">We bring transparency and trust to RO servicing.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className="p-8 h-full card-hover bg-slate-50 border-none group">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Top Rated Purifiers</h2>
              <p className="text-muted-foreground text-lg">Upgrade your home with our bestsellers.</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="hidden md:flex gap-2">View All <ArrowRight className="w-4 h-4"/></Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products?.slice(0, 3).map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.1}>
                <Card className="overflow-hidden card-hover group">
                  <div className="h-64 bg-slate-100 p-8 relative flex items-center justify-center">
                    {/* Unsplash fallback for products if API doesn't have images */}
                    {/* Water purifier clean modern */}
                    <img src={p.imageUrl || "https://images.unsplash.com/photo-1629838048201-92cd1dce3e7d?w=800&q=80"} alt={p.name} className="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {p.rating || 4.8}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-xs text-primary font-bold tracking-wider uppercase mb-2">{p.brand || 'AquaFix'}</div>
                    <h3 className="text-xl font-bold mb-2 truncate">{p.name}</h3>
                    <div className="flex items-center justify-between mt-6">
                      <span className="text-2xl font-bold text-foreground">₹{p.price.toLocaleString()}</span>
                      <Button variant="secondary" size="sm">Buy Now</Button>
                    </div>
                  </div>
                </Card>
              </FadeIn>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/products">
              <Button variant="outline" className="w-full">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center text-white">
          <img src={`${import.meta.env.BASE_URL}images/water-drop.png`} alt="Water drop" className="w-24 h-24 mx-auto mb-8 animate-bounce-slow" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready for clean, safe water?</h2>
          <p className="text-primary-foreground/80 text-xl mb-10 max-w-2xl mx-auto">
            Get your RO serviced today or subscribe to an AMC plan for year-round peace of mind.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/booking">
              <Button size="lg" className="bg-white text-primary hover:bg-slate-50 text-lg shadow-2xl">Book Now</Button>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
