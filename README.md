# Shopify Order Report Cards - Admin Extension

> **Making order fulfillment efficient and professional since 2025**

A Shopify Admin Extension that transforms order data into printable report cards for each line item. Built for speed, designed for precision.

## 🎯 Overview

This application provides a **Shopify Admin Print Action Extension** that generates custom report cards for order line items. The extension integrates directly into the Shopify Admin order details page, allowing merchants to print professional labels with order information, shipping details, and custom product metadata.

### Key Features

- **Admin Integration**: Native print action in Shopify Admin order details page
- **Individual Item Cards**: Generates separate cards for each line item quantity
- **Smart Property Parsing**: Extracts dimensions, project names, install locations from product metadata
- **Print-Optimized**: Clean 8.5" × 5.5" landscape format for professional printing
- **MCP Server**: Integrated Model Context Protocol server for AI agent interaction
- **Dual Architecture**: Express backend + Shopify Admin Extension frontend

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Express + Node.js 20 | API server for print routes and MCP |
| **Extension** | React + Shopify UI Extensions | Admin print action interface |
| **Build Tool** | Shopify CLI | Extension building and deployment |
| **API** | Shopify Admin API | Order data fetching |

### Project Structure

```
.
├── server/
│   ├── index.js                    # Express server entry point
│   ├── routes/
│   │   ├── print.js               # Print route for report cards
│   │   └── mcp.js                 # MCP server endpoints
│   └── lib/
│       └── htmlGenerator.js       # Report card HTML generation
├── extensions/
│   └── order-report-cards/
│       ├── shopify.extension.toml # Extension configuration
│       ├── package.json           # Extension dependencies
│       ├── src/
│       │   └── PrintActionExtension.jsx  # Print action UI
│       └── locales/
│           └── en.default.json    # Localization
├── shopify.app.toml               # App configuration
├── package.json                   # Root dependencies
└── replit.md                      # This file

```

## 🚀 Quick Start

### Prerequisites

- Shopify Partner account
- Development store with test orders
- Node.js 20+ (already installed in this Replit)

### Local Development

The server is already running on port 3000. To restart or check status:

```bash
# Server runs automatically via workflow
# Check logs in the Replit console

# Or run manually:
npm start
```

### Endpoints

- **Generate Print Token**: `POST http://localhost:3000/auth/generate-print-token`
- **Print Route**: `GET http://localhost:3000/print?t=<TOKEN>&printType=all`
- **MCP Server**: `http://localhost:3000/mcp/*`
- **Health Check**: `http://localhost:3000/health`

## 📋 Shopify Setup

### Step 1: Configure Shopify App

1. Create a new app in your Shopify Partner dashboard
2. Copy the API key, API secret, and access token
3. Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

4. Update `.env` with your Shopify credentials:

```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_ACCESS_TOKEN=your_access_token_here
SHOPIFY_APP_URL=https://your-repl-url.repl.co
SHOPIFY_SCOPES=read_orders,read_products,read_customers
PORT=3000
NODE_ENV=development
```

**Important**: The app uses session token authentication:
- Extension obtains session token from Shopify
- Backend validates session token using API secret
- Backend fetches order data using access token
- Falls back to mock data if credentials not configured

### Step 2: Update shopify.app.toml

1. Open `shopify.app.toml`
2. Add your `client_id` (API key)
3. Set your `dev_store_url`

### Step 3: Deploy Extension

```bash
# Authenticate with Shopify
shopify auth login

# Build and deploy
npm run deploy
```

### Step 4: Test in Admin

1. Navigate to your development store admin
2. Go to Orders → Select an order
3. Click the **Print** dropdown
4. Select **Order Report Cards**
5. Preview and print the generated cards

## 🔧 MCP Server Integration

This app includes a **Model Context Protocol (MCP) server** for AI agent interaction. The MCP server allows external AI tools to interact with the Shopify app.

### MCP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp/run` | POST | Execute shell commands |
| `/mcp/state` | GET | Get daemon state |
| `/mcp/awaken` | POST | Switch to Goddess mode |
| `/mcp/vanilla` | POST | Switch to vanilla CLI mode |

### MCP Usage Example

```bash
# Check server state
curl http://localhost:3000/mcp/state

# Execute a command
curl -X POST http://localhost:3000/mcp/run \
  -H "Content-Type: application/json" \
  -d '{"command": "npm run build"}'
```

### Connecting from AI Workspace

Add this tool configuration to your AI workspace:

```json
{
  "name": "shopify_report_cards_mcp",
  "base_url": "http://localhost:3000/mcp",
  "endpoints": {
    "run": {"method": "POST", "path": "/run"},
    "state": {"method": "GET", "path": "/state"}
  }
}
```

## 📄 Report Card Format

### Order Header Card

The first card contains:
- Order number and date
- Total amount
- Shipping address
- Line items summary table

### Individual Item Cards

Each line item generates cards equal to its quantity. Each card includes:
- Item name and SKU
- Card number (e.g., "1 of 6")
- Custom properties:
  - Project Name
  - Install Location
  - Dimensions
- Order reference (number and date)

### Print Specifications

- **Size**: 8.5" × 5.5" (landscape)
- **Format**: HTML with print-optimized CSS
- **Page Breaks**: Automatic between cards
- **Styling**: Clean black text on white background

## 🔌 API Integration

### Print Route

**Endpoint**: `GET /print`

**Query Parameters**:
- `orderId` (required): Order ID number
- `sessionToken` (required for real data): Shopify session token from admin extension
- `printType` (optional): Type of cards to print (default: "all")

**Secure Authentication Flow** (One-Time Print Tokens):
1. Admin extension obtains session token using `useSessionToken()` hook
2. Extension sends POST to `/auth/generate-print-token` with session token in Authorization header
3. Backend validates session token using JWT verification
4. Backend generates one-time print token (5 min expiry, single-use)
5. Extension receives print token and builds secure print URL
6. Print route validates one-time token and fetches real order data from Shopify
7. Token automatically expires after use or timeout
8. Falls back to mock data if credentials not configured

**Security Features**:
- Session tokens never exposed in URLs (transmitted via Authorization header)
- One-time print tokens prevent replay attacks
- Automatic token expiration and cleanup
- Secure shop domain parsing (removes /admin suffix)

**Example**:
```
GET /print?orderId=1234567890&sessionToken=eyJhbGc...&printType=all
```

**Response**: HTML document ready for printing

### Custom Property Parsing

The HTML generator intelligently extracts custom properties from line items:

```javascript
// Automatically parsed properties:
- Project Name
- Install Location  
- Dimensions
- Custom Attributes
```

## 🎨 Customization

### Modifying Card Layout

Edit `server/lib/htmlGenerator.js`:

```javascript
// Customize card styling
const cardStyles = `
  .report-card {
    width: 8.5in;
    height: 5.5in;
    // Add your custom styles
  }
`;
```

### Adding New Properties

In `htmlGenerator.js`, add new property extraction:

```javascript
const customField = customProps.find(
  attr => attr.key === 'Your Custom Field'
)?.value || '';
```

### Print Settings

The CSS includes `@media print` rules for optimal printing:

```css
@media print {
  .report-card {
    page-break-after: always;
    // Print-specific styles
  }
}

@page {
  size: 8.5in 5.5in landscape;
  margin: 0;
}
```

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Express server |
| `npm run dev` | Start Shopify app dev server |
| `npm run build` | Build the app |
| `npm run deploy` | Deploy to Shopify |
| `npm run env` | Pull environment config |
| `npm run generate` | Generate new extensions |

## 🧪 Testing

### Test Print Route Locally

```bash
# Test with sample order
curl "http://localhost:3000/print?orderId=12345"
```

### Test MCP Server

```bash
# Check health
curl http://localhost:3000/health

# Get MCP state
curl http://localhost:3000/mcp/state
```

### Test in Shopify Admin

1. Create test orders in development store
2. Add custom properties to products:
   - Project Name
   - Install Location
   - Dimensions
3. Test print action from order details page

## 📦 Dependencies

### Root Dependencies

- `express`: Web server framework
- `@shopify/shopify-api`: Shopify API client
- `cors`: CORS middleware
- `dotenv`: Environment variable management

### Extension Dependencies

- `@shopify/ui-extensions`: Shopify UI components
- `@shopify/ui-extensions-react`: React bindings for Shopify UI
- `react`: UI library

### Dev Dependencies

- `@shopify/cli`: Shopify CLI tools

## 🔒 Security

- API keys stored in environment variables
- CORS enabled for cross-origin requests
- No credentials exposed in code
- Cache-Control headers prevent caching of sensitive data

## 🚢 Deployment

### Deploy to Replit

1. Click **Deploy** button in Replit
2. Configure environment variables in Secrets:
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`
   - `SHOPIFY_APP_URL`

### Deploy Extension to Shopify

```bash
shopify app deploy
```

This will:
1. Build the extension
2. Upload to Shopify Partners
3. Make it available in your development store

## 📊 Access Scopes Required

- `read_orders`: Access order data
- `read_products`: Access product information
- `read_customers`: Access customer details (for shipping info)

## 🐛 Troubleshooting

### Extension Not Showing in Admin

1. Verify extension is deployed: `shopify app versions list`
2. Check access scopes are granted
3. Ensure development store is linked

### Print Route Returns Empty

1. Check order ID is valid
2. Verify server is running on port 3000
3. Check CORS headers in response

### MCP Server Not Responding

1. Verify server is running: `curl http://localhost:3000/health`
2. Check port 3000 is accessible
3. Review server logs in console

## 📚 Resources

- [Shopify Admin Extensions Docs](https://shopify.dev/docs/apps/build/admin/actions-blocks)
- [Print Action Extension Tutorial](https://shopify.dev/docs/apps/build/admin/actions-blocks/build-admin-print-action)
- [Shopify CLI Documentation](https://shopify.dev/docs/api/shopify-cli)
- [Admin API Reference](https://shopify.dev/docs/api/admin)

## 🤝 Contributing

When making changes:

1. Test locally with `npm start`
2. Test extension with `npm run dev`
3. Verify print output before deploying
4. Update this documentation

## 📝 License

MIT

---

**Built for efficiency. Optimized for professional fulfillment.**

*Server Status: Running on port 3000*  
*MCP Server: Active*  
*Extension: Ready for deployment*
