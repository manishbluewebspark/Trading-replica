import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/db.js';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';
import licenseRoutes from './routes/licenseRoutes.js';
import orderRoute from './routes/orderRoute.js';
import cors from 'cors';
import path from 'path';
import http from "http";         
import { initSocket } from "./socket/index.js";






import { getPublicIP, getMACAddress } from './script/getData.js';

async function main() {
  const publicIP = await getPublicIP();
  const macAddress = await getMACAddress();
  console.log("Public IP:", publicIP);
  console.log("MAC Address:", macAddress);
  // Use publicIP and macAddress in your login logic here
}

// Call the async function
main().catch(console.error);



dotenv.config();
const corsOptions = {
  origin: [  
    'http://localhost:5173',
    'https://pleadingly-misshapen-wilber.ngrok-free.dev'  
 
  ],
  // credentials: true,  
  // methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], 
  // allowedHeaders: ['Content-Type', 'Authorization'] 
};
const app = express();


app.use(cors(corsOptions)); 
app.use(express.json());


app.get("/test/point", (req, res) => {
  
  res.send("Login callback received successfully ✅");
});


app.use("/uploads", express.static(path.join("uploads")));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/licenses", licenseRoutes);
app.use('/api/order', orderRoute);


const server = http.createServer(app);

// Initialize Socket.IO on the *server* (NOT the app)
initSocket(server); 

const PORT = process.env.PORT || 5000;

// server.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//   });

sequelize.sync({ force: false }).then(() => {
  console.log('✅ Database connected & synced');

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ DB connection error:', err);
});


// url =====> https://smartapi.angelbroking.com/signup
// password ====> Mahesh@1997


// username ====> bluewebspark@gmail.com
//password======> Manish@5123
// pin ========> 7748




// https://smartapi.angelbroking.com/


//  https://pleadingly-misshapen-wilber.ngrok-free.dev/       =====>>this is my forntend url



// refresh_token = eyJhbGciOiJIUzUxMiJ9.eyJ0b2tlbiI6IlJFRlJFU0gtVE9LRU4iLCJSRUZSRVNILVRPS0VOIjoiZXlKaGJHY2lPaUpTVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SjFjMlZ5WDNSNWNHVWlPaUpqYkdsbGJuUWlMQ0owYjJ0bGJsOTBlWEJsSWpvaWRISmhaR1ZmY21WbWNtVnphRjkwYjJ0bGJpSXNJbWR0WDJsa0lqb3dMQ0p6YjNWeVkyVWlPaUl6SWl3aVpHVjJhV05sWDJsa0lqb2lNV1V6WkRkbU9XRXRORFExWWkwelpHTTFMVGt4TVdFdE5qUmxaamsyT0RZd05XSmtJaXdpYTJsa0lqb2lkSEpoWkdWZmEyVjVYM1l5SWl3aWIyMXVaVzFoYm1GblpYSnBaQ0k2TUN3aWFYTnpJam9pYkc5bmFXNWZjMlZ5ZG1salpTSXNJbk4xWWlJNklrRlNTazFCTVRreU1TSXNJbVY0Y0NJNk1UYzJNVFkwTlRVMk1pd2libUptSWpveE56WXhOVFU0T1RneUxDSnBZWFFpT2pFM05qRTFOVGc1T0RJc0ltcDBhU0k2SW1NME9UTXdaalV5TFRWbFpHTXROREkxTnkxaE1HRTJMVEZpWWpVME1URXhZalF5WXlJc0lsUnZhMlZ1SWpvaUluMC54dnczTFJPeG4wZlVwNldVdmdfallBS0VxbjdCLVpuLXJBLUdKbUtnYUs4NXN2dXZxM1pCQXNIckx4T0pIbFpkeTljSmRQaDltNGFjVVNWNTF6S3FXMkpBS3VveG4tc2prLW5ER3FhV2FyY3F1Z2hYNmNYSGtvaWVMalktaFhiM1o5UFZ1V1ZyaVVCRHRfdURnODM4aW4wMjMzRUgxREtLdmJRY3FranJFX1EiLCJpYXQiOjE3NjE1NTkxNjJ9.jn9DJ7Vp6frTP0WjPBCwuZqqQclvjvw9WbDRVVBEmT0Pf39QQv2304w86cNKBBQVyq3hF92yX0f67NGG3DviSA

//  token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYxNjI1ODUzLCJleHAiOjE3NjE3MTIyNTN9.tAnJRzX4Svdb9xqJDc6zGlmJ3ZLyUbFLTMjjQKGMnTw


