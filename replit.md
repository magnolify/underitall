# Shopify Order Report Cards - Admin Extension

## Overview

This application is a Shopify Admin Extension that generates printable report cards for order line items. It integrates directly into the Shopify Admin interface as a print action on order details pages, allowing merchants to create custom 8.5" × 5.5" landscape-format labels for each item in an order. The system intelligently parses product properties (dimensions, project names, install locations) and creates individual numbered cards for each unit quantity. The application features a dual-mode architecture: a production mode that runs natively within Shopify Admin, and a developer mode accessible via standalone URL for testing with order numbers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture Pattern

The application utilizes a **Dual-Mode Deployment Strategy**:
- **Live Mode**: Operates as a Shopify Admin Extension built with the UI Extensions React framework.
- **Developer Mode**: Functions as a standalone Express server with a React frontend for local testing.

**Security Model**
- Implements session token validation via JWT (HS256) for Shopify Admin requests.
- Generates one-time print tokens with a 5-minute expiry to secure print URL access.
- Token-based authentication prevents unauthorized access to order data.

**Extension Architecture**
- An Admin print action extension (`extensions/order-report-cards/`) integrates natively into Shopify Admin order details pages.
- The extension triggers token generation and opens the print preview in a new window.

### Backend Architecture

The **Express Server** (`server/index.ts`) runs on port 5000 (configurable) with CORS enabled. It manages three primary route modules:
1.  **Authentication Route** (`/auth/generate-print-token`): Validates Shopify session tokens and issues short-lived print tokens.
2.  **Print Route** (`/print`): Serves printable HTML using validated print tokens and fetches order data from the Shopify GraphQL API.
3.  **MCP Route** (`/mcp`): Provides Model Context Protocol endpoints for daemon mode switching.

Shopify integration uses the `@shopify/shopify-api` package for GraphQL client operations, session management via JWT validation, and supports Shopify Admin API version January 2025.

### Frontend Architecture

The **Extension UI** (`extensions/order-report-cards/src/`) is built with `@shopify/ui-extensions-react` (React 18.3.1 components) and uses Shopify CLI for development and deployment. It supports localization via `locales/en.default.json`.

The **Print Preview System** features server-side HTML generation (`server/lib/htmlGenerator.ts`) with CSS optimized for 8.5" × 5.5" landscape printing, including automatic page breaks and print-specific media queries.

### Data Flow

-   **Live Mode**: Merchant initiates print action > Order ID captured > Session token sent for print token generation > Print URL with token opened > Server validates token, fetches order via GraphQL > HTML generated and served.
-   **Developer Mode**: Accessed via URL (`/{orderNumber}` or `?dev=true`) > Order number triggers direct Shopify API fetch using `SHOPIFY_ACCESS_TOKEN` > Same HTML generation pipeline as live mode.

### HTML Generation Logic

**Report Card Structure** includes a header card with order summary and shipping address, and individual cards for each line item unit. It features dynamic property parsing for custom product metadata (dimensions, install location, rug shape, thickness) with fallback logic for legacy data formats.

### Token Security System

**Print Token Management** (`server/lib/printTokens.ts`)
-   Uses in-memory `Map` storage for active tokens with a 5-minute expiration and single-use enforcement.
-   Stores shop domain, order ID, creation timestamp, and usage flag.

**Session Token Validation**
-   Performs JWT verification using `SHOPIFY_API_SECRET` to extract shop domain and user ID for authorization.

## External Dependencies

### Shopify Platform
-   **Shopify Admin API**: GraphQL for order data.
-   **Shopify UI Extensions**: For admin extension rendering.
-   **Shopify CLI**: Build and deployment (version 3.78+).
-   **Required Scopes**: `read_orders`, `read_all_orders`.
-   **Shopify Store & Partner Account**: For development, testing, and deployment.

### Node.js Packages
-   **Express**: HTTP server framework.
-   **@shopify/shopify-api**: Official Shopify API client.
-   **jsonwebtoken**: Session token validation.
-   **cors**: Cross-origin request handling.
-   **dotenv**: Environment variable management.

### Development Tools
-   **Shopify CLI**: Extension building, local development tunneling.
-   **Node.js 20**: Runtime environment.
-   **adm-zip**: Archive extraction utility (dev dependency).

### Environment Variables
-   `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_ACCESS_TOKEN`, `SHOPIFY_APP_URL`, `PORT`.