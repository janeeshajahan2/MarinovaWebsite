import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No authentication token, access denied'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;

    // Add user id to request
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is invalid or expired'
    });
  }
};

export default authMiddleware;
