import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/db.js';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';
import licenseRoutes from './routes/licenseRoutes.js';
import orderRoute from './routes/orderRoute.js';
import fyersRoute from './routes/fyersRoute.js';
import kiteRoute from './routes/kiteRoute.js';
import upStoxRoute from './routes/upstockRoute.js';
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
// import "./scheduler/ocoWatcher.js"
import {seedAdmin} from './script/adminInsert.js'

import "./services/kiteSocket.js"
import "./script/getData.js"


dotenv.config();

const app = express();

app.use(cookieParser()); // <– parses cookies automatically

app.use(
  cors({
    origin: "*",  
  })
);


app.use(express.json());



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

app.use('/api', upStoxRoute);






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
























