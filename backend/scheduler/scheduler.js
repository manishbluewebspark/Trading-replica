// scheduler.js
import cron from "node-cron";
import { bulkInsertPostgre } from "../script/postgre.js";
import { bulkUpdateSyFieldsJS } from "../script/postgre.js"; 
import redis from "../utils/redis.js";
import { KiteAccess } from '../utils/kiteClient.js';

const MERGED_REDIS_KEY = "merged_instruments";
const TEN_HOURS_IN_SECONDS = 36000;


// This can be used by both the cron and the API
export const buildMergedInstruments = async ({ useCache = true } = {}) => {
  
  const startTime = Date.now();

  // ===========================================
  // 1️⃣ Check Redis Cache (optional)
  // ===========================================
  if (useCache) {

    const cachedData = await redis.get(MERGED_REDIS_KEY);
    const ttl = await redis.ttl(MERGED_REDIS_KEY);
    console.log("Redis key TTL (seconds):", ttl);

    if (cachedData) {
      console.log("📦 Merged instruments served from Redis cache");
      const endTime = Date.now();
      console.log(`✅ Cache hit. Data served in ${(endTime - startTime) / 1000}s`);
      return {
        data: JSON.parse(cachedData),
        cache: true,
        message: "Merged instruments fetched from Redis cache",
      };
    }
  }

  const apiKey = process.env.KITE_API_KEY;
  const kite = KiteAccess(apiKey);

  // ===========================================
  // 2️⃣ Fetch fresh data from both APIs
  // ===========================================
  const [angeloneResponse, kiteResponse] = await Promise.all([
    axios.get(
      "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json",
      { timeout: 120000 }
    ),
    kite.getInstruments(),
  ]);

  const angeloneData = angeloneResponse.data || [];
  const kiteData = kiteResponse || [];

  console.log(angeloneData[0], "angelone");
  console.log(kiteData[0], "kite");

  // ===========================================
  // 3️⃣ Merge Data
  // ===========================================
  const mergedData = angeloneData.map((angelRecord) => {
    const matchingKiteRecord = kiteData.find(
      (kiteRecord) =>
        String(kiteRecord.exchange_token) === String(angelRecord.token)
    );

    if (matchingKiteRecord) {
      return {
        ...angelRecord,
        kite_tradingsymbol: matchingKiteRecord.tradingsymbol,
      };
    }
    return angelRecord;
  });

  // ===========================================
  // 4️⃣ Cache merged data in Redis
  // ===========================================
  await redis.set(
    MERGED_REDIS_KEY,
    JSON.stringify(mergedData),
    "EX",
    TEN_HOURS_IN_SECONDS
  );

  const endTime = Date.now();
  console.log(
    `✅ Merged data fetched and cached in ${(endTime - startTime) / 1000}s`
  );

  return {
    data: mergedData,
    cache: false,
    message: "Merged instruments fetched, merged, and cached in Redis",
  };
};


let running = { merged: false };

cron.schedule(
  "16 7 * * *", // Every day @ 7:00 AM
  async () => {
    if (running.merged) {
      return console.log("⚠️ Merged instrument job already running. Skip.");
    }

    running.merged = true;
    console.log("🔁 Starting merged instrument refresh @ 07:00 IST");

    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        // 1️⃣ Delete old Redis cache
        await redis.del(MERGED_REDIS_KEY);
        console.log("🗑️ Old Redis cache deleted (merged_instruments)");

        // 2️⃣ Build fresh merged data (this will automatically re-cache)
        await buildMergedInstruments({ useCache: false });
        console.log(`✅ Fresh merged instruments saved (attempt ${attempt})`);

        break; // SUCCESS → exit retry loop
      } catch (err) {
        console.error(
          `❌ Attempt ${attempt} failed to refresh merged instruments:`,
          err?.message || err
        );

        if (attempt < MAX_ATTEMPTS) {
          console.log("⏳ Retrying in 1 minute...");
          await new Promise((r) => setTimeout(r, 60000)); // wait 1 minute
        } else {
          console.error("🚨 All retry attempts failed for merged instruments job.");
        }
      }
    }

    running.merged = false;
  },
  { timezone: "Asia/Kolkata" }
);




// // Prevent overlapping runs
// let running = { insert: false, update: false };

// cron.schedule("40 9 * * *", async () => {          // every day at 09:40
// // cron.schedule("40 9 * * *", async () => {          // every day at 09:40  

//   if (running.insert) {
     
//     return console.log("Insert already running, skip.");

//   }

//   running.insert = true;

//   console.log("▶️ bulkInsert @ 09:40 IST");

//   try {

//      await bulkInsertPostgre(); 

//     }catch (e) {

//     console.error("bulkInsert error:", e);
    
//     }finally {

//         running.insert = false;
//     }
// }, { timezone: "Asia/Kolkata" });








