import React, { useState, useEffect } from 'react';
import {
  reactExtension,
  AdminPrintAction,
  useApi,
} from '@shopify/ui-extensions-react/admin';

const TARGET = 'admin.order-details.print-action.render';

export default reactExtension(TARGET, () => <PrintAction />);

function PrintAction() {
  const { extension } = useApi(TARGET);
  const [printUrl, setPrintUrl] = useState('');

  useEffect(() => {
    async function buildPrintUrl() {
      // Get the order name (order number) from the extension context
      // The extension provides both id (gid://shopify/Order/...) and name (#1001)
      const orderName = extension?.target?.data?.name;

      if (orderName) {
        try {
          // Remove the # prefix from the order name to get the order number
          const orderNumber = orderName.replace('#', '');
          
          // Use the port-mapped URL that works with Shopify Admin
          // In production, this should be https://underitall.replit.app
          const isDevelopment = true; // Set this based on environment
          const baseUrl = isDevelopment 
            ? 'https://b2fc0def-6ac7-48a7-a9bd-cd2b71270629-00-3bziosto0yeeu.riker.replit.dev:4200'
            : 'https://underitall.replit.app';

          // Build the print URL
          const url = `${baseUrl}/print/${orderNumber}`;
          console.log('Generated print URL:', url);
          setPrintUrl(url);
        } catch (err) {
          console.error('Error generating print URL:', err);
          setPrintUrl('');
        }
      } else {
        console.log('No order name available in extension context');
        setPrintUrl('');
      }
    }

    buildPrintUrl();
  }, [extension]);

  return (
    <AdminPrintAction 
      src={printUrl}
    />
  );
}