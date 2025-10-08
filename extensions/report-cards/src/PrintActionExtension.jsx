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
    // Check if we have order data
    if (data && data.selected && data.selected.length > 0) {
      // Extract order information
      const order = data.selected[0];
      
      if (order && order.id && printReportCards) {
        // The order ID is a GID like "gid://shopify/Order/1234567890"
        // We need to extract the order name/number if available
        // For now, we'll extract the numeric ID from the GID
        const orderIdMatch = order.id.match(/Order\/(\d+)/);
        
        if (orderIdMatch && orderIdMatch[1]) {
          const orderId = orderIdMatch[1];
          
          // Build the URL for our print route using the numeric order ID
          // Note: This assumes your backend can lookup orders by ID
          // You may need to modify your backend to accept order ID instead of order name
          const printUrl = `https://underitall.replit.app/print/${orderId}`;
          
          console.log('Setting print URL for order ID:', orderId, printUrl);
          setSrc(printUrl);
        } else {
          console.log('Could not extract order ID from:', order.id);
          setSrc(null);
        }
      } else {
        setSrc(null);
      }
    } else {
      console.log('No order data available');
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
            // Cast to the expected checkbox element type
            const checkbox = event.target;
            setPrintReportCards(checkbox.checked);
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