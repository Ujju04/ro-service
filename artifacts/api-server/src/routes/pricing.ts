import { Router } from "express";
import { db } from "@workspace/db";
import { partsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const SERVICE_CHARGE = 199;

// Symptom to parts mapping
const symptomPartsMap: Record<string, string[]> = {
  "low tds": ["Membrane", "Flow Resistor"],
  "no water": ["RO Pump", "Solenoid Valve", "Adapter"],
  "slow flow": ["Membrane", "Sediment Filter", "Spun Filter", "Flow Resistor"],
  "bad taste": ["Carbon Filter", "Membrane", "UV Lamp"],
  "bad smell": ["Carbon Filter", "Membrane"],
  "leaking": ["Adapter", "Tape", "Solenoid Valve"],
  "noisy": ["RO Pump", "Solenoid Valve"],
  "not filtering": ["Sediment Filter", "Carbon Filter", "Membrane"],
  "uv not working": ["UV Lamp", "UV Adapter"],
  "filter change": ["Filter Kit"],
  "full service": ["Full Kit"],
  "dirty water": ["Sediment Filter", "Spun Filter", "Carbon Filter"],
  "high tds": ["Membrane"],
  "motor not working": ["RO Pump"],
  "tank not filling": ["Solenoid Valve", "RO Pump", "Adapter"],
};

// Get all parts with pricing
router.get("/parts", async (req, res) => {
  try {
    const parts = await db.select().from(partsTable).where(eq(partsTable.isActive, true));
    res.json(parts);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Estimate cost based on symptoms
router.post("/estimate", async (req, res) => {
  try {
    const { symptoms = [], serviceType } = req.body;

    if (!symptoms.length) {
      res.json({
        parts: [],
        serviceCharge: SERVICE_CHARGE,
        partsTotal: 0,
        totalMin: SERVICE_CHARGE,
        totalMax: SERVICE_CHARGE,
        diagnosis: "Basic inspection service. Our technician will diagnose the issue on-site.",
      });
      return;
    }

    // Find parts needed based on symptoms
    const neededPartNames = new Set<string>();
    const lowerSymptoms = symptoms.map((s: string) => s.toLowerCase());

    for (const symptom of lowerSymptoms) {
      for (const [key, parts] of Object.entries(symptomPartsMap)) {
        if (symptom.includes(key) || key.includes(symptom)) {
          parts.forEach(p => neededPartNames.add(p));
        }
      }
    }

    // If no specific parts matched, add basic inspection parts
    if (neededPartNames.size === 0) {
      neededPartNames.add("Sediment Filter");
      neededPartNames.add("Carbon Filter");
    }

    // Get pricing for these parts
    const allParts = await db.select().from(partsTable).where(eq(partsTable.isActive, true));
    const estimateParts: any[] = [];
    let partsMin = 0;
    let partsMax = 0;

    for (const partName of neededPartNames) {
      const part = allParts.find(p => p.name.toLowerCase().includes(partName.toLowerCase()) || partName.toLowerCase().includes(p.name.toLowerCase()));
      if (part) {
        const minP = parseFloat(part.minPrice?.toString() || "0");
        const maxP = parseFloat(part.maxPrice?.toString() || "0");
        partsMin += minP;
        partsMax += maxP;
        estimateParts.push({
          name: part.name,
          minPrice: minP,
          maxPrice: maxP,
          reason: `Required for: ${symptoms.slice(0, 2).join(", ")}`,
        });
      }
    }

    const diagnosis = symptoms.length > 0
      ? `Based on your symptoms (${symptoms.join(", ")}), your RO may need the listed parts replaced. A technician will confirm on-site.`
      : "Standard inspection and service.";

    res.json({
      parts: estimateParts,
      serviceCharge: SERVICE_CHARGE,
      partsTotal: partsMin,
      totalMin: partsMin + SERVICE_CHARGE,
      totalMax: partsMax + SERVICE_CHARGE,
      diagnosis,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Water quality data by city
router.get("/water-quality/:city", async (req, res) => {
  const city = req.params.city.toLowerCase();
  
  const cityData: Record<string, any> = {
    delhi: { tds: 450, hardness: "Very Hard", ph: 7.8, quality: "Poor", issues: ["High TDS", "Heavy metals", "Chlorine"], recommendation: "RO + UV system strongly recommended. Change membrane every 6 months." },
    mumbai: { tds: 150, hardness: "Moderate", ph: 7.2, quality: "Moderate", issues: ["Chlorine taste", "Occasional turbidity"], recommendation: "RO with carbon filter recommended for better taste." },
    bangalore: { tds: 280, hardness: "Hard", ph: 7.5, quality: "Fair", issues: ["Hardness", "TDS above safe levels"], recommendation: "RO system recommended. Annual service advised." },
    chennai: { tds: 350, hardness: "Hard", ph: 7.6, quality: "Poor", issues: ["High TDS", "Salinity", "Hardness"], recommendation: "Multi-stage RO system essential. Service every 6 months." },
    hyderabad: { tds: 300, hardness: "Hard", ph: 7.4, quality: "Fair", issues: ["TDS above recommended", "Fluoride"], recommendation: "RO system recommended for safe drinking water." },
    pune: { tds: 200, hardness: "Moderate", ph: 7.3, quality: "Moderate", issues: ["Minor contamination", "Seasonal variations"], recommendation: "RO with UV filter recommended." },
    kolkata: { tds: 180, hardness: "Soft to Moderate", ph: 7.0, quality: "Moderate", issues: ["Arsenic traces", "Organic matter"], recommendation: "RO + UV system for safe water." },
    ahmedabad: { tds: 400, hardness: "Very Hard", ph: 7.9, quality: "Poor", issues: ["Very High TDS", "Fluoride", "Hardness"], recommendation: "High-capacity RO system essential. Service every 3-4 months." },
  };

  const defaultData = { tds: 250, hardness: "Moderate", ph: 7.4, quality: "Fair", issues: ["TDS elevated", "Seasonal variation"], recommendation: "RO system recommended for safe drinking water." };
  const data = cityData[city] || defaultData;
  
  res.json({ city: req.params.city, ...data });
});

export default router;
