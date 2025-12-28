

import cron from "node-cron";
import { getActiveOcoGroups } from "../services/ocoService.js";
import { cancelOrderOCO } from "../services/ocoServiceCancelOders.js";
import { markOcoCompleted } from "../services/ocoUpdateService.js";
import { isCompleted } from "../utils/ocoIsCompleted.js";
import { fetchOrderBookOCO } from "../services/ocoServiceFetchOders.js";
import { logSuccess, logError } from "../utils/loggerr.js";
import Order from "../models/orderModel.js"; // your table

const safeErr = (e) => ({
  message: e?.message,
  status: e?.response?.status,
  data: e?.response?.data,
});


async function ocoWatcher() {
  // ✅ entry
  logSuccess(null, { msg: "ocoWatcher started" });

  try {

    logSuccess(null, { msg: "Fetching active OCO groups" });

    const activeOcos = await getActiveOcoGroups();

    logSuccess(null, {
      msg: "Active OCO groups fetched",
      count: Array.isArray(activeOcos) ? activeOcos.length : 0,
    });

    for (const oco of activeOcos) {

      logSuccess(null, {
        msg: "ocoWatcher Loop Inner start",
        ocoId: oco?.ocoId,
        userId: oco?.userId,
        broker: oco?.broker,
        buyOrderId: oco?.buyOrderId,
        targetOrderId: oco?.targetOrderId,
        stoplossOrderId: oco?.stoplossOrderId,
        status: oco?.status,
      });

      console.log("====================ocoWatcher Loop Inner============");

      let orders = [];
      try {
        logSuccess(null, {
          msg: "Fetching orderbook for OCO",
          userId: oco?.userId,
          broker: oco?.broker,
        });

        orders = await fetchOrderBookOCO(oco.userId, oco.broker);

        logSuccess(null, {
          msg: "Orderbook fetched for OCO",
          userId: oco?.userId,
          broker: oco?.broker,
          orders:orders,
          ordersCount: Array.isArray(orders) ? orders.length : 0,
        });
      } catch (e) {
        logError(null, e, {
          msg: "Failed to fetch orderbook for OCO",
          userId: oco?.userId,
          broker: oco?.broker,
          ocoId: oco?.ocoId,
        });
        // keep loop alive
        continue;
      }

      logSuccess(null, {
        msg: "Finding target & stoploss orders from orderbook",
        ocoId: oco?.ocoId,
        targetOrderId: oco?.targetOrderId,
        stoplossOrderId: oco?.stoplossOrderId,
      });

      const target = orders.find((o) => o.orderid === oco.targetOrderId);

      console.log('================target==========',target);
      

      logSuccess(null, {
        msg: "Target order matched",
        ocoId: oco?.ocoId,
        targetFound: !!target,
        targetOrderId: oco?.targetOrderId,
      });

      const sl = orders.findrs((o) => o.orderid === oco.stoplossOrderId);

      logSuccess(null, { 
        msg: "Stoploss order matched",
        ocoId: oco?.ocoId,
        stoplossFound: !!sl,
        stoplossOrderId: oco?.stoplossOrderId,
      });

      const targetDone = isCompleted(target);

      logSuccess(null, {
        msg: "Target completion computed",
        ocoId: oco?.ocoId,
        targetDone,
      });

      const slDone = isCompleted(sl);

      logSuccess(null, {
        msg: "Stoploss completion computed",
        ocoId: oco?.ocoId,
        slDone,
      });

      // 🎯 TARGET hit
      if (targetDone && !slDone) {
        logSuccess(null, {
          msg: "TARGET hit detected (targetDone && !slDone)",
          ocoId: oco?.ocoId,
          userId: oco?.userId,
          broker: oco?.broker,
          stoplossOrderId: oco?.stoplossOrderId,
        });

        try {
          logSuccess(null, {
            msg: "Cancelling STOPLOSS order because TARGET hit",
            ocoId: oco?.ocoId,
            userId: oco?.userId,
            broker: oco?.broker,
            stoplossOrderId: oco?.stoplossOrderId,
          });

          await cancelOrderOCO(oco.userId, oco.broker, oco.stoplossOrderId);

           logSuccess(null, {
            msg: "STOPLOSS order cancel call done",
            ocoId: oco?.ocoId,
            stoplossOrderId: oco?.stoplossOrderId,
          });


             await Order.update(
                      {
                        orderstatuslocaldb: "CANCELLED",
                        status: "CANCELLED",
                        positionStatus: "CANCELLED",
                      },
                      {
                        where: { orderid: oco.stoplossOrderId },
                      }
                    );

                     logSuccess(null, {
                msg: "OCO | Cancel TARGET order initiated",
                ocoId: oco?.ocoId,
                broker: oco?.broker,
                targetOrderId: oco?.targetOrderId,
              });


         
        } catch (e) {
          logError(null, e, {
            msg: "Failed to cancel STOPLOSS after TARGET hit",
            ocoId: oco?.ocoId,
            userId: oco?.userId,
            broker: oco?.broker,
            stoplossOrderId: oco?.stoplossOrderId,
          });
        }

        try {
          logSuccess(null, {
            msg: "Marking OCO completed with winner=TARGET",
            ocoId: oco?.ocoId,
          });

          await markOcoCompleted(oco.ocoId, "TARGET");

          logSuccess(null, {
            msg: "OCO marked completed (TARGET)",
            ocoId: oco?.ocoId,
          });
        } catch (e) {
          logError(null, e, {
            msg: "Failed to mark OCO completed (TARGET)",
            ocoId: oco?.ocoId,
            userId: oco?.userId,
          });
        }
      }

      // 🛑 STOPLOSS hit
      if (slDone && !targetDone) {
        logSuccess(null, {
          msg: "STOPLOSS hit detected (slDone && !targetDone)",
          ocoId: oco?.ocoId,
          userId: oco?.userId,
          broker: oco?.broker,
          targetOrderId: oco?.targetOrderId,
        });

        try {
          logSuccess(null, {
            msg: "Cancelling TARGET order because STOPLOSS hit",
            ocoId: oco?.ocoId,
            userId: oco?.userId,
            broker: oco?.broker,
            targetOrderId: oco?.targetOrderId,
          });

          await cancelOrderOCO(oco.userId, oco.broker, oco.targetOrderId);

           logSuccess(null, {
            msg: "TARGET order cancel call done",
            ocoId: oco?.ocoId,
            targetOrderId: oco?.targetOrderId,
          });

           await Order.update(
                      {
                        orderstatuslocaldb: "CANCELLED",
                        status: "CANCELLED",
                        positionStatus: "CANCELLED",
                      },
                      {
                        where: { orderid: oco.targetOrderId },
                      }
                    );

                logSuccess(null, {
                msg: "OCO | Cancel TARGET order initiated",
                ocoId: oco?.ocoId,
                broker: oco?.broker,
                targetOrderId: oco?.targetOrderId,
              });



         
        } catch (e) {
          logError(null, e, {
            msg: "Failed to cancel TARGET after STOPLOSS hit",
            ocoId: oco?.ocoId,
            userId: oco?.userId,
            broker: oco?.broker,
            targetOrderId: oco?.targetOrderId,
          });
        }

        try {
          logSuccess(null, {
            msg: "Marking OCO completed with winner=STOPLOSS",
            ocoId: oco?.ocoId,
          });

          await markOcoCompleted(oco.ocoId, "STOPLOSS");

          logSuccess(null, {
            msg: "OCO marked completed (STOPLOSS)",
            ocoId: oco?.ocoId,
          });
        } catch (e) {
          logError(null, e, {
            msg: "Failed to mark OCO completed (STOPLOSS)",
            ocoId: oco?.ocoId,
            userId: oco?.userId,
          });
        }
      }

      logSuccess(null, {
        msg: "ocoWatcher Loop Inner end",
        ocoId: oco?.ocoId,
        userId: oco?.userId,
        broker: oco?.broker,
        targetDone,
        slDone,
      });
    }

    console.log("====================ocoWatcher Loop Outer============");

    logSuccess(null, { msg: "ocoWatcher Loop Outer end" });
    logSuccess(null, { msg: "ocoWatcher completed" });
  } catch (e) {
    logError(null, e, { msg: "ocoWatcher crashed unexpectedly", error: safeErr?.(e) });
    throw e;
  }
}

// Runs at: 00, 02, 04, 06, ... minutes
cron.schedule("*/1 * * * *", async () => {
  logSuccess(null, { msg: "cron tick: ocoWatcher scheduled run started", schedule: "*/1 * * * *" });

  try {

      // const activeOcos = await getActiveOcoGroups();


      console.log(activeOcos,'============activeOcos=========');
      

      logSuccess(null, {
      msg: "Active OCO groups fetched",
      count: Array.isArray(activeOcos) ? activeOcos.length : 0,
    });

    // ✅ Only run watcher if there are active OCOs
    if (Array.isArray(activeOcos) && activeOcos.length > 0) {
      logSuccess(null, {
        msg: "Active OCOs found, running ocoWatcher",
        count: activeOcos.length,
      });

      // await ocoWatcher(activeOcos); // 👈 pass data if needed
    } else {
      logSuccess(null, {
        msg: "No active OCOs found, skipping ocoWatcher",
      });
    }



    logSuccess(null, { msg: "cron tick: ocoWatcher scheduled run completed", schedule: "*/1 * * * *" });
  } catch (e) {
    logError(null, e, { msg: "cron tick: ocoWatcher scheduled run failed", schedule: "*/1 * * * *" });
  }
});





//  ===================== without logger ocde ==================


// import cron from "node-cron";
// import { getActiveOcoGroups } from "../services/ocoService.js";
// import { cancelOrderOCO } from "../services/ocoServiceCancelOders.js";
// import { markOcoCompleted } from "../services/ocoUpdateService.js";
// import { isCompleted } from "../utils/ocoIsCompleted.js";
// import { fetchOrderBookOCO } from "../services/ocoServiceFetchOders.js";
// import { logSuccess, logError } from "../utils/loggerr.js";

// async function ocoWatcher() {

//   const activeOcos = await getActiveOcoGroups();

//   for (const oco of activeOcos) {

//     console.log('====================ocoWatcher Loop Inner============');
    
//     const orders = await fetchOrderBookOCO(oco.userId, oco.broker);

//     const target = orders.find(o => o.orderid === oco.targetOrderId);
//     const sl = orders.findrs(o => o.orderid === oco.stoplossOrderId);

//     const targetDone = isCompleted(target);
//     const slDone = isCompleted(sl);

//     // 🎯 TARGET hit
//     if (targetDone && !slDone) {
//       await cancelOrderOCO(oco.userId, oco.broker, oco.stoplossOrderId);
//       await markOcoCompleted(oco.ocoId, "TARGET");
//     }

//     // 🛑 STOPLOSS hit
//     if (slDone && !targetDone) {
//       await cancelOrderOCO(oco.userId, oco.broker, oco.targetOrderId);
//       await markOcoCompleted(oco.ocoId, "STOPLOSS");
//     }
//   }

//   console.log('====================ocoWatcher Loop Outer============');
  
// }





// // Runs at: 00, 02, 04, 06, ... minutes
// cron.schedule("*/1 * * * *", async () => {

//   await ocoWatcher();

// });