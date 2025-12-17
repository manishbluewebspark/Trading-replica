// import axios from "axios";
// import zlib from "zlib";
// import unzipper from "unzipper";
// import { KiteAccess } from "../utils/kiteClient.js";

// // =======================================================
// // ✅ CONFIG: URLs
// // =======================================================

// // AngelOne
// const ANGELONE_SCRIP_MASTER_URL =
//   "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json";

// // Finvasia (Shoonya)
// const FINVASIA_SYMBOL_MASTER_URLS = {
//   NSE: "https://api.shoonya.com/NSE_symbols.txt.zip",
//   BSE: "https://api.shoonya.com/BSE_symbols.txt.zip",
//   NFO: "https://api.shoonya.com/NFO_symbols.txt.zip",
//   MCX: "https://api.shoonya.com/MCX_symbols.txt.zip",
// };

// // Upstox (gzipped JSON)
// const UPSTOX_INSTRUMENT_URLS = {
//   COMPLETE:
//     "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz",
//   NSE: "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz",
//   BSE: "https://assets.upstox.com/market-quote/instruments/exchange/BSE.json.gz",
//   MCX: "https://assets.upstox.com/market-quote/instruments/exchange/MCX.json.gz",
// };

// // Fyers CSV
// const FYERS_SYMBOL_MASTER_URLS = {
//   NSE_CM: "https://public.fyers.in/sym_details/NSE_CM.csv",
//   BSE_CM: "https://public.fyers.in/sym_details/BSE_CM.csv",
//   NSE_FO: "https://public.fyers.in/sym_details/NSE_FO.csv",
//   BSE_FO: "https://public.fyers.in/sym_details/BSE_FO.csv",
//   NSE_CD: "https://public.fyers.in/sym_details/NSE_CD.csv",
//   MCX_COM: "https://public.fyers.in/sym_details/MCX_COM.csv",
// };

// // =======================================================
// // ✅ HELPERS: Common
// // =======================================================

// const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
// const normalizeExch = (ex) => safeStr(ex).trim().toUpperCase();
// const normalizeSymbol = (s) => safeStr(s).trim().toUpperCase();

// // AngelOne symbol: often "SUZLON-EQ", Kite symbol: "SUZLON"
// function normalizeTradingSymbolForMatch(symbol) {
//   const s = normalizeSymbol(symbol);
//   // remove "-EQ" for matching
//   return s.replace(/-EQ$/i, "");
// }

// // =======================================================
// // ✅ FETCH: AngelOne
// // =======================================================
// async function fetchAngelOneScripMaster() {
//   const res = await axios.get(ANGELONE_SCRIP_MASTER_URL, { timeout: 180000 });
//   return Array.isArray(res.data) ? res.data : [];
// }

// // =======================================================
// // ✅ FETCH: Kite
// // =======================================================
// async function fetchKiteInstruments() {
//   const apiKey = process.env.KITE_API_KEY;
//   const kite = KiteAccess(apiKey);
//   const data = await kite.getInstruments(); // your existing function
//   return Array.isArray(data) ? data : [];
// }

// // =======================================================
// // ✅ FETCH: Finvasia (zip txt)
// // =======================================================

// function parseCSVToObjects(csv) {
//   const lines = csv
//     .split("\n")
//     .map((l) => l.trim())
//     .filter(Boolean);

//   const headers = lines.shift()?.split(",") || [];
//   return lines.map((line) => {
//     const values = line.split(",");
//     const obj = {};
//     headers.forEach((header, index) => {
//       const key = header.trim();
//       let value = values[index]?.trim() ?? "";
//       if (!isNaN(value) && value !== "") value = Number(value);
//       obj[key] = value;
//     });
//     return obj;
//   });
// }

// async function downloadAndUnzipText(url) {
//   const zipRes = await axios.get(url, {
//     responseType: "arraybuffer",
//     timeout: 180000,
//   });

//   const directory = await unzipper.Open.buffer(Buffer.from(zipRes.data));
//   const file = directory.files.find(
//     (f) => !f.path.endsWith("/") && f.path.toLowerCase().includes(".txt")
//   );

//   if (!file) throw new Error(`No .txt found inside zip: ${url}`);

//   const content = await file.buffer();
//   return content.toString("utf-8");
// }

// async function fetchFinvasiaInstrumentsByExchange(exch) {
//   const url = FINVASIA_SYMBOL_MASTER_URLS[exch];
//   if (!url) throw new Error(`Unsupported Finvasia exch '${exch}'`);

//   const txt = await downloadAndUnzipText(url);
//   const list = parseCSVToObjects(txt);
//   return list.map((row) => ({ exch, ...row }));
// }

// async function fetchAllFinvasiaInstruments() {
//   const results = await Promise.all(
//     Object.keys(FINVASIA_SYMBOL_MASTER_URLS).map((exch) =>
//       fetchFinvasiaInstrumentsByExchange(exch)
//     )
//   );
//   return results.flat();
// }

// // =======================================================
// // ✅ FETCH: Upstox (json.gz)
// // =======================================================
// async function fetchUpstoxJsonGz(url) {
//   const res = await axios.get(url, {
//     responseType: "arraybuffer",
//     timeout: 180000,
//     headers: {
//       "Accept-Encoding": "gzip, deflate, br",
//       Accept: "application/json",
//       "User-Agent": "Mozilla/5.0",
//     },
//   });

//   const gzBuffer = Buffer.from(res.data);
//   const jsonText = zlib.gunzipSync(gzBuffer).toString("utf-8");
//   const parsed = JSON.parse(jsonText);
//   return Array.isArray(parsed) ? parsed : [];
// }

// async function fetchUpstoxInstruments(exch = "COMPLETE") {
//   const key = normalizeExch(exch);
//   const url = UPSTOX_INSTRUMENT_URLS[key];
//   if (!url) throw new Error(`Invalid upstox exch '${exch}'`);
//   return fetchUpstoxJsonGz(url);
// }

// // Upstox token/symbol extraction (supports multiple shapes)
// function getUpstoxToken(u) {
//   // try common keys
//   return (
//     u?.exchange_token ??
//     u?.instrument_token ??
//     u?.token ??
//     u?.exchangeToken ??
//     null
//   );
// }

// function getUpstoxSymbol(u) {
//   // try common keys
//   return (
//     u?.tradingsymbol ??
//     u?.trading_symbol ??
//     u?.symbol ??
//     u?.instrument_key ??
//     u?.instrumentKey ??
//     null
//   );
// }

// function getUpstoxExchange(u) {
//   return u?.exchange ?? u?.exch ?? u?.segment ?? null;
// }

// // =======================================================
// // ✅ FETCH: FYERS (CSV)
// // =======================================================

// function splitCSVLine(line) {
//   const out = [];
//   let cur = "";
//   let inQuotes = false;

//   for (let i = 0; i < line.length; i++) {
//     const ch = line[i];
//     if (ch === '"') {
//       inQuotes = !inQuotes;
//       continue;
//     }
//     if (ch === "," && !inQuotes) {
//       out.push(cur);
//       cur = "";
//     } else {
//       cur += ch;
//     }
//   }
//   out.push(cur);
//   return out.map((x) => x.trim());
// }

// function parseFyersCSV(text, segment) {
//   const lines = String(text)
//     .split("\n")
//     .map((l) => l.trim())
//     .filter(Boolean);

//   if (!lines.length) return [];

//   const first = lines[0].toLowerCase();
//   const hasHeader =
//     first.includes("fytoken") ||
//     first.includes("symbol") ||
//     first.includes("exchange");

//   const dataLines = hasHeader ? lines.slice(1) : lines;

//   return dataLines.map((line) => {
//     const cols = splitCSVLine(line);

//     const fytoken = cols[0] ?? "";
//     const name = cols[1] ?? "";

//     // find symbol like NSE:SUZLON-EQ
//     const symbolCol =
//       cols.find((c) => typeof c === "string" && /^[A-Z]+:/.test(c)) || "";

//     const exchange = symbolCol.includes(":") ? symbolCol.split(":")[0] : "";
//     const symbolOnly = symbolCol.includes(":") ? symbolCol.split(":")[1] : symbolCol;

//     return {
//       segment,
//       fytoken,
//       name,
//       symbol: symbolCol,
//       exchange,
//       tradingsymbol: symbolOnly,
//       raw: cols,
//     };
//   });
// }

// async function fetchFyersSegment(segment) {
//   const url = FYERS_SYMBOL_MASTER_URLS[segment];
//   if (!url) throw new Error(`Invalid fyers segment '${segment}'`);

//   const res = await axios.get(url, {
//     responseType: "text",
//     timeout: 180000,
//     headers: { Accept: "text/csv,*/*" },
//   });

//   return parseFyersCSV(res.data, segment);
// }

// async function fetchAllFyersInstruments() {
//   const results = await Promise.all(
//     Object.keys(FYERS_SYMBOL_MASTER_URLS).map((seg) => fetchFyersSegment(seg))
//   );
//   return results.flat();
// }

// // =======================================================
// // ✅ MATCH KEYS (Token + fallback Symbol/Exchange)
// // =======================================================

// function buildTokenKey(token) {
//   const t = safeStr(token).trim();
//   return t ? t : "";
// }

// function buildSymbolKey(exch, symbol) {
//   const e = normalizeExch(exch);
//   const s = normalizeTradingSymbolForMatch(symbol);
//   return e && s ? `${e}:${s}` : "";
// }

// // =======================================================
// // ✅ MAIN CONTROLLER
// // =======================================================
// export const getMergedInstrumentsNew = async (req, res) => {
//   try {

//     console.log('req controll 1');
    
//     const startTime = Date.now();

//     // =======================================================
//     // 1️⃣ Fetch all sources (no Redis)
//     // =======================================================
//     const [angeloneData, kiteData, finvasiaList, upstoxData, fyersData] =
//       await Promise.all([
//         fetchAngelOneScripMaster(),
//         fetchKiteInstruments(),
//         fetchAllFinvasiaInstruments(),
//         fetchUpstoxInstruments("COMPLETE"),
//         fetchAllFyersInstruments(),
//       ]);

//         console.log('req controll 2');

//     // =======================================================
//     // 2️⃣ Build lookup maps (token + symbolKey)
//     // =======================================================

//     // ---- Kite maps ----
//     const kiteByToken = new Map();      // exchange_token -> kite
//     const kiteBySymbolKey = new Map();  // EXCH:SYMBOL -> kite

//     for (const k of kiteData) {
//       const kToken = buildTokenKey(k?.exchange_token);
//       if (kToken) kiteByToken.set(kToken, k);

//       const kKey = buildSymbolKey(k?.exchange, k?.tradingsymbol);
//       if (kKey) kiteBySymbolKey.set(kKey, k);
//     }

//      console.log('req controll 3');

//     // ---- Finvasia maps ----
//     const finByToken = new Map();       // Token -> fin
//     const finBySymbolKey = new Map();   // EXCH:SYMBOL -> fin

//     for (const f of finvasiaList) {
//       const finToken = buildTokenKey(f?.Token);
//       if (finToken) finByToken.set(finToken, f);

//       // Finvasia uses Exchange + TradingSymbol/Symbol
//       const finKey = buildSymbolKey(f?.Exchange, f?.TradingSymbol || f?.Symbol);
//       if (finKey) finBySymbolKey.set(finKey, f);
//     }

//     console.log('req controll 4');

//     // ---- Upstox maps ----
//     const upsByToken = new Map();
//     const upsBySymbolKey = new Map();

//     for (const u of upstoxData) {
//       const uToken = buildTokenKey(getUpstoxToken(u));
//       if (uToken) upsByToken.set(uToken, u);

//       const uKey = buildSymbolKey(getUpstoxExchange(u), getUpstoxSymbol(u));
//       if (uKey) upsBySymbolKey.set(uKey, u);
//     }

//      console.log('req controll 5');

//     // ---- Fyers maps ----
//     const fyByToken = new Map(); // fytoken
//     const fyBySymbolKey = new Map(); // EXCH:SYMBOL

//     for (const f of fyersData) {
//       const fyToken = buildTokenKey(f?.fytoken);
//       if (fyToken) fyByToken.set(fyToken, f);

//       // fyersData already has exchange + tradingsymbol
//       const fyKey = buildSymbolKey(f?.exchange, f?.tradingsymbol);
//       if (fyKey) fyBySymbolKey.set(fyKey, f);
//     }

//       console.log('req controll 6');

//     // =======================================================
//     // 3️⃣ Merge starting from AngelOne rows
//     //    AngelOne token is your primary key
//     // =======================================================
//     const mergedAngel = angeloneData.map((angel) => {
//       const angelToken = buildTokenKey(angel?.token);
//       const angelExch = angel?.exch_seg || angel?.exchange || "";
//       const angelSymbol = angel?.symbol || angel?.name || "";

//       // ✅ primary match by token
//       let kiteMatch = angelToken ? kiteByToken.get(angelToken) : null;
//       let finMatch = angelToken ? finByToken.get(angelToken) : null;
//       let upstoxMatch = angelToken ? upsByToken.get(angelToken) : null;

//       // FYERS token format is usually different, so do fallback by symbol key first
//       let fyMatch = null;

//       // ✅ fallback by EXCH:SYMBOL
//       const symKey = buildSymbolKey(angelExch, angelSymbol);
//       if (!kiteMatch && symKey) kiteMatch = kiteBySymbolKey.get(symKey) || null;
//       if (!finMatch && symKey) finMatch = finBySymbolKey.get(symKey) || null;
//       if (!upstoxMatch && symKey) upstoxMatch = upsBySymbolKey.get(symKey) || null;
//       if (symKey) fyMatch = fyBySymbolKey.get(symKey) || null;

//       // =======================================================
//       // ✅ REQUIRED OUTPUT FIELDS (as you asked)
//       // kiteSymbol, kiteToken
//       // finvasiaSymbol, finvasiaToken
//       // upstoxSymbol, upstoxToken
//       // fyersSymbol, fyersToken
//       // =======================================================
//       return {
//         ...angel,

//         // ---------------- KITE (NEW FIELDS) ----------------
//         kiteSymbol: kiteMatch?.tradingsymbol || null,
//         kiteToken: kiteMatch?.exchange_token ?? null,
//         kiteExchange: kiteMatch?.exchange || null,
//         kiteInstrumentType: kiteMatch?.instrument_type || null,

//         // ---------------- FINVASIA (NEW FIELDS) ----------------
//         finvasiaSymbol: finMatch?.TradingSymbol || finMatch?.Symbol || null,
//         finvasiaToken: finMatch?.Token ?? null,
//         finvasiaExchange: finMatch?.Exchange || null,
//         finvasiaInstrument: finMatch?.Instrument || null,
//         finvasiaLotSize: finMatch?.LotSize ?? null,
//         finvasiaTickSize: finMatch?.TickSize ?? null,

//         // ---------------- UPSTOX (NEW FIELDS) ----------------
//         upstoxSymbol: getUpstoxSymbol(upstoxMatch) || null,
//         upstoxToken: getUpstoxToken(upstoxMatch) ?? null,
//         upstoxExchange: getUpstoxExchange(upstoxMatch) || null,

//         // ---------------- FYERS (NEW FIELDS) ----------------
//         fyersSymbol: fyMatch?.symbol || null,       // e.g. NSE:SUZLON-EQ
//         fyersToken: fyMatch?.fytoken || null,       // FY token (may not equal Angel token)
//         fyersExchange: fyMatch?.exchange || null,
//       };
//     });


//      console.log('req controll 7');

//     // =======================================================
//     // 4️⃣ Add Finvasia-only rows (not in AngelOne)
//     //    (optional but you already had this behaviour)
//     // =======================================================
//     const angelTokenSet = new Set(angeloneData.map((a) => buildTokenKey(a?.token)));

//     const finvasiaOnlyRows = [];
//     for (const f of finvasiaList) {
//       const finToken = buildTokenKey(f?.Token);
//       if (!finToken) continue;
//       if (angelTokenSet.has(finToken)) continue;

//       const finKey = buildSymbolKey(f?.Exchange, f?.TradingSymbol || f?.Symbol);

//       const kiteMatch = finToken ? kiteByToken.get(finToken) : null;
//       const upstoxMatch = finToken ? upsByToken.get(finToken) : null;
//       const fyMatch = finKey ? fyBySymbolKey.get(finKey) : null;

//       finvasiaOnlyRows.push({
//         source: "FINVASIA_ONLY",
//         exch_seg: f.Exchange,
//         token: finToken,
//         symbol: f.Symbol,
//         name: f.Symbol,

//         finvasiaSymbol: f.TradingSymbol || f.Symbol || null,
//         finvasiaToken: f.Token ?? null,

//         kiteSymbol: kiteMatch?.tradingsymbol || null,
//         kiteToken: kiteMatch?.exchange_token ?? null,

//         upstoxSymbol: getUpstoxSymbol(upstoxMatch) || null,
//         upstoxToken: getUpstoxToken(upstoxMatch) ?? null,

//         fyersSymbol: fyMatch?.symbol || null,
//         fyersToken: fyMatch?.fytoken || null,
//       });
//     }

//      console.log('req controll 7');

//     const finalMerged = mergedAngel.concat(finvasiaOnlyRows);

//     const endTime = Date.now();

//      console.log('req controll 8 final');

//     return res.json({
//       status: true,
//       statusCode: 200,
//       data: finalMerged,
//       cache: false,
//       message: "Angel + Kite + Finvasia + Upstox + Fyers merged (no cache)",
//       meta: {
//         timeSec: (endTime - startTime) / 1000,
//         angel: angeloneData.length,
//         kite: kiteData.length,
//         finvasia: finvasiaList.length,
//         upstox: upstoxData.length,
//         fyers: fyersData.length,
//         final: finalMerged.length,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error in getMergedInstruments:", error?.message || error);
//     return res.status(500).json({
//       status: false,
//       statusCode: 500,
//       message: "Unexpected error occurred. Please try again.",
//       data: null,
//       error: error?.message,
//     });
//   }
// };





import axios from "axios";
import zlib from "zlib";
import unzipper from "unzipper";
import { KiteAccess } from "../utils/kiteClient.js";

// =======================================================
// ✅ CONFIG: URLs
// =======================================================
const ANGELONE_SCRIP_MASTER_URL = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json";
const FINVASIA_SYMBOL_MASTER_URLS = {
  NSE: "https://api.shoonya.com/NSE_symbols.txt.zip",
  BSE: "https://api.shoonya.com/BSE_symbols.txt.zip",
  NFO: "https://api.shoonya.com/NFO_symbols.txt.zip",
  MCX: "https://api.shoonya.com/MCX_symbols.txt.zip",
};
const UPSTOX_INSTRUMENT_URLS = {
  COMPLETE: "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz",
  NSE: "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz",
  BSE: "https://assets.upstox.com/market-quote/instruments/exchange/BSE.json.gz",
  MCX: "https://assets.upstox.com/market-quote/instruments/exchange/MCX.json.gz",
};
const FYERS_SYMBOL_MASTER_URLS = {
  NSE_CM: "https://public.fyers.in/sym_details/NSE_CM.csv",
  BSE_CM: "https://public.fyers.in/sym_details/BSE_CM.csv",
  NSE_FO: "https://public.fyers.in/sym_details/NSE_FO.csv",
  BSE_FO: "https://public.fyers.in/sym_details/BSE_FO.csv",
  NSE_CD: "https://public.fyers.in/sym_details/NSE_CD.csv",
  MCX_COM: "https://public.fyers.in/sym_details/MCX_COM.csv",
};

// =======================================================
// ✅ HELPERS: Common
// =======================================================
const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const normalizeExch = (ex) => safeStr(ex).trim().toUpperCase();
const normalizeSymbol = (s) => safeStr(s).trim().toUpperCase();
const normalizeTradingSymbolForMatch = (symbol) => normalizeSymbol(symbol).replace(/-EQ$/i, "");

// =======================================================
// ✅ HELPERS: Token and Symbol Key
// =======================================================
const buildTokenKey = (token) => safeStr(token).trim();
const buildSymbolKey = (exch, symbol) => {
  const e = normalizeExch(exch);
  const s = normalizeTradingSymbolForMatch(symbol);
  return e && s ? `${e}:${s}` : "";
};

// =======================================================
// ✅ FETCH: AngelOne
// =======================================================
async function fetchAngelOneScripMaster() {
  const res = await axios.get(ANGELONE_SCRIP_MASTER_URL, { timeout: 180000 });
  return Array.isArray(res.data) ? res.data : [];
}

// =======================================================
// ✅ FETCH: Kite
// =======================================================
async function fetchKiteInstruments() {
  const apiKey = process.env.KITE_API_KEY;
  const kite = KiteAccess(apiKey);
  const data = await kite.getInstruments();
  return Array.isArray(data) ? data : [];
}

// =======================================================
// ✅ FETCH: Finvasia
// =======================================================
function parseFinvasiaCSV(csv) {
  const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
  const headers = lines.shift()?.split(",") || [];
  return lines.map((line) => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((header, index) => {
      const key = header.trim();
      let value = values[index]?.trim() ?? "";
      if (!isNaN(value) && value !== "") value = Number(value);
      obj[key] = value;
    });
    return obj;
  });
}

async function downloadAndUnzipFinvasiaText(url) {
  const zipRes = await axios.get(url, { responseType: "arraybuffer", timeout: 180000 });
  const directory = await unzipper.Open.buffer(Buffer.from(zipRes.data));
  const file = directory.files.find((f) => !f.path.endsWith("/") && f.path.toLowerCase().includes(".txt"));
  if (!file) throw new Error(`No .txt found inside zip: ${url}`);
  const content = await file.buffer();
  return content.toString("utf-8");
}

async function fetchFinvasiaInstrumentsByExchange(exch) {
  const url = FINVASIA_SYMBOL_MASTER_URLS[exch];
  if (!url) throw new Error(`Unsupported Finvasia exchange '${exch}'`);
  const txt = await downloadAndUnzipFinvasiaText(url);
  const list = parseFinvasiaCSV(txt);
  return list.map((row) => ({ exch, ...row }));
}

async function fetchAllFinvasiaInstruments() {
  const results = await Promise.all(Object.keys(FINVASIA_SYMBOL_MASTER_URLS).map(fetchFinvasiaInstrumentsByExchange));
  return results.flat();
}

// =======================================================
// ✅ FETCH: Upstox
// =======================================================
async function fetchUpstoxJsonGz(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 180000,
    headers: { "Accept-Encoding": "gzip, deflate, br", Accept: "application/json", "User-Agent": "Mozilla/5.0" },
  });
  const gzBuffer = Buffer.from(res.data);
  const jsonText = zlib.gunzipSync(gzBuffer).toString("utf-8");
  return JSON.parse(jsonText);
}

async function fetchUpstoxInstruments(exch = "COMPLETE") {
  const key = normalizeExch(exch);
  const url = UPSTOX_INSTRUMENT_URLS[key];
  if (!url) throw new Error(`Invalid Upstox exchange '${exch}'`);
  return fetchUpstoxJsonGz(url);
}

function getUpstoxToken(u) {
  return u?.exchange_token ?? u?.instrument_token ?? u?.token ?? u?.exchangeToken ?? null;
}

function getUpstoxSymbol(u) {
  return u?.tradingsymbol ?? u?.trading_symbol ?? u?.symbol ?? u?.instrument_key ?? u?.instrumentKey ?? null;
}

function getUpstoxExchange(u) {
  return u?.exchange ?? u?.exch ?? u?.segment ?? null;
}

// =======================================================
// ✅ FETCH: Fyers
// =======================================================
function splitFyersCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { out.push(cur); cur = ""; } else { cur += ch; }
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

function parseFyersCSV(text, segment) {
  const lines = String(text).split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const hasHeader = lines[0].toLowerCase().includes("fytoken") || lines[0].toLowerCase().includes("symbol");
  const dataLines = hasHeader ? lines.slice(1) : lines;
  return dataLines.map((line) => {
    const cols = splitFyersCSVLine(line);
    const fytoken = cols[0] ?? "";
    const name = cols[1] ?? "";
    const symbolCol = cols.find((c) => typeof c === "string" && /^[A-Z]+:/.test(c)) || "";
    const exchange = symbolCol.includes(":") ? symbolCol.split(":")[0] : "";
    const tradingsymbol = symbolCol.includes(":") ? symbolCol.split(":")[1] : symbolCol;
    return { segment, fytoken, name, symbol: symbolCol, exchange, tradingsymbol, raw: cols };
  });
}

async function fetchFyersSegment(segment) {
  const url = FYERS_SYMBOL_MASTER_URLS[segment];
  if (!url) throw new Error(`Invalid Fyers segment '${segment}'`);
  const res = await axios.get(url, { responseType: "text", timeout: 180000, headers: { Accept: "text/csv,*/*" } });
  return parseFyersCSV(res.data, segment);
}

async function fetchAllFyersInstruments() {
  const results = await Promise.all(Object.keys(FYERS_SYMBOL_MASTER_URLS).map(fetchFyersSegment));
  return results.flat();
}

// =======================================================
// ✅ MAIN CONTROLLER: Merged Instruments
// =======================================================
export const getMergedInstrumentsNew = async (req, res) => {
  try {
    console.log('Request started');

    const startTime = Date.now();

    // =======================================================
    // 1️⃣ Fetch all sources
    // =======================================================
    const [angeloneData, kiteData, finvasiaList, upstoxData, fyersData] = await Promise.all([
      fetchAngelOneScripMaster(),
      fetchKiteInstruments(),
      fetchAllFinvasiaInstruments(),
      fetchUpstoxInstruments("COMPLETE"),
      fetchAllFyersInstruments(),
    ]);

    console.log('Data fetched from all sources');

    // =======================================================
    // 2️⃣ Build lookup maps
    // =======================================================

    // ---- Kite: Direct token mapping (like old code) ----
    const kiteTokenMap = new Map();
    for (const kiteRecord of kiteData) {
      kiteTokenMap.set(String(kiteRecord.exchange_token), kiteRecord);
    }

    // ---- Finvasia maps ----
    const finByToken = new Map();
    const finBySymbolKey = new Map();
    for (const f of finvasiaList) {
      const finToken = buildTokenKey(f?.Token);
      if (finToken) finByToken.set(finToken, f);
      const finKey = buildSymbolKey(f?.Exchange, f?.TradingSymbol || f?.Symbol);
      if (finKey) finBySymbolKey.set(finKey, f);
    }

    // ---- Upstox maps ----
    const upsByToken = new Map();
    const upsBySymbolKey = new Map();
    for (const u of upstoxData) {
      const uToken = buildTokenKey(getUpstoxToken(u));
      if (uToken) upsByToken.set(uToken, u);
      const uKey = buildSymbolKey(getUpstoxExchange(u), getUpstoxSymbol(u));
      if (uKey) upsBySymbolKey.set(uKey, u);
    }

    // ---- Fyers maps ----
    const fyByToken = new Map();
    const fyBySymbolKey = new Map();
    for (const f of fyersData) {
      const fyToken = buildTokenKey(f?.fytoken);
      if (fyToken) fyByToken.set(fyToken, f);
      const fyKey = buildSymbolKey(f?.exchange, f?.tradingsymbol);
      if (fyKey) fyBySymbolKey.set(fyKey, f);
    }

    // =======================================================
    // 3️⃣ Merge AngelOne with Kite (direct token match, like old code)
    // =======================================================
    const mergedAngel = angeloneData.map((angel) => {
      const kiteMatch = kiteTokenMap.get(String(angel.token));

      // ---- Finvasia, Upstox, Fyers: Use fallback logic ----
      const angelExch = angel?.exch_seg || angel?.exchange || "";
      const angelSymbol = angel?.symbol || angel?.name || "";
      const symKey = buildSymbolKey(angelExch, angelSymbol);

      const finMatch = finByToken.get(String(angel.token)) || finBySymbolKey.get(symKey) || null;
      const upstoxMatch = upsByToken.get(String(angel.token)) || upsBySymbolKey.get(symKey) || null;
      const fyMatch = fyByToken.get(String(angel.token)) || fyBySymbolKey.get(symKey) || null;

      return {
        ...angel,
        kiteSymbol: kiteMatch?.tradingsymbol || null,
        kiteToken: kiteMatch?.exchange_token || null,
        kiteExchange: kiteMatch?.exchange || null,
        kiteInstrumentType: kiteMatch?.instrument_type || null,

        finvasiaSymbol: finMatch?.TradingSymbol || finMatch?.Symbol || null,
        finvasiaToken: finMatch?.Token || null,
        finvasiaExchange: finMatch?.Exchange || null,
        finvasiaInstrument: finMatch?.Instrument || null,
        finvasiaLotSize: finMatch?.LotSize || null,
        finvasiaTickSize: finMatch?.TickSize || null,

        upstoxSymbol: getUpstoxSymbol(upstoxMatch) || null,
        upstoxToken: getUpstoxToken(upstoxMatch) || null,
        upstoxExchange: getUpstoxExchange(upstoxMatch) || null,

        fyersSymbol: fyMatch?.symbol || null,
        fyersToken: fyMatch?.fytoken || null,
        fyersExchange: fyMatch?.exchange || null,
      };
    });

    // =======================================================
    // 4️⃣ Add Finvasia-only rows (not in AngelOne)
    // =======================================================
    const angelTokenSet = new Set(angeloneData.map((a) => String(a.token)));
    const finvasiaOnlyRows = finvasiaList
      .filter((f) => !angelTokenSet.has(String(f.Token)))
      .map((f) => {
        const finToken = String(f.Token);
        const finKey = buildSymbolKey(f.Exchange, f.TradingSymbol || f.Symbol);

        const kiteMatch = kiteTokenMap.get(finToken) || null;
        const upstoxMatch = upsByToken.get(finToken) || upsBySymbolKey.get(finKey) || null;
        const fyMatch = fyByToken.get(finToken) || fyBySymbolKey.get(finKey) || null;

        return {
          source: "FINVASIA_ONLY",
          exch_seg: f.Exchange,
          token: finToken,
          symbol: f.Symbol,
          name: f.Symbol,

          finvasiaSymbol: f.TradingSymbol || f.Symbol || null,
          finvasiaToken: f.Token || null,

          kiteSymbol: kiteMatch?.tradingsymbol || null,
          kiteToken: kiteMatch?.exchange_token || null,

          upstoxSymbol: getUpstoxSymbol(upstoxMatch) || null,
          upstoxToken: getUpstoxToken(upstoxMatch) || null,

          fyersSymbol: fyMatch?.symbol || null,
          fyersToken: fyMatch?.fytoken || null,
        };
      });

    // =======================================================
    // 5️⃣ Combine all rows
    // =======================================================
    const finalMerged = [...mergedAngel, ...finvasiaOnlyRows];

    const endTime = Date.now();
    console.log(`✅ Merged data in ${(endTime - startTime) / 1000}s`);


    console.log(fyersData.length,'fyersData.length');
    

    return res.json({
      status: true,
      statusCode: 200,
      data: finalMerged,
      cache: false,
      message: "Angel + Kite + Finvasia + Upstox + Fyers merged",
      meta: {
        timeSec: (endTime - startTime) / 1000,
        angelone: angeloneData.length,
        kite: kiteData.length,
        finvasia: finvasiaList.length,
        upstox: upstoxData.length,
        fyers: fyersData.length,
        final: finalMerged.length,
      },
    });
  } catch (error) {
    console.error("❌ Error in getMergedInstruments:", error?.message || error);
    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error?.message,
    });
  }
};


