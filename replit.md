# Shopify Order Report Cards - Admin Extension

## Overview

This application is a Shopify Admin Extension designed to generate printable report cards for order line items. It integrates directly into the Shopify Admin interface, appearing as a print action on order details pages. Merchants can use it to create custom 8.5" × 5.5" landscape-format labels for each item in an order. The system intelligently parses product properties such as dimensions, project names, and install locations to create individual numbered cards for each unit quantity. The project aims to streamline the fulfillment process by providing clear, item-specific labels, enhancing efficiency and accuracy for Shopify merchants. It operates in a dual-mode architecture: a production mode within Shopify Admin and a developer mode for standalone testing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Architecture

The system utilizes a **Dual-Mode Deployment Strategy**:
- **Live Mode**: Deployed as a Shopify Admin Extension using the UI Extensions React framework.
- **Developer Mode**: A standalone Express server with a React frontend, accessible via a direct URL for testing with specific order numbers.

**Security Model**:
- Employs JWT (HS256) for session token validation during Shopify Admin requests.
- Generates one-time print tokens with a 5-minute expiry to secure print URL generation, preventing unauthorized access to order data.

**Extension Architecture**:
- An Admin print action extension (`extensions/order-report-cards/`) built with Shopify UI Extensions.
- Integrates natively into the Shopify Admin order details page as a print action.
- The extension triggers token generation and opens the print preview in a new browser window.

### Backend Architecture

- **Express Server** (`server/index.ts`):
    - Runs on a configurable port (default 5000).
    - CORS is enabled for cross-origin requests from the Shopify Admin.
    - Features three main route modules: `/auth`, `/print`, and `/mcp`.
- **Route Structure**:
    1. **Authentication (`/auth/generate-print-token`)**: Validates Shopify session tokens and issues short-lived print tokens.
    2. **Print (`/print`)**: Serves printable HTML, fetches order data from the Shopify GraphQL API, and requires validated print tokens.
    3. **MCP (`/mcp`)**: Model Context Protocol endpoints for daemon mode switching.
- **Shopify Integration**:
    - Uses the `@shopify/shopify-api` package for GraphQL client operations and session management via JWT validation.
    - Supports Shopify Admin API version January 2025.

### Frontend Architecture

- **Extension UI** (`extensions/order-report-cards/src/`):
    - Built with `@shopify/ui-extensions-react` and React 18.3.1.
    - Utilizes Shopify CLI for building and deployment.
    - Includes localization support via `locales/en.default.json`.
- **Print Preview System**:
    - HTML generation is handled server-side (`server/lib/htmlGenerator.ts`).
    - CSS is optimized for 8.5" × 5.5" landscape printing, including automatic page breaks and print-specific media queries.

### Data Flow

- **Live Mode**: Merchant initiates print action from Shopify Admin, extension captures order ID, sends session token to backend for print token generation, then opens a print URL with the token. The server validates the token, fetches order data via GraphQL, and serves the generated HTML for printing.
- **Developer Mode**: Accessed via specific URL patterns or query parameters, using a `SHOPIFY_ACCESS_TOKEN` environment variable for authentication, and follows the same HTML generation pipeline.

### HTML Generation Logic

- **Report Card Structure**: Includes a header card with order summary and shipping address, and individual cards for each line item unit (quantity-based).
- **Property Parsing**: Dynamically extracts product metadata (e.g., dimensions, install location, rug shape, thickness), handling both new custom property formats and legacy title-based formats, with intelligent dimension string formatting.

### Token Security System

- **Print Token Management** (`server/lib/printTokens.ts`): Uses in-memory storage for active tokens with a 5-minute expiry, enforcing single-use and automatic cleanup. Stores shop domain, order ID, and timestamp.
- **Session Token Validation**: JWT verification using `SHOPIFY_API_SECRET`, extracting shop domain and user ID for authorization.

### Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite.
- **Backend**: Express, TypeScript.
- **Deployment**: Shopify Admin Extension.
- **Runtime**: Node.js 20.

## External Dependencies

### Shopify Platform
- **Shopify Admin API**: GraphQL endpoint for fetching order data.
- **Shopify UI Extensions**: Framework for rendering admin extensions.
- **Shopify CLI**: Essential for build, development, and deployment (version 3.78+ required).
- **Required Scopes**: `read_orders`, `read_all_orders`.

### Node.js Packages
- **Express (4.21.2)**: Core HTTP server framework.
- **@shopify/shopify-api**: Official Shopify API client for integration.
- **jsonwebtoken (9.0.2)**: Used for session token validation.
- **cors (2.8.5)**: Enables Cross-Origin Resource Sharing.
- **dotenv (16.4.7)**: Manages environment variables.

### Development Tools
- **Shopify CLI**: For extension development, local tunneling.
- **Node.js (20)**: The JavaScript runtime environment.

### Environment Variables
- `SHOPIFY_API_KEY`: Application API key.
- `SHOPIFY_API_SECRET`: Secret for JWT validation.
- `SHOPIFY_ACCESS_TOKEN`: Admin API access token for direct queries (primarily dev mode).
- `SHOPIFY_APP_URL`: Public URL of the application.
- `PORT`: Server listening port (default 5000).

### External Services
- **Shopify Store**: The target merchant store providing order data.
- **Shopify Partner Account**: Required for app development and deployment.
- **Development Store**: Used for testing and validation of the extension.