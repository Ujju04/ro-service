import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, partsTable, bookingsTable, usersTable, amcPlansTable, amcSubscriptionsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionState {
  step: "idle" | "diagnosing" | "awaiting_address" | "booking_confirmed";
  diagnosedSymptom?: string;
  diagnosedParts?: string[];
  estimatedMin?: number;
  estimatedMax?: number;
  suggestedServiceType?: string;
  pendingCity?: string;
  lastIntent?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  intent?: string;
}

interface ChatResponse {
  message: string;
  intent: string;
  products?: any[];
  estimate?: any;
  action?: string;
  bookingCreated?: any;
  quickReplies?: string[];
  amcPlans?: any[];
}

// ---------------------------------------------------------------------------
// In-memory session store (message history + conversation state)
// ---------------------------------------------------------------------------

const chatHistory = new Map<string, ChatMessage[]>();
const chatState = new Map<string, SessionState>();

function getState(sessionId: string): SessionState {
  if (!chatState.has(sessionId)) chatState.set(sessionId, { step: "idle" });
  return chatState.get(sessionId)!;
}

function setState(sessionId: string, patch: Partial<SessionState>) {
  const s = getState(sessionId);
  chatState.set(sessionId, { ...s, ...patch });
}

// ---------------------------------------------------------------------------
// Knowledge base
// ---------------------------------------------------------------------------

const SYMPTOM_MAP: Record<string, { diagnosis: string; parts: string[]; serviceType: string; severity: "low" | "medium" | "high" }> = {
  "no water":          { diagnosis: "RO pump failure or blocked solenoid valve", parts: ["RO Pump", "Solenoid Valve"], serviceType: "repair", severity: "high" },
  "not working":       { diagnosis: "Could be pump, solenoid valve, or power supply issue", parts: ["RO Pump", "Solenoid Valve", "Adapter"], serviceType: "repair", severity: "high" },
  "low pressure":      { diagnosis: "Clogged sediment or carbon filter reducing flow", parts: ["Sediment Filter", "Carbon Filter"], serviceType: "repair", severity: "medium" },
  "slow":              { diagnosis: "Clogged membrane or filters reducing output", parts: ["Membrane", "Sediment Filter", "Flow Resistor"], serviceType: "repair", severity: "medium" },
  "bad taste":         { diagnosis: "Exhausted carbon filter or degraded membrane", parts: ["Carbon Filter", "Membrane"], serviceType: "repair", severity: "medium" },
  "bad smell":         { diagnosis: "Exhausted carbon filter allowing contaminants", parts: ["Carbon Filter"], serviceType: "repair", severity: "medium" },
  "smells bad":        { diagnosis: "Exhausted carbon filter allowing contaminants", parts: ["Carbon Filter"], serviceType: "repair", severity: "medium" },
  "tastes bad":        { diagnosis: "Exhausted carbon filter or degraded membrane", parts: ["Carbon Filter", "Membrane"], serviceType: "repair", severity: "medium" },
  "leaking":           { diagnosis: "Loose fittings, cracked adapter or worn tape", parts: ["Adapter", "Tape"], serviceType: "repair", severity: "high" },
  "water leakage":     { diagnosis: "Loose fittings, cracked adapter or worn tape", parts: ["Adapter", "Tape"], serviceType: "repair", severity: "high" },
  "noisy":             { diagnosis: "Faulty RO pump vibrating abnormally", parts: ["RO Pump"], serviceType: "repair", severity: "medium" },
  "making noise":      { diagnosis: "Faulty RO pump vibrating abnormally", parts: ["RO Pump"], serviceType: "repair", severity: "medium" },
  "yellow water":      { diagnosis: "Old spun filter letting through sediment", parts: ["Spun Filter", "Sediment Filter"], serviceType: "repair", severity: "high" },
  "high tds":          { diagnosis: "Membrane performance degraded, needs replacement", parts: ["Membrane", "Flow Resistor"], serviceType: "repair", severity: "high" },
  "tank not filling":  { diagnosis: "Float valve issue or low inlet pressure", parts: ["Solenoid Valve", "RO Pump"], serviceType: "repair", severity: "medium" },
  "uv not working":    { diagnosis: "UV lamp burned out or UV adapter fault", parts: ["UV Lamp", "UV Adapter"], serviceType: "repair", severity: "medium" },
  "filter change":     { diagnosis: "Routine filter replacement needed", parts: ["Carbon Filter", "Sediment Filter", "Spun Filter"], serviceType: "repair", severity: "low" },
  "service":           { diagnosis: "General annual maintenance", parts: ["Carbon Filter", "Sediment Filter"], serviceType: "repair", severity: "low" },
  "installation":      { diagnosis: "New RO system installation", parts: [], serviceType: "installation", severity: "low" },
  "install":           { diagnosis: "New RO system installation", parts: [], serviceType: "installation", severity: "low" },
};

const CITY_TDS: Record<string, { tds: string; quality: string; recommendation: string }> = {
  "delhi":     { tds: "400-500 ppm", quality: "Very High", recommendation: "RO is essential. Change membrane every 12 months." },
  "mumbai":    { tds: "100-200 ppm", quality: "Moderate", recommendation: "RO recommended. Membrane every 18-24 months." },
  "bangalore": { tds: "250-300 ppm", quality: "High", recommendation: "RO recommended. Change filters every 6 months." },
  "chennai":   { tds: "300-400 ppm", quality: "High", recommendation: "RO essential. Membrane every 12-15 months." },
  "hyderabad": { tds: "280-350 ppm", quality: "High", recommendation: "RO recommended. Annual full service advised." },
  "pune":      { tds: "200-280 ppm", quality: "Moderate-High", recommendation: "RO recommended. Filter change every 6-8 months." },
  "kolkata":   { tds: "150-250 ppm", quality: "Moderate", recommendation: "RO recommended. Monsoon season increases contamination." },
  "ahmedabad": { tds: "350-450 ppm", quality: "High", recommendation: "RO essential. Frequent filter changes needed." },
};

// ---------------------------------------------------------------------------
// Intent detection
// ---------------------------------------------------------------------------

function detectIntent(msg: string, state: SessionState): string {
  const m = msg.toLowerCase();

  // Continuation of address collection
  if (state.step === "awaiting_address") return "provide_address";

  // Affirmative responses when we already have a diagnosis
  if (state.step === "diagnosing" || state.lastIntent === "diagnose") {
    if (/\b(yes|yep|sure|ok|okay|book|schedule|confirm|proceed|go ahead)\b/.test(m)) return "book_from_diagnosis";
  }

  // Explicit booking
  if (/\b(book|schedule|appointment|fix it|send tech|technician)\b/.test(m)) return "book_service";

  // Price/estimate
  if (/\b(price|cost|charge|estimate|how much|rate|fee)\b/.test(m)) return "get_price";

  // Product recommendation
  if (/\b(buy|product|purifier|which ro|recommend|best ro|new ro)\b/.test(m)) return "product_recommendation";

  // AMC
  if (/\b(amc|annual|maintenance contract|plan|subscription|yearly)\b/.test(m)) return "amc_info";

  // Water quality
  if (/\b(tds|water quality|water in|ppm|quality)\b/.test(m)) return "water_quality";

  // Diagnosis / problem
  if (Object.keys(SYMPTOM_MAP).some(k => m.includes(k))) return "diagnose";
  if (/\b(problem|issue|broken|not working|help|diagnose|wrong|fault)\b/.test(m)) return "diagnose";

  // Reminder / service history
  if (/\b(reminder|remind|last service|when|how long|6 months|maintenance)\b/.test(m)) return "reminder";

  // FAQ
  if (/\b(how|what|when|why|which|where|can you)\b/.test(m)) return "faq";

  return "general";
}

// ---------------------------------------------------------------------------
// Find symptom match
// ---------------------------------------------------------------------------

function matchSymptom(msg: string): { key: string; info: typeof SYMPTOM_MAP[string] } | null {
  const m = msg.toLowerCase();
  for (const [key, info] of Object.entries(SYMPTOM_MAP)) {
    if (m.includes(key)) return { key, info };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Load parts prices for given part names
// ---------------------------------------------------------------------------

async function loadPartsInfo(partNames: string[]) {
  const all = await db.select().from(partsTable).where(eq(partsTable.isActive, true));
  return all.filter(p => partNames.some(n => p.name.toLowerCase().includes(n.toLowerCase())));
}

// ---------------------------------------------------------------------------
// Core agentic response generator
// ---------------------------------------------------------------------------

async function generateResponse(
  message: string,
  sessionId: string,
  userId?: number,
): Promise<ChatResponse> {
  const state = getState(sessionId);
  const intent = detectIntent(message, state);
  const m = message.toLowerCase();

  // ── 1. User is providing address to complete a booking ──────────────────
  if (intent === "provide_address" && state.step === "awaiting_address") {
    // Parse "city: delhi, address: 296 main road" or just free text
    let city = state.pendingCity || "";
    let address = message.trim();

    const cityMatch = message.match(/city[:\s]+([a-zA-Z\s]+?)(?:,|address|$)/i);
    const addrMatch = message.match(/address[:\s]+(.+)/i);

    if (cityMatch) city = cityMatch[1].trim();
    if (addrMatch) address = addrMatch[1].trim();
    if (!city && !cityMatch) {
      // Try to detect city name in text
      for (const c of Object.keys(CITY_TDS)) {
        if (m.includes(c)) { city = c; break; }
      }
    }

    if (!city || address.length < 5) {
      return {
        message: `📍 Please share both your **city** and **full address**.\n\nFormat: "Delhi, 296 Main Road, Mandawli"`,
        intent,
        quickReplies: ["Delhi, 123 my street", "Mumbai, my address here"],
      };
    }

    if (!userId) {
      setState(sessionId, { step: "idle" });
      return {
        message: `🔐 You need to be logged in to book a service. Please **sign in** first, then come back and I'll complete the booking for you!`,
        intent,
        action: "open_auth",
        quickReplies: ["Sign in"],
      };
    }

    // Create the actual booking
    try {
      const [booking] = await db.insert(bookingsTable).values({
        userId,
        technicianId: null,
        serviceType: state.suggestedServiceType || "repair",
        status: "pending",
        bookingType: "instant",
        address,
        city,
        symptoms: state.diagnosedSymptom || "",
        serviceCharge: "199",
        estimatedCost: state.estimatedMin ? `${state.estimatedMin}-${state.estimatedMax}` : null,
      }).returning();

      setState(sessionId, { step: "booking_confirmed" });

      return {
        message: `✅ **Booking Confirmed! Booking #${booking.id}**\n\nYour service request is live and open for technicians to accept. You'll be notified once a technician picks it up.\n\n📍 **Address:** ${address}, ${city}\n🔧 **Service:** ${state.suggestedServiceType || "Repair"}\n💰 **Estimated Cost:** ₹${state.estimatedMin || 199}–₹${state.estimatedMax || 1500}\n\nWant to save money on future services? Check out our **AMC plans**!`,
        intent,
        bookingCreated: {
          id: booking.id,
          status: booking.status,
          serviceType: booking.serviceType,
          address,
          city,
          estimatedCost: `₹${state.estimatedMin || 199}–₹${state.estimatedMax || 1500}`,
        },
        action: "booking_done",
        quickReplies: ["View AMC Plans", "Track my booking", "Book another service"],
      };
    } catch (err) {
      return {
        message: `❌ Oops, something went wrong creating your booking. Please try the **Book Service** page directly.`,
        intent,
        action: "open_booking",
      };
    }
  }

  // ── 2. Book from diagnosis (user said yes after diagnosis) ───────────────
  if (intent === "book_from_diagnosis") {
    setState(sessionId, { step: "awaiting_address", lastIntent: "book_service" });
    return {
      message: `📍 **Almost there!** Please share your **city and address** so I can create your service request.\n\nExample: "Delhi, 296 Main Road, Mandawli"\n\nA technician will pick up your request shortly!`,
      intent,
      action: "collect_address",
      quickReplies: ["Delhi, my address", "Mumbai, my address", "Bangalore, my address"],
    };
  }

  // ── 3. Diagnose ──────────────────────────────────────────────────────────
  if (intent === "diagnose") {
    const match = matchSymptom(message);

    if (!match) {
      setState(sessionId, { step: "diagnosing", lastIntent: "diagnose" });
      return {
        message: `🔧 I'm here to help! To diagnose your RO issue, which best describes it?\n\n💧 **Water issues:**\n• No water / very slow output\n• Yellow or discolored water\n• High TDS reading\n\n👃 **Taste/Smell:**\n• Bad taste\n• Bad smell\n\n🔊 **Hardware:**\n• Making loud noise\n• Water leaking\n• Tank not filling\n• UV light not working\n\nJust describe what you're experiencing!`,
        intent,
        quickReplies: ["No water output", "Water tastes bad", "RO is leaking", "Making noise", "Tank not filling", "High TDS"],
      };
    }

    const { key, info } = match;
    const partsData = await loadPartsInfo(info.parts);

    const minCost = partsData.reduce((s, p) => s + parseFloat(p.minPrice?.toString() || "0"), 0) + 199;
    const maxCost = partsData.reduce((s, p) => s + parseFloat(p.maxPrice?.toString() || "0"), 0) + 199;

    setState(sessionId, {
      step: "diagnosing",
      lastIntent: "diagnose",
      diagnosedSymptom: key,
      diagnosedParts: info.parts,
      estimatedMin: minCost,
      estimatedMax: maxCost,
      suggestedServiceType: info.serviceType,
    });

    const severityEmoji = info.severity === "high" ? "🔴" : info.severity === "medium" ? "🟡" : "🟢";

    return {
      message: `🔍 **Diagnosis: "${key.charAt(0).toUpperCase() + key.slice(1)}"**\n\n${severityEmoji} **Severity:** ${info.severity.toUpperCase()}\n\n**Likely Cause:**\n${info.diagnosis}\n\n**Parts that may need replacement:**\n${partsData.map(p => `• ${p.name}: ₹${p.minPrice}–₹${p.maxPrice}`).join("\n") || "• Assessment needed on-site"}\n\n**Quick Fix Tip:** ${getQuickTip(key)}\n\nWould you like me to book a technician? I can create the service request right now!`,
      intent,
      estimate: {
        diagnosis: info.diagnosis,
        parts: partsData.map(p => ({
          name: p.name,
          minPrice: parseFloat(p.minPrice?.toString() || "0"),
          maxPrice: parseFloat(p.maxPrice?.toString() || "0"),
        })),
        serviceCharge: 199,
        totalMin: minCost,
        totalMax: maxCost,
      },
      quickReplies: ["Yes, book a technician", "How much will it cost?", "Can I fix it myself?"],
    };
  }

  // ── 4. Book service (fresh, no prior diagnosis) ──────────────────────────
  if (intent === "book_service") {
    setState(sessionId, { step: "awaiting_address", lastIntent: "book_service" });
    return {
      message: `📅 **Book a Service**\n\nI'll create a service request for you right now!\n\nPlease share your **city and full address**:\n\nExample: "Delhi, 296 Main Road, Mandawli"\n\nTechnicians in your area can accept the request immediately!`,
      intent,
      action: "collect_address",
      quickReplies: ["Delhi, my address", "Mumbai, my address", "Bangalore, my address"],
    };
  }

  // ── 5. Price inquiry ─────────────────────────────────────────────────────
  if (intent === "get_price") {
    const match = matchSymptom(message);
    const partsData = match
      ? await loadPartsInfo(match.info.parts)
      : await db.select().from(partsTable).where(eq(partsTable.isActive, true));

    const displayParts = partsData.slice(0, 8);
    const totalMin = displayParts.reduce((s, p) => s + parseFloat(p.minPrice?.toString() || "0"), 0);
    const totalMax = displayParts.reduce((s, p) => s + parseFloat(p.maxPrice?.toString() || "0"), 0);

    return {
      message: `💰 **Transparent Pricing — No Hidden Charges**\n\n${displayParts.map(p => `• **${p.name}**: ₹${p.minPrice}${p.minPrice !== p.maxPrice ? `–₹${p.maxPrice}` : ""}`).join("\n")}\n\n🔧 **Service Visit**: ₹199\n\n${match ? `**Estimated repair cost for your issue: ₹${totalMin + 199}–₹${totalMax + 199}**` : "Tell me your symptoms for an exact estimate!"}\n\n*Technician confirms exact parts needed on-site. You approve before any part is replaced.*`,
      intent,
      estimate: match ? {
        diagnosis: match.info.diagnosis,
        parts: displayParts.map(p => ({ name: p.name, minPrice: parseFloat(p.minPrice?.toString() || "0"), maxPrice: parseFloat(p.maxPrice?.toString() || "0") })),
        serviceCharge: 199,
        totalMin: totalMin + 199,
        totalMax: totalMax + 199,
      } : undefined,
      quickReplies: ["Book a technician", "Get AMC to save money", "My RO is not working"],
    };
  }

  // ── 6. Product recommendation ────────────────────────────────────────────
  if (intent === "product_recommendation") {
    const budget = /budget|cheap|affordable|low cost|entry/.test(m);
    const premium = /premium|best|top|high end|advanced/.test(m);

    const products = await db.select().from(productsTable)
      .where(eq(productsTable.inStock, true))
      .limit(4);

    return {
      message: `🛒 **Top RO System Recommendations**\n\n${premium ? "Premium picks for best water quality:" : budget ? "Budget-friendly options that don't compromise quality:" : "Here are our most popular RO systems:"}\n\nAll products include **free installation support** and **1-year warranty**. Want me to book an installation technician?`,
      intent,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price?.toString() || "0"),
        description: p.description,
        imageUrl: p.imageUrl,
        rating: parseFloat(p.rating?.toString() || "4"),
        capacity: p.capacity,
      })),
      action: "book_installation",
      quickReplies: ["Book installation", "What's the price difference?", "Which is best for Delhi water?"],
    };
  }

  // ── 7. AMC info ──────────────────────────────────────────────────────────
  if (intent === "amc_info") {
    const plans = await db.select().from(amcPlansTable).where(eq(amcPlansTable.isActive, true));

    return {
      message: `📋 **AMC Plans — Save ₹1,500–₹3,000 Annually**\n\n${plans.map(p => `**${p.name} — ₹${p.price}/year**\n${p.description}`).join("\n\n")}\n\n💡 **Why get AMC?**\n• Fixed annual cost, no surprise bills\n• Priority technician dispatch\n• Regular filter replacements included\n• Extends RO life by 2-3 years\n\nWhich plan would you like to subscribe to?`,
      intent,
      amcPlans: plans.map(p => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price?.toString() || "0"),
        description: p.description,
        visits: p.servicesIncluded,
      })),
      action: "subscribe_amc",
      quickReplies: ["Subscribe to Basic", "Subscribe to Standard", "Subscribe to Premium", "Tell me more"],
    };
  }

  // ── 8. Water quality ─────────────────────────────────────────────────────
  if (intent === "water_quality") {
    let detectedCity = "";
    for (const c of Object.keys(CITY_TDS)) {
      if (m.includes(c)) { detectedCity = c; break; }
    }

    if (detectedCity) {
      const info = CITY_TDS[detectedCity];
      return {
        message: `💧 **Water Quality in ${detectedCity.charAt(0).toUpperCase() + detectedCity.slice(1)}**\n\n• **TDS Level**: ${info.tds}\n• **Quality**: ${info.quality}\n• **Recommendation**: ${info.recommendation}\n\n**Safe TDS for drinking**: 50–150 ppm\n\nWant to book a **free water quality check** with your next service?`,
        intent,
        quickReplies: ["Book a service", "What TDS is safe?", "Get AMC plan"],
      };
    }

    return {
      message: `💧 **Water Quality by City:**\n\n${Object.entries(CITY_TDS).map(([c, d]) => `• **${c.charAt(0).toUpperCase() + c.slice(1)}**: TDS ${d.tds} — ${d.quality}`).join("\n")}\n\n**Safe range**: 50–150 ppm for drinking\n\nTell me your city for a detailed recommendation!`,
      intent,
      quickReplies: ["Delhi water quality", "Mumbai water quality", "Bangalore water quality"],
    };
  }

  // ── 9. Reminder / service history ───────────────────────────────────────
  if (intent === "reminder") {
    let lastServiceMessage = "You haven't had a service logged with us yet.";
    if (userId) {
      const recent = await db.select()
        .from(bookingsTable)
        .where(eq(bookingsTable.userId, userId))
        .orderBy(desc(bookingsTable.createdAt))
        .limit(1);

      if (recent.length > 0) {
        const last = recent[0];
        const days = Math.floor((Date.now() - new Date(last.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        if (months >= 6) {
          lastServiceMessage = `⚠️ It's been **${months} months** since your last service — filters may be exhausted. Time for a checkup!`;
        } else {
          lastServiceMessage = `✅ Your last service was **${days} days ago** (${months} months). You're good for now, but schedule around ${6 - months} months from now.`;
        }
      }
    }

    return {
      message: `🔁 **RO Maintenance Schedule:**\n\n${lastServiceMessage}\n\n**Recommended intervals:**\n• **Sediment & Carbon Filters**: Every 6 months\n• **Membrane**: Every 12–24 months (based on TDS)\n• **Full Service**: Every 6–12 months\n• **UV Lamp**: Every 12 months\n\nSet up an **AMC plan** to get automatic reminders and scheduled service visits!`,
      intent,
      quickReplies: ["Book a service now", "Get AMC plan", "What's my last service date?"],
    };
  }

  // ── 10. FAQ ──────────────────────────────────────────────────────────────
  if (intent === "faq") {
    if (/tds|total dissolved/.test(m)) {
      return { message: `💡 **TDS (Total Dissolved Solids)** measures mineral/chemical content in water.\n\n• **0–50 ppm**: Too pure (lacks minerals)\n• **50–150 ppm**: Ideal for drinking\n• **150–300 ppm**: Acceptable\n• **300–500 ppm**: High — RO essential\n• **500+ ppm**: Dangerous — urgent treatment needed\n\nIndia's tap water typically ranges from 200–500 ppm.`, intent, quickReplies: ["Check Delhi TDS", "Book water quality test"] };
    }
    if (/how often|service|when.*service/.test(m)) {
      return { message: `🗓️ **Service Frequency:**\n\n• **Sediment filter**: Every 3-6 months\n• **Carbon filter**: Every 6 months\n• **Membrane**: Every 12-24 months\n• **Full service**: Every 6-12 months\n• **UV lamp**: Every 12 months\n\nWith an **AMC plan**, we handle all reminders and visits automatically!`, intent, quickReplies: ["Get AMC plan", "Book a service"] };
    }
    if (/install|how long|time/.test(m)) {
      return { message: `⏱️ **RO Installation takes 1-2 hours**.\n\nOur technician will:\n1. Choose the best location\n2. Install wall mount & brackets\n3. Connect inlet & drain pipes\n4. Set up tank & faucet\n5. Test water quality & TDS\n6. Explain usage & maintenance\n\nBook installation now to get it done today!`, intent, quickReplies: ["Book installation"] };
    }

    return {
      message: `🤔 **Frequently Asked Questions:**\n\n• **How often to service?** Every 6-12 months\n• **When to change membrane?** When TDS output rises above 150 ppm or every 2 years\n• **How long does installation take?** 1-2 hours\n• **What is TDS?** Total Dissolved Solids — ideal 50-150 ppm\n• **What is AMC?** Annual contract for regular servicing at fixed cost\n• **What if I smell plastic?** Normal for first 24-48 hours; rinse tank 2-3 times\n\nAsk me anything about your RO!`,
      intent,
      quickReplies: ["How often to service?", "What is TDS?", "Book a service"],
    };
  }

  // ── 11. Default greeting ─────────────────────────────────────────────────
  setState(sessionId, { step: "idle", lastIntent: "general" });
  return {
    message: `👋 **Hi! I'm AquaBot — your RO service assistant.**\n\nI can help you:\n\n🔍 **Diagnose** your RO problem and estimate repair cost\n📅 **Book** a technician directly from this chat\n💰 **Get transparent prices** — no surprises\n🛒 **Recommend** the right RO system for your water\n📋 **Explain AMC plans** to save money long-term\n💧 **Check water quality** for your city\n🔁 **Track service history** and set reminders\n\n**Just describe your RO problem or ask me anything!**`,
    intent,
    quickReplies: ["My RO has no water", "Water tastes bad", "RO is leaking", "Book a service", "What is AMC?", "Water quality in Delhi"],
  };
}

// ---------------------------------------------------------------------------
// Quick fix tips
// ---------------------------------------------------------------------------

function getQuickTip(symptom: string): string {
  const tips: Record<string, string> = {
    "bad taste":      "Try flushing the tank 2-3 times. If taste persists after 24 hours, the carbon filter needs replacement.",
    "bad smell":      "Run 2-3 full tanks of water. Persistent smell means carbon filter is exhausted.",
    "smells bad":     "Run 2-3 full tanks of water. Persistent smell means carbon filter is exhausted.",
    "tastes bad":     "Try flushing the tank 2-3 times. If taste persists after 24 hours, the carbon filter needs replacement.",
    "leaking":        "Turn off the inlet valve immediately. Check all push-fit connections — press the blue ring and push pipe firmly.",
    "water leakage":  "Turn off the inlet valve immediately. Check all push-fit connections — press the blue ring and push pipe firmly.",
    "noisy":          "Check that the RO is mounted firmly on the wall. Loose mounting causes vibration noise.",
    "making noise":   "Check that the RO is mounted firmly on the wall. Loose mounting causes vibration noise.",
    "no water":       "Check if inlet water supply is on and the power adapter is connected.",
    "not working":    "Check power connection and inlet water supply valve first.",
    "slow":           "Check if any kinks in the inlet pipe are restricting flow.",
    "low pressure":   "Ensure inlet water supply pressure is adequate (min 5 psi).",
    "yellow water":   "Do not drink! Flush completely and call a technician immediately.",
    "tank not filling": "Check the inlet valve is fully open and water pressure is adequate.",
    "filter change":  "A DIY carbon/sediment filter change takes 15 minutes — we can guide you, or send a technician.",
    "high tds":       "Flush the membrane by running 1-2 full tanks. If TDS stays high, membrane replacement is needed.",
  };
  return tips[symptom] || "A technician inspection will identify the exact issue and fix it on the spot.";
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// POST /chat — main agentic endpoint
router.post("/", async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body || {};

    if (!message || !sessionId) {
      res.status(400).json({ error: "Missing message or sessionId" });
      return;
    }

    // Store user message
    if (!chatHistory.has(sessionId)) chatHistory.set(sessionId, []);
    const history = chatHistory.get(sessionId)!;
    history.push({ id: Date.now().toString(), role: "user", content: message, timestamp: new Date().toISOString() });

    // Generate agentic response
    const response = await generateResponse(message, sessionId, userId ? Number(userId) : undefined);

    // Store assistant message
    history.push({
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.message,
      timestamp: new Date().toISOString(),
      intent: response.intent,
    });

    if (history.length > 100) history.splice(0, history.length - 100);

    res.json({
      message: response.message,
      sessionId,
      intent: response.intent,
      products: response.products,
      estimate: response.estimate,
      action: response.action,
      bookingCreated: response.bookingCreated || null,
      quickReplies: response.quickReplies || [],
      amcPlans: response.amcPlans || [],
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /chat/history
router.get("/history", async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) { res.status(400).json({ error: "Missing sessionId" }); return; }
    res.json(chatHistory.get(sessionId as string) || []);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
