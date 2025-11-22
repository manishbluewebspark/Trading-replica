import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/db.js';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';
import licenseRoutes from './routes/licenseRoutes.js';
import orderRoute from './routes/orderRoute.js';
import adminRoute from './routes/admin/adminOrderRoute.js';
import cors from 'cors';
import path from 'path';
import http from "http";
import session from "express-session";
import cookieParser from "cookie-parser";
import { initSocket } from "./socket/index.js";
import "./scheduler/scheduler.js"
import {seedAdmin} from './script/adminInsert.js'


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

// connectSmartSocket(19,process.env.SMART_AUTH_TOKEN,process.env.SMART_FEED_TOKEN)

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

