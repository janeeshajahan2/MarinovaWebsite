"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Add user id to request
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token is invalid or expired'
        });
    }
};
exports.default = authMiddleware;
