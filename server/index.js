import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { printRouter } from './routes/print.js';
import { mcpRouter } from './routes/mcp.js';
import { authRouter } from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRouter);
app.use('/print', printRouter);
app.use('/mcp', mcpRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Print endpoint: http://localhost:${PORT}/print`);
  console.log(`🔧 MCP endpoint: http://localhost:${PORT}/mcp`);
});
