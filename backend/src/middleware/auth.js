// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Provider from '../models/Provider.js';
import Admin from '../models/Admin.js';

dotenv.config();

export const protect = (roles = []) => async (req, res, next) => {
  let token;

  console.log('Auth middleware: Checking authorization for path:', req.path);
  console.log('Auth middleware: Headers present:', !!req.headers.authorization);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('Auth middleware: Token received, length:', token.length);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Auth middleware: Token decoded successfully:', {
        id: decoded.id,
        role: decoded.role,
        exp: decoded.exp
      });

      // Check if server start time matches to invalidate sessions on restart
      if (!decoded.serverStartTime || decoded.serverStartTime !== parseInt(process.env.SERVER_START_TIME)) {
        console.log('Auth middleware: Token issued before current server start, invalidating');
        return res.status(401).json({ message: 'Session expired, please login again' });
      }

      let model;
      if (decoded.role === 'user') model = User;
      else if (decoded.role === 'provider') model = Provider;
      else if (decoded.role === 'admin') model = Admin;
      else {
        console.log('Auth middleware: Invalid role detected:', decoded.role);
        return res.status(401).json({ message: 'Invalid role' });
      }

      console.log('Auth middleware: Looking up user in database with model:', model.modelName);
      req.user = await model.findById(decoded.id).select('-password');

      if (!req.user) {
        console.log('Auth middleware: User not found in database');
        return res.status(401).json({ message: 'User not found' });
      }

      console.log('Auth middleware: User found:', {
        id: req.user._id,
        name: req.user.name,
        role: decoded.role
      });

      // Attach role to user object
      req.user.role = decoded.role;

      // Check role access
      if (roles.length && !roles.includes(decoded.role)) {
        console.log('Auth middleware: Role access denied. Required roles:', roles, 'User role:', decoded.role);
        return res.status(403).json({ message: 'Access denied' });
      }

      console.log('Auth middleware: Authorization successful, proceeding to next middleware');
      next();
    } catch (error) {
      console.log('Auth middleware: Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.log('Auth middleware: No authorization header or Bearer token');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
};
