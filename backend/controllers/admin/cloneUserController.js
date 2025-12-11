// controllers/userController.js


import User from "../../models/userModel.js";
import Order from "../../models/orderModel.js";
import { encrypt,decrypt } from "../../utils/passwordUtils.js";
import { generateRandomNumbers } from "../../utils/randomWords.js";
import ExcelJS from "exceljs";
import sequelize from "../../config/db.js";
import BrokerModel from "../../models/borkerModel.js"
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";





dayjs.extend(utc);
dayjs.extend(timezone);

// Helper to convert "01 December 2025 at 12:23 pm" (IST) → JS Date (UTC)
const parseISTToDate = (val) => {
  if (!val) return null;

  // If Excel already gave a Date object, just use it
  if (val instanceof Date) {
    return val;
  }

  const str = String(val).trim();
  if (!str) return null;

  const d = dayjs.tz(str, "DD MMMM YYYY [at] hh:mm a", "Asia/Kolkata");
  return d.isValid() ? d.toDate() : null;
};


export const getCloneAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: "clone-user" },
      order: [["id", "DESC"]],
      raw: true, // plain objects
    });

    if (!users.length) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "No clone users found",
        data: [],
      });
    }

    // 🔹 IMPORTANT: async map + Promise.all
    const results = await Promise.all(
      users.map(async (user) => {
        console.log(user.firstName);

        const encrypted = user.password;
        console.log("Encrypted:", encrypted, "Secret:", process.env.CRYPTO_SECRET);

        // अगर decrypt sync है तो 'await' ज़रूरी नहीं है, लेकिन रहने दो तो भी चलेगा
        const plainPassword = await decrypt(encrypted, process.env.CRYPTO_SECRET);

        console.log("Decrypted:", plainPassword);

        return {
          ...user,          // पूरा user object
          password: plainPassword, // decrypted password से replace
        };
      })
    );

    return res.json({
      status: true,
      message: "Users fetched successfully",
      data: results, // यहाँ अब normal array of objects जाएगा, Promise नहीं
    });
  } catch (err) {
    console.error("getCloneAllUsers error:", err);
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching users",
      error: err.message,
    });
  }
};


/**
 * POST /admin/users
 * Create single user (for Create User modal)
 */

async function generateUniqueUsername() {
  let username;
  let isUnique = false;

  while (!isUnique) {
    username = await generateRandomNumbers(5); // e.g., "48371"

    const existingUser = await User.findOne({
      where: { username: username },
    });

    if (!existingUser) {
      isUnique = true; // ✅ unique username found
    }
  }

  return username;
}

export const createCloneUser = async (req, res) => {
  try {

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      brokerName
    } = req.body;

    console.log(req.body);
    

    if (!email || !phoneNumber) {
      return res.status(400).json({
        status: false,
        message: "Email and Username are required",
      });
    }


    const existing = await User.findOne({ where: { email,phoneNumber } });

    if (existing) {

      return res.status(400).json({
        status: false,
        message: "Email already exists",
      });
    }

     // ✅ Validate password strength
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7,}$/;

      if (!passwordRegex.test(password)) {
        return res.json({
          status: false,
          statusCode: 400,
          message:
            "Password must be at least 7 characters long and contain uppercase, lowercase, number, and special character",
        });
      }

    const username = await generateUniqueUsername();

    const hashedPassword = await encrypt(password, process.env.CRYPTO_SECRET);

         const brokerData = await BrokerModel.findOne({
          where: { brokerName: brokerName.toLowerCase() },
          raw: true,
        });

    if (!brokerData) {
          return res.json({
            status: false,
            message: "Invalid broker selected",
          });
        }

    const brokerLink = brokerData.brokerLink;
    
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password:hashedPassword,
      username,
      phoneNumber,
      role:  "clone-user",
      isChecked: true,
      brokerName:brokerName,
      brokerImageLink:brokerLink,
      strategyName:"",
      strategyDis:"",
      packageName:"",
      packageDis:"",
    });

    return res.json({
      status: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (err) {
    console.error("createUser error:", err);
    return res.status(500).json({
      status: false,
      message: "Something went wrong while creating user",
    });
  }
};

export const deleteCloneUser = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "User ID is required",
      });
    }

    // Find user
    const user = await User.findOne({
      where: { id, role: "clone-user" },
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Clone user not found",
      });
    }

    // Delete User
    await User.destroy({ where: { id } });

    return res.json({
      status: true,
      message: "Clone user deleted successfully",
    });

  } catch (error) {
    console.error("deleteCloneUser error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong while deleting user",
    });
  }
};

export const updateCloneUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "User ID is required",
      });
    }

    // Check user exists & must be clone-user
    const user = await User.findOne({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Clone user not found",
      });
    }

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      strategyName,
      strategyDis,
      packageName,
      packageDis,
      packageDate,
      brokerName,
      brokerImageLink,
      DematFund
    } = req.body;

    // 🔥 Check duplicate email for others
    if (email) {
      const emailExists = await User.findOne({
        where: { email },
      });

      if (emailExists && emailExists.id !== Number(id)) {
        return res.status(400).json({
          status: false,
          message: "Email already exists",
        });
      }
    }

    // 🔥 Check duplicate phone number
    if (phoneNumber) {
      const phoneExists = await User.findOne({
        where: { phoneNumber },
      });

      if (phoneExists && phoneExists.id !== Number(id)) {
        return res.status(400).json({
          status: false,
          message: "Phone number already exists",
        });
      }
    }

    // 🔐 Update password if provided
    let updatedPassword = user.password;
    if (password) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7,}$/;

      if (!passwordRegex.test(password)) {
        return res.json({
          status: false,
          statusCode: 400,
          message:
            "Password must be at least 7 characters long & contain uppercase, lowercase, number, and special character",
        });
      }

      updatedPassword = await encrypt(password, process.env.CRYPTO_SECRET);
    }

    // 🎯 Final Update
    const updated = await user.update({
      firstName: firstName ?? user.firstName,
      lastName: lastName ?? user.lastName,
      email: email ?? user.email,
      phoneNumber: phoneNumber ?? user.phoneNumber,
      password: updatedPassword,
      strategyName: strategyName ?? user.strategyName,
      strategyDis: strategyDis ?? user.strategyDis,
      packageName: packageName ?? user.packageName,
      packageDis: packageDis ?? user.packageDis,
      packageDate: packageDate ?? user.packageDate,
      brokerName: brokerName ?? user.brokerName,
      brokerImageLink: brokerImageLink ?? user.brokerImageLink,
      DematFund:DematFund??DematFund
    });

    return res.json({
      status: true,
      message: "Clone user updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateCloneUser error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong while updating the user",
      error: error.message,
    });
  }
};

// 15 digit order ID
function generateOrderId() {
  return Date.now().toString() + Math.floor(1000 + Math.random() * 9000);
}

// UUID v4
function generateUniqueOrderUUID() {
  return uuidv4();
}

// 7 digit fill ID
function generateFillId() {
  return Math.floor(1000000 + Math.random() * 9000000);
}

// export const uploadOrderExcel = async (req, res) => {

//   const t = await sequelize.transaction();

//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         status: false,
//         message: "No file uploaded",
//       });
//     }

//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.readFile(req.file.path);

//     const worksheet = workbook.worksheets[0];

//     const jsonData = [];

//     worksheet.eachRow((row, rowNumber) => {

//       if (rowNumber === 1) return; // skip header

//       let rowObj = {};

//       row.eachCell((cell, colNumber) => {

//         const header = worksheet.getRow(1).getCell(colNumber).value;

//         const headerText =
//           typeof header === "object" && header?.richText
//             ? header.richText.map((r) => r.text).join("")
//             : header;

//         rowObj[headerText] = cell.value;
//       });

//       jsonData.push(rowObj);
//     });

//     // remove empty rows
//     const rowsToInsert = jsonData.filter((row) =>
//       Object.values(row).some((v) => v !== null && v !== "" && v !== undefined)
//     );

//     if (!rowsToInsert.length) {
//       return res.status(400).json({
//         status: false,
//         message: "Excel file is empty or invalid",
//       });
//     }

//     // -----------------------------------------
//     // ADD UNIQUE KEYS TO EACH ROW
//     // -----------------------------------------
//     rowsToInsert.forEach((row) => {
//       row.orderid = generateOrderId(); // 15 digit unique id
//       row.uniqueorderid = generateUniqueOrderUUID(); // uuid
//       row.fillid = generateFillId(); // numeric 7 digit code
//     });

//     const createdOrders = await Order.bulkCreate(rowsToInsert, {
//       transaction: t,
//       validate: true,
//     });

//     await t.commit();

//     return res.json({
//       status: true,
//       message: "Orders imported & processed successfully",
//       insertedCount: createdOrders.length,
//     });
//   } catch (err) {
//     console.error("uploadOrderExcel error:", err);
//     await t.rollback();

//     return res.status(500).json({
//       status: false,
//       message: "Error processing Excel",
//       error: err.message,
//     });
//   }
// };


// export const uploadOrderExcel = async (req, res) => {

//   const t = await sequelize.transaction(); // ✅ transaction for safety

//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         status: false,
//         message: "No file uploaded",
//       });
//     }

//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.readFile(req.file.path);

//     const worksheet = workbook.worksheets[0]; // first sheet

//     const jsonData = [];

//     worksheet.eachRow((row, rowNumber) => {
//       if (rowNumber === 1) return; // skip header

//       let rowObj = {};
//       row.eachCell((cell, colNumber) => {

//         const header = worksheet.getRow(1).getCell(colNumber).value;

//         // ExcelJS sometimes returns { richText: [...] }
//         const headerText =
//           typeof header === "object" && header?.richText
//             ? header.richText.map((r) => r.text).join("")
//             : header;

//         rowObj[headerText] = cell.value;
//       });

//       jsonData.push(rowObj);
//     });

//     // 🔍 Remove completely empty rows
//     const rowsToInsert = jsonData.filter((row) =>
//       Object.values(row).some((v) => v !== null && v !== "" && v !== undefined)
//     );


//      // Generate IDs
//     let orderId = generateOrderId();
//     let uniqueorderid = generateUniqueOrderUUID();
//     let fillid = generateFillId();


//     if (!rowsToInsert.length) {
//       return res.status(400).json({
//         status: false,
//         message: "Excel file is empty or has no valid rows",
//       });
//     }

//     // 🚀 BULK INSERT
//     const createdOrders = await Order.bulkCreate(rowsToInsert, {
//       transaction: t,
//       validate: true,        // runs model validations
//       // ignoreDuplicates: true, // optional if you have unique index and want to skip duplicates
//     });

//     await t.commit();

//     return res.json({
//       status: true,
//       message: "Orders imported successfully",
//       insertedCount: createdOrders.length,
//       sampleRow: createdOrders[0], // optional
//     });
//   } catch (err) {

//     console.error("uploadOrderExcel error:", err);
//     await t.rollback();

//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong while processing Excel",
//       error: err.message,
//     });
//   }
// };


export const uploadOrderExcel1 = async (req, res) => {

  const t = await sequelize.transaction();

  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
      });
    }

    const headerMap = {
      "Username": "userId",
      "SignalType": "transactiontype",
      "Exchange": "exchange",
      "Instrument": "instrumenttype",
      "OrderID": "orderid",
      "Symbol": "tradingsymbol",
      "OrderType": "ordertype",
      "ProductType": "producttype",
      "Buy Price": "buyprice",
      "Sell Price": "price",
      "Sell Price": "fillprice",
      "PnL": "pnl",
      "OrderQty": "quantity",
      "TradedQty": "fillsize",
      "Status": "status",
      "Message": "text",
      "Buy Time": "buyTime",
      "Sell Time": "filltime",
    };

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const worksheet = workbook.worksheets[0];

    const jsonData = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      let rowObj = {};

      row.eachCell((cell, colNumber) => {

        let excelHeader = worksheet.getRow(1).getCell(colNumber).value;
        let headerText = typeof excelHeader === "object" && excelHeader?.richText
          ? excelHeader.richText.map(r => r.text).join("")
          : excelHeader;

        const dbField = headerMap[headerText];

        if (dbField) {
          rowObj[dbField] = cell.value;
        }
      });


              // // 🌟 FIX: convert dates INSIDE rowObj
              // if (rowObj.createdAt) {
              //   const d = dayjs(rowObj.createdAt, "DD MMMM YYYY [at] hh:mm a");
              //   rowObj.createdAt = d.isValid() ? d.toDate() : null;
              // }

              // if (rowObj.updatedAt) {
              //   const d = dayjs(rowObj.updatedAt, "DD MMMM YYYY [at] hh:mm a");
              //   rowObj.updatedAt = d.isValid() ? d.toDate() : null;
              // }

              // ✅ NEW: Buy Time / Sell Time from Excel
              if (rowObj.buyTime) {
                rowObj.buyTime = parseISTToDate(rowObj.buyTime);
              }

              if (rowObj.filltime) {
                rowObj.filltime = parseISTToDate(rowObj.filltime);
              }

           jsonData.push(rowObj);
    });

    const rowsToInsert = jsonData.filter(row =>
      Object.values(row).some(v => v !== null && v !== "" && v !== undefined)
    );

    rowsToInsert.forEach(row => {
    
      
      row.orderid = generateOrderId();
      row.uniqueorderid = generateUniqueOrderUUID();
      row.fillid = generateFillId();
    });

  
    

    const createdOrders = await Order.bulkCreate(rowsToInsert, {
      transaction: t,
      validate: true,
    });

    await t.commit();

    return res.json({
      status: true,
      message: "Orders imported successfully",
      insertedCount: createdOrders.length,
    });

  } catch (err) {
    console.error("uploadOrderExcel error:", err.message);
    await t.rollback();

    return res.status(500).json({
      status: false,
      message: "Error processing Excel",
      error: err.message,
    });
  }
};

export const uploadOrderExcel= async (req, res) => {
 
  const t = await sequelize.transaction();

  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
      });
    }

    // Map Excel headers → temporary row fields
    const headerMap = {
      "UserId": "username",           // ⬅️ IMPORTANT: store username, we'll resolve to userId later
      "SignalType": "transactiontype",
      "Exchange": "exchange",
      "Instrument": "instrumenttype",
      "OrderID": "orderid",             // can be ignored / overwritten later
      "Symbol": "tradingsymbol",
      "OrderType": "ordertype",
      "ProductType": "producttype",
      "Buy Price": "buyprice",
      "Sell Price": "price",          // NOTE: you had "Sell Price" twice; only last will win
      // "Sell Price": "fillprice",   // <- if you need separate, Excel header must be different
      "PnL": "pnl",
      "OrderQty": "quantity",
      "TradedQty": "fillsize",
      "Status": "status",
      "Message": "text",
      "Buy Time": "buyTime",
      "Sell Time": "filltime",
    };

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    const worksheet = workbook.worksheets[0];
    const jsonData = [];

    worksheet.eachRow((row, rowNumber) => {
     
      // Skip header row
      if (rowNumber === 1) return;

      const rowObj = {};

       

      row.eachCell((cell, colNumber) => {
        const excelHeader = worksheet.getRow(1).getCell(colNumber).value;

        const headerText =
          typeof excelHeader === "object" && excelHeader?.richText
            ? excelHeader.richText.map((r) => r.text).join("")
            : excelHeader;

        const dbField = headerMap[headerText];

           

        if (dbField) {
          rowObj[dbField] = cell.value;
        }
      });



      if (rowObj.buyTime) {
        rowObj.buyTime = String(parseISTToDate(rowObj.buyTime));
      }
      if (rowObj.filltime) {
        rowObj.filltime = String(parseISTToDate(rowObj.filltime));
      }

      jsonData.push(rowObj);
    });

     console.log(jsonData,'excel file upload');


    // Remove completely empty rows
    const rowsToInsert = jsonData.filter((row) =>
      Object.values(row).some(
        (v) => v !== null && v !== "" && v !== undefined
      )
    );

    // 🔹 1) Collect unique usernames from Excel
    const usernames = [
      ...new Set(
        rowsToInsert
          .map((row) => (row.username || "").toString().trim())
          .filter((u) => u)
      ),
    ];

    if (usernames.length === 0) {
      await t.rollback();
      return res.status(400).json({
        status: false,
        message: "No usernames found in Excel",
      });
    }

    // 🔹 2) Fetch all users for those usernames in one query
    const users = await User.findAll({
      where: { username: { [Op.in]: usernames } },
      attributes: ["id", "username"],
      transaction: t,
      raw:true
    });

       

    const userMap = new Map();
    users.forEach((u) => {
      userMap.set(u.username, u.id);
    });

    // 🔹 3) Map username → userId in each row
    for (const row of rowsToInsert) {
      const uname = (row.username || "").toString().trim();
      if (!uname) continue;

      const userId = userMap.get(uname);

      if (!userId) {
        await t.rollback();
        return res.status(400).json({
          status: false,
          message: `User not found for username: ${uname}`,
        });
      }

      row.userId = userId;

      // If Order model doesn't have "username" column, remove it
      // delete row.username;
    }

    // 🔹 4) Generate order ids / unique ids / fill ids
    rowsToInsert.forEach((row) => {
      // row.orderid = generateOrderId();
      row.orderid =row.orderid;
      row.uniqueorderid = generateUniqueOrderUUID();
      row.fillid = generateFillId();
      row.userNameId = row.username
       row.variety = 'NORMAL'
       row.duration = 'DAY'
        row.lotsize =  row.fillsize
       row.status =  'COMPLETE'
      row.orderstatus =  'COMPLETE'
      row.orderstatuslocaldb =  'COMPLETE'
      row.tradedValue =   row.fillsize*row.price
       row.buyvalue =   row.fillsize*row.buyprice
       row.ordertag =   'dummyorder'
       row.fillprice = row.price

    });

    console.log(rowsToInsert,'rowsToInsert');
    

    // 🔹 5) Bulk insert orders
    const createdOrders = await Order.bulkCreate(rowsToInsert, {
      transaction: t,
      validate: true,
    });

    await t.commit();

    return res.json({
      status: true,
      message: "Orders imported successfully",
      insertedCount: createdOrders.length,
    });
  } catch (err) {



    console.log(err);
    

    await t.rollback();

    return res.status(500).json({
      status: false,
      message: "Error processing Excel",
      error: err.message,
    });
  }
};


export const loginCloneUserDemat = async (req, res) => {
  try {

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Login successfully",
      error: null,
    });

  } catch (error) {

    console.error("loginCloneUserDemat error:", error);
    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: "Something went wrong while logging in",
      error: error.message,
    });
  }
};



export const getCloneUserFund = async (req, res) => {
  try {
   

    // 1️⃣ Get user from DB
    const user = await User.findOne({
      where: { id: req.userId },
      raw: true,
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        error: null,
      });
    }

    // 2️⃣ Access DematFund (decimal always comes as STRING in Sequelize)
    const fund = parseFloat(user.DematFund || 0);


        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

             // 🔁 Since filltime is VARCHAR with ISO UTC string -> compare with ISO strings
    const startISO = startOfDay.toISOString(); // e.g. "2025-12-03T18:30:00.000Z"
    const endISO = endOfDay.toISOString();



        const todayOrders = await Order.findAll({
          where: {
            userId: req.userId,
            filltime: {
              [Op.between]: [startISO, endISO]
            }
          },
          raw: true,
        });
    

    // 3️⃣ Send response
    return res.status(200).json({
      status: true,
      message: "Fund fetched successfully",
      totalOrders:todayOrders,
      data: {
    availablecash: fund
  },
      error: null,
    });

  } catch (error) {
    console.error("getCloneUserFund error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching the user fund",
      error: error.message,
    });
  }
};





export const getCloneUserTrade1 = async (req, res) => {
  try {

    let pnlValues = 0

    const userId = req.userId; // ensure middleware sets this

     const startOfDay = new Date();
     startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1️⃣ Fetch all completed trades for this clone user
    const trades = await Order.findAll({
      where: {
        userId: userId,
        createdAt: { [Op.between]: [startOfDay, endOfDay] },
      },
      raw: true,
    });


    console.log(trades[0],'trades');
    

    if (!trades || trades.length === 0) {
      return res.status(200).json({
        status: true,
        message: "No trades found",
        data: [],
        pnl: 0,
        totalTraded: 0,
        totalOpen: 0,
        error: null,
      });
    }

    // Helper for money rounding
    const toMoney = n => Math.round(n * 100) / 100;


    // 2️⃣ CALCULATE PNL (same logic as your AngelOne API)
    const grouped = {};

    for (const t of trades) {
      if (!grouped[t.tradingsymbol]) grouped[t.tradingsymbol] = [];
      grouped[t.tradingsymbol].push(t);
      pnlValues = t.pnl+pnlValues
    }

    const pnlData = [];
    let totalBuy = 0;
    let totalSell = 0;
    let totalBuyLength = 0;

    for (const [symbol, list] of Object.entries(grouped)) {

      const buys = list.filter(o => o.transactiontype === "BUY");
      const sells = list.filter(o => o.transactiontype === "SELL");

      let totalBuyQty = 0, totalBuyValue = 0;
      buys.forEach(b => {
        totalBuyQty += Number(b.fillsize);
        totalBuyValue += b.fillsize * b.fillprice;
        totalBuyLength++;
      });

      let totalSellQty = 0, totalSellValue = 0;
      sells.forEach(s => {
        totalSellQty += Number(s.fillsize);
        totalSellValue += s.fillsize * s.fillprice;
      });

      if (totalBuyQty > 0) totalBuy += totalBuyValue;
      if (totalSellQty > 0) totalSell += totalSellValue;

      // Only calculate pnl if both exist
      if (totalBuyQty > 0 && totalSellQty > 0) {
        const matchedQty = Math.min(totalBuyQty, totalSellQty);
        const buyAvg = totalBuyValue / totalBuyQty;
        const sellAvg = totalSellValue / totalSellQty;
        const pnl = (sellAvg - buyAvg) * matchedQty;

        pnlData.push({
          label: symbol,
          win: toMoney(buyAvg),
          loss: toMoney(sellAvg),
          quantity: matchedQty,
          pnl: toMoney(pnl),
        });
      }
    }

    // 3️⃣ Count OPEN Orders
    const openCount = await Order.count({
      where: {
         userId: userId,
        orderstatuslocaldb: "OPEN",
         createdAt: { [Op.between]: [startOfDay, endOfDay] },
      }
    });


    console.log(totalSell,'sell' , totalBuy,'clone user pnl ');

    // 4️⃣ Final response (same as AngelOne response)
    return res.status(200).json({
      status: true,
      statusCode: 203,
      message: "Getting clone-user trade data",
      data: pnlData,
      // pnl: toMoney(totalSell - totalBuy),
       pnl: pnlValues,
      totalTraded: totalBuyLength,
      totalOpen: openCount,
      error: null,
    });

  } catch (error) {
    console.error("getCloneUserTrade error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching clone user trade data",
      error: error.message,
    });
  }
};

export const getCloneUserTrade = async (req, res) => {
  try {
    let pnlValues = 0;

    const userId = req.userId; // from auth middleware

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

     // 🔁 Since filltime is VARCHAR with ISO UTC string -> compare with ISO strings
    const startISO = startOfDay.toISOString(); // e.g. "2025-12-03T18:30:00.000Z"
    const endISO = endOfDay.toISOString();

    const trades = await Order.findAll({
      where: {
        userId,
        transactiontype:"SELL",
        filltime: { [Op.between]: [startISO, endISO] },
      },
      raw: true,
    });

    console.log(trades[0], "trades");

    if (!trades || trades.length === 0) {
      return res.status(200).json({
        status: true,
        message: "No trades found",
        data: [],
        pnl: 0,
        totalTraded: 0,
        totalOpen: 0,
        error: null,
      });
    }

    const toMoney = (n) => Math.round(n * 100) / 100;

    // Group by symbol (each row is a completed trade with Buy & Sell price)
    const grouped = {};

    for (const t of trades) {
      const symbol = t.tradingsymbol || "UNKNOWN";
      if (!grouped[symbol]) {
        grouped[symbol] = {
          symbol,
          totalQty: 0,
          totalBuyValue: 0,
          totalSellValue: 0,
          totalPnl: 0,
          tradesCount: 0,
        };
      }

      const g = grouped[symbol];

      const qty = Number(t.fillsize || t.quantity || 0);
      const buyPrice = t.buyprice != null ? Number(t.buyprice) : null;
      const sellPrice = t.fillprice != null ? Number(t.fillprice) : null;
      const rowPnl = t.pnl != null ? Number(t.pnl) : 0;

      if (qty > 0) g.totalQty += qty;
      if (qty > 0 && buyPrice != null && !isNaN(buyPrice)) {
        g.totalBuyValue += buyPrice * qty;
      }
      if (qty > 0 && sellPrice != null && !isNaN(sellPrice)) {
        g.totalSellValue += sellPrice * qty;
      }

      g.totalPnl += rowPnl;
      g.tradesCount += 1;

      pnlValues += rowPnl; // total PnL across all symbols
    }

    const pnlData = Object.values(grouped).map((g) => {
      const avgBuy =
        g.totalQty > 0 ? g.totalBuyValue / g.totalQty : 0;
      const avgSell =
        g.totalQty > 0 ? g.totalSellValue / g.totalQty : 0;

      return {
        label: g.symbol,
        win: toMoney(avgSell), // avg sell price
        loss: toMoney(avgBuy), // avg buy price
        quantity: g.totalQty,
        pnl: toMoney(g.totalPnl),
        tradesCount: g.tradesCount,
      };
    });

    // OPEN count (if you ever mark some as OPEN in excel / DB)
    const openCount = await Order.count({
      where: {
        userId,
        orderstatuslocaldb: "OPEN",
        filltime: { [Op.between]: [startISO, endISO] },
      },
    });

    const totalTraded = trades.length; // number of completed trades / rows

    console.log("Clone user totals → pnl:", pnlData);

    return res.status(200).json({
      status: true,
      statusCode: 203,
      message: "Getting clone-user trade data",
      data: pnlData,
      pnl: toMoney(pnlValues),   // ✅ sum of PnL column
      totalTraded,               // number of rows
      totalOpen: openCount,
      error: null,
    });
  } catch (error) {
    console.error("getCloneUserTrade error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching clone user trade data",
      error: error.message,
    });
  }
};

