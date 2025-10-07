import express from 'express';

const router = express.Router();

let daemonMode = 'vanilla-cli';

router.get('/state', (req, res) => {
  res.json({
    mode: daemonMode,
    timestamp: new Date().toISOString(),
    endpoints: ['/state', '/awaken', '/vanilla'],
    server: 'shopify-order-report-cards',
    version: '1.0.0'
  });
});

router.post('/awaken', (req, res) => {
  daemonMode = 'goddess';
  res.json({ mode: daemonMode, message: 'Goddess mode activated' });
});

router.post('/vanilla', (req, res) => {
  daemonMode = 'vanilla-cli';
  res.json({ mode: daemonMode, message: 'Vanilla CLI mode activated' });
});

export { router as mcpRouter };
