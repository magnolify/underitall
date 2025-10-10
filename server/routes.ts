import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static assets (logo and icon)
  app.get("/logo.svg", (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, "..", "client", "logo.svg"));
  });

  app.get("/logo.png", (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, "..", "client", "logo.png"));
  });

  app.get("/icon.svg", (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, "..", "client", "icon.svg"));
  });

  app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, "..", "client", "favicon.ico"));
  });

  // Health check endpoint for deployment (separate from root)
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "Shopify Report Card Generator" });
  });

  // Serve dev console for Shopify extensions
  app.get("/extensions/dev-console", (req, res) => {
    res.redirect(`https://admin.shopify.com/store/${process.env.SHOPIFY_SHOP_DOMAIN?.replace('.myshopify.com', '')}/apps/${process.env.SHOPIFY_API_KEY || '4ae50f96f3f8c6ef4f269f27aa4e2ebf'}`);
  });

  // Proxy GraphiQL requests to Shopify's GraphiQL server
  app.get("/graphiql", (req, res) => {
    res.redirect("http://localhost:3457/graphiql");
  });

  // Fetch Shopify order by order number
  app.get("/api/orders/:orderNumber", async (req, res) => {
    const orderNumber = req.params.orderNumber;
    const adminToken = process.env.SHOPIFY_ADMIN_TOKEN;
    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;

    if (!adminToken || !shopDomain) {
      return res.status(500).json({ 
        error: "Missing Shopify credentials. Set SHOPIFY_ADMIN_TOKEN and SHOPIFY_SHOP_DOMAIN in Secrets." 
      });
    }

    try {
      // GraphQL query to fetch order by name (order number)
      const query = `
        query getOrder($query: String!) {
          orders(first: 1, query: $query) {
            edges {
              node {
                id
                name
                createdAt
                email
                phone
                lineItems(first: 50) {
                  edges {
                    node {
                      id
                      title
                      quantity
                      sku
                      variantTitle
                      name
                      customAttributes {
                        key
                        value
                      }
                    }
                  }
                }
                shippingAddress {
                  firstName
                  lastName
                  company
                  address1
                  address2
                  city
                  province
                  provinceCode
                  zip
                  country
                  countryCode
                  phone
                  name
                }
                customer {
                  firstName
                  lastName
                  email
                }
              }
            }
          }
        }
      `;

      const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken
        },
        body: JSON.stringify({
          query,
          variables: {
            query: `name:#${orderNumber}`
          }
        })
      });

      const result = await response.json();

      if (result.errors) {
        return res.status(400).json({ error: result.errors });
      }

      const edges = result.data?.orders?.edges;
      if (!edges || edges.length === 0) {
        return res.status(404).json({ error: `Order #${orderNumber} not found` });
      }

      const order = edges[0].node;

      // Transform GraphQL response to match our schema
      const transformedOrder = {
        id: parseInt(order.id.split('/').pop() || '0'),
        name: order.name,
        order_number: parseInt(orderNumber),
        created_at: order.createdAt,
        email: order.email,
        phone: order.phone,
        line_items: order.lineItems.edges.map((item: any) => ({
          id: parseInt(item.node.id.split('/').pop() || '0'),
          title: item.node.title,
          quantity: item.node.quantity,
          sku: item.node.sku || '',
          variant_title: item.node.variantTitle,
          name: item.node.name,
          properties: item.node.customAttributes?.map((attr: any) => ({
            name: attr.key,
            value: attr.value
          })) || []
        })),
        shipping_address: order.shippingAddress ? {
          first_name: order.shippingAddress.firstName,
          last_name: order.shippingAddress.lastName,
          company: order.shippingAddress.company,
          address1: order.shippingAddress.address1,
          address2: order.shippingAddress.address2,
          city: order.shippingAddress.city,
          province: order.shippingAddress.province,
          province_code: order.shippingAddress.provinceCode,
          zip: order.shippingAddress.zip,
          country: order.shippingAddress.country,
          country_code: order.shippingAddress.countryCode,
          phone: order.shippingAddress.phone,
          name: order.shippingAddress.name
        } : null,
        customer: order.customer ? {
          first_name: order.customer.firstName,
          last_name: order.customer.lastName,
          email: order.customer.email
        } : null
      };

      res.json({ order: transformedOrder });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Handle OPTIONS requests for CORS preflight
  app.options("/print/:orderNumber", (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '86400');
    res.status(200).send();
  });

  // Print route for Shopify Admin extension
  app.get("/print/:orderNumber", async (req, res) => {
    const orderIdentifier = req.params.orderNumber;
    const adminToken = process.env.SHOPIFY_ADMIN_TOKEN;
    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;

    // Set CORS headers for Shopify Admin
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('X-Frame-Options', 'ALLOWALL');
    res.header('Content-Security-Policy', "frame-ancestors *;");

    if (!adminToken || !shopDomain) {
      return res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Configuration Error</h2>
            <p>Missing Shopify credentials. Please set SHOPIFY_ADMIN_TOKEN and SHOPIFY_SHOP_DOMAIN in environment variables.</p>
          </body>
        </html>
      `);
    }

    try {
      // Determine if this is an order ID (long number) or order number (short number)
      let searchQuery = '';
      if (orderIdentifier.length > 8) {
        // This is likely a GID-based ID (like 6751928615139)
        searchQuery = `id:${orderIdentifier}`;
      } else {
        // This is likely an order number (like 1217)
        searchQuery = `name:#${orderIdentifier}`;
      }

      console.log('Searching for order with query:', searchQuery);

      // Fetch order data using the same GraphQL query
      const query = `
        query getOrder($query: String!) {
          orders(first: 1, query: $query) {
            edges {
              node {
                id
                name
                createdAt
                email
                phone
                lineItems(first: 50) {
                  edges {
                    node {
                      id
                      title
                      quantity
                      sku
                      variantTitle
                      name
                      customAttributes {
                        key
                        value
                      }
                    }
                  }
                }
                shippingAddress {
                  firstName
                  lastName
                  company
                  address1
                  address2
                  city
                  province
                  provinceCode
                  zip
                  country
                  countryCode
                  phone
                  name
                }
                customer {
                  firstName
                  lastName
                  email
                }
              }
            }
          }
        }
      `;

      const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken
        },
        body: JSON.stringify({
          query,
          variables: {
            query: searchQuery
          }
        })
      });

      const result = await response.json();

      if (result.errors) {
        return res.status(500).send(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Error Loading Order</h2>
              <p>${result.errors[0]?.message || 'Unknown error occurred'}</p>
            </body>
          </html>
        `);
      }

      const edges = result.data?.orders?.edges;
      if (!edges || edges.length === 0) {
        return res.status(404).send(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Order Not Found</h2>
              <p>Order ${orderIdentifier} could not be found.</p>
            </body>
          </html>
        `);
      }

      const order = edges[0].node;

      // Transform to match our HTML generator format
      const transformedOrder = {
        id: order.id,
        name: order.name,
        createdAt: order.createdAt,
        email: order.email,
        phone: order.phone,
        lineItems: order.lineItems.edges.map((item: any) => ({
          id: item.node.id,
          title: item.node.title,
          quantity: item.node.quantity,
          sku: item.node.sku || '',
          variantTitle: item.node.variantTitle,
          name: item.node.name,
          properties: item.node.customAttributes?.map((attr: any) => ({
            key: attr.key,
            value: attr.value
          })) || [],
          customAttributes: item.node.customAttributes
        })),
        shippingAddress: order.shippingAddress,
        customer: order.customer
      };

      // Generate HTML using our server-side generator
      const { generateReportCardHTML } = await import('./lib/htmlGenerator.js');
      const html = generateReportCardHTML(transformedOrder, false);

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error: any) {
      console.error('Error generating print preview:', error);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Error Generating Report Cards</h2>
            <p>${error.message}</p>
          </body>
        </html>
      `);
    }
  });

  // Serve HTML preview for printing
  app.post("/api/preview-html", express.json({ limit: '10mb' }), (req, res) => {
    const { html } = req.body;
    if (!html) {
      return res.status(400).send("Missing HTML content");
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  const httpServer = createServer(app);

  return httpServer;
}