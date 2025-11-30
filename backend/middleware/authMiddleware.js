
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {

const token = req.headers.authorization?.split(' ')[1];

// let token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJ1c2VyIiwiYm9ya2VyIjoia2l0ZSIsImlhdCI6MTc2NDMxMTAyNiwiZXhwIjoxNzY0Mzk3NDI2fQ.vWLs1sB2A5vPriYVYolCjD_B1m9NK2RZfw1Ib8kY3cQ'


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
