#!/bin/bash
# Helper script to run Shopify CLI commands using the correct version

# Run Shopify CLI command using npx to ensure we use the local version
npx shopify "$@"