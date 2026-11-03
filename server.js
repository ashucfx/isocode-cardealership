const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET || "local-development-secret-change-me";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const PUBLIC = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data.json");

function seed() {
  return {
    users: [
      { id: "u-admin", name: "Aarav Mehta", email: "admin@example.test", passwordHash: hashPassword("Admin@123"), role: "ADMIN", showroomId: "lucknow" },
      { id: "u-consultant", name: "Nisha Verma", email: "consultant@example.test", passwordHash: hashPassword("Consult@123"), role: "SALES_CONSULTANT", showroomId: "lucknow" },
      { id: "u-buyer", name: "Demo Buyer", email: "buyer@example.test", passwordHash: hashPassword("Buyer@123"), role: "BUYER" }
    ],
    showrooms: [
      { id: "lucknow", name: "Brand X Hazratganj", city: "Lucknow", address: "14 Mahatma Gandhi Marg" },
      { id: "gomti", name: "Brand X Gomti Nagar", city: "Lucknow", address: "Vibhuti Khand" }
    ],
    vehicles: [
      { id: "NEW-H-02", type: "NEW", model: "Model H", variant: "ZX Automatic", fuel: "Petrol", transmission: "Automatic", year: 2026, km: 0, price: 1245000, status: "Available", image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1400&q=85", colour: "Arctic White", specs: ["1.5L turbo petrol", "6-speed automatic", "6 airbags"] },
      { id: "NEW-C-01", type: "NEW", model: "Model C", variant: "VX Manual", fuel: "Petrol", transmission: "Manual", year: 2026, km: 0, price: 985000, status: "Available", image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=85", colour: "Midnight Blue", specs: ["1.2L petrol", "5-speed manual", "Connected cabin"] },
      { id: "NEW-S-03", type: "NEW", model: "Model S", variant: "LX Hybrid", fuel: "Hybrid", transmission: "Automatic", year: 2026, km: 0, price: 1675000, status: "Available", image: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1400&q=85", colour: "Satin Silver", specs: ["Hybrid powertrain", "Panoramic roof", "360° camera"] },
      { id: "UC-1182", type: "USED", model: "Model C", variant: "VX", fuel: "Diesel", transmission: "Manual", year: 2022, km: 41200, price: 845000, status: "Available", image: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1400&q=85", colour: "Graphite Grey", owners: 1, registration: "UP-32-AB-4812", inspection: "128-point inspection passed", certified: true },
      { id: "UC-1190", type: "USED", model: "Model S", variant: "LX", fuel: "Petrol", transmission: "Automatic", year: 2021, km: 58600, price: 512000, status: "Booked", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85", colour: "Pearl White", owners: 2, registration: "UP-32-CD-1190", inspection: "Inspection completed", certified: true }
    ],
    pricing: [
      { id: "p-h-lko", vehicleId: "NEW-H-02", city: "Lucknow", exShowroom: 1245000, roadTax: 149400, insurance: 52800, accessories: 18000, validUntil: "2026-12-31", active: true },
      { id: "p-c-lko", vehicleId: "NEW-C-01", city: "Lucknow", exShowroom: 985000, roadTax: 118200, insurance: 46700, accessories: 12000, validUntil: "2026-12-31", active: true },
      { id: "p-s-lko", vehicleId: "NEW-S-03", city: "Lucknow", exShowroom: 1675000, roadTax: 201000, insurance: 61200, accessories: 22000, validUntil: "2026-12-31", active: true }
    ],
    bookings: [],
    leads: [
      { id: "lead-demo", name: "Riya Kapoor", email: "riya@example.test", phone: "+91 98765 43210", vehicleId: "NEW-H-02", showroomId: "lucknow", date: "2026-11-08", slot: "11:30", source: "Website", status: "NEW", assignedTo: "u-consultant", createdAt: new Date().toISOString(), consent: true }
    ]
  };
}
function load() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(seed(), null, 2));
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  let migrated = false;
  for (const user of data.users) {
    if (user.password && !user.passwordHash) {
      user.passwordHash = hashPassword(user.password);
      delete user.password;
      migrated = true;
    }
  }
  if (migrated) fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  return data;
}
let db = load();
function save() { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }
function json(res, status, value) { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(value)); }
function body(req) { return new Promise((resolve, reject) => { let raw = ""; req.on("data", c => { raw += c; if (raw.length > 1000000) req.destroy(); }); req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("Invalid JSON")); } }); req.on("error", reject); }); }
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) { return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`; }
function verifyPassword(password, stored) { const [salt, expected] = String(stored || "").split(":"); if (!salt || !expected) return false; const actual = crypto.scryptSync(password, salt, 64).toString("hex"); return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected)); }
function tokenFor(user) { const payload = Buffer.from(JSON.stringify({ id: user.id, exp: Date.now() + 86400000 })).toString("base64url"); const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url"); return `${payload}.${signature}`; }
function userFrom(req) { const value = req.headers.cookie?.match(/bx_session=([^;]+)/)?.[1]; if (!value) return null; try { const [payload, signature] = value.split("."); const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url"); if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; const session = JSON.parse(Buffer.from(payload, "base64url").toString()); return session.exp > Date.now() ? db.users.find(u => u.id === session.id) : null; } catch { return null; } }
function guard(req, res, roles) { const user = userFrom(req); if (!user) { json(res, 401, { error: "Please sign in." }); return null; } if (roles && !roles.includes(user.role)) { json(res, 403, { error: "You do not have permission for this action." }); return null; } return user; }
function priceFor(vehicleId, city = "Lucknow") { const p = db.pricing.find(x => x.vehicleId === vehicleId && x.city.toLowerCase() === city.toLowerCase() && x.active && new Date(x.validUntil) >= new Date()); return p ? { ...p, onRoad: p.exShowroom + p.roadTax + p.insurance + p.accessories } : null; }
function masked(registration) { return registration ? registration.replace(/^(.{2})-(\d{2})-([A-Z]{2})-(\d{2})\d{2}$/, "$1-$2-$3-••••") : null; }
function assignLead(lead) { const consultants = db.users.filter(u => u.role === "SALES_CONSULTANT" && u.showroomId === lead.showroomId); if (consultants.length) lead.assignedTo = consultants[0].id; return lead; }
async function generateAiText(kind, lead, vehicle) {
  const prompt = kind === "summary"
    ? `Summarise this buyer lead in two concise sentences. Use only these facts and say unknown when a fact is missing. Do not invent discounts, availability, budget, or preferences.\nBuyer: ${lead.name}\nVehicle: ${vehicle.model} ${vehicle.variant}\nTest drive: ${lead.date} at ${lead.slot}\nSource: ${lead.source}`
    : `Write a concise professional first-reply draft for this showroom lead. Reference only the supplied vehicle and booking facts. Do not promise availability, discounts, final prices, or actions not yet completed. Clearly write a draft that a consultant must review.\nBuyer: ${lead.name}\nVehicle: ${vehicle.model} ${vehicle.variant}\nRequested test drive: ${lead.date} at ${lead.slot}`;
  if (!GEMINI_API_KEY) return { text: kind === "summary" ? `Interested in ${vehicle.model} ${vehicle.variant}. Requested a ${lead.date} test drive at ${lead.slot}. Source: ${lead.source}. Budget and preferences are unknown.` : `Hello ${lead.name}, thank you for your interest in the ${vehicle.model} ${vehicle.variant}. Your test drive request for ${lead.date} at ${lead.slot} is with our team. We will confirm the details shortly. Regards, Brand X Showroom`, source: "local-development" };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 180 } }) });
  if (!response.ok) throw new Error(`Gemini provider returned ${response.status}`);
  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
  if (!text || text.length > 2000) throw new Error("Gemini returned an invalid response");
  return { text, source: "gemini" };
}
function staticFile(req, res, pathname) { const file = pathname === "/" ? "index.html" : pathname.slice(1); const target = path.normalize(path.join(PUBLIC, file)); if (!target.startsWith(PUBLIC) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) return false; const ext = path.extname(target); const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" }; res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" }); fs.createReadStream(target).pipe(res); return true; }

async function api(req, res, url) {
  try {
    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const input = await body(req); const user = db.users.find(u => u.email.toLowerCase() === String(input.email || "").toLowerCase() && verifyPassword(input.password, u.passwordHash));
      if (!user) return json(res, 401, { error: "Incorrect email or password." });
      res.setHeader("Set-Cookie", `bx_session=${tokenFor(user)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`);
      return json(res, 200, { user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    if (req.method === "POST" && url.pathname === "/api/auth/logout") { res.setHeader("Set-Cookie", "bx_session=; HttpOnly; Path=/; Max-Age=0"); return json(res, 200, { ok: true }); }
    if (req.method === "GET" && url.pathname === "/api/session") { const user = userFrom(req); return json(res, 200, { user: user ? { id: user.id, name: user.name, role: user.role } : null }); }
    if (req.method === "GET" && url.pathname === "/api/vehicles") {
      const type = url.searchParams.get("type"); const vehicles = db.vehicles.filter(v => !type || v.type === type).map(v => ({ ...v, registration: masked(v.registration), pricing: v.type === "NEW" ? priceFor(v.id) : null }));
      return json(res, 200, { vehicles });
    }
    if (req.method === "GET" && url.pathname.startsWith("/api/vehicles/")) {
      const v = db.vehicles.find(x => x.id === decodeURIComponent(url.pathname.split("/").pop())); if (!v) return json(res, 404, { error: "Vehicle not found." });
      return json(res, 200, { vehicle: { ...v, registration: masked(v.registration), pricing: v.type === "NEW" ? priceFor(v.id) : null } });
    }
    if (req.method === "GET" && url.pathname === "/api/showrooms") return json(res, 200, { showrooms: db.showrooms });
    if (req.method === "GET" && url.pathname === "/api/availability") {
      const date = url.searchParams.get("date"); const taken = db.bookings.filter(b => b.date === date).map(b => b.slot); return json(res, 200, { slots: ["09:30", "11:30", "14:30", "16:30"].map(time => ({ time, available: !taken.includes(time) })) });
    }
    if (req.method === "POST" && url.pathname === "/api/test-drives") {
      const input = await body(req); if (!input.consent) return json(res, 400, { error: "Consent is required to process your booking." });
      if (!input.name || !input.email || !input.phone || !input.vehicleId || !input.showroomId || !input.date || !input.slot) return json(res, 400, { error: "Please complete all required fields." });
      if (db.bookings.some(b => b.date === input.date && b.slot === input.slot && b.showroomId === input.showroomId)) return json(res, 409, { error: "That slot is no longer available. Please choose another." });
      const booking = { id: `td-${Date.now()}`, ...input, createdAt: new Date().toISOString() }; db.bookings.push(booking);
      const lead = assignLead({ id: `lead-${Date.now()}`, name: input.name, email: input.email, phone: input.phone, vehicleId: input.vehicleId, showroomId: input.showroomId, date: input.date, slot: input.slot, source: "Website", status: "ASSIGNED", createdAt: new Date().toISOString(), consent: true }); db.leads.push(lead); save();
      return json(res, 201, { booking, lead });
    }
    if (req.method === "GET" && url.pathname === "/api/leads") { const user = guard(req, res, ["SALES_CONSULTANT", "ADMIN"]); if (!user) return; const leads = db.leads.filter(l => user.role === "ADMIN" || l.assignedTo === user.id).map(l => ({ ...l, vehicle: db.vehicles.find(v => v.id === l.vehicleId), assignee: db.users.find(u => u.id === l.assignedTo)?.name })); return json(res, 200, { leads }); }
    if (req.method === "PATCH" && url.pathname.startsWith("/api/leads/")) { const user = guard(req, res, ["SALES_CONSULTANT", "ADMIN"]); if (!user) return; const id = url.pathname.split("/").pop(); const lead = db.leads.find(l => l.id === id); if (!lead || (user.role !== "ADMIN" && lead.assignedTo !== user.id)) return json(res, 404, { error: "Lead not found." }); const input = await body(req); Object.assign(lead, { status: input.status || lead.status, contactedAt: input.status === "CONTACTED" ? new Date().toISOString() : lead.contactedAt }); save(); return json(res, 200, { lead }); }
    if (req.method === "POST" && url.pathname.match(/^\/api\/leads\/[^/]+\/ai-(summary|reply)$/)) { const user = guard(req, res, ["SALES_CONSULTANT", "ADMIN"]); if (!user) return; const id = url.pathname.split("/")[3]; const lead = db.leads.find(l => l.id === id); if (!lead) return json(res, 404, { error: "Lead not found." }); const vehicle = db.vehicles.find(v => v.id === lead.vehicleId); try { const kind = url.pathname.endsWith("summary") ? "summary" : "reply"; const result = await generateAiText(kind, lead, vehicle); return json(res, 200, { kind, draft: result.text, generated: result.source === "gemini", source: result.source }); } catch (error) { console.error("AI provider error:", error.message); return json(res, 503, { error: "AI assistance is temporarily unavailable. Write the response manually." }); } }
    if (req.method === "GET" && url.pathname === "/api/admin/pricing") { if (!guard(req, res, ["ADMIN"])) return; return json(res, 200, { pricing: db.pricing.map(p => ({ ...p, vehicle: db.vehicles.find(v => v.id === p.vehicleId) })) }); }
    if (req.method === "PATCH" && url.pathname.startsWith("/api/admin/pricing/")) { if (!guard(req, res, ["ADMIN"])) return; const p = db.pricing.find(x => x.id === url.pathname.split("/").pop()); if (!p) return json(res, 404, { error: "Pricing record not found." }); const input = await body(req); for (const key of ["exShowroom", "roadTax", "insurance", "accessories"]) if (input[key] !== undefined && (!Number.isFinite(Number(input[key])) || Number(input[key]) < 0)) return json(res, 400, { error: "Pricing values must be non-negative numbers." }); Object.assign(p, input, { exShowroom: Number(input.exShowroom ?? p.exShowroom), roadTax: Number(input.roadTax ?? p.roadTax), insurance: Number(input.insurance ?? p.insurance), accessories: Number(input.accessories ?? p.accessories) }); save(); return json(res, 200, { pricing: p }); }
    return json(res, 404, { error: "Not found." });
  } catch (error) { console.error(error); return json(res, 500, { error: "Something went wrong. Please try again." }); }
}
const server = http.createServer((req, res) => { const url = new URL(req.url, `http://${req.headers.host || "localhost"}`); if (url.pathname.startsWith("/api/")) return api(req, res, url); if (!staticFile(req, res, url.pathname)) json(res, 404, { error: "Not found." }); });
if (require.main === module) server.listen(PORT, () => console.log(`Brand X showroom running at http://localhost:${PORT}`));
module.exports = { priceFor, assignLead };
