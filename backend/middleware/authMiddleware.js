
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {

const token = req.headers.authorization?.split(' ')[1];

const angelToken = req.headers.angelonetoken;

  if (!token) {
    
     return res.json({
            status: false,
            statusCode:401,
            message: "Unauthorized",
            error: null,
        });
  }

  // if(req.url!=='/login/totp/angelone'&&!angelToken) {

  //     return res.json({
  //           status: false,
  //           statusCode:401,
  //           message: "Angel Token not Found",
  //           error: null,
  //       });
           
  // }


 
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;
    
    next();

  } catch (err) {

    return res.status(403).json({ message: 'Token invalid or expired' });
  }
};


const authMiddlewareAngelOne = (req, res, next) => {
  
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token invalid or expired' });
  }
};

export default authMiddleware;
