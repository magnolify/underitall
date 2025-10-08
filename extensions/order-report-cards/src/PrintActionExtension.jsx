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
      // Get the order ID from the extension context
      const orderId = extension?.target?.data?.id;

      if (orderId) {
        try {
          const orderIdNumber = orderId.split('/').pop();
          // Use the current app URL - Shopify will inject the correct domain
          const baseUrl = 'https://underitall.replit.app';

          // For now, use direct order ID access (we'll add token auth later if needed)
          const url = `${baseUrl}/print/${orderIdNumber}?printType=all`;
          setPrintUrl(url);
        } catch (err) {
          console.error('Error generating print URL:', err);
          setPrintUrl('');
        }
      } else {
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