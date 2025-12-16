"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const usage_1 = __importDefault(require("./routes/usage"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '5000', 10);
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// MongoDB Connection
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/usage', usage_1.default);
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
