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
          
          // Use the production URL - this will work once deployed
          // For development testing, use the Shopify Dev Console preview
          const baseUrl = 'https://underitall.replit.app';

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