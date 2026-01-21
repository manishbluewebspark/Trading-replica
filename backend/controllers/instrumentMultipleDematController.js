
import redis from "../utils/redis.js";  // your redis client
import { logSuccess, logError } from "../utils/loggerr.js"; // <-- path adjust
import { startMergeWorker } from "../workers/startMergeWorker.js";
import zlib from "zlib";


// =======================================================
// ✅ MAIN CONTROLLER: Merged Instruments Testing Code
// =======================================================
let isWorkerRunning = false;

// Helper to check if buffer is compressed
const isCompressedBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer)) return false;
  // Check for gzip magic number (0x1f 0x8b)
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
    return 'gzip';
  }
  // Check for deflate/zlib header
  if (buffer.length >= 2 && (buffer[0] === 0x78 && 
      (buffer[1] === 0x01 || buffer[1] === 0x5e || 
       buffer[1] === 0x9c || buffer[1] === 0xda))) {
    return 'deflate';
  }
  return false;
};

export const getMergedInstrumentsNew = async (req, res) => {
  try {
    console.log("✅ getMergedInstrumentsNew called");

    const MERGED_KEY = "merged_instruments_new";

    // await redis.del(MERGED_KEY);
    // console.log("🧹 Redis merged data removed!");

    // 1️⃣ Check Redis cache
    const cached = await redis.getBuffer(MERGED_KEY);
    
    if (cached) {
      console.log("✅ Cache found, checking compression...");
      
      // Check if data is compressed
      const compressionType = isCompressedBuffer(cached);
      
      if (compressionType) {
       
        try {
          let decompressed;
          
          if (compressionType === 'gzip') {
            decompressed = zlib.gunzipSync(cached);
          } else if (compressionType === 'deflate') {
            decompressed = zlib.inflateSync(cached);
          }
          
         
          
          // Send decompressed data
          res.setHeader("Content-Type", "application/json");
          res.setHeader("X-Compression", compressionType);
          res.setHeader("X-Original-Size", cached.length);
          res.setHeader("X-Decompressed-Size", decompressed.length);
          return res.status(200).send(decompressed);
          
        } catch (decompressError) {
          console.error("❌ Decompression failed:", decompressError);
          // Fallback: Send compressed data (client will need to handle it)
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader("X-Compression", compressionType);
          return res.status(200).send(cached);
        }
      } else {
        // Data is not compressed, send as is
        console.log("✅ Data is not compressed, sending directly");
        res.setHeader("Content-Type", "application/json");
        return res.status(200).send(cached);
      }
    }

    // 2️⃣ If worker already running
    if (isWorkerRunning) {
      return res.status(202).json({
        status: false,
        code: "WORKER_RUNNING",
        message: "Preparing instruments... worker is already running, try again in 10-15 minutes"
      });
    }

    // 3️⃣ Start worker (async fire)
    console.log("❌ Cache empty — starting merge worker");
    isWorkerRunning = true;

    startMergeWorker()   // no await here → fire and forget
      // .then(() => console.log("✔️ Merge worker completed"))
      // .catch((err) => console.error("❌ Merge worker failed:", err))
      // .finally(() => {
      //   isWorkerRunning = false;
      //   console.log("✅ Worker status reset");
      // });

    // 4️⃣ Immediate response
    return res.status(202).json({
      status: false,
      code: "WORKER_STARTED",
      message: "Preparing instruments... try again in 10-15 minutes",
      startedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Controller error:", err);
    isWorkerRunning = false;
    return res.status(500).json({
      status: false,
      code: "INTERNAL_ERROR",
      error: err.message,
      message: "Server error while preparing instruments. Please try again in 20-30 minutes"
    });
  }
};


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











// ========================================================
// ============================ 17 jan 2025 old ================
// ========================================================




// import redis from "../utils/redis.js";  // your redis client
// import { logSuccess, logError } from "../utils/loggerr.js"; // <-- path adjust
// import { startMergeWorker } from "../workers/startMergeWorker.js";



// // =======================================================
// // ✅ MAIN CONTROLLER: Merged Instruments Testing Code
// // =======================================================
// let isWorkerRunning = false;

// export const getMergedInstrumentsNew = async (req, res) => {
//   try {

//     console.log("✅ getMergedInstrumentsNew called");

//     const MERGED_KEY = "merged_instruments_new";

//     //  const cached2 = await redis.del(MERGED_KEY);

//     // 1️⃣ Check Redis cache

//     const cached = await redis.get(MERGED_KEY);
//     if (cached) {

//        console.log("✅ cached called");

//       res.setHeader("Content-Type", "application/json");
//       return res.status(200).send(cached);
//     }

//       console.log("✅ with out cached called");

//     // 2️⃣ If worker already running
//     if (isWorkerRunning) {
//       return res.json({
//         status: false,
//         message: "Preparing instruments... worker is already running, try again in 10-15 Minute"
//       });
//     }

//     // 3️⃣ Start worker (async fire)
//     console.log("Cache empty — starting merge worker");
//     isWorkerRunning = true;

//     startMergeWorker()   // no await here → fire and forget
//       .then(() => console.log("✔️ Merge worker completed"))
//       .catch((err) => console.error("❌ Merge worker failed:", err))
//       .finally(() => {
//         isWorkerRunning = false;
        
//       });

//     // 4️⃣ Immediate response
//     return res.json({
//       status: false,
//       message: "Preparing instruments... try again in 10-15 Minute"
//     });

//   } catch (err) {
//     console.error("❌ Controller error:", err);
//     isWorkerRunning = false;
//     return res.json({
//       status: false,
//       error: err.message,
//       message: "Preparing instruments... try again in 20-30 Minute"
//     });
//   }
// };









// const resolveMergedRedisKey = (req) => {

//   const type = String(req.query.type || "new").toLowerCase();

//   console.log(type);
  

//   if (type === "angelone") return "merged_instruments";

//   return "merged_instruments_new"; // default
// };



// export const getMergedInstrumentsCacheTTL = async (req, res) => {
//   try {
//     const MERGED_REDIS_KEY = resolveMergedRedisKey(req);

//     const nowIST = new Date().toLocaleString("en-IN", {
//       timeZone: "Asia/Kolkata",
//     });

//     const ttl = await redis.ttl(MERGED_REDIS_KEY);      // -2, -1, or seconds
//     const exists = await redis.exists(MERGED_REDIS_KEY);

//     const ttlReadable =
//       ttl > 0
//         ? `${Math.floor(ttl / 60)} min ${ttl % 60} sec`
//         : ttl === -1
//         ? "No expiry set"
//         : "Cache not found";

//     logSuccess(req, {
//       msg: "Fetched Redis cache TTL",
//       redisKey: MERGED_REDIS_KEY,
//       cacheType: req.query.type || "new",
//       timeIST: nowIST,
//       exists: Boolean(exists),
//       ttlSeconds: ttl,
//       ttlReadable,
//     });

//     return res.json({
//       status: true,
//       message: "Redis cache TTL fetched",
//       data: {
//         redisKey: MERGED_REDIS_KEY,
//         cacheType: req.query.type || "new",
//         checkedAtIST: nowIST,
//         exists: Boolean(exists),
//         ttlSeconds: ttl,
//         ttlReadable,
//       },
//     });
//   } catch (error) {
//     logError(req, error, {
//       msg: "Failed to fetch Redis cache TTL",
//       cacheType: req.query.type,
//     });

//     return res.status(500).json({
//       status: false,
//       message: "Failed to fetch Redis cache TTL",
//       error: error?.message,
//     });
//   }
// };


// export const clearMergedInstrumentsCache = async (req, res) => {
//   try {
//     const MERGED_REDIS_KEY = resolveMergedRedisKey(req);

//     const nowIST = new Date().toLocaleString("en-IN", {
//       timeZone: "Asia/Kolkata",
//     });

//     const ttlBefore = await redis.ttl(MERGED_REDIS_KEY);
//     const existedBefore = await redis.exists(MERGED_REDIS_KEY);

//     const delCount = await redis.del(MERGED_REDIS_KEY);

//     logSuccess(req, {
//       msg: "Merged instruments Redis cache deleted",
//       redisKey: MERGED_REDIS_KEY,
//       cacheType: req.query.type || "new",
//       deletedAtIST: nowIST,
//       existedBefore: Boolean(existedBefore),
//       ttlBefore,
//       deleted: delCount === 1,
//     });

//     return res.json({
//       status: true,
//       message: "Redis cache deleted successfully",
//       data: {
//         redisKey: MERGED_REDIS_KEY,
//         cacheType: req.query.type || "new",
//         deletedAtIST: nowIST,
//         existedBefore: Boolean(existedBefore),
//         ttlBefore,
//         deleted: delCount === 1,
//       },
//     });
//   } catch (error) {
//     logError(req, error, {
//       msg: "Failed to delete Redis cache",
//       cacheType: req.query.type,
//     });

//     return res.status(500).json({
//       status: false,
//       message: "Failed to delete Redis cache",
//       error: error?.message,
//     });
//   }
// };
