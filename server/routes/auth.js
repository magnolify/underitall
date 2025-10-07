import express from 'express';
import { validateSessionToken } from '../lib/shopifyClient.js';
import { generatePrintToken } from '../lib/printTokens.js';

const router = express.Router();

router.post('/generate-print-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!sessionToken) {
      return res.status(401).json({ error: 'No session token provided' });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const sessionData = await validateSessionToken(sessionToken);
    
    if (!sessionData || !sessionData.shop) {
      return res.status(401).json({ error: 'Invalid session token' });
    }

    const printToken = generatePrintToken(sessionData.shop, orderId);

    res.json({
      printToken,
      expiresIn: 300
    });
  } catch (error) {
    console.error('Print token generation error:', error);
    res.status(500).json({ error: 'Failed to generate print token' });
  }
});

export { router as authRouter };
