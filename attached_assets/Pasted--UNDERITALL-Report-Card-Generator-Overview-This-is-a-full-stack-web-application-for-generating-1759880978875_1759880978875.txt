# UNDERITALL Report Card Generator

## Overview

This is a full-stack web application for generating printable report cards for Shopify order line items. The app features a React frontend with a modern dark-themed UI where users can input order numbers to load and preview report cards. It also includes a Shopify Admin Extension for seamless integration within the Shopify Admin interface.

The application generates custom 8.5" × 5.5" landscape-format labels for each item in an order, intelligently parsing product properties (dimensions, project names, install locations) and creating individual numbered cards for each unit quantity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture Pattern

**Full-Stack Web Application**
- **Frontend**: React 18 + Vite development server with TypeScript
- **Backend**: Express server serving both API routes and Vite dev server
- **Shopify Extension**: Admin print action for in-admin integration
- **Styling**: Tailwind CSS with dark theme and shadcn/ui components

**Development Architecture**
- Vite provides HMR (Hot Module Replacement) in development mode
- Express serves as proxy for API routes (`/api/*`)
- Server runs on port 5000 (only non-firewalled port for Replit webview)
- Production builds bundle frontend and compile TypeScript backend

### Backend Architecture

**Express Server** (`server/index.ts`)
- Port 5000 (Replit webview requirement)
- TypeScript with tsx for development
- Serves both API and frontend via Vite middleware

**Route Structure** (`server/routes.ts`)
1. **Order API** (`/api/order/:id`): Fetches order data from Shopify GraphQL API
2. **Print Route** (`/api/print`): Generates printable HTML for report cards
3. **Settings API** (`/api/settings`): Manages print configuration and preferences

**Vite Integration** (`server/vite.ts`)
- Development: Vite middleware with HMR
- Production: Serves pre-built static assets from `dist/public`

**Shopify Integration**
- Uses `@shopify/shopify-api` package (latest version)
- GraphQL client for order data fetching
- Session management via JWT validation
- Supports Shopify Admin API version January 2025

### Frontend Architecture

**React Application** (`client/src/`)
- React 18.3.1 with TypeScript
- Wouter for client-side routing
- TanStack Query for API state management
- shadcn/ui component library (Radix UI primitives)

**Key Components**
- `OrderInput`: Load orders by number with real-time validation
- `PrintPreview`: Live preview of report cards before printing
- `SettingsPanel`: Configure print preferences (page size, margins, etc.)
- `Header`: App navigation and branding

**Styling**
- Tailwind CSS 4.x with custom dark theme
- Print-optimized CSS for 8.5" × 5.5" landscape format
- Responsive design with mobile support

### Data Flow

**Live Mode Flow**
1. Merchant clicks print action in Shopify Admin
2. Extension captures order ID from Shopify context
3. Session token sent to `/auth/generate-print-token`
4. Server validates token, generates one-time print token
5. Print URL with token opened in new window
6. Print route validates token, fetches order via GraphQL
7. HTML generated and served for printing

**Developer Mode Flow**
1. Access via URL pattern `/{orderNumber}` or query param `?dev=true`
2. Order number input triggers direct Shopify API fetch
3. Uses `SHOPIFY_ACCESS_TOKEN` environment variable for authentication
4. Same HTML generation pipeline as live mode

### HTML Generation Logic

**Report Card Structure**
- Header card with order summary and shipping address
- Individual cards for each line item unit (quantity-based)
- Dynamic property parsing for custom product metadata
- Fallback logic for legacy data formats

**Property Parsing**
- Extracts: Rectangle dimensions (ft/in), Install Location, Rug Shape, Thickness
- Handles both new custom property format and legacy title-based format
- Intelligent dimension string formatting (`X' Y" × A' B"`)

### Token Security System

**Print Token Management** (`server/lib/printTokens.js`)
- In-memory Map storage for active tokens
- 5-minute expiration window
- Single-use enforcement (marked as used after validation)
- Automatic cleanup via setTimeout
- Stores: shop domain, order ID, creation timestamp, used flag

**Session Token Validation**
- JWT verification with `SHOPIFY_API_SECRET`
- Extracts shop domain from `dest` claim
- Returns shop and user ID for authorization

## External Dependencies

### Shopify Platform
- **Shopify Admin API**: GraphQL endpoint for order data fetching
- **Shopify UI Extensions**: Framework for admin extension rendering
- **Shopify CLI**: Build and deployment tooling (version 3.78+ required)
- **Required Scopes**: `read_orders`, `read_all_orders` (for protected customer data)

### Node.js Packages
- **Express 4.21.2**: HTTP server framework
- **@shopify/shopify-api** (latest): Official Shopify API client
- **jsonwebtoken 9.0.2**: Session token validation
- **cors 2.8.5**: Cross-origin request handling
- **dotenv 16.4.7**: Environment variable management

### Development Tools
- **Shopify CLI** (latest): Extension building, local development tunneling
- **Node.js 20**: Runtime environment
- **adm-zip 0.5.16**: Archive extraction utility (dev dependency)

### Environment Variables
- `SHOPIFY_API_KEY`: App API key for authentication
- `SHOPIFY_API_SECRET`: Secret for JWT validation
- `SHOPIFY_ACCESS_TOKEN`: Admin API access token for direct queries
- `SHOPIFY_APP_URL`: Public app URL for API configuration
- `PORT`: Server port (default 3000)

### External Services
- **Shopify Store**: Target merchant store for order data
- **Shopify Partner Account**: Required for app development and deployment
- **Development Store**: Testing environment for extension validation