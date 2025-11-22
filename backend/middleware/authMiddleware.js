
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {

const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    
     return res.json({
            status: false,
            statusCode:401,
            message: "Unauthorized",
            error: null,
        });
  }
 
  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.role = decoded.role
    req.userId = decoded.id;
    req.borker = decoded.borker;
    
    next();

  } catch (err) {

    return res.status(403).json({ message: 'Token invalid or expired' });
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
