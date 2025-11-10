// scheduler.js
import cron from "node-cron";
import { bulkInsertPostgre } from "./scripts/bulkInsertPostgre.js";
import { bulkUpdateSyFields } from "./scripts/bulkUpdateSyFields.js"; 


// Prevent overlapping runs
let running = { insert: false, update: false };

cron.schedule("40 9 * * *", async () => {          // every day at 09:40
// cron.schedule("40 9 * * *", async () => {          // every day at 09:40  

  if (running.insert) {
     
    return console.log("Insert already running, skip.");

  }

  running.insert = true;

  console.log("▶️ bulkInsert @ 09:40 IST");

  try {

     await bulkInsertPostgre(); 

    }catch (e) {

    console.error("bulkInsert error:", e);
    
    }finally {

        running.insert = false;
    }
}, { timezone: "Asia/Kolkata" });



// Example: second job at 09:55
cron.schedule("55 9 * * *", async () => {

  if (running.update) return console.log("Update already running, skip.");

  running.update = true;

  console.log("▶️ bulkUpdate @ 09:55 IST");
  try {
     await bulkUpdateSyFields();
     }

  catch (e) {
     console.error("bulkUpdate error:", e);

   }
  finally {
     running.update = false; 
    }
}, { timezone: "Asia/Kolkata" });

// keep process alive (start this file with PM2 or node)
