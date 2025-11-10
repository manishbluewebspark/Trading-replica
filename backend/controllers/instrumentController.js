
import axios from 'axios';
import Instrument from "../models/instrumentPostgreModel.js"
import sequelize from "../config/db.js"; // ✅ your Sequelize instance
import { QueryTypes } from "sequelize";

export async function ensureInstrumentTextIndexes() {
    try {

        // await sequelize.query(`DROP INDEX IF EXISTS instruments_fts_idx;`)
        
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

ensureInstrumentTextIndexes()


export const getInstrumentPostgre = async (req, res) => {

    try {

    
         const startTime = Date.now();

        //  const data = await Instrument.findAll({});

        const data = await sequelize.query(
        'SELECT "id", "token", "symbol", "name","lotsize","exch_seg","SyNum","syType" FROM "Instruments";',
        { type: QueryTypes.SELECT, raw: true }
      );

        const endTime = Date.now();

        console.log(`Query took ${endTime - startTime} milliseconds hhy`);

     return res.json({
            status: true,
            statusCode:200,
            data: data,
            message:'successfully fetch data'
        });


    } catch (error) {

        console.log(error);
        
        
         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }

   



}



// export const searchInstrumentPostgre = async (req, res) => {

//     try {

//         let query = req.params.id

//     const startTime = Date.now();

//     // 🔍 Use Full-Text Search on name + symbol + SyNum
//     const sql = `
//       SELECT *,
//         ts_rank(
//           to_tsvector('simple',
//             coalesce("name",'') || ' ' ||
//             coalesce("symbol",'') || ' ' ||
//             coalesce("SyNum",'')
//           ),
//           plainto_tsquery('simple', :query)
//         ) AS rank
//       FROM "Instruments"
//       WHERE to_tsvector('simple',
//               coalesce("name",'') || ' ' ||
//               coalesce("symbol",'') || ' ' ||
//               coalesce("SyNum",'')
//             ) @@ plainto_tsquery('simple', :query)
//       ORDER BY rank DESC, "updatedAt" DESC
//       LIMIT :limit
//     `;

//     const data = await sequelize.query(sql, {
//       replacements: { query },
//     });

//     const endTime = Date.now();
//     console.log(`🕒 Query took ${endTime - startTime} ms`);


//     console.log(data,'data search ');
    

//     return res.json({
//       status: true,
//       statusCode: 200,
//       message: "Successfully fetched data",
//       data,
//     });


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

// export const searchInstrumentPostgre = async (req, res) => {
//   try {
//     const q = (req.params.id || req.query.q || "").trim();
//     const limit = Math.min(parseInt(req.query.limit || "200", 10), 1000); // safe cap

//     if (!q) {
//       return res.status(400).json({
//         status: false,
//         statusCode: 400,
//         message: "Search query is required (use /:id or ?q=)",
//         data: null,
//       });
//     }

//     const startTime = Date.now();

//     const sql = `
//       SELECT *,
//         ts_rank(
//           to_tsvector('simple',
//             coalesce("name",'') || ' ' ||
//             coalesce("symbol",'') || ' ' ||
//             coalesce("SyNum",'')
//           ),
//           plainto_tsquery('simple', :q)
//         ) AS rank
//       FROM "Instruments"
//       WHERE to_tsvector('simple',
//               coalesce("name",'') || ' ' ||
//               coalesce("symbol",'') || ' ' ||
//               coalesce("SyNum",'')
//             ) @@ plainto_tsquery('simple', :q)
//       ORDER BY rank DESC, "updatedAt" DESC
//       LIMIT :limit
//     `;

//     const data = await sequelize.query(sql, {
//       replacements: { q, limit },        // ✅ provide both named params
//       type: QueryTypes.SELECT,           // ✅ get rows directly
//     });

//     const endTime = Date.now();
//     console.log(`🕒 Query took ${endTime - startTime} ms`);

//     return res.json({
//       status: true,
//       statusCode: 200,
//       message: "Successfully fetched data",
//       data,
//     });
//   } catch (error) {
//     console.error(error);
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
    console.log(`🕒 Query took ${endTime - startTime} ms`);

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


export const getAllInstruments = async (req, res) => {
    try {
  
        const start = Date.now();

        const response = await axios.get(
              "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
            );

    const end = Date.now();
    const duration = end - start;

    console.log(duration,'duration');
    

        let data =  response.data 

        // data = data.slice(0, 100000);

         console.log(data.length,'length');

        return res.json({
            status: true,
            statusCode:200,
            data: data,
            message:'successfully fetch data'
        });

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