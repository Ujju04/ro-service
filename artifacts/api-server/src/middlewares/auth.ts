import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../lib/auth.js";

export interface AuthRequest extends Request {
  userId?: number;
  technicianId?: number;
  role?: "user" | "technician";
}

export function requireUser(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "Missing token" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyJwt(token);

  if (!payload || payload.role !== "user") {
    res.status(401).json({ error: "Unauthorized", message: "Invalid token" });
    return;
  }

  req.userId = payload.id as number;
  req.role = "user";
  next();
}

export function requireTechnician(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "Missing token" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyJwt(token);

  if (!payload || payload.role !== "technician") {
    res.status(401).json({ error: "Unauthorized", message: "Invalid token" });
    return;
  }

  req.technicianId = payload.id as number;
  req.role = "technician";
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "Missing token" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyJwt(token);

  if (!payload) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid token" });
    return;
  }

  if (payload.role === "user") {
    req.userId = payload.id as number;
  } else if (payload.role === "technician") {
    req.technicianId = payload.id as number;
  }
  req.role = payload.role as "user" | "technician";
  next();
}
