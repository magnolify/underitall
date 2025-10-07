import React, { useState, useEffect } from 'react';
import {
  reactExtension,
  AdminPrintAction,
  useData,
  useSessionToken,
} from '@shopify/ui-extensions-react/admin';

const TARGET = 'admin.order-details.print-action.render';

export default reactExtension(TARGET, () => <PrintAction />);

function PrintAction() {
  const { data } = useData(TARGET);
  const { getSessionToken } = useSessionToken();
  const [printUrl, setPrintUrl] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function buildPrintUrl() {
      const selectedOrders = data?.selected || [];
      
      if (selectedOrders.length > 0) {
        try {
          const orderId = selectedOrders[0].id;
          const orderIdNumber = orderId.split('/').pop();
          
          const sessionToken = await getSessionToken();
          const baseUrl = process.env.SHOPIFY_APP_URL || 'http://localhost:3000';
          
          const response = await fetch(`${baseUrl}/auth/generate-print-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ orderId: orderIdNumber })
          });

          if (!response.ok) {
            throw new Error('Failed to generate print token');
          }

          const { printToken } = await response.json();
          
          const url = `${baseUrl}/print?t=${printToken}&printType=all`;
          setPrintUrl(url);
          setError(null);
        } catch (err) {
          console.error('Error generating print URL:', err);
          setError(err.message);
          setPrintUrl('');
        }
      } else {
        setPrintUrl('');
      }
    }

    buildPrintUrl();
  }, [data, getSessionToken]);

  if (error) {
    return <AdminPrintAction src="" />;
  }

  return (
    <AdminPrintAction 
      src={printUrl}
    />
  );
}
