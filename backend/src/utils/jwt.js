import jwt from 'jsonwebtoken';

export const createAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

export const createRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);
