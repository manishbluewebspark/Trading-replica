import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/db.js';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';
import licenseRoutes from './routes/licenseRoutes.js';
import orderRoute from './routes/orderRoute.js';
import fyersRoute from './routes/fyersRoute.js';
import kiteRoute from './routes/kiteRoute.js';
import shoonyaRoute from './routes/shoonyaRoute.js';
import angeloneRoute from './routes/angelOneRoute.js';
import adminRoute from './routes/admin/adminOrderRoute.js';
import cors from 'cors';
import path from 'path';
import http from "http";
import session from "express-session";
import cookieParser from "cookie-parser";
import { initSocket } from "./socket/index.js";
// import "./scheduler/scheduler.js"
import {seedAdmin} from './script/adminInsert.js'

import "./services/kiteSocket.js"
import "./script/getData.js"


import { connectSmartSocket } from "./services/smartapiFeed.js";
import {bulkInsertPostgre} from "./script/postgre.js"

// bulkInsertPostgre()
// bulkUpdateSyFieldsJS()

dotenv.config();

// const corsOptions = {
//   origin: [  
//         process.env.CROSS_ORIGIN_APP_1,   // your React/Vite app
//         process.env.CROSS_ORIGIN_APP_2,
//         process.env.CROSS_ORIGIN_APP_3,
//         process.env.CROSS_ORIGIN_APP_4,
//         process.env.CROSS_ORIGIN_APP_5,
 
//   ],
//   // credentials: true,  
//   // methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], 
//   // allowedHeaders: ['Content-Type', 'Authorization'] 
// };



const app = express();

app.use(cookieParser()); // <– parses cookies automatically

app.use(
  cors({
    origin: "*",  
  })
);


app.use(express.json());

// connectSmartSocket(2,process.env.SMART_AUTH_TOKEN,process.env.SMART_FEED_TOKEN,'ARJMA1921')

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: "sid",
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,          // HTTP only in dev
    maxAge: 1000 * 60 * 60,
  },
}));


app.get("/test/point", (req, res) => {
  
  res.send("Login callback received successfully ✅");
  
});


app.use("/uploads", express.static(path.join("uploads")));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/licenses", licenseRoutes);
app.use('/api/order', orderRoute);
app.use('/api/admin', adminRoute);

app.use('/api', fyersRoute);
app.use('/api', kiteRoute);
app.use('/api', angeloneRoute);
app.use('/api', shoonyaRoute);




const server = http.createServer(app);

// Initialize Socket.IO on the *server* (NOT the app)
initSocket(server); 

const PORT = process.env.PORT || 5000;



sequelize.sync({ force: false }).then(() => {
  console.log('✅ Database connected & synced');

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    seedAdmin()
  });
}).catch(err => {
  console.error('❌ DB connection error:', err);
});


// url =====> https://smartapi.angelbroking.com/signup
// password ====> Mahesh@1997


// username ====> bluewebspark@gmail.com
//password======> Manish@5123
// pin ========> 7748








// import { exec } from "child_process";

// const ssid = "Airtel_BWS411";

// exec(
//   `security find-generic-password -D "AirPort network password" -a "${ssid}" -w`,
//   (err, stdout) => {
//     if (err) {
//       console.error("Cannot read password. Need permission:", err.message);
//       return;
//     }
//     console.log("WiFi Password:", stdout.trim());
//   }
// );













// Kite session response for user 3: {
//   status: 'success',
//   data: {
//     user_type: 'individual/res_no_nn',
//     email: 'bluewebspark@gmail.com',
//     user_name: 'Manish Shukla',
//     user_shortname: 'Manish',
//     broker: 'ZERODHA',
//     exchanges: [ 'NSE', 'BSE', 'MF' ],
//     products: [ 'CNC', 'NRML', 'MIS', 'BO', 'CO' ],
//     order_types: [ 'MARKET', 'LIMIT', 'SL', 'SL-M' ],
//     avatar_url: null,
//     user_id: 'JGQ802',
//     api_key: 'kjxhagw7nl1ypg3t',
//     access_token: 'AYo0dlqDOSxPweHkua2gbYBo1jL79fZa',
//     public_token: 'Blh1giFr2P0Gp641HjA6KWphHOEMEItd',
//     refresh_token: '',
//     enctoken: 'YiEI7p816ckVEISzDVxbnnuLHEwynPHuAJbaPiHgGLC1izRwA/AoKAobfAql9GRqBgi4bzHtC+SBjE1jrPXR7/1TgfVNTlduT3ThFxy2IXmjlCNGG2/M63fq0XmVXeQ=',
//     login_time: '2025-12-03 13:27:39',
//     meta: { demat_consent: 'consent' }
//   }
// }






