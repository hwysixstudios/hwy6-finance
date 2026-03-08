import { useState, useMemo, useEffect } from "react";

const SUPABASE_URL = "https://oifdogecmbnztylkqiyk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZmRvZ2VjbWJuenR5bGtxaXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NTgyNTgsImV4cCI6MjA4ODQzNDI1OH0.9gdCu9W1PX1LJMpnHoeGofvQb1idJboqnSeBoW7rhm0";

const sb = {
  headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Prefer": "return=representation" },
  async get(table) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=id`, { headers: this.headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async insert(table, row) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: this.headers, body: JSON.stringify(row) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async update(table, id, patch) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: this.headers, body: JSON.stringify(patch) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async delete(table, id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: this.headers });
    if (!r.ok) throw new Error(await r.text());
  },
  async upsertConfig(key, value) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/config`, { method: "POST", headers: { ...this.headers, "Prefer": "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ key, value: String(value) }) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async getConfig() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/config?select=*`, { headers: this.headers });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const _NOW = new Date();
const CUR_MONTH = MONTHS[_NOW.getMonth()];
const CUR_YEAR = _NOW.getFullYear();
const DEFAULT_TARGET = 2500;

function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function groupByMonth(items) {
  const order = [...MONTHS].reverse(); // Dec → Jan, newest first
  const groups = {};
  items.forEach(item => {
    if (!groups[item.month]) groups[item.month] = [];
    groups[item.month].push(item);
  });
  return order.filter(m => groups[m]).map(m => ({ month: m, items: groups[m] }));
}

// Inline editable field — click to edit, blur/enter to save
const EF = ({ value, onSave, type = "text", options, style = {} }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const commit = () => { setEditing(false); if (String(val) !== String(value)) onSave(type === "number" ? parseFloat(val) || 0 : val); };
  if (editing) {
    if (options) return (
      <select value={val} onChange={e => { setVal(e.target.value); onSave(e.target.value); setEditing(false); }}
        onBlur={() => setEditing(false)}
        style={{ background: "#111", border: "1px solid #444", color: "#fff", fontFamily: "'DM Mono',monospace", fontSize: 11, padding: "2px 6px", borderRadius: 3, ...style }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    );
    return <input value={val} type={type === "number" ? "number" : "text"}
      onChange={e => setVal(e.target.value)}
      onBlur={commit} onKeyDown={e => e.key === "Enter" && commit()}
      style={{ background: "#111", border: "1px solid #444", color: "#fff", fontFamily: "'DM Mono',monospace", fontSize: 11, padding: "2px 6px", borderRadius: 3, width: "100%", ...style }} />;
  }
  return <span onClick={() => { setVal(value); setEditing(true); }}
    title="Click to edit"
    style={{ cursor: "text", borderBottom: "1px dashed #2a2a2a", paddingBottom: 1, ...style }}>{value || <span style={{ color: "#333" }}>—</span>}</span>;
};



const TABS = ["dashboard", "clients", "merch", "events", "contractors", "expenses", "subscriptions", "p&l"];

const EVENT_EXPENSE_CATS = ["Venue", "Marketing / Flyers", "Equipment / AV", "Talent / Performers", "Security", "Catering", "Permits / Insurance", "Staffing", "Merch / Giveaways", "Other"];

const initEvents = [
  { id: 1, name: "hwy6con", month: "Mar", status: "upcoming", description: "hwy6 convention / creative collective event" },
];

const initEventRevenue = [];
const initEventExpenses = [];

const initClients = [
  { id: 1, client: "McMurry University Football", amount: 2400, jobType: "Creative Direction", month: "Mar", type: "retainer", status: "paid" },
  { id: 2, client: "Alief Taylor Football", amount: 1200, jobType: "Film Production", month: "Feb", type: "one-off", status: "paid" },
  { id: 3, client: "Texas State Football", amount: 800, jobType: "Event Coverage", month: "Mar", type: "one-off", status: "unpaid" },
];

const initProducts = [
  { id: 1, name: "6SkullCaps", price: 35, category: "hwy6archives" },
  { id: 2, name: "6Chains", price: 65, category: "hwy6archives" },
];

const initSales = [
  { id: 1, productId: 1, qty: 4, month: "Mar" },
  { id: 2, productId: 2, qty: 2, month: "Mar" },
];

const initSubs = [
  { id: 1, name: "Meta Ads", category: "Marketing & Ads", amount: 300, billing: "monthly" },
  { id: 2, name: "Adobe Creative Cloud", category: "Software / SaaS", amount: 54.99, billing: "monthly" },
  { id: 3, name: "Google Drive", category: "Software / SaaS", amount: 9.99, billing: "monthly" },
  { id: 4, name: "QuickBooks", category: "Software / SaaS", amount: 30, billing: "monthly" },
  { id: 5, name: "Shopify", category: "Software / SaaS", amount: 39, billing: "monthly" },
];

const initContractors = [
  { id: 1, name: "Jahiree", role: "Music Producer", handle: "souljasix" },
];

const initPayments = [];

const EXPENSE_CATS = ["Equipment / Gear", "Travel / Gas", "Food / On-Set", "Printing / Materials", "Marketing", "Software / Tools", "Studio / Venue", "Wardrobe / Props", "Other"];

const initExpenses = [];

const Tag = ({ children, color }) => {
  const map = {
    green:  { bg: "#0b2218", text: "#4ade80", border: "#14532d" },
    red:    { bg: "#200f0f", text: "#f87171", border: "#7f1d1d" },
    yellow: { bg: "#231a07", text: "#fbbf24", border: "#78350f" },
    blue:   { bg: "#0b1628", text: "#60a5fa", border: "#1e3a5f" },
    purple: { bg: "#160f2a", text: "#c084fc", border: "#4a1d96" },
    gray:   { bg: "#161616", text: "#9ca3af", border: "#2a2a2a" },
  };
  const c = map[color] || map.gray;
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: "2px 9px", borderRadius: 3, fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
};

// NOTE: Inp and Sel receive c prop for theme colors
const Inp = ({ c = { input: "#111", inputBorder: "#252525", text: "#fff" }, style, ...p }) => (
  <input style={{ background: c.input, border: `1px solid ${c.inputBorder}`, color: c.text, padding: "14px 16px", borderRadius: 6, fontFamily: "'DM Mono',monospace", fontSize: 16, outline: "none", width: "100%", boxSizing: "border-box", WebkitAppearance: "none", ...style }} {...p} />
);

const Sel = ({ c = { input: "#111", inputBorder: "#252525", text: "#fff" }, style, children, ...p }) => (
  <select style={{ background: c.input, border: `1px solid ${c.inputBorder}`, color: c.text, padding: "14px 16px", borderRadius: 6, fontFamily: "'DM Mono',monospace", fontSize: 16, outline: "none", width: "100%", boxSizing: "border-box", WebkitAppearance: "none", cursor: "pointer", ...style }} {...p}>{children}</select>
);

const TH = ({ children }) => <span style={{ fontSize: 9, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase" }}>{children}</span>;

const LABEL = ({ children }) => <span style={{ fontSize: 9, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10, display: "block" }}>{children}</span>;

const emptyC = { client: "", amount: "", jobType: "", month: CUR_MONTH, type: "retainer", status: "unpaid" };
const emptySub = { name: "", category: "Software / SaaS", amount: "", billing: "monthly" };
const emptyP = { name: "", price: "", category: "hwy6archives" };
const emptySl = { productId: "", qty: "", month: CUR_MONTH };

export default function HWY6Finance() {
  const [tab, setTab] = useState("dashboard");
  const [dbReady, setDbReady] = useState(null); // null=checking, true=ready, false=needs setup
  const [dbError, setDbError] = useState(null);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : true
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = e => setDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const C = dark ? {
    bg: "#080808", nav: "#080808", navBorder: "#141414", surface: "#0e0e0e",
    border: "#1a1a1a", borderAlt: "#1e1e1e", borderFaint: "#0f0f0f",
    text: "#ffffff", textMid: "#aaaaaa", textDim: "#555555", textFaint: "#2a2a2a",
    label: "#3a3a3a", thead: "#0e0e0e", rowHover: "#0d0d0d",
    input: "#111111", inputBorder: "#252525",
    card: "#0e0e0e", codeBg: "#080808", codeText: "#4ade80",
    btnPrimary: "#ffffff", btnPrimaryText: "#000000",
    btnCancel: "none", btnCancelBorder: "#2a2a2a", btnCancelText: "#555555",
    btnDel: "#2a2a2a", tabOff: "#333333", tabOn: "#ffffff",
    error: "#1a0a0a", errorBorder: "#3a1a1a", errorText: "#f87171",
    scrollbar: "#222222", scrollbarTrack: "#0a0a0a",
    exportBorder: "#2a2a2a", exportText: "#666666",
    toggleBg: "#1a1a1a", toggleIcon: "☀️",
  } : {
    bg: "#f5f5f0", nav: "#ffffff", navBorder: "#e0e0d8", surface: "#ffffff",
    border: "#e0e0d8", borderAlt: "#d8d8cc", borderFaint: "#ebebE4",
    text: "#111111", textMid: "#444444", textDim: "#888888", textFaint: "#bbbbbb",
    label: "#999999", thead: "#f8f8f4", rowHover: "#fafaf6",
    input: "#ffffff", inputBorder: "#d0d0c8",
    card: "#ffffff", codeBg: "#f0f0ec", codeText: "#166534",
    btnPrimary: "#111111", btnPrimaryText: "#ffffff",
    btnCancel: "none", btnCancelBorder: "#d0d0c8", btnCancelText: "#888888",
    btnDel: "#cccccc", tabOff: "#aaaaaa", tabOn: "#111111",
    error: "#fef2f2", errorBorder: "#fca5a5", errorText: "#dc2626",
    scrollbar: "#cccccc", scrollbarTrack: "#f0f0ec",
    exportBorder: "#d0d0c8", exportText: "#888888",
    toggleBg: "#f0f0ec", toggleIcon: "🌙",
  };


  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [subs, setSubs] = useState([]);
  const [taxRate, setTaxRateState] = useState(0.30);
  const [incomeTarget, setIncomeTargetState] = useState(2500);
  const [editTarget, setEditTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState("2500");
  const [contractors, setContractors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showContractorF, setShowContractorF] = useState(false);
  const [showPaymentF, setShowPaymentF] = useState(null);
  const [showExpF, setShowExpF] = useState(false);
  const [nc2, setNc2] = useState({ name: "", role: "", handle: "" });
  const [npay, setNpay] = useState({ amount: "", month: CUR_MONTH, note: "" });
  const [nexp, setNexp] = useState({ description: "", amount: "", category: EXPENSE_CATS[0], month: CUR_MONTH, deductible: true });
  const [editTax, setEditTax] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventRevenue, setEventRevenue] = useState([]);
  const [eventExpenses, setEventExpenses] = useState([]);
  const [showEventF, setShowEventF] = useState(false);
  const [showEventRevF, setShowEventRevF] = useState(null);
  const [showEventExpF, setShowEventExpF] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ name: "", month: CUR_MONTH, status: "upcoming", description: "" });
  const [newEventRev, setNewEventRev] = useState({ description: "", amount: "", type: "Ticket Sales" });
  const [newEventExp, setNewEventExp] = useState({ description: "", amount: "", category: EVENT_EXPENSE_CATS[0] });
  const [showSF, setShowSF] = useState(false);
  const [showPF, setShowPF] = useState(false);
  const [showSlF, setShowSlF] = useState(false);
  const [showCF, setShowCF] = useState(false);
  const [nc, setNc] = useState(emptyC);
  const [ns, setNs] = useState(emptySub);
  const [np, setNp] = useState(emptyP);
  const [nsl, setNsl] = useState(emptySl);
  const [filterMonth, setFilterMonth] = useState("All");
  const [plMonth, setPlMonth] = useState(CUR_MONTH);
  const [exportMonth, setExportMonth] = useState(CUR_MONTH);
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // ── Load all data from Supabase on mount ──
  useEffect(() => {
    async function load() {
      try {
        const [cl, pr, sl, sb2, co, py, ex, ev, er, ee, cfg] = await Promise.all([
          sb.get("clients"), sb.get("products"), sb.get("sales"), sb.get("subs"),
          sb.get("contractors"), sb.get("payments"), sb.get("expenses"),
          sb.get("events"), sb.get("event_revenue"), sb.get("event_expenses"),
          sb.getConfig()
        ]);
        setClients(cl); setProducts(pr); setSales(sl); setSubs(sb2);
        setContractors(co); setPayments(py); setExpenses(ex);
        setEvents(ev); setEventRevenue(er); setEventExpenses(ee);
        const tax = cfg.find(c => c.key === "taxRate");
        const target = cfg.find(c => c.key === "incomeTarget");
        if (tax) setTaxRateState(parseFloat(tax.value));
        if (target) setIncomeTargetState(parseFloat(target.value));
        setDbReady(true);
      } catch (e) {
        if (e.message?.includes("relation") || e.message?.includes("does not exist") || e.message?.includes("404")) {
          setDbReady(false);
        } else {
          setDbError(e.message);
          setDbReady(false);
        }
      }
    }
    load();
  }, []);

  const setTaxRate = async (v) => { setTaxRateState(v); await sb.upsertConfig("taxRate", v); };
  const setIncomeTarget = async (v) => { setIncomeTargetState(v); await sb.upsertConfig("incomeTarget", v); };


  const clientRevenue = useMemo(() => clients.filter(c => c.status === "paid").reduce((a, c) => a + Number(c.amount), 0), [clients]);
  const clientUnpaid = useMemo(() => clients.filter(c => c.status === "unpaid").reduce((a, c) => a + Number(c.amount), 0), [clients]);
  const totalExpenses = useMemo(() => subs.reduce((a, s) => a + Number(s.amount), 0), [subs]);

  const getMerchRev = (salesArr) => salesArr.reduce((a, s) => {
    const p = products.find(p => p.id === s.product_id);
    return a + (p ? p.price * s.qty : 0);
  }, 0);

  const merchRevenue = useMemo(() => getMerchRev(sales), [sales, products]);
  const totalRevenue = clientRevenue + merchRevenue;
  const netProfit = totalRevenue - totalExpenses;
  const taxOwed = totalRevenue * taxRate;
  const takeHome = netProfit - taxOwed;

  const productTotals = useMemo(() => products.map(p => {
    const unitsSold = sales.filter(s => s.product_id === p.id).reduce((a, s) => a + s.qty, 0);
    return { ...p, unitsSold, revenue: unitsSold * p.price };
  }), [products, sales]);

  const filteredClients = useMemo(() =>
    filterMonth === "All" ? clients : clients.filter(c => c.month === filterMonth), [clients, filterMonth]);

  // P&L for month
  const plClientRev = useMemo(() => clients.filter(c => c.status === "paid" && c.month === plMonth).reduce((a, c) => a + Number(c.amount), 0), [clients, plMonth]);
  const plMerchRev = useMemo(() => getMerchRev(sales.filter(s => s.month === plMonth)), [sales, products, plMonth]);
  const plTotalRev = plClientRev + plMerchRev;
  const plNet = plTotalRev - totalExpenses;
  const plTax = plTotalRev * taxRate;
  const plTakeHome = plNet - plTax;

  const totalEventRevenue = useMemo(() => eventRevenue.reduce((a, r) => a + Number(r.amount), 0), [eventRevenue]);
  const totalEventExpenses = useMemo(() => eventExpenses.reduce((a, e) => a + Number(e.amount), 0), [eventExpenses]);

  const addEvent = async () => { if (!newEvent.name) return; const [r] = await sb.insert("events", newEvent); setEvents(v => [...v, r]); setNewEvent({ name: "", month: CUR_MONTH, status: "upcoming", description: "" }); setShowEventF(false); };
  const addEventRev = async (eventId) => { if (!newEventRev.amount) return; const [r] = await sb.insert("event_revenue", { ...newEventRev, event_id: eventId, amount: parseFloat(newEventRev.amount) }); setEventRevenue(v => [...v, r]); setNewEventRev({ description: "", amount: "", type: "Ticket Sales" }); setShowEventRevF(null); };
  const addEventExp = async (eventId) => { if (!newEventExp.amount) return; const [r] = await sb.insert("event_expenses", { ...newEventExp, event_id: eventId, amount: parseFloat(newEventExp.amount) }); setEventExpenses(v => [...v, r]); setNewEventExp({ description: "", amount: "", category: EVENT_EXPENSE_CATS[0] }); setShowEventExpF(null); };
  const addContractor = async () => { if (!nc2.name) return; const [r] = await sb.insert("contractors", nc2); setContractors(v => [...v, r]); setNc2({ name: "", role: "", handle: "" }); setShowContractorF(false); };
  const addPayment = async (contractorId) => { if (!npay.amount) return; const [r] = await sb.insert("payments", { ...npay, contractor_id: contractorId, amount: parseFloat(npay.amount) }); setPayments(v => [...v, r]); setNpay({ amount: "", month: CUR_MONTH, note: "" }); setShowPaymentF(null); };
  const addExpense = async () => { if (!nexp.description || !nexp.amount) return; const [r] = await sb.insert("expenses", { ...nexp, amount: parseFloat(nexp.amount) }); setExpenses(v => [...v, r]); setNexp({ description: "", amount: "", category: EXPENSE_CATS[0], month: CUR_MONTH, deductible: true }); setShowExpF(false); };
  const addClient = async () => { if (!nc.client || !nc.amount) return; const [r] = await sb.insert("clients", { ...nc, amount: parseFloat(nc.amount) }); setClients(v => [...v, r]); setNc(emptyC); setShowCF(false); };
  const addSub = async () => { if (!ns.name || !ns.amount) return; const [r] = await sb.insert("subs", { ...ns, amount: parseFloat(ns.amount) }); setSubs(v => [...v, r]); setNs(emptySub); setShowSF(false); };
  const addProduct = async () => { if (!np.name || !np.price) return; const [r] = await sb.insert("products", { ...np, price: parseFloat(np.price) }); setProducts(v => [...v, r]); setNp(emptyP); setShowPF(false); };
  const addSale = async () => { if (!nsl.productId || !nsl.qty) return; const [r] = await sb.insert("sales", { product_id: Number(nsl.productId), qty: parseInt(nsl.qty), month: nsl.month }); setSales(v => [...v, r]); setNsl(emptySl); setShowSlF(false); };

  const toggleClient = async (id) => { const c = clients.find(x => x.id === id); const ns2 = c.status === "paid" ? "unpaid" : "paid"; await sb.update("clients", id, { status: ns2 }); setClients(v => v.map(x => x.id === id ? { ...x, status: ns2 } : x)); };
  const updateClient = async (id, field, val) => { await sb.update("clients", id, { [field]: val }); setClients(v => v.map(c => c.id === id ? { ...c, [field]: val } : c)); };
  const updateSub = async (id, field, val) => { await sb.update("subs", id, { [field]: val }); setSubs(v => v.map(s => s.id === id ? { ...s, [field]: val } : s)); };
  const updateProduct = async (id, field, val) => { await sb.update("products", id, { [field]: val }); setProducts(v => v.map(p => p.id === id ? { ...p, [field]: val } : p)); };
  const updateSale = async (id, field, val) => { const dbField = field === "productId" ? "product_id" : field; await sb.update("sales", id, { [dbField]: val }); setSales(v => v.map(s => s.id === id ? { ...s, [field]: val } : s)); };
  const updateContractor = async (id, field, val) => { await sb.update("contractors", id, { [field]: val }); setContractors(v => v.map(c => c.id === id ? { ...c, [field]: val } : c)); };
  const updatePayment = async (id, field, val) => { await sb.update("payments", id, { [field]: val }); setPayments(v => v.map(p => p.id === id ? { ...p, [field]: val } : p)); };
  const updateExpense = async (id, field, val) => { await sb.update("expenses", id, { [field]: val }); setExpenses(v => v.map(e => e.id === id ? { ...e, [field]: val } : e)); };
  const updateEvent = async (id, field, val) => { await sb.update("events", id, { [field]: val }); setEvents(v => v.map(e => e.id === id ? { ...e, [field]: val } : e)); };
  const updateEventRev = async (id, field, val) => { await sb.update("event_revenue", id, { [field]: val }); setEventRevenue(v => v.map(r => r.id === id ? { ...r, [field]: val } : r)); };
  const updateEventExp = async (id, field, val) => { await sb.update("event_expenses", id, { [field]: val }); setEventExpenses(v => v.map(e => e.id === id ? { ...e, [field]: val } : e)); };

  const delClient = async (id) => { await sb.delete("clients", id); setClients(v => v.filter(x => x.id !== id)); };
  const delProduct = async (id) => { await sb.delete("products", id); setProducts(v => v.filter(x => x.id !== id)); };
  const delSale = async (id) => { await sb.delete("sales", id); setSales(v => v.filter(x => x.id !== id)); };
  const delSub = async (id) => { await sb.delete("subs", id); setSubs(v => v.filter(x => x.id !== id)); };
  const delContractor = async (id) => { await sb.delete("contractors", id); setContractors(v => v.filter(x => x.id !== id)); await Promise.all(payments.filter(p => p.contractor_id === id).map(p => sb.delete("payments", p.id))); setPayments(v => v.filter(p => p.contractor_id !== id)); };
  const delPayment = async (id) => { await sb.delete("payments", id); setPayments(v => v.filter(x => x.id !== id)); };
  const delExpense = async (id) => { await sb.delete("expenses", id); setExpenses(v => v.filter(x => x.id !== id)); };
  const delEvent = async (id) => { await sb.delete("events", id); setEvents(v => v.filter(x => x.id !== id)); };
  const delEventRev = async (id) => { await sb.delete("event_revenue", id); setEventRevenue(v => v.filter(x => x.id !== id)); };
  const delEventExp = async (id) => { await sb.delete("event_expenses", id); setEventExpenses(v => v.filter(x => x.id !== id)); };

  const totalContractorPaid = useMemo(() => payments.reduce((a, p) => a + Number(p.amount), 0), [payments]);
  const totalExpensesLogged = useMemo(() => expenses.reduce((a, e) => a + Number(e.amount), 0), [expenses]);
  const totalDeductible = useMemo(() => expenses.filter(e => e.deductible).reduce((a, e) => a + Number(e.amount), 0), [expenses]);
  const totalAllExpenses = totalExpenses + totalContractorPaid + totalExpensesLogged + totalEventExpenses;

  const exportCSV = () => {
    const m = exportMonth;
    const csvRows = [];

    // Header
    csvRows.push([`HWY6 Finance Export — ${m} ${CUR_YEAR}`]);
    csvRows.push([]);

    // Clients
    csvRows.push(["CLIENTS"]);
    csvRows.push(["Client", "Amount", "Job Type", "Type", "Status"]);
    clients.filter(c => c.month === m).forEach(c => {
      csvRows.push([c.client, c.amount, c.jobType || "", c.type, c.status]);
    });
    const clientTotal = clients.filter(c => c.month === m && c.status === "paid").reduce((a, c) => a + c.amount, 0);
    csvRows.push(["", `Collected: $${clientTotal.toFixed(2)}`]);
    csvRows.push([]);

    // Merch Sales
    csvRows.push(["MERCH SALES"]);
    csvRows.push(["Product", "Qty", "Unit Price", "Total"]);
    sales.filter(s => s.month === m).forEach(s => {
      const p = products.find(p => p.id === s.product_id);
      csvRows.push([p ? p.name : "Unknown", s.qty, p ? p.price : 0, p ? p.price * s.qty : 0]);
    });
    const merchTotal = sales.filter(s => s.month === m).reduce((a, s) => { const p = products.find(p => p.id === s.product_id); return a + (p ? p.price * s.qty : 0); }, 0);
    csvRows.push(["", `Merch Revenue: $${merchTotal.toFixed(2)}`]);
    csvRows.push([]);

    // Contractor Payments
    csvRows.push(["CONTRACTOR PAYMENTS"]);
    csvRows.push(["Contractor", "Role", "Amount", "Note"]);
    payments.filter(p => p.month === m).forEach(p => {
      const c = contractors.find(c => c.id === p.contractor_id);
      csvRows.push([c ? c.name : "Unknown", c ? c.role : "", p.amount, p.note || ""]);
    });
    const contractorTotal = payments.filter(p => p.month === m).reduce((a, p) => a + p.amount, 0);
    csvRows.push(["", `Total Paid Out: $${contractorTotal.toFixed(2)}`]);
    csvRows.push([]);

    // Expenses
    csvRows.push(["BUSINESS EXPENSES"]);
    csvRows.push(["Description", "Amount", "Category", "Deductible"]);
    expenses.filter(e => e.month === m).forEach(e => {
      csvRows.push([e.description, e.amount, e.category, e.deductible ? "Yes" : "No"]);
    });
    const expTotal = expenses.filter(e => e.month === m).reduce((a, e) => a + e.amount, 0);
    const expDeductible = expenses.filter(e => e.month === m && e.deductible).reduce((a, e) => a + e.amount, 0);
    csvRows.push(["", `Total: $${expTotal.toFixed(2)}`, `Deductible: $${expDeductible.toFixed(2)}`]);
    csvRows.push([]);

    // Events
    const eventsThisMonth = events.filter(ev => ev.month === m);
    if (eventsThisMonth.length > 0) {
      csvRows.push(["EVENTS"]);
      eventsThisMonth.forEach(ev => {
        const evRev = eventRevenue.filter(r => r.event_id === ev.id);
        const evExp = eventExpenses.filter(e => e.event_id === ev.id);
        const tRev = evRev.reduce((a, r) => a + r.amount, 0);
        const tExp = evExp.reduce((a, e) => a + e.amount, 0);
        csvRows.push([ev.name, ev.status, `Revenue: $${tRev.toFixed(2)}`, `Expenses: $${tExp.toFixed(2)}`, `Net: $${(tRev - tExp).toFixed(2)}`]);
        if (evRev.length > 0) { csvRows.push(["  Revenue Detail", "Type", "Amount"]); evRev.forEach(r => csvRows.push(["  " + (r.description || ""), r.type, r.amount])); }
        if (evExp.length > 0) { csvRows.push(["  Expense Detail", "Category", "Amount"]); evExp.forEach(e => csvRows.push(["  " + (e.description || ""), e.category, e.amount])); }
      });
      csvRows.push([]);
    }

    // Subscriptions
    csvRows.push(["SUBSCRIPTIONS (MONTHLY)"]);
    csvRows.push(["Name", "Category", "Amount", "Billing"]);
    subs.forEach(s => csvRows.push([s.name, s.category, s.amount, s.billing]));
    csvRows.push(["", `Total: $${totalExpenses.toFixed(2)}`]);
    csvRows.push([]);

    // Summary
    const totalRev = clientTotal + merchTotal;
    const totalExp = contractorTotal + expTotal + totalExpenses;
    const net = totalRev - totalExp;
    const tax = totalRev * taxRate;
    csvRows.push(["SUMMARY"]);
    csvRows.push(["Total Revenue", `$${totalRev.toFixed(2)}`]);
    csvRows.push(["Total Expenses", `$${totalExp.toFixed(2)}`]);
    csvRows.push(["Net Profit", `$${net.toFixed(2)}`]);
    csvRows.push([`Tax Reserve (${Math.round(taxRate * 100)}%)`, `$${tax.toFixed(2)}`]);
    csvRows.push(["Take-Home", `$${(net - tax).toFixed(2)}`]);

    const csv = csvRows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hwy6_${m}_${CUR_YEAR}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  const ROW = { padding: "12px 14px", borderBottom: `1px solid ${C.borderFaint}` };
  const THEAD = { padding: "10px 16px", borderBottom: `1px solid ${C.border}`, background: C.thead };
  const TABLE = { border: `1px solid ${C.border}`, borderRadius: 2, overflow: "hidden", marginBottom: 24 };
  const CARD = { background: C.card, border: `1px solid ${C.border}`, padding: "16px" };
  const FORM = { background: C.card, border: `1px solid ${C.borderAlt}`, padding: "16px", marginBottom: 12, borderRadius: 6 };
  const ADDBTN = { background: C.btnPrimary, color: C.btnPrimaryText, border: 'none', padding: '12px 18px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700, WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' };
  const SAVEBTN = { background: C.btnPrimary, color: C.btnPrimaryText, border: 'none', padding: '12px 18px', fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700, WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' };
  const CANCELBTN = { background: C.btnCancel, border: `1px solid ${C.btnCancelBorder}`, color: C.btnCancelText, padding: '12px 14px', fontFamily: "'DM Mono',monospace", fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' };
  const DELBTN = { background: 'none', border: 'none', color: C.btnDel, cursor: 'pointer', fontSize: 15, padding: '8px 12px', fontFamily: 'monospace' };
  const G2 = (children) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>{children}</div>;
  const G3 = (children) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>{children}</div>;

  const SQL_SETUP = `-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)
create table if not exists clients (id bigserial primary key, client text, amount numeric, "jobType" text, month text, type text, status text);
create table if not exists products (id bigserial primary key, name text, price numeric, category text);
create table if not exists sales (id bigserial primary key, product_id bigint, qty int, month text);
create table if not exists subs (id bigserial primary key, name text, category text, amount numeric, billing text);
create table if not exists contractors (id bigserial primary key, name text, role text, handle text);
create table if not exists payments (id bigserial primary key, contractor_id bigint, amount numeric, month text, note text);
create table if not exists expenses (id bigserial primary key, description text, amount numeric, category text, month text, deductible boolean);
create table if not exists events (id bigserial primary key, name text, month text, status text, description text);
create table if not exists event_revenue (id bigserial primary key, event_id bigint, description text, type text, amount numeric);
create table if not exists event_expenses (id bigserial primary key, event_id bigint, description text, category text, amount numeric);
create table if not exists config (id bigserial primary key, key text unique, value text);
alter table clients enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table subs enable row level security;
alter table contractors enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table events enable row level security;
alter table event_revenue enable row level security;
alter table event_expenses enable row level security;
alter table config enable row level security;
create policy "allow all" on clients for all using (true) with check (true);
create policy "allow all" on products for all using (true) with check (true);
create policy "allow all" on sales for all using (true) with check (true);
create policy "allow all" on subs for all using (true) with check (true);
create policy "allow all" on contractors for all using (true) with check (true);
create policy "allow all" on payments for all using (true) with check (true);
create policy "allow all" on expenses for all using (true) with check (true);
create policy "allow all" on events for all using (true) with check (true);
create policy "allow all" on event_revenue for all using (true) with check (true);
create policy "allow all" on event_expenses for all using (true) with check (true);
create policy "allow all" on config for all using (true) with check (true);`;

  const copySQL = () => { navigator.clipboard.writeText(SQL_SETUP); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const retry = async () => {
    setRetrying(true);
    setDbError(null);
    try {
      const [cl,pr,sl,sb2,co,py,ex,ev,er,ee,cfg] = await Promise.all([
        sb.get("clients"),sb.get("products"),sb.get("sales"),sb.get("subs"),
        sb.get("contractors"),sb.get("payments"),sb.get("expenses"),
        sb.get("events"),sb.get("event_revenue"),sb.get("event_expenses"),
        sb.getConfig()
      ]);
      setClients(cl); setProducts(pr); setSales(sl); setSubs(sb2);
      setContractors(co); setPayments(py); setExpenses(ex);
      setEvents(ev); setEventRevenue(er); setEventExpenses(ee);
      const tax = cfg.find(c => c.key === "taxRate");
      const target = cfg.find(c => c.key === "incomeTarget");
      if (tax) setTaxRateState(parseFloat(tax.value));
      if (target) setIncomeTargetState(parseFloat(target.value));
      setDbReady(true);
    } catch(e) {
      setDbError(e.message);
    }
    setRetrying(false);
  };

  if (dbReady === null) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "#222", letterSpacing: "0.2em", marginBottom: 8 }}>HWY6</div>
        <div style={{ fontSize: 10, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase" }}>Connecting to database...</div>
      </div>
    </div>
  );

  if (dbReady === false) return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", padding: "40px 16px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 40, letterSpacing: "0.1em", marginBottom: 4 }}>HWY6 FINANCE</div>
        <div style={{ fontSize: 10, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 32 }}>Database Setup Required</div>
        {dbError && <div style={{ background: C.error, border: `1px solid ${C.errorBorder}`, padding: 12, marginBottom: 20, fontSize: 11, color: C.errorText, borderRadius: 2 }}>Error: {dbError}</div>}
        <div style={{ background: C.card, border: `1px solid ${C.borderAlt}`, padding: 24, marginBottom: 20, borderRadius: 2 }}>
          <div style={{ fontSize: 9, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>Step 1 — Run this SQL in Supabase</div>
          <div style={{ fontSize: 10, color: C.textDim, marginBottom: 16, lineHeight: 1.6 }}>Go to <span style={{ color: "#60a5fa" }}>supabase.com</span> → your <strong style={{ color: "#fff" }}>hwy6-finance</strong> project → <strong style={{ color: "#fff" }}>SQL Editor</strong> → paste and run:</div>
          <pre style={{ background: C.codeBg, border: `1px solid ${C.border}`, padding: 16, fontSize: 10, color: C.codeText, overflowX: "auto", borderRadius: 2, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{SQL_SETUP}</pre>
          <button onClick={copySQL} style={{ marginTop: 12, background: copied ? "#0b2218" : "#fff", color: copied ? "#4ade80" : "#000", border: "none", padding: "8px 18px", fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontWeight: 700 }}>{copied ? "✓ Copied" : "Copy SQL"}</button>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.borderAlt}`, padding: 24, borderRadius: 2 }}>
          <div style={{ fontSize: 9, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>Step 2 — Connect</div>
          <div style={{ fontSize: 10, color: C.textDim, marginBottom: 16 }}>After running the SQL, click below to connect the app.</div>
          <button onClick={retry} disabled={retrying} style={{ background: "#fff", color: "#000", border: "none", padding: "10px 24px", fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontWeight: 700, opacity: retrying ? 0.5 : 1 }}>{retrying ? "Connecting..." : "Connect to Database"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        html,body,#root{height:100%;overscroll-behavior:none}
        body{background:` + C.bg + `}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:` + C.scrollbarTrack + `}::-webkit-scrollbar-thumb{background:` + C.scrollbar + `}
        .tr:hover{background:` + C.rowHover + `}
        .del:hover{color:#f87171!important}
        .tab{cursor:pointer;background:none;border:none;border-bottom:2px solid transparent;color:` + C.tabOff + `;font-family:'DM Mono',monospace;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;padding:12px 14px;transition:color 0.15s;-webkit-tap-highlight-color:transparent;touch-action:manipulation;white-space:nowrap}
        .tab.on{color:` + C.tabOn + `;border-bottom-color:` + C.tabOn + `}
        .tab:active{opacity:0.7}
        .mc{transition:border-color 0.2s}
        input,select{font-size:16px!important}
        input:focus,select:focus{outline:none;border-color:` + C.text + `!important}
        button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
      `}</style>

      {/* NAV */}
      <div style={{ borderBottom: `1px solid ${C.navBorder}`, background: C.nav, position: "sticky", top: 0, zIndex: 100, paddingTop: "env(safe-area-inset-top)" }}>
        <div style={{ maxWidth: 1020, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, paddingBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="data:image/png;base64,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" alt="hwy6" style={{ height: 36, width: 'auto', display: 'block', filter: dark ? 'invert(0)' : 'invert(1)' }} />
              <span style={{ fontSize: 10, color: C.label, letterSpacing: "0.25em", textTransform: "uppercase" }}>Finance OS</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sel c={C} style={{ width: "auto", fontSize: 12, padding: "6px 8px" }} value={exportMonth} onChange={e => setExportMonth(e.target.value)}>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </Sel>
              <button style={{ background: "none", border: `1px solid ${C.exportBorder}`, color: C.exportText, padding: "6px 14px", fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                onClick={exportCSV}>↓ Export {exportMonth}</button>
              <button onClick={() => setDark(d => !d)} style={{ background: C.toggleBg, border: `1px solid ${C.exportBorder}`, padding: "6px 10px", cursor: "pointer", fontSize: 14, borderRadius: 4, touchAction: "manipulation", WebkitTapHighlightColor: "transparent", lineHeight: 1 }}>{C.toggleIcon}</button>
            </div>
          </div>
          <div style={{ display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {TABS.map(t => <button key={t} className={`tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>{t}</button>)}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "20px 16px calc(100px + env(safe-area-inset-bottom))" }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Total Revenue", val: fmt(totalRevenue), color: "#4ade80", sub: "collected" },
              { label: "Net Profit", val: fmt(netProfit), color: netProfit >= 0 ? "#4ade80" : "#f87171", sub: "after expenses" },
              { label: "Burn Rate", val: fmt(totalAllExpenses), color: "#f87171", sub: "subs + contractors + expenses" },
              { label: "Pending", val: fmt(clientUnpaid), color: "#fbbf24", sub: "unpaid invoices" },
            ].map((m, i) => (
              <div key={i} className="mc" style={CARD}>
                <LABEL>{m.label}</LABEL>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 34, color: m.color, lineHeight: 1, marginBottom: 4 }}>{m.val}</div>
                <div style={{ fontSize: 9, color: C.label, letterSpacing: "0.1em" }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Tax card */}
          <div className="mc" style={{ ...CARD, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <LABEL>Tax Reserve ({Math.round(taxRate * 100)}%)</LABEL>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: "#fb923c" }}>{fmt(taxOwed)}</div>
              <div style={{ fontSize: 9, color: C.label, marginTop: 2 }}>set aside from revenue</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <LABEL>Take-Home</LABEL>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: takeHome >= 0 ? "#4ade80" : "#f87171" }}>{fmt(takeHome)}</div>
              {editTax ? (
                <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end", alignItems: "center" }}>
                  <Inp c={C} style={{ width: 60, textAlign: "center" }} value={tempTax} onChange={e => setTempTax(e.target.value)} />
                  <span style={{ fontSize: 11, color: C.textDim }}>%</span>
                  <button style={SAVEBTN} onClick={() => { setTaxRate(parseFloat(tempTax) / 100 || 0.25); setEditTax(false); }}>Set</button>
                  <button style={CANCELBTN} onClick={() => setEditTax(false)}>✕</button>
                </div>
              ) : (
                <button style={{ ...CANCELBTN, marginTop: 8 }} onClick={() => { setTempTax(String(Math.round(taxRate * 100))); setEditTax(true); }}>Edit %</button>
              )}
            </div>
          </div>

          {/* Income Target */}
          {(() => {
            const pct = Math.min((totalRevenue / incomeTarget) * 100, 100);
            const remaining = Math.max(incomeTarget - totalRevenue, 0);
            const over = totalRevenue > incomeTarget;
            return (
              <div className="mc" style={{ ...CARD, marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <LABEL>Monthly Target</LABEL>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: over ? "#4ade80" : "#fff" }}>{fmt(totalRevenue)}</span>
                      <span style={{ fontSize: 11, color: "#333" }}>/ {fmt(incomeTarget)}</span>
                    </div>
                    <div style={{ fontSize: 9, color: over ? "#4ade80" : "#fbbf24", marginTop: 2, letterSpacing: "0.1em" }}>
                      {over ? `▲ ${fmt(totalRevenue - incomeTarget)} over target` : `${fmt(remaining)} to go`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: C.label, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>{Math.round(pct)}% there</div>
                    {editTarget ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
                        <Inp c={C} style={{ width: 90, textAlign: "center" }} value={tempTarget} onChange={e => setTempTarget(e.target.value)} placeholder="$" />
                        <button style={SAVEBTN} onClick={() => { setIncomeTarget(parseFloat(tempTarget) || 2500); setEditTarget(false); }}>Set</button>
                        <button style={CANCELBTN} onClick={() => setEditTarget(false)}>✕</button>
                      </div>
                    ) : (
                      <button style={CANCELBTN} onClick={() => { setTempTarget(String(incomeTarget)); setEditTarget(true); }}>Edit Target</button>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 16, height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: over ? "#4ade80" : pct >= 75 ? "#fbbf24" : "#60a5fa", borderRadius: 2, transition: "width 0.6s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 9, color: "#1e1e1e" }}>$0</span>
                  <span style={{ fontSize: 9, color: "#1e1e1e" }}>{fmt(incomeTarget)}</span>
                </div>
              </div>
            );
          })()}

          {/* Revenue breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Freelance / Retainer", amt: clientRevenue, color: "#60a5fa" },
              { label: "Merch Sales", amt: merchRevenue, color: "#c084fc" },
            ].map((r, i) => {
              const pct = totalRevenue > 0 ? Math.round((r.amt / totalRevenue) * 100) : 0;
              return (
                <div key={i} className="mc" style={CARD}>
                  <LABEL>{r.label}</LABEL>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: r.color }}>{fmt(r.amt)}</div>
                  <div style={{ height: 2, background: "#1a1a1a", marginTop: 12, borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: r.color, borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 9, color: C.label, marginTop: 5 }}>{pct}% of total</div>
                </div>
              );
            })}
          </div>

          {/* Merch snapshot */}
          <div style={TABLE}>
            <div style={{ ...THEAD, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
              {["Product","Price","Units Sold","Revenue"].map(h => <TH key={h}>{h}</TH>)}
            </div>
            {productTotals.map(p => (
              <div key={p.id} className="tr" style={{ ...ROW, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#ccc" }}>{p.name}</span>
                <span style={{ fontSize: 12, color: C.textDim }}>{fmt(p.price)}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#c084fc" }}>{p.unitsSold}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#c084fc" }}>{fmt(p.revenue)}</span>
              </div>
            ))}
          </div>
        </>)}

        {/* ── CLIENTS ── */}
        {tab === "clients" && (<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 9, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase" }}>Clients</span>
            <button style={ADDBTN} onClick={() => setShowCF(v => !v)}>+ Add Client</button>
          </div>

          {showCF && (
            <div style={FORM}>
              <LABEL>New Entry</LABEL>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <Inp c={C} placeholder="Client name" value={nc.client} onChange={e => setNc(v => ({ ...v, client: e.target.value }))} />
                <Inp c={C} placeholder="Amount ($)" type="number" value={nc.amount} onChange={e => setNc(v => ({ ...v, amount: e.target.value }))} />
                <Inp c={C} placeholder="Job type" value={nc.jobType} onChange={e => setNc(v => ({ ...v, jobType: e.target.value }))} />
                <Sel c={C} value={nc.month} onChange={e => setNc(v => ({ ...v, month: e.target.value }))}>{MONTHS.map(m => <option key={m}>{m}</option>)}</Sel>
                <Sel c={C} value={nc.type} onChange={e => setNc(v => ({ ...v, type: e.target.value }))}><option value="retainer">Retainer</option><option value="one-off">One-Off</option></Sel>
                <Sel c={C} value={nc.status} onChange={e => setNc(v => ({ ...v, status: e.target.value }))}><option value="unpaid">Unpaid</option><option value="paid">Paid</option></Sel>
              </div>
              <div style={{ display: "flex", gap: 8 }}><button style={SAVEBTN} onClick={addClient}>Save</button><button style={CANCELBTN} onClick={() => setShowCF(false)}>Cancel</button></div>
            </div>
          )}

          {clients.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "#1e1e1e", fontSize: 11 }}>No clients added yet</div>}

          {groupByMonth(clients).map(({ month, items }) => {
            const monthCollected = items.filter(c => c.status === "paid").reduce((a, c) => a + c.amount, 0);
            const monthPending = items.filter(c => c.status === "unpaid").reduce((a, c) => a + c.amount, 0);
            return (
              <div key={month} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", marginBottom: 8, borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#333", letterSpacing: "0.08em" }}>{month} {CUR_YEAR}</span>
                  <div style={{ display: "flex", gap: 20 }}>
                    <span style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>Collected: <span style={{ color: "#4ade80", fontFamily: "'Bebas Neue'", fontSize: 15 }}>{fmt(monthCollected)}</span></span>
                    <span style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pending: <span style={{ color: "#fbbf24", fontFamily: "'Bebas Neue'", fontSize: 15 }}>{fmt(monthPending)}</span></span>
                  </div>
                </div>
                <div style={TABLE}>
                  <div style={{ ...THEAD, display: "grid", gridTemplateColumns: "2fr 1fr 1.4fr 0.8fr 0.8fr 36px" }}>
                    {["Client","Amount","Job Type","Type","Status",""].map(h => <TH key={h}>{h}</TH>)}
                  </div>
                  {items.map(c => (
                    <div key={c.id} className="tr" style={{ ...ROW, display: "grid", gridTemplateColumns: "2fr 1fr 1.4fr 0.8fr 0.8fr 36px", alignItems: "center" }}>
                      <EF value={c.client} onSave={v => updateClient(c.id, "client", v)} style={{ fontSize: 12, color: "#ddd" }} />
                      <EF value={c.amount} type="number" onSave={v => updateClient(c.id, "amount", v)} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: c.status === "paid" ? "#4ade80" : "#fbbf24" }} />
                      <EF value={c.jobType || ""} onSave={v => updateClient(c.id, "jobType", v)} style={{ fontSize: 11, color: C.textDim }} />
                      <EF value={c.type} options={["retainer","one-off"]} onSave={v => updateClient(c.id, "type", v)} style={{ fontSize: 10 }} />
                      <button className="stoggle" onClick={() => toggleClient(c.id)}><Tag color={c.status === "paid" ? "green" : "yellow"}>{c.status}</Tag></button>
                      <button className="del" style={DELBTN} onClick={() => delClient(c.id)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>)}

        {/* ── MERCH ── */}
        {tab === "merch" && (<>
          {/* Products table */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <LABEL>Products</LABEL>
            <button style={ADDBTN} onClick={() => setShowPF(v => !v)}>+ Add Product</button>
          </div>
          {showPF && (
            <div style={FORM}>
              <LABEL>New Product</LABEL>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <Inp c={C} placeholder="Product name" value={np.name} onChange={e => setNp(v => ({ ...v, name: e.target.value }))} />
                <Inp c={C} placeholder="Price ($)" type="number" value={np.price} onChange={e => setNp(v => ({ ...v, price: e.target.value }))} />
                <Sel c={C} value={np.category} onChange={e => setNp(v => ({ ...v, category: e.target.value }))}>
                  <option>hwy6archives</option><option>hwy6warehouse</option><option>other</option>
                </Sel>
              </div>
              <div style={{ display: "flex", gap: 8 }}><button style={SAVEBTN} onClick={addProduct}>Save</button><button style={CANCELBTN} onClick={() => setShowPF(false)}>Cancel</button></div>
            </div>
          )}
          <div style={TABLE}>
            <div style={{ ...THEAD, display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr 36px" }}>
              {["Product","Price","Category","Units Sold","Revenue",""].map(h => <TH key={h}>{h}</TH>)}
            </div>
            {productTotals.map(p => (
              <div key={p.id} className="tr" style={{ ...ROW, display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr 36px", alignItems: "center" }}>
                <EF value={p.name} onSave={v => updateProduct(p.id, "name", v)} style={{ fontSize: 12, color: "#ddd" }} />
                <EF value={p.price} type="number" onSave={v => updateProduct(p.id, "price", v)} style={{ fontSize: 12, color: C.textDim }} />
                <EF value={p.category} options={["hwy6archives","hwy6warehouse","other"]} onSave={v => updateProduct(p.id, "category", v)} style={{ fontSize: 10 }} />
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#c084fc" }}>{p.unitsSold}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#c084fc" }}>{fmt(p.revenue)}</span>
                <button className="del" style={DELBTN} onClick={() => delProduct(p.id)}>×</button>
              </div>
            ))}
          </div>

          {/* Sales log */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <LABEL>Sales Log</LABEL>
            <button style={ADDBTN} onClick={() => setShowSlF(v => !v)}>+ Log Sale</button>
          </div>
          {showSlF && (
            <div style={FORM}>
              <LABEL>New Sale</LABEL>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <Sel c={C} value={nsl.productId} onChange={e => setNsl(v => ({ ...v, productId: e.target.value }))}>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Sel>
                <Inp c={C} placeholder="Qty" type="number" value={nsl.qty} onChange={e => setNsl(v => ({ ...v, qty: e.target.value }))} />
                <Sel c={C} value={nsl.month} onChange={e => setNsl(v => ({ ...v, month: e.target.value }))}>{MONTHS.map(m => <option key={m}>{m}</option>)}</Sel>
              </div>
              <div style={{ display: "flex", gap: 8 }}><button style={SAVEBTN} onClick={addSale}>Save</button><button style={CANCELBTN} onClick={() => setShowSlF(false)}>Cancel</button></div>
            </div>
          )}

          {sales.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "#1e1e1e", fontSize: 11 }}>No sales logged</div>}

          {groupByMonth(sales).map(({ month, items: monthSales }) => {
            const monthTotal = monthSales.reduce((a, s) => { const p = products.find(p => p.id === s.product_id); return a + (p ? p.price * s.qty : 0); }, 0);
            return (
              <div key={month} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", marginBottom: 8, borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#333", letterSpacing: "0.08em" }}>{month} {CUR_YEAR}</span>
                  <span style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>Revenue: <span style={{ color: "#c084fc", fontFamily: "'Bebas Neue'", fontSize: 15 }}>{fmt(monthTotal)}</span></span>
                </div>
                <div style={TABLE}>
                  <div style={{ ...THEAD, display: "grid", gridTemplateColumns: "2fr 0.6fr 1fr 36px" }}>
                    {["Product","Qty","Total",""].map(h => <TH key={h}>{h}</TH>)}
                  </div>
                  {monthSales.map(sl => {
                    const p = products.find(p => p.id === sl.productId);
                    return (
                      <div key={sl.id} className="tr" style={{ ...ROW, display: "grid", gridTemplateColumns: "2fr 0.6fr 1fr 36px", alignItems: "center" }}>
                        <EF value={p ? p.name : "—"} options={products.map(p => p.name)} onSave={v => { const found = products.find(p => p.name === v); if (found) updateSale(sl.id, "productId", found.id); }} style={{ fontSize: 12, color: "#ddd" }} />
                        <EF value={sl.qty} type="number" onSave={v => updateSale(sl.id, "qty", parseInt(v))} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#c084fc" }} />
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#c084fc" }}>{p ? fmt(p.price * sl.qty) : "—"}</span>
                        <button className="del" style={DELBTN} onClick={() => delSale(sl.id)}>×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>)}

        {/* ── SUBSCRIPTIONS ── */}
        {tab === "subscriptions" && (<>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button style={ADDBTN} onClick={() => setShowSF(v => !v)}>+ Add Subscription</button>
          </div>
          {showSF && (
            <div style={FORM}>
              <LABEL>New Subscription</LABEL>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <Inp c={C} placeholder="Name" value={ns.name} onChange={e => setNs(v => ({ ...v, name: e.target.value }))} />
                <Inp c={C} placeholder="Amount ($/mo)" type="number" value={ns.amount} onChange={e => setNs(v => ({ ...v, amount: e.target.value }))} />
                <Sel c={C} value={ns.category} onChange={e => setNs(v => ({ ...v, category: e.target.value }))}>
                  <option>Software / SaaS</option><option>Marketing & Ads</option><option>Business / LLC</option>
                </Sel>
                <Sel c={C} value={ns.billing} onChange={e => setNs(v => ({ ...v, billing: e.target.value }))}>
                  <option value="monthly">Monthly</option><option value="annual">Annual</option>
                </Sel>
              </div>
              <div style={{ display: "flex", gap: 8 }}><button style={SAVEBTN} onClick={addSub}>Save</button><button style={CANCELBTN} onClick={() => setShowSF(false)}>Cancel</button></div>
            </div>
          )}
          <div style={TABLE}>
            <div style={{ ...THEAD, display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 36px" }}>
              {["Name","Category","Billing","Amount",""].map(h => <TH key={h}>{h}</TH>)}
            </div>
            {subs.map(sub => (
              <div key={sub.id} className="tr" style={{ ...ROW, display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 36px", alignItems: "center" }}>
                <EF value={sub.name} onSave={v => updateSub(sub.id, "name", v)} style={{ fontSize: 12, color: "#ddd" }} />
                <EF value={sub.category} options={["Software / SaaS","Marketing & Ads","Business / LLC"]} onSave={v => updateSub(sub.id, "category", v)} style={{ fontSize: 11, color: C.textDim }} />
                <EF value={sub.billing} options={["monthly","annual"]} onSave={v => updateSub(sub.id, "billing", v)} style={{ fontSize: 10 }} />
                <EF value={sub.amount} type="number" onSave={v => updateSub(sub.id, "amount", v)} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#f87171" }} />
                <button className="del" style={DELBTN} onClick={() => delSub(sub.id)}>×</button>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px", background: "#0a0a0a" }}>
              <span style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>Monthly Total: <span style={{ color: "#f87171", fontFamily: "'Bebas Neue'", fontSize: 17 }}>{fmt(totalExpenses)}</span></span>
            </div>
          </div>
        </>)}

        {/* ── EVENTS ── */}
        {tab === "events" && (<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 9, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase" }}>Events</span>
            <button style={ADDBTN} onClick={() => setShowEventF(v => !v)}>+ Add Event</button>
          </div>

          {showEventF && (
            <div style={FORM}>
              <div style={{ fontSize: 9, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>New Event</div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <Inp c={C} placeholder="Event name" value={newEvent.name} onChange={e => setNewEvent(v => ({ ...v, name: e.target.value }))} />
                <Sel c={C} value={newEvent.month} onChange={e => setNewEvent(v => ({ ...v, month: e.target.value }))}>{MONTHS.map(m => <option key={m}>{m}</option>)}</Sel>
                <Sel c={C} value={newEvent.status} onChange={e => setNewEvent(v => ({ ...v, status: e.target.value }))}><option value="upcoming">Upcoming</option><option value="past">Past</option></Sel>
              </div>
              <Inp c={C} placeholder="Description (optional)" value={newEvent.description} onChange={e => setNewEvent(v => ({ ...v, description: e.target.value }))} style={{ marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8 }}><button style={SAVEBTN} onClick={addEvent}>Save</button><button style={CANCELBTN} onClick={() => setShowEventF(false)}>Cancel</button></div>
            </div>
          )}

          {events.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "#1e1e1e", fontSize: 11 }}>No events added yet</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {events.map(ev => {
              const evRev = eventRevenue.filter(r => r.event_id === ev.id);
              const evExp = eventExpenses.filter(e => e.event_id === ev.id);
              const totalRev = evRev.reduce((a, r) => a + r.amount, 0);
              const totalExp = evExp.reduce((a, e) => a + e.amount, 0);
              const net = totalRev - totalExp;
              const isExpanded = expandedEvent === ev.id;

              return (
                <div key={ev.id} style={{ border: `1px solid ${C.border}`, borderRadius: 2, overflow: "hidden" }}>
                  {/* Event header */}
                  <div style={{ background: C.card, padding: "18px 20px", cursor: "pointer" }} onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <EF value={ev.name} onSave={v => updateEvent(ev.id, "name", v)} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#fff", letterSpacing: "0.05em" }} />
                        <Tag color={ev.status === "upcoming" ? "blue" : "gray"}>{ev.status}</Tag>
                        <EF value={ev.month} options={MONTHS} onSave={v => updateEvent(ev.id, "month", v)} style={{ fontSize: 10, color: "#333" }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 9, color: C.label, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 2 }}>Net</div>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: net >= 0 ? "#4ade80" : "#f87171" }}>{fmt(net)}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Sel c={C} style={{ width: "auto", fontSize: 10, padding: "4px 8px", background: "#111" }}
                            value={ev.status}
                            onChange={e => { e.stopPropagation(); updateEvent(ev.id, "status", e.target.value); }}
                            onClick={e => e.stopPropagation()}>
                            <option value="upcoming">Upcoming</option>
                            <option value="past">Past</option>
                          </Sel>
                          <button className="del" style={DELBTN} onClick={e => { e.stopPropagation(); delEvent(ev.id); }}>×</button>
                        </div>
                      </div>
                    </div>
                    {ev.description !== undefined && <div style={{ fontSize: 11, color: "#333", marginTop: 6 }}><EF value={ev.description || ""} onSave={v => updateEvent(ev.id, "description", v)} style={{ fontSize: 11, color: C.textMid }} /></div>}

                    {/* Mini summary bar */}
                    <div style={{ display: "flex", gap: 24, marginTop: 14 }}>
                      {[
                        { label: "Revenue", val: fmt(totalRev), color: "#4ade80" },
                        { label: "Expenses", val: fmt(totalExp), color: "#f87171" },
                        { label: "Net", val: fmt(net), color: net >= 0 ? "#4ade80" : "#f87171" },
                      ].map((s, i) => (
                        <div key={i}>
                          <div style={{ fontSize: 9, color: C.label, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
                          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: s.color }}>{s.val}</div>
                        </div>
                      ))}
                      <div style={{ marginLeft: "auto", fontSize: 10, color: "#222", alignSelf: "flex-end" }}>{isExpanded ? "▲ collapse" : "▼ expand"}</div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: "20px", borderTop: "1px solid #141414" }}>

                      {/* Revenue section */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 9, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase" }}>Revenue</span>
                          <button style={ADDBTN} onClick={() => setShowEventRevF(showEventRevF === ev.id ? null : ev.id)}>+ Add Revenue</button>
                        </div>
                        {showEventRevF === ev.id && (
                          <div style={{ ...FORM, marginBottom: 10 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                              <Inp c={C} placeholder="Description (e.g. Ticket Sales)" value={newEventRev.description} onChange={e => setNewEventRev(v => ({ ...v, description: e.target.value }))} />
                              <Inp c={C} placeholder="Amount ($)" type="number" value={newEventRev.amount} onChange={e => setNewEventRev(v => ({ ...v, amount: e.target.value }))} />
                              <Sel c={C} value={newEventRev.type} onChange={e => setNewEventRev(v => ({ ...v, type: e.target.value }))}>
                                {["Ticket Sales","Vendor Fees","Sponsorship","Merch","Other"].map(t => <option key={t}>{t}</option>)}
                              </Sel>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}><button style={SAVEBTN} onClick={() => addEventRev(ev.id)}>Save</button><button style={CANCELBTN} onClick={() => setShowEventRevF(null)}>Cancel</button></div>
                          </div>
                        )}
                        {evRev.length === 0 && <div style={{ fontSize: 11, color: "#1e1e1e", padding: "8px 0" }}>No revenue logged</div>}
                        {evRev.length > 0 && (
                          <div style={TABLE}>
                            <div style={{ ...THEAD, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 36px" }}>
                              {["Description","Type","Amount",""].map(h => <TH key={h}>{h}</TH>)}
                            </div>
                            {evRev.map(r => (
                              <div key={r.id} className="tr" style={{ ...ROW, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 36px", alignItems: "center" }}>
                                <EF value={r.description || ""} onSave={v => updateEventRev(r.id, "description", v)} style={{ fontSize: 12, color: "#ccc" }} />
                                <EF value={r.type} options={["Ticket Sales","Vendor Fees","Sponsorship","Merch","Other"]} onSave={v => updateEventRev(r.id, "type", v)} style={{ fontSize: 10 }} />
                                <EF value={r.amount} type="number" onSave={v => updateEventRev(r.id, "amount", v)} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#4ade80" }} />
                                <button className="del" style={DELBTN} onClick={() => delEventRev(r.id)}>×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Expenses section */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 9, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase" }}>Expenses</span>
                          <button style={ADDBTN} onClick={() => setShowEventExpF(showEventExpF === ev.id ? null : ev.id)}>+ Add Expense</button>
                        </div>
                        {showEventExpF === ev.id && (
                          <div style={{ ...FORM, marginBottom: 10 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                              <Inp c={C} placeholder="Description (e.g. Venue deposit)" value={newEventExp.description} onChange={e => setNewEventExp(v => ({ ...v, description: e.target.value }))} />
                              <Inp c={C} placeholder="Amount ($)" type="number" value={newEventExp.amount} onChange={e => setNewEventExp(v => ({ ...v, amount: e.target.value }))} />
                              <Sel c={C} value={newEventExp.category} onChange={e => setNewEventExp(v => ({ ...v, category: e.target.value }))}>
                                {EVENT_EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                              </Sel>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}><button style={SAVEBTN} onClick={() => addEventExp(ev.id)}>Save</button><button style={CANCELBTN} onClick={() => setShowEventExpF(null)}>Cancel</button></div>
                          </div>
                        )}
                        {evExp.length === 0 && <div style={{ fontSize: 11, color: "#1e1e1e", padding: "8px 0" }}>No expenses logged</div>}
                        {evExp.length > 0 && (
                          <div style={TABLE}>
                            <div style={{ ...THEAD, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 36px" }}>
                              {["Description","Category","Amount",""].map(h => <TH key={h}>{h}</TH>)}
                            </div>
                            {evExp.map(e => (
                              <div key={e.id} className="tr" style={{ ...ROW, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 36px", alignItems: "center" }}>
                                <EF value={e.description || ""} onSave={v => updateEventExp(e.id, "description", v)} style={{ fontSize: 12, color: "#ccc" }} />
                                <EF value={e.category} options={EVENT_EXPENSE_CATS} onSave={v => updateEventExp(e.id, "category", v)} style={{ fontSize: 10 }} />
                                <EF value={e.amount} type="number" onSave={v => updateEventExp(e.id, "amount", v)} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#f87171" }} />
                                <button className="del" style={DELBTN} onClick={() => delEventExp(e.id)}>×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>)}

        {/* ── CONTRACTORS ── */}
        {tab === "contractors" && (<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 9, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase" }}>Contractor Profiles</span>
            <button style={ADDBTN} onClick={() => setShowContractorF(v => !v)}>+ Add Contractor</button>
          </div>

          {showContractorF && (
            <div style={FORM}>
              <div style={{ fontSize: 9, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>New Contractor</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <Inp c={C} placeholder="Name" value={nc2.name} onChange={e => setNc2(v => ({ ...v, name: e.target.value }))} />
                <Inp c={C} placeholder="Role (e.g. Editor)" value={nc2.role} onChange={e => setNc2(v => ({ ...v, role: e.target.value }))} />
                <Inp c={C} placeholder="Handle / IG (optional)" value={nc2.handle} onChange={e => setNc2(v => ({ ...v, handle: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 8 }}><button style={SAVEBTN} onClick={addContractor}>Save</button><button style={CANCELBTN} onClick={() => setShowContractorF(false)}>Cancel</button></div>
            </div>
          )}

          {contractors.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "#222", fontSize: 11 }}>No contractors added yet</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {contractors.map(c => {
              const cPayments = payments.filter(p => p.contractor_id === c.id);
              const totalPaid = cPayments.reduce((a, p) => a + p.amount, 0);
              const isLogging = showPaymentF === c.id;
              return (
                <div key={c.id} style={{ border: `1px solid ${C.border}`, borderRadius: 2, overflow: "hidden" }}>
                  {/* Profile header */}
                  <div style={{ background: C.card, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a1a1a", border: `1px solid ${C.exportBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, color: C.textDim }}>{c.name[0]}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 16, color: "#ddd", marginBottom: 2 }}><EF value={c.name} onSave={v => updateContractor(c.id, "name", v)} style={{ fontSize: 16, color: "#ddd" }} /></div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <EF value={c.role || ""} onSave={v => updateContractor(c.id, "role", v)} style={{ fontSize: 10, color: C.textDim }} />
                          <EF value={c.handle || ""} onSave={v => updateContractor(c.id, "handle", v)} style={{ fontSize: 10, color: "#333" }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, color: C.label, letterSpacing: "0.15em", textTransform: "uppercase" }}>Total Paid Out</div>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: "#f87171" }}>{fmt(totalPaid)}</div>
                      </div>
                      <button style={ADDBTN} onClick={() => { setShowPaymentF(isLogging ? null : c.id); setNpay({ amount: "", month: CUR_MONTH, note: "" }); }}>+ Log Payment</button>
                      <button className="del" style={DELBTN} onClick={() => delContractor(c.id)}>×</button>
                    </div>
                  </div>

                  {/* Log payment form */}
                  {isLogging && (
                    <div style={{ ...FORM, margin: 0, borderRadius: 0, borderTop: "1px solid #1e1e1e" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 10, marginBottom: 10 }}>
                        <Inp c={C} placeholder="Amount ($)" type="number" value={npay.amount} onChange={e => setNpay(v => ({ ...v, amount: e.target.value }))} />
                        <Sel c={C} value={npay.month} onChange={e => setNpay(v => ({ ...v, month: e.target.value }))}>{MONTHS.map(m => <option key={m}>{m}</option>)}</Sel>
                        <Inp c={C} placeholder="Note (e.g. Edit — Matière Desirée video)" value={npay.note} onChange={e => setNpay(v => ({ ...v, note: e.target.value }))} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}><button style={SAVEBTN} onClick={() => addPayment(c.id)}>Save</button><button style={CANCELBTN} onClick={() => setShowPaymentF(null)}>Cancel</button></div>
                    </div>
                  )}

                  {/* Payment history */}
                  {cPayments.length > 0 && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 36px", padding: "8px 20px", background: C.bg, borderTop: "1px solid #111" }}>
                        {["Amount","Month","Note",""].map(h => <TH key={h}>{h}</TH>)}
                      </div>
                      {cPayments.map(p => (
                        <div key={p.id} className="tr" style={{ ...ROW, display: "grid", gridTemplateColumns: "1fr 1fr 2fr 36px", alignItems: "center", paddingLeft: 20 }}>
                          <EF value={p.amount} type="number" onSave={v => updatePayment(p.id, "amount", v)} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#f87171" }} />
                          <EF value={p.month} options={MONTHS} onSave={v => updatePayment(p.id, "month", v)} style={{ fontSize: 11, color: C.textMid }} />
                          <EF value={p.note || ""} onSave={v => updatePayment(p.id, "note", v)} style={{ fontSize: 11, color: C.textDim }} />
                          <button className="del" style={DELBTN} onClick={() => delPayment(p.id)}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {cPayments.length === 0 && (
                    <div style={{ padding: "14px 20px", fontSize: 10, color: "#1e1e1e" }}>No payments logged yet</div>
                  )}
                </div>
              );
            })}
          </div>

          {contractors.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, padding: "12px 16px", border: `1px solid ${C.border}`, background: "#0a0a0a" }}>
              <span style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total Paid Out: <span style={{ color: "#f87171", fontFamily: "'Bebas Neue'", fontSize: 17 }}>{fmt(totalContractorPaid)}</span></span>
            </div>
          )}
        </>)}

        {/* ── EXPENSES ── */}
        {tab === "expenses" && (<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 9, color: "#333", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Business Expenses</span>
              <span style={{ fontSize: 10, color: C.label }}>Tax deductible entries reduce your taxable income</span>
            </div>
            <button style={ADDBTN} onClick={() => setShowExpF(v => !v)}>+ Log Expense</button>
          </div>

          {showExpF && (
            <div style={FORM}>
              <div style={{ fontSize: 9, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>New Expense</div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                <Inp c={C} placeholder="Description" value={nexp.description} onChange={e => setNexp(v => ({ ...v, description: e.target.value }))} />
                <Inp c={C} placeholder="Amount ($)" type="number" value={nexp.amount} onChange={e => setNexp(v => ({ ...v, amount: e.target.value }))} />
                <Sel c={C} value={nexp.month} onChange={e => setNexp(v => ({ ...v, month: e.target.value }))}>{MONTHS.map(m => <option key={m}>{m}</option>)}</Sel>
                <Sel c={C} value={nexp.category} onChange={e => setNexp(v => ({ ...v, category: e.target.value }))}>
                  {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                </Sel>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <input type="checkbox" id="deductible" checked={nexp.deductible} onChange={e => setNexp(v => ({ ...v, deductible: e.target.checked }))} style={{ accentColor: "#4ade80", width: 14, height: 14, cursor: "pointer" }} />
                <label htmlFor="deductible" style={{ fontSize: 11, color: C.textDim, cursor: "pointer", letterSpacing: "0.05em" }}>Tax deductible</label>
              </div>
              <div style={{ display: "flex", gap: 8 }}><button style={SAVEBTN} onClick={addExpense}>Save</button><button style={CANCELBTN} onClick={() => setShowExpF(false)}>Cancel</button></div>
            </div>
          )}

          {/* Summary bar */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Total Spent", val: fmt(totalExpensesLogged), color: "#f87171" },
              { label: "Deductible", val: fmt(totalDeductible), color: "#4ade80" },
              { label: "Tax Savings Est.", val: fmt(totalDeductible * taxRate), color: "#fb923c" },
            ].map((s, i) => (
              <div key={i} className="mc" style={CARD}>
                <div style={{ fontSize: 9, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {expenses.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "#1e1e1e", fontSize: 11 }}>No expenses logged</div>}

          {groupByMonth(expenses).map(({ month, items: monthExp }) => {
            const monthTotal = monthExp.reduce((a, e) => a + e.amount, 0);
            const monthDeductible = monthExp.filter(e => e.deductible).reduce((a, e) => a + e.amount, 0);
            return (
              <div key={month} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", marginBottom: 8, borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: "#333", letterSpacing: "0.08em" }}>{month} {CUR_YEAR}</span>
                  <div style={{ display: "flex", gap: 20 }}>
                    <span style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>Spent: <span style={{ color: "#f87171", fontFamily: "'Bebas Neue'", fontSize: 15 }}>{fmt(monthTotal)}</span></span>
                    <span style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>Deductible: <span style={{ color: "#4ade80", fontFamily: "'Bebas Neue'", fontSize: 15 }}>{fmt(monthDeductible)}</span></span>
                  </div>
                </div>
                <div style={TABLE}>
                  <div style={{ ...THEAD, display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 0.8fr 36px" }}>
                    {["Description","Amount","Category","Deductible",""].map(h => <TH key={h}>{h}</TH>)}
                  </div>
                  {monthExp.map(e => (
                    <div key={e.id} className="tr" style={{ ...ROW, display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 0.8fr 36px", alignItems: "center" }}>
                      <EF value={e.description} onSave={v => updateExpense(e.id, "description", v)} style={{ fontSize: 12, color: "#ccc" }} />
                      <EF value={e.amount} type="number" onSave={v => updateExpense(e.id, "amount", v)} style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#f87171" }} />
                      <EF value={e.category} options={EXPENSE_CATS} onSave={v => updateExpense(e.id, "category", v)} style={{ fontSize: 10 }} />
                      <EF value={e.deductible ? "Yes" : "No"} options={["Yes","No"]} onSave={v => updateExpense(e.id, "deductible", v === "Yes")} style={{ fontSize: 10 }} />
                      <button className="del" style={DELBTN} onClick={() => delExpense(e.id)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>)}

        {/* ── P&L ── */}
        {tab === "p&l" && (<>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 9, color: "#333", letterSpacing: "0.15em", textTransform: "uppercase" }}>Month:</span>
            <Sel c={C} style={{ width: "auto" }} value={plMonth} onChange={e => setPlMonth(e.target.value)}>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </Sel>
            <span style={{ fontSize: 9, color: "#1e1e1e" }}>{CUR_YEAR}</span>
          </div>

          <div style={{ ...TABLE, marginBottom: 0 }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #141414", background: "#0d0d0d" }}>
              <span style={{ fontSize: 9, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase" }}>Revenue</span>
            </div>
            {[
              { label: "Freelance / Retainer", val: plClientRev, color: "#60a5fa" },
              { label: "Merch Sales", val: plMerchRev, color: "#c084fc" },
            ].map((r, i) => (
              <div key={i} className="tr" style={{ ...ROW, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: C.textDim }}>{r.label}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: r.color }}>{fmt(r.val)}</span>
              </div>
            ))}
            <div style={{ ...ROW, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}>
              <span style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Total Revenue</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: "#4ade80" }}>{fmt(plTotalRev)}</span>
            </div>

            <div style={{ padding: "12px 20px", borderBottom: "1px solid #141414", borderTop: "1px solid #1e1e1e", background: "#0d0d0d" }}>
              <span style={{ fontSize: 9, color: C.label, letterSpacing: "0.2em", textTransform: "uppercase" }}>Expenses</span>
            </div>
            {subs.map(sub => (
              <div key={sub.id} className="tr" style={{ ...ROW, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: C.textMid }}>{sub.name}</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#f87171" }}>({fmt(sub.amount)})</span>
              </div>
            ))}
            {totalContractorPaid > 0 && (
              <div className="tr" style={{ ...ROW, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: C.textMid }}>Contractor Payments</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#f87171" }}>({fmt(totalContractorPaid)})</span>
              </div>
            )}
            {totalEventExpenses > 0 && (
              <div className="tr" style={{ ...ROW, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: C.textMid }}>Event Expenses</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "#f87171" }}>({fmt(totalEventExpenses)})</span>
              </div>
            )}
            {totalEventRevenue > 0 && (
              <div className="tr" style={{ ...ROW, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: C.textDim }}>Event Revenue</span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#4ade80" }}>{fmt(totalEventRevenue)}</span>
              </div>
            )}
            <div style={{ ...ROW, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}>
              <span style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Total Expenses</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: "#f87171" }}>({fmt(totalAllExpenses)})</span>
            </div>

            <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e1e1e", background: "#0a0a0a" }}>
              <span style={{ fontSize: 10, color: "#777", textTransform: "uppercase", letterSpacing: "0.15em" }}>Net Profit</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: (plTotalRev - totalAllExpenses) >= 0 ? "#4ade80" : "#f87171" }}>{fmt(plTotalRev - totalAllExpenses)}</span>
            </div>

            <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #141414", background: "#090909" }}>
              <span style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.15em" }}>Tax Reserve ({Math.round(taxRate * 100)}%)</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: "#fb923c" }}>({fmt(plTax)})</span>
            </div>

            <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e1e1e", background: C.bg }}>
              <span style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.15em" }}>Take-Home</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 38, color: (plTotalRev - totalAllExpenses - (plTotalRev * taxRate)) >= 0 ? "#4ade80" : "#f87171" }}>{fmt(plTotalRev - totalAllExpenses - (plTotalRev * taxRate))}</span>
            </div>
          </div>
        </>)}

      </div>
    </div>
  );
}
