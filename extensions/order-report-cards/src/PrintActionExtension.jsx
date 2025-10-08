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
      // Get the order data from the extension context
      const orderData = extension?.target?.data;
      const orderName = orderData?.name;

      if (orderName) {
        try {
          // Remove the # prefix from the order name to get the order number
          const orderNumber = orderName.replace('#', '');
          
          // Use the deployed production URL
          const baseUrl = 'https://underitall.replit.app';

          // Build the print URL with order number
          const url = `${baseUrl}/print/${orderNumber}`;
          console.log('Generated print URL for order:', orderNumber, url);
          setPrintUrl(url);
        } catch (err) {
          console.error('Error generating print URL:', err);
          // Provide a fallback URL
          setPrintUrl('https://underitall.replit.app/print/error');
        }
      } else {
        console.log('No order data available:', orderData);
        setPrintUrl('https://underitall.replit.app/print/loading');
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