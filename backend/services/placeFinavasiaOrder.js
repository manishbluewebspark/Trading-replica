import axios from "axios";
import Order from "../models/orderModel.js";

const SHOONYA_BASE_URL = process.env.SHOONYA_BASE_URL; // e.g. https://api.shoonya.com/NorenWClientTP


// 🔁 Map your generic product type → Shoonya PRD code
function getShoonyaProductCode(type) {
  if (!type) return "I"; // default to intraday

  switch (type.toUpperCase()) {
    case "DELIVERY":
    case "CNC":
      return "C";      // CNC
    case "CARRYFORWARD":
    case "NRML":
      return "M";      // NRML
    case "INTRADAY":
    case "MIS":
      return "I";      // MIS
    case "BO":
      return "B";      // Bracket
    case "CO":
      return "H";      // Cover Order
    default:
      return "I";
  }
}

// 🔁 Map your orderType → Shoonya prctyp
function mapOrderTypeToShoonya(orderType) {
  if (!orderType) return "MKT";

  switch (orderType.toUpperCase()) {
    case "MARKET":
    case "MKT":
      return "MKT";
    case "LIMIT":
    case "LMT":
      return "LMT";
    case "SL":
    case "SL-LMT":
      return "SL-LMT";
    case "SLM":
    case "SL-MKT":
      return "SL-MKT";
    default:
      return "MKT";
  }
}

export const placeFinavasiaOrder = async (user, reqInput, startOfDay, endOfDay) => {
  try {
    // ----------------------------------------
    // 1) Resolve Shoonya-specific mappings
    // ----------------------------------------
    const shoonyaProductCode = getShoonyaProductCode(reqInput.productType);
    const shoonyaOrderType = mapOrderTypeToShoonya(reqInput.orderType);
    const transactionType = (reqInput.transactiontype || "").toUpperCase(); // BUY / SELL

    // Shoonya identifiers
    const uid = user?.kite_client_id;       // 🔹 You are using this for Shoonya login
    const susertoken = user.authToken;  // 🔹 Make sure you save this after login

    if (!uid || !susertoken) {
      return {
        userId: user.id,
        broker: "Finvasia",
        result: "ERROR",
        message: "Shoonya uid or token missing. Please login Shoonya first.",
      };
    }

    // ----------------------------------------
    // 2) CREATE LOCAL PENDING ORDER
    // ----------------------------------------
    const orderData = {
      symboltoken: reqInput.kiteToken || reqInput.token,
      variety: reqInput.variety || "NORMAL", // just for local reference
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: transactionType,
      exchange: reqInput.exch_seg,           // e.g. NFO / NSE / BSE
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,     // store original product type (INTRADAY / DELIVERY etc)
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker: "finvasia",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
    };

    const newOrder = await Order.create(orderData);

    // ----------------------------------------
    // 3) BUILD SHOONYA PLACE ORDER PAYLOAD
    // ----------------------------------------
    const tsym = reqInput.symbol; // ⛔ NOTE: For Shoonya, this usually needs to be URL-encoded symbol string. Make sure your symbol is in correct format.

    const qty = Number(reqInput.quantity);
    const prc =
      shoonyaOrderType === "MKT" ? 0 : Number(reqInput.price) || 0;

    const jData = {
      uid,             // user id
      actid: uid,      // account id
      exch: reqInput.exch_seg, // "NFO"/"NSE"/"BSE"
      tsym,            // trading symbol
      qty,
      prc,             // price (0 for MKT)
      prd: shoonyaProductCode,   // C / I / M / B / H
      trantype: transactionType, // BUY / SELL
      prctyp: shoonyaOrderType,  // MKT / LMT / SL-LMT / SL-MKT
      ret: "DAY",
      remarks: "API Order",
    };

    // Shoonya expects x-www-form-urlencoded: "jKey=<susertoken>&jData=<json>"
    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    // ----------------------------------------
    // 4) PLACE ORDER IN SHOONYA
    // ----------------------------------------
    let placeRes;

    try {
      const resp = await axios.post(
        `${SHOONYA_BASE_URL}/PlaceOrder`,
        body,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      placeRes = resp.data;

      console.log("Shoonya place order response:", placeRes);

      if (!placeRes || placeRes.stat !== "Ok") {

        const msg = placeRes?.emsg || "Shoonya order placement failed";

        await newOrder.update({
          orderstatuslocaldb: "FAILED",
          status: "FAILED",
          text: msg,
          buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
        });

        return {
          userId: user.id,
          broker: "Finvasia",
          result: "BROKER_REJECTED",
          message: msg,
          raw: placeRes,
        };
      }
    } catch (err) {
      console.error("Shoonya place order error:", err?.response?.data || err);

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err.message,
        buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
      });

      return {
        userId: user.id,
        broker: "Finvasia",
        result: "BROKER_ERROR",
        message: err.message,
      };
    }

    // Shoonya order number
    const orderid = placeRes.norenordno;

    await newOrder.update({ orderid });

    // ----------------------------------------
    // 5) FETCH ORDER DETAILS FROM SHOONYA (OrderBook)
    // ----------------------------------------
    let orderDetails = null;

    try {
      const obBody = `jKey=${susertoken}&jData=${JSON.stringify({
        uid,
        actid: uid,
      })}`;

      const obResp = await axios.post(
        `${SHOONYA_BASE_URL}/OrderBook`,
        obBody,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const obData = obResp.data;

      // Typically obData is array. Filter by norenordno (Shoonya orderid)
      if (Array.isArray(obData)) {
        orderDetails = obData.find(
          (o) => String(o.norenordno) === String(orderid)
        );
      }

      console.log("Shoonya orderDetails:", orderDetails);
    } catch (e) {
      console.error("Shoonya OrderBook fetch error:", e?.response?.data || e);
      // optional, not fatal
    }

    // ----------------------------------------
    // 6) HANDLE BUY / SELL LOGIC (PAIR WITH PREVIOUS BUY)
    // ----------------------------------------
    let finalStatus = "OPEN";
    let buyOrder;

  
    // ----------------------------------------
    // 7) UPDATE LOCAL ORDER WITH BASIC DETAILS
    // ----------------------------------------
    const avgPrice =
      Number(orderDetails?.avgprc) ||
      0;

    const filledQty =
      Number(orderDetails?.qty) || Number(reqInput.quantity) || 0;

    await newOrder.update({
      uniqueorderid: orderDetails?.exchordid || null,
      averageprice: avgPrice,
      lotsize: filledQty,
      symboltoken: reqInput.kiteToken || reqInput.token,
      price: avgPrice,
      orderstatuslocaldb: finalStatus,
      status: orderDetails?.status.toUpperCase(),
    });

    // ----------------------------------------
    // 8) FETCH TRADEBOOK FOR MORE DETAILS (PnL etc.)
    // ----------------------------------------
    try {
      const tbBody = `jKey=${susertoken}&jData=${JSON.stringify({
        uid,
        actid: uid,
      })}`;

      const tbResp = await axios.post(
        `${SHOONYA_BASE_URL}/TradeBook`,
        tbBody,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const tradeBook = tbResp.data;
      console.log("Shoonya TradeBook:", tradeBook);

      let t = null;
      if (Array.isArray(tradeBook)) {
        t = tradeBook.find(
          (tr) => String(tr.norenordno) === String(orderid)
        );
      }

      if (t) {
        // Shoonya trade fields (typical names, adjust if different)
        const tradePrice =
          Number(t.flprc) ||
          avgPrice;
        const tradeQty =
          Number(t.trdq) || Number(t.qty) || Number(reqInput.quantity) || 0;

        const buyPrice = buyOrder?.fillprice || 0;
        const buySize = buyOrder?.fillsize || 0;
        const buyValue = buyOrder?.tradedValue || 0;
        let buyTime = buyOrder?.filltime || "NA";

        // Calculate PnL
        let pnl = tradeQty * tradePrice - buyPrice * buySize;

        if (transactionType === "BUY") {
          pnl = 0;
          buyTime = "NA";
        }

        const fillTime =
          t.fltm ||
          orderDetails?.norentm 

        const updateObj2 = await newOrder.update({
          tradedValue: tradePrice * tradeQty,
          fillprice: tradePrice,
          fillsize: tradeQty,
          fillid: t.flid ,
          price: tradePrice,
          filltime: fillTime,
          status: "COMPLETE",
          pnl,
          buyTime,
          buyprice: buyPrice,
          buysize: buySize,
          buyvalue: buyValue,
        });

        console.log("Shoonya local DB trade update:", updateObj2);
      } else {
        console.log("No specific trade entry found for Shoonya order", orderid);
      }
    } catch (e) {
      console.error("Shoonya TradeBook fetch error:", e?.response?.data || e);
    }

    // ----------------------------------------
    // 9) RETURN RESULT
    // ----------------------------------------
    return {
      userId: user.id,
      broker: "Finvasia",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    console.error("Finvasia Order Error:", err);
    return {
      userId: user.id,
      broker: "Finvasia",
      result: "ERROR",
      message: err.message,
    };
  }
};


export const placeFinavasiaOrderLocalDb = async (user, reqInput, startOfDay, endOfDay) => {
  try {
    // ----------------------------------------
    // 1) Resolve Shoonya credentials
    // ----------------------------------------
    const uid = user.kite_client_id;          // you are using this for Shoonya login
    const susertoken = user.authToken;    // 🔴 change according to your column name

    if (!uid || !susertoken) {
      return {
        userId: user.id,
        broker: "finvasia",
        result: "ERROR",
        message: "Shoonya uid or token missing. Please login Finvasia first.",
      };
    }

    // ----------------------------------------
    // 2) CREATE LOCAL PENDING ORDER
    // ----------------------------------------
    const orderData = {
      symboltoken: reqInput.kiteToken || reqInput.token,
      variety: reqInput.variety || "NORMAL", // for your info only
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: reqInput.transactiontype,       // BUY / SELL
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker: "finvasia",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
      buyOrderId: reqInput?.buyOrderId,
    };

    console.log(orderData, "Finvasia orderData");

    const newOrder = await Order.create(orderData);

    // ----------------------------------------
    // 3) SHOONYA PLACE ORDER PAYLOAD
    // ----------------------------------------
    const prd = getShoonyaProductCode(reqInput.productType);
    const prctyp = mapOrderTypeToShoonya(reqInput.orderType);
    const trantype = (reqInput.transactiontype || "").toUpperCase(); // BUY / SELL

    // ⚠️ sometimes tsym must be URL encoded, uncomment if needed:
    // const tsym = encodeURIComponent(reqInput.symbol);
    const tsym = reqInput.symbol;

    const qty = Number(reqInput.quantity);
    const priceNum = Number(reqInput.price) || 0;
    const prc = prctyp === "MKT" ? 0 : priceNum;

    const jData = {
      uid,            // user id
      actid: uid,     // account id
      exch: reqInput.exch_seg, // NFO / NSE / BSE
      tsym,           // trading symbol
      qty,
      prc,
      prd,            // C / M / I / B / H
      trantype,       // BUY / SELL
      prctyp,         // MKT / LMT / SL-LMT / SL-MKT
      ret: "DAY",
      remarks: "API Order",
    };

    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    console.log("Shoonya PlaceOrder jData:", jData);

    // ----------------------------------------
    // 4) PLACE ORDER IN SHOONYA
    // ----------------------------------------
    let placeRes;
    try {
      const resp = await axios.post(
        `${SHOONYA_BASE_URL}/PlaceOrder`,
        body,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      placeRes = resp.data;
      console.log("Shoonya place order response:", placeRes);

      if (!placeRes || placeRes.stat !== "Ok") {
        const msg = placeRes?.emsg || "Shoonya order placement failed";

        await newOrder.update({
          orderstatuslocaldb: "FAILED",
          status: "FAILED",
          text: msg,
          buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
        });

        return {
          userId: user.id,
          broker: "finvasia",
          result: "BROKER_REJECTED",
          message: msg,
          raw: placeRes,
        };
      }
    } catch (err) {
      console.log(err?.response?.data || err, "Shoonya place order error");

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err.message,
        buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
      });

      return {
        userId: user.id,
        broker: "finvasia",
        result: "BROKER_ERROR",
        message: err.message,
      };
    }

    const orderid = placeRes.norenordno; // 🔹 Shoonya order id

    await newOrder.update({ orderid });

    // ----------------------------------------
    // 5) FETCH ORDER DETAILS (ORDERBOOK)
    // ----------------------------------------
    let detailsData = {};
    try {
      const obBody = `jKey=${susertoken}&jData=${JSON.stringify({
        uid,
        actid: uid,
      })}`;

      const obResp = await axios.post(
        `${SHOONYA_BASE_URL}/OrderBook`,
        obBody,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const obData = obResp.data;
      console.log("Shoonya OrderBook:", obData);

      if (Array.isArray(obData)) {
        detailsData = obData.find(
          (o) => String(o.norenordno) === String(orderid)
        ) || {};
      }
    } catch (e) {
      console.log(e?.response?.data || e, "Shoonya OrderBook error");
    }

    // Shoonya common fields (check actual response once and adjust)
    const avgPrice =
      Number(detailsData.avgprc)
    const filledQty =
      Number(detailsData.qty) || qty;

    // ----------------------------------------
    // 6) HANDLE BUY / SELL LOGIC (pair with local BUY)
    // ----------------------------------------
    let finalStatus = "OPEN";
    let buyOrder;

    if (trantype === "SELL") {
      // match by buyOrderId (like you did for Kite)
      if (reqInput?.buyOrderId) {
        buyOrder = await Order.findOne({
          where: {
            userId: user.id,
            status: "COMPLETE",
            orderstatuslocaldb: "OPEN",
            orderid: String(reqInput.buyOrderId),
          },
          raw: true,
        });

        if (buyOrder) {
          await Order.update(
            { orderstatuslocaldb: "COMPLETE" },
            { where: { orderid: reqInput.buyOrderId } }
          );
        }
      }

      finalStatus = "COMPLETE";
    }

    // ----------------------------------------
    // 7) BASIC LOCAL ORDER UPDATE
    // ----------------------------------------
    await newOrder.update({
      uniqueorderid: detailsData.exchordid || null, // or detailsData.exch_ord_id if different
      averageprice: avgPrice,
      lotsize: filledQty,
      symboltoken: reqInput.kiteToken || reqInput.token,
      triggerprice: Number(detailsData.trgprc) || 0,
      price: avgPrice,
      orderstatuslocaldb: finalStatus,
      status: detailsData.status || finalStatus,
    });

    // ----------------------------------------
    // 8) FETCH TRADEBOOK FOR PnL / filltime
    // ----------------------------------------
    try {
      const tbBody = `jKey=${susertoken}&jData=${JSON.stringify({
        uid,
        actid: uid,
      })}`;

      const tbResp = await axios.post(
        `${SHOONYA_BASE_URL}/TradeBook`,
        tbBody,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const tradeBook = tbResp.data;
      console.log("Shoonya TradeBook:", tradeBook);

      let t = null;
      if (Array.isArray(tradeBook)) {
        t = tradeBook.find(
          (tr) => String(tr.norenordno) === String(orderid)
        );
      }

      if (t) {
        // ⚠️ Adjust these keys according to real Shoonya tradebook response (once you log it)
        const tradePrice = Number(t.flprc) 
         
        const tradeQty = Number(t.qty) 
        
        const buyPrice = buyOrder?.fillprice || 0;
        const buySize = buyOrder?.fillsize || 0;
        const buyValue = buyOrder?.tradedValue || 0;
        let buyTime = buyOrder?.filltime || "NA";

        let pnl = tradeQty * tradePrice - buyPrice * buySize;

        if (trantype === "BUY") {
          pnl = 0;
          buyTime = "NA";
        }

        const fillTime =
          t.trdtime || t.trd_tm || detailsData.norentm || new Date().toISOString();

        await newOrder.update({
          tradedValue: tradePrice * tradeQty,
          fillprice: tradePrice,
          fillsize: tradeQty,
          fillid: t.tradeid || t.uid || null,
          filltime: fillTime,
          status: "COMPLETE",
          pnl,
          buyTime,
          buyprice: buyPrice,
          buysize: buySize,
          buyvalue: buyValue,
        });
      } else {
        console.log("No tradebook row found for Shoonya order", orderid);
      }
    } catch (e) {
      console.log(e?.response?.data || e, "Shoonya TradeBook error");
    }

    // ----------------------------------------
    // 9) RETURN RESULT
    // ----------------------------------------
    return {
      userId: user.id,
      broker: "finvasia",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    console.log(err, "Finvasia local DB order error");
    return {
      userId: user.id,
      broker: "finvasia",
      result: "ERROR",
      message: err.message,
    };
  }
};