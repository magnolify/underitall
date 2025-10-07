import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
import jwt from 'jsonwebtoken';

let shopify = null;

export function initializeShopifyClient() {
  if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
    console.warn('⚠️  Shopify credentials not configured. Using mock data.');
    return null;
  }

  if (shopify) return shopify;

  shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: ['read_orders', 'read_products', 'read_customers'],
    hostName: process.env.SHOPIFY_APP_URL?.replace('https://', '') || 'localhost',
    apiVersion: ApiVersion.January25,
    isEmbeddedApp: true,
  });

  return shopify;
}

export async function validateSessionToken(token) {
  try {
    const secret = process.env.SHOPIFY_API_SECRET;
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    
    let shop = decoded.dest?.replace('https://', '') || '';
    shop = shop.replace(/\/admin$/, '');
    
    return {
      shop,
      userId: decoded.sub
    };
  } catch (error) {
    console.error('Session token validation failed:', error);
    return null;
  }
}

export async function fetchOrderData(session, orderId) {
  const client = session.graphqlClient;
  
  const query = `
    query getOrder($id: ID!) {
      order(id: $id) {
        id
        name
        createdAt
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        shippingAddress {
          firstName
          lastName
          address1
          address2
          city
          province
          zip
          country
        }
        lineItems(first: 100) {
          edges {
            node {
              id
              name
              quantity
              sku
              originalUnitPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customAttributes {
                key
                value
              }
            }
          }
        }
      }
    }
  `;

  const response = await client.request(query, {
    variables: { id: `gid://shopify/Order/${orderId}` }
  });

  return response.data.order;
}
