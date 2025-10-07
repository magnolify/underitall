# UNDERITALL Report Card Generator

> **Making order fulfillment efficient and professional since 2025**

A full-stack web application for generating printable report cards for Shopify order line items. Features a modern React frontend with dark-themed UI and seamless Shopify Admin integration.

## 🎯 Overview

This application provides both a **standalone web interface** and a **Shopify Admin Print Action Extension** that generates custom report cards for order line items. Users can input order numbers directly in the web app or use the native print action within Shopify Admin.

### Key Features

- **Full-Stack Web App**: Modern React 18 + TypeScript interface with real-time order loading
- **Admin Integration**: Native print action in Shopify Admin order details page
- **Individual Item Cards**: Generates separate cards for each line item quantity
- **Smart Property Parsing**: Extracts dimensions, project names, install locations from product metadata
- **Print-Optimized**: Clean 8.5" × 5.5" landscape format for professional printing
- **Dark Theme UI**: Beautiful shadcn/ui components with Tailwind CSS
- **Live Preview**: See report cards before printing

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Vite | Modern UI with HMR |
| **Backend** | Express + TypeScript | API server and Vite middleware |
| **Styling** | Tailwind CSS 4.x + shadcn/ui | Dark theme and responsive design |
| **Router** | Wouter | Client-side routing |
| **State** | TanStack Query | API state management |
| **Extension** | Shopify UI Extensions | Admin print action |
| **API** | Shopify Admin API (GraphQL) | Order data fetching |

### Project Structure

```
.
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   ├── Header.tsx        # App header
│   │   │   ├── OrderInput.tsx    # Order number input
│   │   │   ├── PrintPreview.tsx  # Print preview
│   │   │   └── SettingsPanel.tsx # Print settings
│   │   ├── pages/
│   │   │   └── ReportCardGenerator.tsx
│   │   ├── lib/
│   │   │   ├── htmlGenerator.ts  # Report card HTML generation
│   │   │   └── utils.ts
│   │   └── App.tsx
│   └── index.html
├── server/                        # Express backend
│   ├── index.ts                  # Server entry point
│   ├── routes.ts                 # API routes
│   └── vite.ts                   # Vite middleware
├── extensions/
│   └── admin-print/
│       ├── shopify.extension.toml
│       ├── src/
│       │   └── PrintActionExtension.jsx
│       └── package.json
├── shared/
│   └── schema.ts                 # Shared types
├── shopify.app.toml
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Shopify Partner account
- Development store with test orders
- Node.js 20+ (already installed in this Replit)

### Local Development

The server runs automatically on port 5000:

```bash
# Server runs automatically via workflow
# Check logs in the Replit console

# Or run manually:
npm run dev
```

### Endpoints

- **Frontend**: `http://localhost:5000/`
- **Order API**: `GET http://localhost:5000/api/order/:orderNumber`
- **Print Route**: `POST http://localhost:5000/api/print`
- **Settings API**: `GET/POST http://localhost:5000/api/settings`

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
PORT=5000
NODE_ENV=development
```

### Step 2: Update shopify.app.toml

1. Open `shopify.app.toml`
2. Add your `client_id` (API key)
3. Set your `dev_store_url`

### Step 3: Deploy Extension (Optional)

```bash
# Authenticate with Shopify
shopify auth login

# Build and deploy extension
shopify app deploy
```

### Step 4: Use the Web App

1. Open the preview at `http://localhost:5000`
2. Enter an order number (e.g., 1217)
3. Click **Load Order**
4. Preview the generated report cards
5. Click **Print** to print

### Step 5: Test in Admin (if extension deployed)

1. Navigate to your development store admin
2. Go to Orders → Select an order
3. Click the **Print** dropdown
4. Select **Order Report Cards**
5. Preview and print the generated cards

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
  - Dimensions (Rectangle, Rug Shape, Thickness)
- Order reference (number and date)

### Print Specifications

- **Size**: 8.5" × 5.5" (landscape)
- **Format**: HTML with print-optimized CSS
- **Page Breaks**: Automatic between cards
- **Styling**: Clean black text on white background

## 🎨 Customization

### Modifying Card Layout

Edit `client/src/lib/htmlGenerator.ts`:

```typescript
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

In `htmlGenerator.ts`, add new property extraction:

```typescript
const customField = lineItem.customAttributes?.find(
  attr => attr.key === 'Your Custom Field'
)?.value || '';
```

### UI Customization

- Edit components in `client/src/components/`
- Modify Tailwind config in `tailwind.config.ts`
- Customize dark theme in `client/src/index.css`

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run check` | Type check TypeScript |
| `shopify app deploy` | Deploy extension to Shopify |

## 🧪 Testing

### Test Web Interface

1. Open `http://localhost:5000` in browser
2. Enter a test order number
3. Verify order data loads correctly
4. Check print preview renders properly

### Test Print Route

```bash
# Test with sample order
curl "http://localhost:5000/api/order/12345"
```

### Test in Shopify Admin

1. Create test orders in development store
2. Add custom properties to products:
   - Project Name
   - Install Location
   - Dimensions
3. Test print action from order details page

## 📦 Dependencies

### Core Dependencies

- `express`: Web server framework
- `@shopify/shopify-api`: Shopify API client
- `react`: UI library
- `@tanstack/react-query`: Data fetching
- `wouter`: Client-side routing
- `tailwindcss`: Utility-first CSS
- Radix UI components (via shadcn/ui)

### Dev Dependencies

- `vite`: Build tool and dev server
- `tsx`: TypeScript execution
- `typescript`: Type checking
- `@shopify/cli`: Shopify CLI tools
- `esbuild`: Production builds

## 🔒 Security

- API keys stored in environment variables
- JWT validation for Shopify session tokens
- CORS enabled for cross-origin requests
- No credentials exposed in code
- Cache-Control headers prevent caching of sensitive data

## 🚢 Deployment

### Deploy to Replit

1. Click **Deploy** button in Replit
2. Configure environment variables in Secrets:
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`
   - `SHOPIFY_ACCESS_TOKEN`
   - `SHOPIFY_APP_URL`

The deployment is configured with:
- **Build**: `npm run build`
- **Run**: `npm start`
- **Type**: Autoscale

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

### Web App Not Loading

1. Verify server is running on port 5000
2. Check browser console for errors
3. Review server logs in Replit console

### Order Data Not Loading

1. Check Shopify credentials in `.env`
2. Verify access token has correct scopes
3. Ensure order number exists in store

### Extension Not Showing in Admin

1. Verify extension is deployed: `shopify app versions list`
2. Check access scopes are granted
3. Ensure development store is linked

### Print Preview Empty

1. Check order data loads successfully
2. Verify HTML generator in `htmlGenerator.ts`
3. Check browser console for rendering errors

## 📚 Resources

- [Shopify Admin Extensions Docs](https://shopify.dev/docs/apps/build/admin/actions-blocks)
- [Print Action Extension Tutorial](https://shopify.dev/docs/apps/build/admin/actions-blocks/build-admin-print-action)
- [Shopify CLI Documentation](https://shopify.dev/docs/api/shopify-cli)
- [Admin API Reference](https://shopify.dev/docs/api/admin)
- [Vite Documentation](https://vitejs.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🤝 Contributing

When making changes:

1. Test locally with `npm run dev`
2. Run type checking with `npm run check`
3. Test extension with `shopify app dev`
4. Verify print output before deploying
5. Update this documentation

## 📝 License

MIT

---

**Built for efficiency. Optimized for professional fulfillment.**

*Server Status: Running on port 5000*  
*Frontend: React 18 + Vite with HMR*  
*Extension: Ready for deployment*
