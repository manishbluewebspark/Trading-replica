
import axios from 'axios';
import sequelize from "../config/db.js"; // ✅ your Sequelize instance
import { QueryTypes } from "sequelize";
import redis from "../utils/redis.js";  // your redis client
import { KiteAccess } from '../utils/kiteClient.js';
import unzipper from "unzipper";



const SYMBOL_MASTER_URLS = {
  NSE: "https://api.shoonya.com/NSE_symbols.txt.zip",
  BSE: "https://api.shoonya.com/BSE_symbols.txt.zip",
  NFO: "https://api.shoonya.com/NFO_symbols.txt.zip",
  MCX: "https://api.shoonya.com/MCX_symbols.txt.zip",
};

// Parse CSV to objects
function parseCSVToObjects(csv) {
  const lines = csv
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const headers = lines.shift().split(",");

  return lines.map((line) => {
    const values = line.split(",");

    const obj = {};
    headers.forEach((header, index) => {
      const key = header.trim();
      let value = values[index]?.trim() ?? "";

      // Auto type conversion
      if (!isNaN(value) && value !== "") {
        value = Number(value);
      }

      obj[key] = value;
    });

    return obj;
  });
}

async function downloadAndUnzipText(url) {
  const zipRes = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 120000,
  });

  const directory = await unzipper.Open.buffer(Buffer.from(zipRes.data));
  const file = directory.files.find(
    (f) => !f.path.endsWith("/") && f.path.includes(".txt")
  );

  if (!file) throw new Error(`No .txt found inside zip: ${url}`);

  const content = await file.buffer();
  return content.toString("utf-8");
}

async function loadInstruments(exch) {
  const url = SYMBOL_MASTER_URLS[exch];
  if (!url) throw new Error(`Unsupported exch '${exch}'. Use NSE/BSE/NFO/MCX`);

  const txt = await downloadAndUnzipText(url);
  return parseCSVToObjects(txt).map((row) => ({ exch, ...row }));
}

async function loadAllFinvasiaInstruments() {
  const results = await Promise.all(
    Object.keys(SYMBOL_MASTER_URLS).map((exch) => loadInstruments(exch))
  );
  return results.flat();
}

// =======================================================
// ✅ MAIN CONTROLLER: Merged Instruments with Redis Caching
// =======================================================
export const getMergedInstruments1 = async (req, res) => {
  
  const MERGED_REDIS_KEY = "merged_instruments";
  const TEN_HOURS_IN_SECONDS = 36000;

   // ===========================================
  // 1️⃣ Delete Redis Cache (if needed)
  // ===========================================
  // await redis.del(MERGED_REDIS_KEY);
  // console.log("🗑️ Deleted Redis cache for key:", MERGED_REDIS_KEY);



  try {
    const startTime = Date.now();

    // ===========================================
    // 1️⃣ Check Redis Cache First
    // ===========================================

    // const cachedData = await redis.get(MERGED_REDIS_KEY);
    // const ttl = await redis.ttl(MERGED_REDIS_KEY);
    // console.log("Redis key TTL (seconds):", ttl);

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

    // ===========================================
    // 2️⃣ Fetch fresh data from all sources
    // ===========================================
    const apiKey = process.env.KITE_API_KEY;
    const kite = KiteAccess(apiKey);

    const [angeloneResponse, kiteResponse, finvasiaList] = await Promise.all([
      axios.get(
        "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json",
        { timeout: 120000 }
      ),
      kite.getInstruments(),
      loadAllFinvasiaInstruments(),
    ]);

    const angeloneData = angeloneResponse.data || [];
    const kiteData = kiteResponse || [];

    console.log("AngelOne first record:", angeloneData[0]);
    console.log("Kite first record:", kiteData[0]);
    console.log("Finvasia first record:", finvasiaList[0]);

    // ===========================================
    // 3️⃣ Build lookup maps
    // ===========================================

    // Kite: exchange_token -> kite record
    const kiteByExchangeToken = new Map();
    for (const k of kiteData) {
      if (k?.exchange_token != null) {
        kiteByExchangeToken.set(String(k.exchange_token), k);
      }
    }

    // Finvasia: Token -> Finvasia record
    const finByToken = new Map();
    for (const f of finvasiaList) {
      const token = String(f.Token || "");
      if (!token) continue;
      finByToken.set(token, f);
    }

    // ===========================================
    // 4️⃣ Merge AngelOne + Kite + Finvasia
    // ===========================================
    const mergedAngel = angeloneData.map((angel) => {
      const angelToken = String(angel.token ?? "");
      const kiteMatch = kiteByExchangeToken.get(angelToken) || null;
      const finMatch = finByToken.get(angelToken) || null;

      return {
        ...angel,
        kite_tradingsymbol: kiteMatch?.tradingsymbol || null,
        kite_exchange: kiteMatch?.exchange || null,
        kite_instrument_type: kiteMatch?.instrument_type || null,
        finvasia_tradingsymbol: finMatch?.TradingSymbol || null,
        finvasia_token: finMatch ? Number(finMatch.Token) : null,
        finvasia_symbol: finMatch?.Symbol || null,
        finvasia_exchange: finMatch?.Exchange || null,
        finvasia_instrument: finMatch?.Instrument || null,
        finvasia_lotsize: finMatch?.LotSize ?? null,
        finvasia_ticksize: finMatch?.TickSize ?? null,
      };
    });

    // ===========================================
    // 5️⃣ Insert Finvasia-only rows (not in AngelOne)
    // ===========================================
    const angelTokenSet = new Set(angeloneData.map((a) => String(a.token)));

    const finvasiaOnlyRows = [];
    for (const f of finvasiaList) {
      const finToken = String(f.Token);
      if (!finToken) continue;
      if (angelTokenSet.has(finToken)) continue;

      const kiteMatch = kiteByExchangeToken.get(finToken) || null;

      finvasiaOnlyRows.push({
        source: "FINVASIA_ONLY",
        exch_seg: f.Exchange,
        token: finToken,
        symbol: f.Symbol,
        name: f.Symbol,
        kite_tradingsymbol: kiteMatch?.tradingsymbol || null,
        kite_exchange: kiteMatch?.exchange || null,
        kite_instrument_type: kiteMatch?.instrument_type || null,
        finvasia_tradingsymbol: f.TradingSymbol,
        // finvasia_token: Number(f.Token),
        // finvasia_symbol: f.Symbol,
        // finvasia_exchange: f.Exchange,
        // finvasia_instrument: f.Instrument,
        // finvasia_lotsize: f.LotSize ?? null,
        // finvasia_ticksize: f.TickSize ?? null,
      });
    }

    const finalMerged = mergedAngel.concat(finvasiaOnlyRows);

    // ===========================================
    // 6️⃣ Cache merged data in Redis
    // ===========================================

    // await redis.set(
    //   MERGED_REDIS_KEY,
    //   JSON.stringify(finalMerged),
    //   "EX",
    //   TEN_HOURS_IN_SECONDS
    // );

    const endTime = Date.now();
    console.log(`✅ Final merged data fetched and cached in ${(endTime - startTime) / 1000}s`);
    console.log(
      `Counts: angel=${angeloneData.length}, kite=${kiteData.length}, fin=${finvasiaList.length}, final=${finalMerged.length}`
    );

    // ===========================================
    // 7️⃣ Send response
    // ===========================================
    return res.json({
      status: true,
      statusCode: 200,
      data: finalMerged,
      cache: false,
      message: "Angel + Kite + Finvasia merged and cached in Redis",
      meta: {
        angel: angeloneData.length,
        kite: kiteData.length,
        finvasia: finvasiaList.length,
        final: finalMerged.length,
      },
    });

  } catch (error) {
    console.error("❌ Error in getMergedInstruments:", error?.message || error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error?.message,
    });
  }
};



// const SYMBOL_MASTER_URLS = {
//   NSE: "https://api.shoonya.com/NSE_symbols.txt.zip",
//   BSE: "https://api.shoonya.com/BSE_symbols.txt.zip",
//   NFO: "https://api.shoonya.com/NFO_symbols.txt.zip",
//   MCX: "https://api.shoonya.com/MCX_symbols.txt.zip",
// };

// // Parse CSV to objects
// function parseCSVToObjects(csv) {
//   const lines = csv
//     .split("\n")
//     .map((l) => l.trim())
//     .filter(Boolean);

//   const headers = lines.shift().split(",");

//   return lines.map((line) => {
//     const values = line.split(",");

//     const obj = {};
//     headers.forEach((header, index) => {
//       const key = header.trim();
//       let value = values[index]?.trim() ?? "";

//       // Auto type conversion
//       if (!isNaN(value) && value !== "") {
//         value = Number(value);
//       }

//       obj[key] = value;
//     });

//     return obj;
//   });
// }

// async function downloadAndUnzipText(url) {
//   const zipRes = await axios.get(url, {
//     responseType: "arraybuffer",
//     timeout: 120000,
//   });

//   const directory = await unzipper.Open.buffer(Buffer.from(zipRes.data));
//   const file = directory.files.find(
//     (f) => !f.path.endsWith("/") && f.path.includes(".txt")
//   );

//   if (!file) throw new Error(`No .txt found inside zip: ${url}`);

//   const content = await file.buffer();
//   return content.toString("utf-8");
// }

// async function loadInstruments(exch) {
//   const url = SYMBOL_MASTER_URLS[exch];
//   if (!url) throw new Error(`Unsupported exch '${exch}'. Use NSE/BSE/NFO/MCX`);

//   const txt = await downloadAndUnzipText(url);
//   return parseCSVToObjects(txt).map((row) => ({ exch, ...row }));
// }

// async function loadAllFinvasiaInstruments() {
//   const results = await Promise.all(
//     Object.keys(SYMBOL_MASTER_URLS).map((exch) => loadInstruments(exch))
//   );
//   return results.flat();
// }

// // =======================================================
// // ✅ MAIN CONTROLLER: Merged Instruments
// // =======================================================
// export const getMergedInstruments = async (req, res) => {
//   try {
//     const startTime = Date.now();

//     // ===========================================
//     // 1️⃣ Fetch fresh data from all sources
//     // ===========================================
//     const apiKey = process.env.KITE_API_KEY;
//     const kite = KiteAccess(apiKey);

//     const [angeloneResponse, kiteResponse, finvasiaList] = await Promise.all([
//       axios.get(
//         "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json",
//         { timeout: 120000 }
//       ),
//       kite.getInstruments(),
//       loadAllFinvasiaInstruments(),
//     ]);

//     const angeloneData = angeloneResponse.data || [];
//     const kiteData = kiteResponse || [];

//     console.log("AngelOne first record:", angeloneData[0]);
//     console.log("Kite first record:", kiteData[0]);
//     console.log("Finvasia first record:", finvasiaList[0]);

//     // ===========================================
//     // 2️⃣ Build lookup maps
//     // ===========================================

//     // Kite: exchange_token -> kite record
//     const kiteByExchangeToken = new Map();
//     for (const k of kiteData) {
//       if (k?.exchange_token != null) {
//         kiteByExchangeToken.set(String(k.exchange_token), k);
//       }
//     }

//     // Finvasia: Token -> Finvasia record
//     const finByToken = new Map();
//     for (const f of finvasiaList) {
//       const token = String(f.Token || "");
//       if (!token) continue;
//       finByToken.set(token, f);
//     }

//     // ===========================================
//     // 3️⃣ Merge AngelOne + Kite + Finvasia
//     // ===========================================
//     const mergedAngel = angeloneData.map((angel) => {
//       const angelToken = String(angel.token ?? "");
//       const kiteMatch = kiteByExchangeToken.get(angelToken) || null;
//       const finMatch = finByToken.get(angelToken) || null;

//       return {
//         ...angel,
//         kite_tradingsymbol: kiteMatch?.tradingsymbol || null,
//         kite_exchange: kiteMatch?.exchange || null,
//         kite_instrument_type: kiteMatch?.instrument_type || null,
//         finvasia_tradingsymbol: finMatch?.TradingSymbol || null, // Add finvasia_tradingsymbol
//         finvasia_token: finMatch ? Number(finMatch.Token) : null,
//         // finvasia_symbol: finMatch?.Symbol || null,
//         // finvasia_exchange: finMatch?.Exchange || null,
//         // finvasia_instrument: finMatch?.Instrument || null,
//         // finvasia_lotsize: finMatch?.LotSize ?? null,
//         // finvasia_ticksize: finMatch?.TickSize ?? null,
//       };
//     });

//     // ===========================================
//     // 4️⃣ Insert Finvasia-only rows (not in AngelOne)
//     // ===========================================
//     const angelTokenSet = new Set(angeloneData.map((a) => String(a.token)));

//     const finvasiaOnlyRows = [];
//     for (const f of finvasiaList) {
//       const finToken = String(f.Token);
//       if (!finToken) continue;
//       if (angelTokenSet.has(finToken)) continue;

//       const kiteMatch = kiteByExchangeToken.get(finToken) || null;

//       finvasiaOnlyRows.push({
//         source: "FINVASIA_ONLY",
//         exch_seg: f.Exchange,
//         token: finToken,
//         symbol: f.Symbol,
//         name: f.Symbol,
//         kite_tradingsymbol: kiteMatch?.tradingsymbol || null,
//         kite_exchange: kiteMatch?.exchange || null,
//         kite_instrument_type: kiteMatch?.instrument_type || null,
//         finvasia_tradingsymbol: f.TradingSymbol, // Add finvasia_tradingsymbol
//         finvasia_token: Number(f.Token),
//         finvasia_symbol: f.Symbol,
//         finvasia_exchange: f.Exchange,
//         finvasia_instrument: f.Instrument,
//         finvasia_lotsize: f.LotSize ?? null,
//         finvasia_ticksize: f.TickSize ?? null,
//       });
//     }

//     const finalMerged = mergedAngel.concat(finvasiaOnlyRows);

//     const endTime = Date.now();
//     console.log(`✅ Final merged data fetched in ${(endTime - startTime) / 1000}s`);
//     console.log(
//       `Counts: angel=${angeloneData.length}, kite=${kiteData.length}, fin=${finvasiaList.length}, final=${finalMerged.length}`
//     );

//     // ===========================================
//     // 5️⃣ Send response
//     // ===========================================
//     return res.json({
//       status: true,
//       statusCode: 200,
//       data: finalMerged,
//       message: "Angel + Kite + Finvasia merged successfully",
//       meta: {
//         angel: angeloneData.length,
//         kite: kiteData.length,
//         finvasia: finvasiaList.length,
//         final: finalMerged.length,
//       },
//     });

//   } catch (error) {
//     console.error("❌ Error in getMergedInstruments:", error?.message || error);
//     return res.json({
//       status: false,
//       statusCode: 500,
//       message: "Unexpected error occurred. Please try again.",
//       data: null,
//       error: error?.message,
//     });
//   }
// };


// =========== node corn used ===============

export const getMergedInstruments = async (req, res) => {

  const MERGED_REDIS_KEY = "merged_instruments";

  const TEN_HOURS_IN_SECONDS = 36000;

    // await redis.del(MERGED_REDIS_KEY)

    // console.log('delete redis cache data');
    

  try {
    const startTime = Date.now();

    // ===========================================
    // 1️⃣ Check Redis Cache First
    // ===========================================
    const cachedData = await redis.get(MERGED_REDIS_KEY);

    // console.log(cachedData,'cachedData');

    const ttl = await redis.ttl(MERGED_REDIS_KEY);
      console.log("Redis key TTL (seconds):", ttl);
    

    if (cachedData) {
      console.log("📦 Merged instruments served from Redis cache");
      const endTime = Date.now();
      console.log(`✅ Cache hit. Data served in ${(endTime - startTime) / 1000}s`);

      return res.json({
        status: true,
        statusCode: 200,
        data: JSON.parse(cachedData),
        cache: true,
        message: "Merged instruments fetched from Redis cache",
      });
    }


      const apiKey = process.env.KITE_API_KEY;
        const kite = KiteAccess(apiKey);

    // ===========================================
    // 1️⃣ Fetch fresh data from both APIs
    // ===========================================
    const [angeloneResponse, kiteResponse] = await Promise.all([
      axios.get(
        "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json",
        { timeout: 120000 }
      ),
      kite.getInstruments(), // Assuming `kite` is initialized
    ]);

    const angeloneData = angeloneResponse.data || [];
    const kiteData = kiteResponse || [];

    console.log(angeloneData[0],'angelone');
    console.log(kiteData[0],'kite');

    // ✅ Build lookup map from Kite data
const kiteTokenMap = new Map();
for (const kiteRecord of kiteData) {
  kiteTokenMap.set(String(kiteRecord.exchange_token), kiteRecord.tradingsymbol);
}
    
    // ✅ Fast merge using map lookup
const mergedData = angeloneData.map((angelRecord) => {
  const kiteSymbol = kiteTokenMap.get(String(angelRecord.token));

  if (kiteSymbol) {
    return {
      ...angelRecord,
      kite_tradingsymbol: kiteSymbol,
    };
  }

  return angelRecord;
});

    // ===========================================
    // 3️⃣ Cache merged data in Redis
    // ===========================================
    await redis.set(
      MERGED_REDIS_KEY,
      JSON.stringify(mergedData),
      "EX",
      TEN_HOURS_IN_SECONDS
    );

    const endTime = Date.now();
    console.log(`✅ Merged data fetched and cached in ${(endTime - startTime) / 1000}s`);

    // ===========================================
    // 4️⃣ Send response
    // ===========================================
    return res.json({
      status: true,
      statusCode: 200,
      data: mergedData,
      cache: false, // Since we fetched fresh data
      message: "Merged instruments fetched, merged, and cached in Redis",
    });

  } catch (error) {
    console.error("❌ Error in getMergedInstruments:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }

};



export const getInstrumentPostgre = async (req, res) => {


  try {
    const startTime = Date.now();
    const REDIS_KEY = "angelone_scrip_master";

    // ===========================================
    // 🔍 1. Check Redis First
    // ===========================================
    const cachedData = await redis.get(REDIS_KEY);




    if (cachedData) {
      console.log("📦 Data served from Redis");

      

      return res.json({
        status: true,
        statusCode: 200,
        data: JSON.parse(cachedData),
        cache: true,
        message: "Fetched from Redis cache",
      });
    }

    // ===========================================
    // 🌐 2. Fetch from AngelOne API if not in Redis
    // ===========================================
    const SCRIP_URL =
      "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json";

    const response = await axios.get(SCRIP_URL, {
      timeout: 120000, // 120 sec
    });

    const data = response.data || [];

    console.log(data,1000)
    

    // ===========================================
    // 💾 3. Store in Redis (Expires in 10 hours)
    // ===========================================
    await redis.set(REDIS_KEY, JSON.stringify(data), "EX", 36000);

    const endTime = Date.now();
    console.log(
      `Fetched AngelOne ScripMaster LIVE API in ${(endTime - startTime) / 1000}s`
    );

    return res.json({
      status: true,
      statusCode: 200,
      data,
      cache: false,
      message: "Fetched live from AngelOne API and cached in Redis",
    });
  } catch (error) {
    console.error("Error fetching AngelOne ScripMaster:", error.message);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};





// export const getInstrumentPostgre = async (req, res) => {
//   try {
//     const startTime = Date.now();

//     // 🔗 Angel One scrip master URL
//     const SCRIP_URL =
//       "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json";

//     // ⬇️ Fetch data using axios
//     const response = await axios.get(SCRIP_URL, {
//       timeout: 120000, // 120s timeout (optional)
//     });

//     // response.data is the JSON from AngelOne
//     const data = response.data || [];

//     const endTime = Date.now();
//     console.log(
//       `Fetched AngelOne ScripMaster in ${(endTime - startTime) / 1000}s`
//     );

//     return res.json({
//       status: true,
//       statusCode: 200,
//       data,
//       message: "Successfully fetched data from AngelOne ScripMaster",
//     });
//   } catch (error) {
//     console.error("Error fetching AngelOne ScripMaster:", error.message);

//     return res.json({
//       status: false,
//       statusCode: 500,
//       message: "Unexpected error occurred. Please try again.",
//       data: null,
//       error: error.message,
//     });
//   }
// };

export const searchInstrumentPostgre = async (req, res) => {
  try {

    const q = (req.params.id || req.query.q || "").trim();

    const limit = Math.min(parseInt(req.query.limit || "200", 10), 1000);

    if (!q) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Search query is required (use /:id or ?q=)",
        data: null,
      });
    }

    const startTime = Date.now();

    const sql = `
      SELECT *,
        ts_rank(
          to_tsvector('simple',
            coalesce("name",'') || ' ' ||
            coalesce("token",'') || ' ' ||        -- ✅ include token
            coalesce("symbol",'') || ' ' ||
             coalesce("nameStrickType",'') || ' ' ||
            coalesce("SyNum",'')
          ),
          plainto_tsquery('simple', :q)
        ) AS rank
      FROM "Instruments"
      WHERE
        -- ✅ FTS over name+token+symbol+SyNum (matches your GIN index expr)
        to_tsvector('simple',
          coalesce("name",'') || ' ' ||
          coalesce("token",'') || ' ' ||        -- ✅ include token
          coalesce("symbol",'') || ' ' ||
          coalesce("nameStrickType",'') || ' ' ||
          coalesce("SyNum",'')
        ) @@ plainto_tsquery('simple', :q)

        -- ✅ helpful fallbacks when searching pure token values
        OR "token" = :q
        OR "token" ILIKE '%' || :q || '%'
      ORDER BY rank DESC NULLS LAST, "updatedAt" DESC
      LIMIT :limit
    `;

    const data = await sequelize.query(sql, {
      replacements: { q, limit },
      type: QueryTypes.SELECT,
    });

    const endTime = Date.now();
  

    return res.json({ status: true, statusCode: 200, message: "Successfully fetched data", data });
  } catch (error) {
    console.error(error);
    return res.json({ status: false, statusCode: 500, message: "Unexpected error occurred. Please try again.", data: null, error: error.message });
  }
};


export const getPerticularInstruments = async (req, res) => {
    try {

        const reqData = JSON.stringify({
            "exchange": req.body.exchange,
            "tradingsymbol": req.body.tradingsymbol,
            "symboltoken": req.body.symboltoken,
        });

        var config = {
        method: 'post',
        url: 'https://apiconnect.angelone.in/order-service/rest/secure/angelbroking/order/v1/getLtpData',
        headers: { 
            'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
             'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
        data : reqData
        };

        const {data} = await axios(config);

         if(data.status==true) {

            return res.json({
            status: true,
            statusCode:200,
            data: data.data,
            message:'successfully fetch data'
        });

         }else{

        return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }
        
    } catch (error) {

 
       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};


export async function ensureInstrumentTextIndexes() {
    try {

  await sequelize.query(`DROP INDEX IF EXISTS instruments_fts_idx;`)
        
        // Optional but handy for fuzzy search, keep it anyway
  await sequelize.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

  // Full-text GIN index over name + symbol + SyNum
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS instruments_fts_idx
    ON "Instruments"
    USING GIN (
      to_tsvector('simple',
        coalesce("name",'') || ' ' ||
        coalesce("token",'') || ' ' ||
        coalesce("symbol",'') || ' ' ||
         coalesce("nameStrickType",'') || ' ' ||
        coalesce("SyNum",'')
      )
    );
  `);

//   await sequelize.query(`CREATE INDEX IF NOT EXISTS instruments_token_idx
// ON "Instruments" ("token");`)

  console.log('done index in instrument');

    } catch (error) {

        console.log(error);
        
        
    }
}

// ensureInstrumentTextIndexes()


// export const getInstrumentPostgre = async (req, res) => {

//     try {

    
//          const startTime = Date.now();

//         //  const data = await Instrument.findAll({});

//         const data = await sequelize.query(
//         'SELECT "id", "token", "symbol", "name","instrumenttype","lotsize","exch_seg","SyNum","syType" FROM "Instruments";',
//         { type: QueryTypes.SELECT, raw: true }
//       );

//         const endTime = Date.now();

//      return res.json({
//             status: true,
//             statusCode:200,
//             data: data,
//             message:'successfully fetch data'
//         });


//     } catch (error) {

//         console.log(error);
        
        
//          return res.json({
//             status: false,
//             statusCode:500,
//             message: "Unexpected error occurred. Please try again.",
//             data:null,
//             error: error.message,
//         });

//     }

   



// }



























