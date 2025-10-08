import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';

export default async () => {
  render(<ReportCardsExtension />, document.body);
}

function ReportCardsExtension() {
  const {i18n, data} = shopify;
  const [src, setSrc] = useState(null);
  const [printReportCards, setPrintReportCards] = useState(true);
  
  // Log the order data for debugging
  console.log('Order data received:', data);
  
  useEffect(() => {
    // The extension receives order data in data.selected array
    // Each order has an id (GID format) and possibly a name property
    if (data && data.selected && data.selected.length > 0 && printReportCards) {
      const order = data.selected[0];
      console.log('Processing order:', order);
      
      if (order && order.id) {
        // Try to get the order number from the order data
        // The order.id is in format: gid://shopify/Order/5678901234567
        // But we need the order name/number (like #1217)
        
        // First check if we have a name property
        let orderNumber = null;
        
        // If the order has a name field (like "#1217"), use it
        if (order.name) {
          orderNumber = order.name.replace('#', '');
        } else {
          // Fallback: extract the numeric ID from the GID and use it
          // This might not match the order number exactly
          const match = order.id.match(/Order\/(\d+)/);
          if (match && match[1]) {
            // Note: This is the internal order ID, not the order number
            // The print route expects the order number, so this is a fallback
            orderNumber = match[1];
            console.warn('Using order ID as fallback, order name not available');
          }
        }
        
        if (orderNumber) {
          const printUrl = `https://underitall.replit.app/print/${orderNumber}`;
          console.log('Setting print URL for order:', orderNumber, printUrl);
          setSrc(printUrl);
        } else {
          console.log('Could not determine order number from data:', order);
          setSrc(null);
        }
      } else {
        setSrc(null);
      }
    } else if (!printReportCards) {
      // Checkbox is unchecked
      setSrc(null);
    } else {
      console.log('No order data available or checkbox unchecked');
      setSrc(null);
    }
  }, [data, printReportCards]);
  
  return (
    <s-admin-print-action src={src}>
      <s-stack direction="block">
        <s-banner tone="info" heading={i18n.translate('bannerTitle')}>
          {i18n.translate('bannerBody')}
        </s-banner>
        
        <s-text type="strong">{i18n.translate('printOptions')}</s-text>
        
        <s-checkbox
          name="print-report-cards"
          checked={printReportCards}
          onChange={(event) => {
            // Access checked property directly from event.target
            setPrintReportCards(event.target?.['checked'] || false);
          }}
          label={i18n.translate('reportCards')}
        >
        </s-checkbox>
        
        <s-text>
          {i18n.translate('description')}
        </s-text>
      </s-stack>
    </s-admin-print-action>
  );
}