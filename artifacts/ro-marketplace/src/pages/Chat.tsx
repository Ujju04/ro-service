import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { Card, Input, Button, FadeIn, Badge } from "@/components/ui/shared";
import { useSendChatMessage, useGetChatHistory } from "@workspace/api-client-react";
import { Send, User, Loader2, CheckCircle2, Calendar, Wrench, Star, Droplets, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";

const getSessionId = () => {
  let sid = localStorage.getItem("chat_sid");
  if (!sid) { sid = Math.random().toString(36).substring(7); localStorage.setItem("chat_sid", sid); }
  return sid;
};

// ─── Inline address collection form ──────────────────────────────────────────
function AddressForm({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !address.trim()) return;
    onSubmit(`${city.trim()}, ${address.trim()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-primary/20 rounded-xl p-4 shadow-md space-y-3">
      <div className="flex items-center gap-2 mb-1 text-primary font-bold text-sm">
        <Calendar className="w-4 h-4" /> Book Your Service
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">City</label>
        <Input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="e.g. Delhi, Mumbai, Bangalore..."
          className="bg-slate-50 border-slate-200 text-sm h-9"
          required
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">Full Address</label>
        <Input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="e.g. 296 Main Road, Mandawli..."
          className="bg-slate-50 border-slate-200 text-sm h-9"
          required
        />
      </div>
      <Button type="submit" className="w-full h-9 text-sm" disabled={!city.trim() || !address.trim()}>
        <Calendar className="w-4 h-4 mr-2" /> Confirm Booking
      </Button>
    </form>
  );
}

// ─── Booking confirmation card ─────────────────────────────────────────────
function BookingCard({ booking }: { booking: any }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-md">
      <div className="flex items-center gap-2 mb-3 text-green-700 font-bold">
        <CheckCircle2 className="w-5 h-5" /> Booking Confirmed!
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Booking ID</span>
          <span className="font-bold text-slate-800">#{booking.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Service</span>
          <span className="font-semibold capitalize">{booking.serviceType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Location</span>
          <span className="font-semibold text-right max-w-[60%]">{booking.city}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Estimated Cost</span>
          <span className="font-bold text-primary">{booking.estimatedCost}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Status</span>
          <Badge className="text-xs capitalize bg-amber-100 text-amber-700 border-amber-200">{booking.status} — Searching technician</Badge>
        </div>
      </div>
      <Link href="/bookings">
        <Button variant="outline" className="w-full h-9 text-sm mt-3 border-green-300 text-green-700 hover:bg-green-100">
          Track Booking <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

// ─── Estimate card ─────────────────────────────────────────────────────────
function EstimateCard({ estimate }: { estimate: any }) {
  return (
    <div className="bg-white border border-primary/20 rounded-xl p-4 shadow-md">
      <div className="flex items-center gap-2 mb-3 text-primary font-bold text-sm">
        <Wrench className="w-4 h-4" /> Repair Estimate
      </div>
      <div className="space-y-2 text-sm mb-3">
        {estimate.parts?.map((p: any, i: number) => (
          <div key={i} className="flex justify-between border-b border-slate-100 pb-1">
            <span className="text-slate-600">{p.name}</span>
            <span className="font-semibold">₹{p.minPrice}{p.minPrice !== p.maxPrice ? `–₹${p.maxPrice}` : ""}</span>
          </div>
        ))}
        <div className="flex justify-between pt-0.5">
          <span className="text-slate-500">Service Visit</span>
          <span className="font-semibold">₹{estimate.serviceCharge}</span>
        </div>
      </div>
      <div className="bg-slate-50 rounded-lg p-2.5 flex justify-between items-center border border-slate-200 mb-3">
        <span className="font-bold text-slate-700 text-sm">Total Estimate:</span>
        <span className="text-lg font-black text-primary">₹{estimate.totalMin}–₹{estimate.totalMax}</span>
      </div>
      <p className="text-xs text-slate-400 mb-3">* Technician confirms exact parts on-site. You approve before replacement.</p>
    </div>
  );
}

// ─── AMC Plans card ────────────────────────────────────────────────────────
function AmcPlansCard({ plans }: { plans: any[] }) {
  const tiers = [
    { badge: "🥉", color: "from-amber-50 to-amber-100 border-amber-200", textColor: "text-amber-800" },
    { badge: "🥈", color: "from-slate-50 to-slate-100 border-slate-300", textColor: "text-slate-800" },
    { badge: "🥇", color: "from-yellow-50 to-yellow-100 border-yellow-300", textColor: "text-yellow-800" },
  ];
  return (
    <div className="space-y-2 w-full">
      {plans.map((plan, i) => {
        const tier = tiers[i] || tiers[0];
        return (
          <div key={plan.id} className={`bg-gradient-to-r ${tier.color} border rounded-xl p-3`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`font-bold text-sm ${tier.textColor}`}>{tier.badge} {plan.name}</span>
              <span className="font-black text-primary text-base">₹{plan.price}<span className="text-xs font-normal text-slate-500">/yr</span></span>
            </div>
            <p className="text-xs text-slate-600 line-clamp-2">{plan.description}</p>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500">{plan.visits} service visits included</span>
            </div>
          </div>
        );
      })}
      <Link href="/amc">
        <Button className="w-full h-9 text-sm">Subscribe to AMC <Star className="w-4 h-4 ml-2" /></Button>
      </Link>
    </div>
  );
}

// ─── Product cards ─────────────────────────────────────────────────────────
function ProductCards({ products }: { products: any[] }) {
  return (
    <div className="flex overflow-x-auto gap-3 pb-2 w-[300px] md:w-[420px]" style={{ scrollbarWidth: "none" }}>
      {products.map((p: any) => (
        <div key={p.id} className="min-w-[175px] bg-white border border-slate-200 rounded-xl p-3 shadow-sm shrink-0">
          <img
            src={p.imageUrl || "https://images.unsplash.com/photo-1629838048201-92cd1dce3e7d?w=400&q=80"}
            alt={p.name}
            className="h-24 w-full object-contain mb-2 bg-slate-50 rounded-lg p-2"
          />
          <h4 className="font-bold text-xs truncate">{p.name}</h4>
          {p.brand && <p className="text-slate-400 text-xs">{p.brand}</p>}
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-slate-500">{p.rating?.toFixed(1)}</span>
          </div>
          <p className="text-primary font-black text-sm mt-1">₹{p.price.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────
function MessageBubble({ msg, onQuickReply, onAddressSubmit }: {
  msg: any;
  onQuickReply: (text: string) => void;
  onAddressSubmit: (text: string) => void;
}) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
      <div className={`max-w-[88%] md:max-w-[72%] flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>

        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${isUser ? "bg-secondary text-white" : "bg-gradient-to-br from-primary to-blue-600 text-white"}`}>
          {isUser ? <User className="w-4 h-4" /> : <Droplets className="w-4 h-4" />}
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          {/* Text bubble */}
          <div className={`p-3.5 rounded-2xl leading-relaxed text-sm ${isUser ? "bg-secondary text-white rounded-tr-sm" : "bg-white border border-slate-200 text-foreground shadow-sm rounded-tl-sm"}`}>
            <FormattedText text={msg.content} />
          </div>

          {/* Rich cards */}
          {msg.estimate && !msg.bookingCreated && <EstimateCard estimate={msg.estimate} />}
          {msg.bookingCreated && <BookingCard booking={msg.bookingCreated} />}
          {msg.products && msg.products.length > 0 && <ProductCards products={msg.products} />}
          {msg.amcPlans && msg.amcPlans.length > 0 && <AmcPlansCard plans={msg.amcPlans} />}
          {msg.action === "collect_address" && <AddressForm onSubmit={onAddressSubmit} />}

          {/* Quick reply chips */}
          {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {msg.quickReplies.map((qr: string) => (
                <button
                  key={qr}
                  onClick={() => onQuickReply(qr)}
                  className="px-3 py-1.5 rounded-full bg-primary/8 text-primary border border-primary/20 text-xs font-medium hover:bg-primary hover:text-white transition-all duration-150 active:scale-95"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bold/bullet text formatter ────────────────────────────────────────────
function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Replace **text** with bold spans
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const formatted = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : <span key={j}>{p}</span>);
        return <p key={i}>{formatted}</p>;
      })}
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center shrink-0">
          <Droplets className="w-4 h-4" />
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm flex items-center gap-1 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Chat page ────────────────────────────────────────────────────────
export default function Chat() {
  const { user } = useAuth();
  const sessionId = getSessionId();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: history } = useGetChatHistory({ sessionId }, { query: { refetchInterval: false } });
  const sendMessage = useSendChatMessage();

  useEffect(() => {
    if (history && messages.length === 0) setMessages(history);
  }, [history]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessage.isPending]);

  const doSend = async (text: string) => {
    if (!text.trim() || sendMessage.isPending) return;
    const userMsg = { role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const res = await sendMessage.mutateAsync({
        data: {
          message: text,
          sessionId,
          userId: user?.id ?? undefined,
        }
      });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.message,
        estimate: res.estimate,
        products: res.products,
        action: res.action,
        bookingCreated: res.bookingCreated,
        quickReplies: res.quickReplies,
        amcPlans: res.amcPlans,
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ Sorry, something went wrong. Please try again!",
        timestamp: new Date().toISOString(),
      }]);
    }
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doSend(input); };

  const initialQuickReplies = [
    "My RO has no water", "Water tastes bad", "RO is leaking",
    "Book a service", "What is AMC?", "Water quality in Delhi",
  ];

  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-slate-100 to-slate-50 min-h-[calc(100vh-80px)] py-6 px-4 flex justify-center">
        <FadeIn className="w-full max-w-4xl h-[85vh] flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden border border-slate-200 shadow-2xl shadow-primary/10 rounded-2xl">

            {/* ─── Header ─────────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white flex items-center gap-4 rounded-t-2xl">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/40 border-2 border-primary/50">
                <Droplets className="w-6 h-6 text-white" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg leading-tight">AquaBot AI</h2>
                <p className="text-xs text-primary/80 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Online — Smart RO Assistant
                </p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-xs text-slate-400">Powered by AquaFix</p>
                <p className="text-xs text-slate-500">Diagnosis · Booking · AMC</p>
              </div>
            </div>

            {/* ─── Chat area ─────────────────────────────────────────── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/60" style={{ scrollBehavior: "smooth" }}>
              {/* Welcome state */}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center mb-5 shadow-lg shadow-primary/30">
                    <Droplets className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Hi! I'm AquaBot 👋</h3>
                  <p className="text-slate-500 text-sm max-w-xs mb-6">
                    I can diagnose your RO problem, estimate costs, and book a technician — all right here in chat!
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {initialQuickReplies.map(qr => (
                      <button
                        key={qr}
                        onClick={() => doSend(qr)}
                        className="px-4 py-2 rounded-full bg-white text-primary border border-primary/25 text-sm font-medium hover:bg-primary hover:text-white transition-all duration-150 shadow-sm active:scale-95"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  msg={msg}
                  onQuickReply={doSend}
                  onAddressSubmit={doSend}
                />
              ))}

              {sendMessage.isPending && <TypingIndicator />}
            </div>

            {/* ─── Input area ────────────────────────────────────────── */}
            <form
              onSubmit={handleSubmit}
              className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center rounded-b-2xl"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Describe your RO issue or ask anything..."
                className="bg-slate-50 border-slate-200 rounded-xl text-sm flex-1"
                disabled={sendMessage.isPending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || sendMessage.isPending}
                className="shrink-0 rounded-xl w-10 h-10 shadow-sm shadow-primary/20"
              >
                {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
              </Button>
            </form>

          </Card>
        </FadeIn>
      </div>
    </MainLayout>
  );
}
