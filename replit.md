# Shopify Order Report Cards - Admin Extension

## Overview

This application is a Shopify Admin Extension designed to generate printable report cards for order line items. It integrates directly into the Shopify Admin interface, providing a print action on order details pages. Merchants can create custom 8.5" × 5.5" landscape-format labels for each item in an order. The system intelligently parses product properties (e.g., dimensions, project names, install locations) and creates individual numbered cards for each unit quantity.

The application operates in a dual-mode architecture: a production mode natively within Shopify Admin, and a developer mode accessible via a standalone URL for testing with specific order numbers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture

The application employs a **Dual-Mode Deployment Strategy**:
- **Live Mode**: A Shopify Admin Extension built with the UI Extensions React framework.
- **Developer Mode**: A standalone Express server with a React frontend for local testing.

**Security Model**:
- Session token validation using JWT (HS256) for Shopify Admin requests.
- One-time print tokens with a 5-minute expiry for secure print URL generation, preventing unauthorized access to order data.

**Extension Architecture**:
- The Admin print action extension (`extensions/order-report-cards/`) is built with Shopify UI Extensions and appears natively on Shopify Admin order details pages.
- The extension triggers token generation and opens the print preview in a new browser window.

### Backend Architecture

The backend is an **Express Server** (`server/index.ts`) running on port 5000 (configurable via environment variables). It supports CORS for cross-origin admin requests and organizes routes into three primary modules: `/auth`, `/print`, and `/mcp`.

**Route Structure**:
1.  **Authentication Route** (`/auth/generate-print-token`): Validates Shopify session tokens and issues short-lived print tokens.
2.  **Print Route** (`/print`): Serves printable HTML, validates print tokens, and fetches order data from the Shopify GraphQL API.
3.  **MCP Route** (`/mcp`): Provides Model Context Protocol endpoints for internal daemon mode switching (e.g., goddess/vanilla-cli modes for agent interaction).

**Shopify Integration**:
- Uses the `@shopify/shopify-api` package for GraphQL client operations and session management via JWT validation.
- Supports Shopify Admin API version January 2025.

### Frontend Architecture

The **Extension UI** (`extensions/order-report-cards/src/`) is built with `@shopify/ui-extensions-react` (React 18.3.1 components) and uses Shopify CLI for building and deployment. It includes localization support via `locales/en.default.json`.

**Print Preview System**:
- Server-side HTML generation (`server/lib/htmlGenerator.ts`) optimized for 8.5" × 5.5" landscape printing.
- Features automatic page breaks between cards and print-specific media queries.

### Data Flow

-   **Live Mode**: Merchant initiates print action from Shopify Admin, extension captures order ID, sends session token to backend for print token generation, and opens a new window with the print URL. The backend validates the print token, fetches order data, and serves the generated HTML.
-   **Developer Mode**: Accessible via a URL pattern or query parameter (`?dev=true`), allowing direct Shopify API fetches using an environment variable (`SHOPIFY_ACCESS_TOKEN`) for authentication, and follows the same HTML generation pipeline.

### HTML Generation Logic

**Report Card Structure**: Includes a header card with order summary and shipping address, followed by individual cards for each line item unit.
**Property Parsing**: Dynamically extracts product metadata such as dimensions, install locations, rug shape, and thickness, handling both new custom property formats and legacy title-based formats.

### Token Security System

-   **Print Token Management** (`server/lib/printTokens.ts`): Uses in-memory Map storage for active, single-use tokens with a 5-minute expiration, automatically cleaned up. Stores shop domain, order ID, and creation timestamp.
-   **Session Token Validation**: JWT verification using `SHOPIFY_API_SECRET` to extract shop domain and user ID for authorization.

## External Dependencies

### Shopify Platform

-   **Shopify Admin API**: GraphQL endpoint for fetching order data.
-   **Shopify UI Extensions**: Framework for rendering admin extensions.
-   **Shopify CLI**: Required for build and deployment (version 3.78+).
-   **Required Scopes**: `read_orders`, `read_all_orders`.

### Node.js Packages

-   **Express 4.21.2**: HTTP server framework.
-   **@shopify/shopify-api**: Official Shopify API client.
-   **jsonwebtoken 9.0.2**: For session token validation.
-   **cors 2.8.5**: For handling cross-origin requests.
-   **dotenv 16.4.7**: For environment variable management.

### Development Tools

-   **Shopify CLI**: For extension building and local development tunneling.
-   **Node.js 20**: Runtime environment.
-   **adm-zip 0.5.16**: Archive extraction utility (dev dependency).

### Environment Variables

-   `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_ACCESS_TOKEN`, `SHOPIFY_APP_URL`, `PORT`.

### External Services

-   **Shopify Store**: The target merchant store for order data.
-   **Shopify Partner Account**: Necessary for app development and deployment.
-   **Development Store**: Testing environment for extension validation.