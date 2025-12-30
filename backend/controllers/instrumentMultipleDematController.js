


import axios from "axios";
import zlib from "zlib";
import unzipper from "unzipper";
import { KiteAccess } from "../utils/kiteClient.js";
import redis from "../utils/redis.js";  // your redis client
import { logSuccess, logError } from "../utils/loggerr.js"; // <-- path adjust
import crypto from "crypto";

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
// ✅ MAIN CONTROLLER: Merged Instruments Testing Code
// =======================================================
// =========== node corn used ===============
export const getMergedInstrumentsNew = async (req, res) => {

    const startTime = Date.now();
 
  // ✅ correlation id for this request
  const requestId =  crypto.randomUUID();
  req.requestId = requestId;

   const MERGED_REDIS_KEY = "merged_instruments_new";

  //  const MERGED_REDIS_KEY = "merged_instruments";

  const TEN_HOURS_IN_SECONDS = 36000;


  //  await redis.del(MERGED_REDIS_KEY)

  //  console.log('redis cache is delete');
   



  try {
    logSuccess(req, {
      msg: "Merged instruments request started",
      requestId,
      redisKey: MERGED_REDIS_KEY,
    });

    // ✅ TTL + cache check
    const ttl = await redis.ttl(MERGED_REDIS_KEY);
    logSuccess(req, {
      msg: "Redis TTL checked for merged instruments",
      requestId,
      ttlSeconds: ttl,
    });

    const cachedData = await redis.get(MERGED_REDIS_KEY);

    console.log('==============cachedData==============');
    

    if (cachedData) {
      const endTime = Date.now();

       console.log('==============durationMs Cache response ==============',endTime - startTime);

      logSuccess(req, {
        msg: "Merged instruments served from Redis cache",
        requestId,
        cache: true,
        durationMs: endTime - startTime,
        payloadSizeBytes: Buffer.byteLength(cachedData, "utf8"),
      });

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(cachedData);

      // return res.json({
      //   status: true,
      //   statusCode: 200,
      //   data: JSON.parse(cachedData),
      //   cache: true,
      //   message: "Merged instruments fetched from Redis cache",
      // });
    }

    logSuccess(req, {
      msg: "Cache miss for merged instruments; fetching all sources",
      requestId,
      cache: false,
    });

    // =======================================================
    // 1️⃣ Fetch all sources (with timing)
    // =======================================================
    const tFetch0 = Date.now();

    const [angeloneData, kiteData, finvasiaList, upstoxData, fyersData] =
      await Promise.all([
        fetchAngelOneScripMaster(),
        fetchKiteInstruments(),
        fetchAllFinvasiaInstruments(),
        fetchUpstoxInstruments("COMPLETE"),
        fetchAllFyersInstruments(),
      ]);

    logSuccess(req, {
      msg: "Fetched instruments from all sources",
      requestId,
      durationMs: Date.now() - tFetch0,
      counts: {
        angelone: angeloneData?.length || 0,
        kite: kiteData?.length || 0,
        finvasia: finvasiaList?.length || 0,
        upstox: upstoxData?.length || 0,
        fyers: fyersData?.length || 0,
      },
    });

    // =======================================================
    // 2️⃣ Build lookup maps (with timing)
    // =======================================================
    const tMap0 = Date.now();

    const kiteTokenMap = new Map();
    for (const kiteRecord of kiteData) {
      kiteTokenMap.set(String(kiteRecord.exchange_token), kiteRecord);
    }

    const finByToken = new Map();
    const finBySymbolKey = new Map();
    for (const f of finvasiaList) {
      const finToken = buildTokenKey(f?.Token);
      if (finToken) finByToken.set(finToken, f);
      const finKey = buildSymbolKey(f?.Exchange, f?.TradingSymbol || f?.Symbol);
      if (finKey) finBySymbolKey.set(finKey, f);
    }

    const upsByToken = new Map();
    const upsBySymbolKey = new Map();
    for (const u of upstoxData) {
      const uToken = buildTokenKey(getUpstoxToken(u));
      if (uToken) upsByToken.set(uToken, u);
      const uKey = buildSymbolKey(getUpstoxExchange(u), getUpstoxSymbol(u));
      if (uKey) upsBySymbolKey.set(uKey, u);
    }

    const fyByToken = new Map();
    const fyBySymbolKey = new Map();
    for (const f of fyersData) {
      const fyToken = buildTokenKey(f?.fytoken);
      if (fyToken) fyByToken.set(fyToken, f);
      const fyKey = buildSymbolKey(f?.exchange, f?.tradingsymbol);
      if (fyKey) fyBySymbolKey.set(fyKey, f);
    }

    logSuccess(req, {
      msg: "Lookup maps built for all sources",
      requestId,
      durationMs: Date.now() - tMap0,
      mapSizes: {
        kiteTokenMap: kiteTokenMap.size,
        finByToken: finByToken.size,
        finBySymbolKey: finBySymbolKey.size,
        upsByToken: upsByToken.size,
        upsBySymbolKey: upsBySymbolKey.size,
        fyByToken: fyByToken.size,
        fyBySymbolKey: fyBySymbolKey.size,
      },
    });

    // =======================================================
    // 3️⃣ Merge AngelOne rows
    // =======================================================
    const tMerge0 = Date.now();

    const mergedAngel = angeloneData.map((angel) => {
      const kiteMatch = kiteTokenMap.get(String(angel.token));

      const angelExch = angel?.exch_seg || angel?.exchange || "";
      const angelSymbol = angel?.symbol || angel?.name || "";
      const symKey = buildSymbolKey(angelExch, angelSymbol);

      const finMatch =
        finByToken.get(String(angel.token)) || finBySymbolKey.get(symKey) || null;
      const upstoxMatch =
        upsByToken.get(String(angel.token)) || upsBySymbolKey.get(symKey) || null;
      const fyMatch =
        fyByToken.get(String(angel.token)) || fyBySymbolKey.get(symKey) || null;

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

    logSuccess(req, {
      msg: "AngelOne rows merged with other sources",
      requestId,
      durationMs: Date.now() - tMerge0,
      mergedAngelCount: mergedAngel.length,
    });

    // =======================================================
    // 4️⃣ Finvasia-only rows
    // =======================================================
    const tFinOnly0 = Date.now();

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

    logSuccess(req, {
      msg: "Finvasia-only rows prepared",
      requestId,
      durationMs: Date.now() - tFinOnly0,
      finvasiaOnlyCount: finvasiaOnlyRows.length,
    });

    // =======================================================
    // 5️⃣ Combine + cache
    // =======================================================
    const finalMerged = [...mergedAngel, ...finvasiaOnlyRows];

    // ✅ Cache set timing
    const tCache0 = Date.now();

   const responseObj = {
        status: true,
        statusCode: 200,
        data: finalMerged,
        cache: false,
        message: "Angel + Kite + Finvasia + Upstox + Fyers merged",
      };

   const payload = JSON.stringify(responseObj);

    await redis.set(MERGED_REDIS_KEY, payload, "EX", TEN_HOURS_IN_SECONDS);

    logSuccess(req, {
      msg: "Merged instruments cached in Redis",
      requestId,
      durationMs: Date.now() - tCache0,
      ttlSeconds: TEN_HOURS_IN_SECONDS,
      mergedCount: finalMerged.length,
      payloadSizeBytes: Buffer.byteLength(payload, "utf8"),
    });

    logSuccess(req, {
      msg: "Merged instruments request completed",
      requestId,
      totalDurationMs: Date.now() - startTime,
      mergedCount: finalMerged.length,
    });

    console.log('==============durationMs Normal response==============',Date.now() - startTime);

      // ✅ send JSON string directly (no res.json stringify)
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(payload);

  } catch (error) {
    logError(req, error, {
      msg: "Error in getMergedInstrumentsNew",
      requestId,
      durationMs: Date.now() - startTime,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error?.message,
    });
  }
};




// import axios from "axios";
// import zlib from "zlib";
// import unzipper from "unzipper";
// import { promisify } from "util";
// import { KiteAccess } from "../utils/kiteClient.js";
// import redis from "../utils/redis.js";
// import { logSuccess, logError } from "../utils/loggerr.js";
// import crypto from "crypto";

// // ✅ async gunzip (no blocking gunzipSync)
// const gunzipAsync = promisify(zlib.gunzip);

// // =======================================================
// // ✅ CONFIG: URLs
// // =======================================================
// const ANGELONE_SCRIP_MASTER_URL =
//   "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json";

// const FINVASIA_SYMBOL_MASTER_URLS = {
//   NSE: "https://api.shoonya.com/NSE_symbols.txt.zip",
//   BSE: "https://api.shoonya.com/BSE_symbols.txt.zip",
//   NFO: "https://api.shoonya.com/NFO_symbols.txt.zip",
//   MCX: "https://api.shoonya.com/MCX_symbols.txt.zip",
// };

// const UPSTOX_INSTRUMENT_URLS = {
//   COMPLETE:
//     "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz",
//   NSE: "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz",
//   BSE: "https://assets.upstox.com/market-quote/instruments/exchange/BSE.json.gz",
//   MCX: "https://assets.upstox.com/market-quote/instruments/exchange/MCX.json.gz",
// };

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
// const normalizeTradingSymbolForMatch = (symbol) =>
//   normalizeSymbol(symbol).replace(/-EQ$/i, "");

// // =======================================================
// // ✅ HELPERS: Token and Symbol Key
// // =======================================================
// const buildTokenKey = (token) => safeStr(token).trim();
// const buildSymbolKey = (exch, symbol) => {
//   const e = normalizeExch(exch);
//   const s = normalizeTradingSymbolForMatch(symbol);
//   return e && s ? `${e}:${s}` : "";
// };

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
//   const data = await kite.getInstruments();
//   return Array.isArray(data) ? data : [];
// }

// // =======================================================
// // ✅ FETCH: Finvasia
// // =======================================================
// function parseFinvasiaCSV(csv) {
//   const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
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

// async function downloadAndUnzipFinvasiaText(url) {
//   const zipRes = await axios.get(url, {
//     responseType: "arraybuffer",
//     timeout: 180000,
//   });
//   const directory = await unzipper.Open.buffer(Buffer.from(zipRes.data));
//   const file = directory.files.find(
//     (f) =>
//       !f.path.endsWith("/") && f.path.toLowerCase().includes(".txt")
//   );
//   if (!file) throw new Error(`No .txt found inside zip: ${url}`);
//   const content = await file.buffer();
//   return content.toString("utf-8");
// }

// async function fetchFinvasiaInstrumentsByExchange(exch) {
//   const url = FINVASIA_SYMBOL_MASTER_URLS[exch];
//   if (!url) throw new Error(`Unsupported Finvasia exchange '${exch}'`);
//   const txt = await downloadAndUnzipFinvasiaText(url);
//   const list = parseFinvasiaCSV(txt);
//   return list.map((row) => ({ exch, ...row }));
// }

// async function fetchAllFinvasiaInstruments() {
//   const results = await Promise.all(
//     Object.keys(FINVASIA_SYMBOL_MASTER_URLS).map(fetchFinvasiaInstrumentsByExchange)
//   );
//   return results.flat();
// }

// // =======================================================
// // ✅ FETCH: Upstox (optimized: async gunzip)
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
//   const jsonBuf = await gunzipAsync(gzBuffer); // ✅ async
//   return JSON.parse(jsonBuf.toString("utf-8"));
// }

// async function fetchUpstoxInstruments(exch = "COMPLETE") {
//   const key = normalizeExch(exch);
//   const url = UPSTOX_INSTRUMENT_URLS[key];
//   if (!url) throw new Error(`Invalid Upstox exchange '${exch}'`);
//   return fetchUpstoxJsonGz(url);
// }

// function getUpstoxToken(u) {
//   return (
//     u?.exchange_token ??
//     u?.instrument_token ??
//     u?.token ??
//     u?.exchangeToken ??
//     null
//   );
// }

// function getUpstoxSymbol(u) {
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
// // ✅ FETCH: Fyers
// // =======================================================
// function splitFyersCSVLine(line) {
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

//   const hasHeader =
//     lines[0].toLowerCase().includes("fytoken") ||
//     lines[0].toLowerCase().includes("symbol");

//   const dataLines = hasHeader ? lines.slice(1) : lines;

//   return dataLines.map((line) => {
//     const cols = splitFyersCSVLine(line);
//     const fytoken = cols[0] ?? "";
//     const name = cols[1] ?? "";
//     const symbolCol =
//       cols.find((c) => typeof c === "string" && /^[A-Z]+:/.test(c)) || "";
//     const exchange = symbolCol.includes(":") ? symbolCol.split(":")[0] : "";
//     const tradingsymbol = symbolCol.includes(":")
//       ? symbolCol.split(":")[1]
//       : symbolCol;

//     return {
//       segment,
//       fytoken,
//       name,
//       symbol: symbolCol,
//       exchange,
//       tradingsymbol,
//       raw: cols,
//     };
//   });
// }

// async function fetchFyersSegment(segment) {
//   const url = FYERS_SYMBOL_MASTER_URLS[segment];
//   if (!url) throw new Error(`Invalid Fyers segment '${segment}'`);
//   const res = await axios.get(url, {
//     responseType: "text",
//     timeout: 180000,
//     headers: { Accept: "text/csv,*/*" },
//   });
//   return parseFyersCSV(res.data, segment);
// }

// async function fetchAllFyersInstruments() {
//   const results = await Promise.all(
//     Object.keys(FYERS_SYMBOL_MASTER_URLS).map(fetchFyersSegment)
//   );
//   return results.flat();
// }

// // =======================================================
// // ✅ MAIN CONTROLLER (optimized, no other changes needed)
// // =======================================================
// export const getMergedInstrumentsNew = async (req, res) => {
//   const requestId = crypto.randomUUID();
//   req.requestId = requestId;

//   // ✅ KEEP SAME KEY NAME
//   const MERGED_REDIS_KEY = "merged_instruments_new";

//   // ✅ lock key (extra) to prevent multiple rebuilds
//   const LOCK_KEY = `${MERGED_REDIS_KEY}:lock`;

//   const TEN_HOURS_IN_SECONDS = 36000;
//   const LOCK_SECONDS = 900; // 15 min

//   const startTime = Date.now();

//   try {
//     logSuccess(req, {
//       msg: "Merged instruments request started",
//       requestId,
//       redisKey: MERGED_REDIS_KEY,
//     });

//     // ✅ Fast cache read
//     const cachedData = await redis.get(MERGED_REDIS_KEY);

//     if (cachedData) {
//       // ✅ NO JSON.parse, NO res.json (direct send cached JSON string)
//       logSuccess(req, {
//         msg: "Merged instruments served from Redis cache (direct)",
//         requestId,
//         cache: true,
//         durationMs: Date.now() - startTime,
//         payloadSizeBytes: Buffer.byteLength(cachedData, "utf8"),
//       });

//       res.setHeader("Content-Type", "application/json; charset=utf-8");
//       return res.status(200).send(cachedData);
//     }

//     // ✅ Lock: only one request builds cache
//     const gotLock = await redis.set(LOCK_KEY, requestId, "NX", "EX", LOCK_SECONDS);
//     if (!gotLock) {
//       // Another request is building cache
//       return res.status(202).json({
//         status: false,
//         statusCode: 202,
//         message: "Cache building. Please retry in 30-60 seconds.",
//         data: null,
//       });
//     }

//     try {
//       // Double-check cache after lock (race safe)
//       const cachedAgain = await redis.get(MERGED_REDIS_KEY);
//       if (cachedAgain) {
//         res.setHeader("Content-Type", "application/json; charset=utf-8");
//         return res.status(200).send(cachedAgain);
//       }

//       logSuccess(req, {
//         msg: "Cache miss; fetching all sources",
//         requestId,
//       });

//       // =======================================================
//       // 1️⃣ Fetch all sources
//       // =======================================================
//       const tFetch0 = Date.now();
//       const [angeloneData, kiteData, finvasiaList, upstoxData, fyersData] =
//         await Promise.all([
//           fetchAngelOneScripMaster(),
//           fetchKiteInstruments(),
//           fetchAllFinvasiaInstruments(),
//           fetchUpstoxInstruments("COMPLETE"),
//           fetchAllFyersInstruments(),
//         ]);

//       logSuccess(req, {
//         msg: "Fetched instruments from all sources",
//         requestId,
//         durationMs: Date.now() - tFetch0,
//         counts: {
//           angelone: angeloneData?.length || 0,
//           kite: kiteData?.length || 0,
//           finvasia: finvasiaList?.length || 0,
//           upstox: upstoxData?.length || 0,
//           fyers: fyersData?.length || 0,
//         },
//       });

//       // =======================================================
//       // 2️⃣ Build lookup maps
//       // =======================================================
//       const tMap0 = Date.now();

//       const kiteTokenMap = new Map();
//       for (const kiteRecord of kiteData) {
//         kiteTokenMap.set(String(kiteRecord.exchange_token), kiteRecord);
//       }

//       const finByToken = new Map();
//       const finBySymbolKey = new Map();
//       for (const f of finvasiaList) {
//         const finToken = buildTokenKey(f?.Token);
//         if (finToken) finByToken.set(finToken, f);
//         const finKey = buildSymbolKey(f?.Exchange, f?.TradingSymbol || f?.Symbol);
//         if (finKey) finBySymbolKey.set(finKey, f);
//       }

//       const upsByToken = new Map();
//       const upsBySymbolKey = new Map();
//       for (const u of upstoxData) {
//         const uToken = buildTokenKey(getUpstoxToken(u));
//         if (uToken) upsByToken.set(uToken, u);
//         const uKey = buildSymbolKey(getUpstoxExchange(u), getUpstoxSymbol(u));
//         if (uKey) upsBySymbolKey.set(uKey, u);
//       }

//       const fyByToken = new Map();
//       const fyBySymbolKey = new Map();
//       for (const f of fyersData) {
//         const fyToken = buildTokenKey(f?.fytoken);
//         if (fyToken) fyByToken.set(fyToken, f);
//         const fyKey = buildSymbolKey(f?.exchange, f?.tradingsymbol);
//         if (fyKey) fyBySymbolKey.set(fyKey, f);
//       }

//       logSuccess(req, {
//         msg: "Lookup maps built",
//         requestId,
//         durationMs: Date.now() - tMap0,
//         mapSizes: {
//           kiteTokenMap: kiteTokenMap.size,
//           finByToken: finByToken.size,
//           finBySymbolKey: finBySymbolKey.size,
//           upsByToken: upsByToken.size,
//           upsBySymbolKey: upsBySymbolKey.size,
//           fyByToken: fyByToken.size,
//           fyBySymbolKey: fyBySymbolKey.size,
//         },
//       });

//       // =======================================================
//       // 3️⃣ Merge AngelOne rows (same output as your code)
//       //    Optimized: for-loop (faster & less overhead than map)
//       // =======================================================
//       const tMerge0 = Date.now();

//       const mergedAngel = new Array(angeloneData.length);
//       for (let i = 0; i < angeloneData.length; i++) {
//         const angel = angeloneData[i];

//         const kiteMatch = kiteTokenMap.get(String(angel.token));

//         const angelExch = angel?.exch_seg || angel?.exchange || "";
//         const angelSymbol = angel?.symbol || angel?.name || "";
//         const symKey = buildSymbolKey(angelExch, angelSymbol);

//         const finMatch =
//           finByToken.get(String(angel.token)) || finBySymbolKey.get(symKey) || null;
//         const upstoxMatch =
//           upsByToken.get(String(angel.token)) || upsBySymbolKey.get(symKey) || null;
//         const fyMatch =
//           fyByToken.get(String(angel.token)) || fyBySymbolKey.get(symKey) || null;

//         mergedAngel[i] = {
//           ...angel, // ✅ keep same response structure
//           kiteSymbol: kiteMatch?.tradingsymbol || null,
//           kiteToken: kiteMatch?.exchange_token || null,
//           kiteExchange: kiteMatch?.exchange || null,
//           kiteInstrumentType: kiteMatch?.instrument_type || null,

//           finvasiaSymbol: finMatch?.TradingSymbol || finMatch?.Symbol || null,
//           finvasiaToken: finMatch?.Token || null,
//           finvasiaExchange: finMatch?.Exchange || null,
//           finvasiaInstrument: finMatch?.Instrument || null,
//           finvasiaLotSize: finMatch?.LotSize || null,
//           finvasiaTickSize: finMatch?.TickSize || null,

//           upstoxSymbol: getUpstoxSymbol(upstoxMatch) || null,
//           upstoxToken: getUpstoxToken(upstoxMatch) || null,
//           upstoxExchange: getUpstoxExchange(upstoxMatch) || null,

//           fyersSymbol: fyMatch?.symbol || null,
//           fyersToken: fyMatch?.fytoken || null,
//           fyersExchange: fyMatch?.exchange || null,
//         };
//       }

//       logSuccess(req, {
//         msg: "AngelOne rows merged",
//         requestId,
//         durationMs: Date.now() - tMerge0,
//         mergedAngelCount: mergedAngel.length,
//       });

//       // =======================================================
//       // 4️⃣ Finvasia-only rows
//       // =======================================================
//       const tFinOnly0 = Date.now();

//       const angelTokenSet = new Set(angeloneData.map((a) => String(a.token)));

//       const finvasiaOnlyRows = [];
//       for (let i = 0; i < finvasiaList.length; i++) {
//         const f = finvasiaList[i];
//         if (angelTokenSet.has(String(f.Token))) continue;

//         const finToken = String(f.Token);
//         const finKey = buildSymbolKey(f.Exchange, f.TradingSymbol || f.Symbol);

//         const kiteMatch = kiteTokenMap.get(finToken) || null;
//         const upstoxMatch = upsByToken.get(finToken) || upsBySymbolKey.get(finKey) || null;
//         const fyMatch = fyByToken.get(finToken) || fyBySymbolKey.get(finKey) || null;

//         finvasiaOnlyRows.push({
//           source: "FINVASIA_ONLY",
//           exch_seg: f.Exchange,
//           token: finToken,
//           symbol: f.Symbol,
//           name: f.Symbol,

//           finvasiaSymbol: f.TradingSymbol || f.Symbol || null,
//           finvasiaToken: f.Token || null,

//           kiteSymbol: kiteMatch?.tradingsymbol || null,
//           kiteToken: kiteMatch?.exchange_token || null,

//           upstoxSymbol: getUpstoxSymbol(upstoxMatch) || null,
//           upstoxToken: getUpstoxToken(upstoxMatch) || null,

//           fyersSymbol: fyMatch?.symbol || null,
//           fyersToken: fyMatch?.fytoken || null,
//         });
//       }

//       logSuccess(req, {
//         msg: "Finvasia-only rows prepared",
//         requestId,
//         durationMs: Date.now() - tFinOnly0,
//         finvasiaOnlyCount: finvasiaOnlyRows.length,
//       });

//       // =======================================================
//       // 5️⃣ Combine + cache (store FULL response JSON)
//       // =======================================================
//       const finalMerged = [...mergedAngel, ...finvasiaOnlyRows];

//       const responseObj = {
//         status: true,
//         statusCode: 200,
//         data: finalMerged,
//         cache: false,
//         message: "Angel + Kite + Finvasia + Upstox + Fyers merged",
//       };

//       // ✅ One stringify only (reuse for redis + response)
//       const payload = JSON.stringify(responseObj);

//       const tCache0 = Date.now();
//       await redis.set(MERGED_REDIS_KEY, payload, "EX", TEN_HOURS_IN_SECONDS);

//       logSuccess(req, {
//         msg: "Merged instruments cached in Redis",
//         requestId,
//         durationMs: Date.now() - tCache0,
//         ttlSeconds: TEN_HOURS_IN_SECONDS,
//         mergedCount: finalMerged.length,
//         payloadSizeBytes: Buffer.byteLength(payload, "utf8"),
//       });

//       logSuccess(req, {
//         msg: "Merged instruments request completed",
//         requestId,
//         totalDurationMs: Date.now() - startTime,
//         mergedCount: finalMerged.length,
//       });

//       // ✅ send JSON string directly (no res.json stringify)
//       res.setHeader("Content-Type", "application/json; charset=utf-8");
//       return res.status(200).send(payload);
//     } finally {
//       await redis.del(LOCK_KEY);
//     }
//   } catch (error) {
//     logError(req, error, {
//       msg: "Error in getMergedInstrumentsNew",
//       requestId,
//       durationMs: Date.now() - startTime,
//     });

//     return res.status(500).json({
//       status: false,
//       statusCode: 500,
//       message: "Unexpected error occurred. Please try again.",
//       data: null,
//       error: error?.message,
//     });
//   }
// };



const resolveMergedRedisKey = (req) => {

  const type = String(req.query.type || "new").toLowerCase();

  console.log(type);
  

  if (type === "angelone") return "merged_instruments";

  return "merged_instruments_new"; // default
};



export const getMergedInstrumentsCacheTTL = async (req, res) => {
  try {
    const MERGED_REDIS_KEY = resolveMergedRedisKey(req);

    const nowIST = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const ttl = await redis.ttl(MERGED_REDIS_KEY);      // -2, -1, or seconds
    const exists = await redis.exists(MERGED_REDIS_KEY);

    const ttlReadable =
      ttl > 0
        ? `${Math.floor(ttl / 60)} min ${ttl % 60} sec`
        : ttl === -1
        ? "No expiry set"
        : "Cache not found";

    logSuccess(req, {
      msg: "Fetched Redis cache TTL",
      redisKey: MERGED_REDIS_KEY,
      cacheType: req.query.type || "new",
      timeIST: nowIST,
      exists: Boolean(exists),
      ttlSeconds: ttl,
      ttlReadable,
    });

    return res.json({
      status: true,
      message: "Redis cache TTL fetched",
      data: {
        redisKey: MERGED_REDIS_KEY,
        cacheType: req.query.type || "new",
        checkedAtIST: nowIST,
        exists: Boolean(exists),
        ttlSeconds: ttl,
        ttlReadable,
      },
    });
  } catch (error) {
    logError(req, error, {
      msg: "Failed to fetch Redis cache TTL",
      cacheType: req.query.type,
    });

    return res.status(500).json({
      status: false,
      message: "Failed to fetch Redis cache TTL",
      error: error?.message,
    });
  }
};


export const clearMergedInstrumentsCache = async (req, res) => {
  try {
    const MERGED_REDIS_KEY = resolveMergedRedisKey(req);

    const nowIST = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const ttlBefore = await redis.ttl(MERGED_REDIS_KEY);
    const existedBefore = await redis.exists(MERGED_REDIS_KEY);

    const delCount = await redis.del(MERGED_REDIS_KEY);

    logSuccess(req, {
      msg: "Merged instruments Redis cache deleted",
      redisKey: MERGED_REDIS_KEY,
      cacheType: req.query.type || "new",
      deletedAtIST: nowIST,
      existedBefore: Boolean(existedBefore),
      ttlBefore,
      deleted: delCount === 1,
    });

    return res.json({
      status: true,
      message: "Redis cache deleted successfully",
      data: {
        redisKey: MERGED_REDIS_KEY,
        cacheType: req.query.type || "new",
        deletedAtIST: nowIST,
        existedBefore: Boolean(existedBefore),
        ttlBefore,
        deleted: delCount === 1,
      },
    });
  } catch (error) {
    logError(req, error, {
      msg: "Failed to delete Redis cache",
      cacheType: req.query.type,
    });

    return res.status(500).json({
      status: false,
      message: "Failed to delete Redis cache",
      error: error?.message,
    });
  }
};







// =======================================================
// ✅ MAIN CONTROLLER: Merged Instruments Working Code
// =======================================================
export const getMergedInstrumentsNew1 = async (req, res) => {
  try {

  console.log('Request started');

  // const MERGED_REDIS_KEY = "merged_instruments_new";
   const MERGED_REDIS_KEY = "merged_instruments";

  const TEN_HOURS_IN_SECONDS = 36000;

    const delCount = await redis.del(MERGED_REDIS_KEY);

      logSuccess(req, {
        msg: "Redis cache delete attempted for merged instruments",
        redisKey: MERGED_REDIS_KEY,
        deletedKeys: delCount, // 0 or 1
        durationMs: Date.now() - tDel0,
      });


    // const startTime = Date.now();

    //     const ttl = await redis.ttl(MERGED_REDIS_KEY);
    //   console.log("Redis key TTL (seconds):", ttl);

    //    const cachedData = await redis.get(MERGED_REDIS_KEY);
    

    // if (cachedData) {
    //   console.log("📦 Merged instruments served from Redis cache");
    //   const endTime = Date.now();
    //   console.log(`✅ Cache hit. Data served in ${(endTime - startTime) / 1000}s`);

    //   return res.json({
    //     status: true,
    //     statusCode: 200,
    //     data: JSON.parse(cachedData),
    //     cache: true,
    //     message: "Merged instruments fetched from Redis cache",
    //   });
    // }


    // // =======================================================
    // // 1️⃣ Fetch all sources
    // // =======================================================
    // const [angeloneData, kiteData, finvasiaList, upstoxData, fyersData] = await Promise.all([
    //   fetchAngelOneScripMaster(),
    //   fetchKiteInstruments(),
    //   fetchAllFinvasiaInstruments(),
    //   fetchUpstoxInstruments("COMPLETE"),
    //   fetchAllFyersInstruments(),
    // ]);

    // console.log('Data fetched from all sources');

    // // =======================================================
    // // 2️⃣ Build lookup maps
    // // =======================================================

    // // ---- Kite: Direct token mapping (like old code) ----
    // const kiteTokenMap = new Map();
    // for (const kiteRecord of kiteData) {
    //   kiteTokenMap.set(String(kiteRecord.exchange_token), kiteRecord);
    // }

    // // ---- Finvasia maps ----
    // const finByToken = new Map();
    // const finBySymbolKey = new Map();
    // for (const f of finvasiaList) {
    //   const finToken = buildTokenKey(f?.Token);
    //   if (finToken) finByToken.set(finToken, f);
    //   const finKey = buildSymbolKey(f?.Exchange, f?.TradingSymbol || f?.Symbol);
    //   if (finKey) finBySymbolKey.set(finKey, f);
    // }

    // // ---- Upstox maps ----
    // const upsByToken = new Map();
    // const upsBySymbolKey = new Map();
    // for (const u of upstoxData) {
    //   const uToken = buildTokenKey(getUpstoxToken(u));
    //   if (uToken) upsByToken.set(uToken, u);
    //   const uKey = buildSymbolKey(getUpstoxExchange(u), getUpstoxSymbol(u));
    //   if (uKey) upsBySymbolKey.set(uKey, u);
    // }

    // // ---- Fyers maps ----
    // const fyByToken = new Map();
    // const fyBySymbolKey = new Map();
    // for (const f of fyersData) {
    //   const fyToken = buildTokenKey(f?.fytoken);
    //   if (fyToken) fyByToken.set(fyToken, f);
    //   const fyKey = buildSymbolKey(f?.exchange, f?.tradingsymbol);
    //   if (fyKey) fyBySymbolKey.set(fyKey, f);
    // }

    // // =======================================================
    // // 3️⃣ Merge AngelOne with Kite (direct token match, like old code)
    // // =======================================================
    // const mergedAngel = angeloneData.map((angel) => {
    //   const kiteMatch = kiteTokenMap.get(String(angel.token));

    //   // ---- Finvasia, Upstox, Fyers: Use fallback logic ----
    //   const angelExch = angel?.exch_seg || angel?.exchange || "";
    //   const angelSymbol = angel?.symbol || angel?.name || "";
    //   const symKey = buildSymbolKey(angelExch, angelSymbol);

    //   const finMatch = finByToken.get(String(angel.token)) || finBySymbolKey.get(symKey) || null;
    //   const upstoxMatch = upsByToken.get(String(angel.token)) || upsBySymbolKey.get(symKey) || null;
    //   const fyMatch = fyByToken.get(String(angel.token)) || fyBySymbolKey.get(symKey) || null;

    //   return {
    //     ...angel,
    //     kiteSymbol: kiteMatch?.tradingsymbol || null,
    //     kiteToken: kiteMatch?.exchange_token || null,
    //     kiteExchange: kiteMatch?.exchange || null,
    //     kiteInstrumentType: kiteMatch?.instrument_type || null,

    //     finvasiaSymbol: finMatch?.TradingSymbol || finMatch?.Symbol || null,
    //     finvasiaToken: finMatch?.Token || null,
    //     finvasiaExchange: finMatch?.Exchange || null,
    //     finvasiaInstrument: finMatch?.Instrument || null,
    //     finvasiaLotSize: finMatch?.LotSize || null,
    //     finvasiaTickSize: finMatch?.TickSize || null,

    //     upstoxSymbol: getUpstoxSymbol(upstoxMatch) || null,
    //     upstoxToken: getUpstoxToken(upstoxMatch) || null,
    //     upstoxExchange: getUpstoxExchange(upstoxMatch) || null,

    //     fyersSymbol: fyMatch?.symbol || null,
    //     fyersToken: fyMatch?.fytoken || null,
    //     fyersExchange: fyMatch?.exchange || null,
    //   };
    // });

    // // =======================================================
    // // 4️⃣ Add Finvasia-only rows (not in AngelOne)
    // // =======================================================
    // const angelTokenSet = new Set(angeloneData.map((a) => String(a.token)));
    // const finvasiaOnlyRows = finvasiaList
    //   .filter((f) => !angelTokenSet.has(String(f.Token)))
    //   .map((f) => {
    //     const finToken = String(f.Token);
    //     const finKey = buildSymbolKey(f.Exchange, f.TradingSymbol || f.Symbol);

    //     const kiteMatch = kiteTokenMap.get(finToken) || null;
    //     const upstoxMatch = upsByToken.get(finToken) || upsBySymbolKey.get(finKey) || null;
    //     const fyMatch = fyByToken.get(finToken) || fyBySymbolKey.get(finKey) || null;

    //     return {
    //       source: "FINVASIA_ONLY",
    //       exch_seg: f.Exchange,
    //       token: finToken,
    //       symbol: f.Symbol,
    //       name: f.Symbol,

    //       finvasiaSymbol: f.TradingSymbol || f.Symbol || null,
    //       finvasiaToken: f.Token || null,

    //       kiteSymbol: kiteMatch?.tradingsymbol || null,
    //       kiteToken: kiteMatch?.exchange_token || null,

    //       upstoxSymbol: getUpstoxSymbol(upstoxMatch) || null,
    //       upstoxToken: getUpstoxToken(upstoxMatch) || null,

    //       fyersSymbol: fyMatch?.symbol || null,
    //       fyersToken: fyMatch?.fytoken || null,
    //     };
    //   });

    // // =======================================================
    // // 5️⃣ Combine all rows
    // // =======================================================
    // const finalMerged = [...mergedAngel, ...finvasiaOnlyRows];

    // const endTime = Date.now();
    // console.log(`✅ Merged data in ${(endTime - startTime) / 1000}s`);


    // console.log(fyersData.length,'fyersData.length');

    // // ===========================================
    // // 3️⃣ Cache merged data in Redis
    // // ===========================================
    // await redis.set(
    //   MERGED_REDIS_KEY,
    //   JSON.stringify(finalMerged),
    //   "EX",
    //   TEN_HOURS_IN_SECONDS
    // );
    
    // return res.json({
    //   status: true,
    //   statusCode: 200,
    //   data: finalMerged,
    //   cache: false,
    //   message: "Angel + Kite + Finvasia + Upstox + Fyers merged",
    // });
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


