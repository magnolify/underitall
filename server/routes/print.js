import express from 'express';
import { generateReportCardHTML } from '../lib/htmlGenerator.js';
import { fetchOrderData } from '../lib/shopifyClient.js';
import { validatePrintToken } from '../lib/printTokens.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { printType = 'all', t: printToken } = req.query;

    if (!printToken) {
      return res.status(400).send('<html><body><h1>Error: Missing print token</h1><p>This print URL has expired or is invalid.</p></body></html>');
    }

    const tokenData = validatePrintToken(printToken);

    if (!tokenData) {
      return res.status(401).send('<html><body><h1>Error: Invalid or expired print token</h1><p>Please regenerate the print from Shopify admin.</p></body></html>');
    }

    let orderData;

    if (process.env.SHOPIFY_ACCESS_TOKEN) {
      try {
        console.log(`🔍 Using one-time token for shop: ${tokenData.shop}, order: ${tokenData.orderId}`);

        const session = {
          shop: tokenData.shop,
          accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
          graphqlClient: {
            request: async (query, options) => {
              const apiUrl = `https://${tokenData.shop}/admin/api/2025-01/graphql.json`;
              console.log(`📡 Fetching from: ${apiUrl}`);
              
              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
                },
                body: JSON.stringify({
                  query,
                  variables: options.variables
                })
              });
              
              if (!response.ok) {
                throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
              }
              
              return await response.json();
            }
          }
        };

        orderData = await fetchOrderData(session, tokenData.orderId);
        console.log('✅ Fetched real order data from Shopify');
      } catch (error) {
        console.error('Failed to fetch real order data:', error);
        orderData = getMockOrderData(tokenData.orderId);
      }
    } else {
      console.warn('⚠️  No Shopify access token configured. Using mock data for development.');
      orderData = getMockOrderData(tokenData.orderId);
    }

    const html = generateReportCardHTML(orderData, printType);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(html);
  } catch (error) {
    console.error('Print route error:', error);
    res.status(500).send(`<html><body><h1>Error</h1><p>${error.message}</p></body></html>`);
  }
});

function getMockOrderData(orderId) {
  return {
    id: orderId,
    name: `#${orderId}`,
    createdAt: new Date().toISOString(),
    totalPriceSet: {
      shopMoney: { amount: '299.99', currencyCode: 'USD' }
    },
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'New York',
      province: 'NY',
      zip: '10001',
      country: 'United States'
    },
    lineItems: {
      edges: [
        {
          node: {
            id: '1',
            name: 'Custom Rug 8x10',
            quantity: 2,
            sku: 'RUG-8X10-001',
            originalUnitPriceSet: { shopMoney: { amount: '149.99', currencyCode: 'USD' } },
            customAttributes: [
              { key: 'Project Name', value: 'Living Room Renovation' },
              { key: 'Install Location', value: 'Living Room' },
              { key: 'Dimensions', value: '8\' x 10\'' }
            ]
          }
        }
      ]
    }
  };
}

export { router as printRouter };
