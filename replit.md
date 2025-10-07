# Shopify Order Report Cards - Admin Extension

## Overview

This application is a Shopify Admin Extension that generates printable report cards for order line items. It integrates directly into the Shopify Admin interface as a print action on order details pages, allowing merchants to create custom 8.5" × 5.5" landscape-format labels for each item in an order. The system intelligently parses product properties (dimensions, project names, install locations) and creates individual numbered cards for each unit quantity.

The application features a dual-mode architecture: a production mode that runs natively within Shopify Admin, and a developer mode accessible via standalone URL for testing with order numbers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture Pattern

**Dual-Mode Deployment Strategy**
- **Live Mode**: Shopify Admin Extension using UI Extensions React framework
- **Developer Mode**: Standalone Express server with React frontend for testing

**Security Model**
- Session token validation via JWT (HS256) for Shopify Admin requests
- One-time print tokens with 5-minute expiry for secure print URL generation
- Token-based authentication prevents unauthorized access to order data

**Extension Architecture**
- Admin print action extension (`extensions/order-report-cards/`) built with Shopify UI Extensions
- Print action appears natively in Shopify Admin order details page
- Extension triggers token generation and opens print preview in new window

### Backend Architecture

**Express Server** (`server/index.js`)
- Port 3000 default, configurable via environment
- CORS enabled for cross-origin admin requests
- Three primary route modules: `/auth`, `/print`, `/mcp`

**Route Structure**
1. **Authentication Route** (`/auth/generate-print-token`): Validates Shopify session tokens and issues short-lived print tokens
2. **Print Route** (`/print`): Serves printable HTML using validated print tokens, fetches order data from Shopify GraphQL API
3. **MCP Route** (`/mcp`): Model Context Protocol endpoints for daemon mode switching (goddess/vanilla-cli modes)

**Shopify Integration**
- Uses `@shopify/shopify-api` package (latest version)
- GraphQL client for order data fetching
- Session management via JWT validation
- Supports Shopify Admin API version January 2025

### Frontend Architecture

**Extension UI** (`extensions/order-report-cards/src/`)
- Built with `@shopify/ui-extensions-react` (latest)
- React 18.3.1 components
- Shopify CLI for building and deployment
- Localization support via `locales/en.default.json`

**Print Preview System**
- Server-side HTML generation (`server/lib/htmlGenerator.js`)
- CSS optimized for 8.5" × 5.5" landscape printing
- Automatic page breaks between cards
- Print-specific media queries

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