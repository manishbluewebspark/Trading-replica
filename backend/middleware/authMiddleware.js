
import jwt from 'jsonwebtoken';
import logger from "../common/logger.js";


const authMiddleware = (req, res, next) => {

const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    
     return res.json({
            status: false,
            statusCode:401,
            message: "Unauthorized",
            error: "Request with No Token Again Login",
        });
  }
 
  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.role = decoded.role
    req.userId = decoded.id;
    req.borker = decoded.borker;

     if(req.role==='clone-user') {

      return res.json({
      status: true,
      statusCode: 200,
      data: [], // ✅ only yesterday+old positions
      message:
        "No Holding Data Found",
    });  
}
    
    next();

  } catch (err) {

    logger.error("API Request Failed", {
    url: req.originalUrl,
    method: req.method,
    status: false,
    userId: req?.userId || null,
    error: err.message,          // store error message
    stack: err.stack || null     // optional: saves trace
  });

    return res.json({
            status: false,
            statusCode:401,
            message: "Unauthorized",
            error: "Token invalid or expired",
      });

  }
};


const AdminAuthMiddleware = (req, res, next) => {
  
  const token = req.headers.authorization?.split(' ')[1];

  const userid = req.headers?.userid

  if (!token) {
     return res.json({
            status: false,
            statusCode:401,
            message: 'Unauthorized',
            error: null,
        });
  }

   if (!userid) {
     return res.json({
            status: false,
            statusCode:401,
            message: 'Please Again Login',
            error: null,
        });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = userid
    req.AdminId = decoded.id

    next();

  } catch (err) {
    return res.json({
            status: false,
            statusCode:401,
            message: err.message,
            error: null,
        });
  }
};

export  {authMiddleware,AdminAuthMiddleware};
