// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Provider from '../models/Provider.js';
import Admin from '../models/Admin.js';

dotenv.config();

export const protect = (roles = []) => async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let model;
      if (decoded.role === 'user') model = User;
      else if (decoded.role === 'provider') model = Provider;
      else if (decoded.role === 'admin') model = Admin;
      else {
        return res.status(401).json({ message: 'Invalid role' });
      }

      req.user = await model.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Attach role to user object
      req.user.role = decoded.role;

      // Check role access
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
};
