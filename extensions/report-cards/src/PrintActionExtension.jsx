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
    if (data && data.selected && data.selected.length > 0 && printReportCards) {
      const order = data.selected[0];
      console.log('Processing order:', order);
      
      if (order && order.id) {
        // Extract the numeric ID from the GID format
        // Format: gid://shopify/Order/6509259587819
        const match = order.id.match(/Order\/(\d+)/);
        if (match && match[1]) {
          const orderId = match[1];
          const printUrl = `/print/${orderId}`;
          console.log('Setting print URL for order ID:', orderId);
          setSrc(printUrl);
        } else {
          console.error('Could not extract order ID from:', order.id);
          setSrc(null);
        }
      } else {
        console.error('No order ID found in data:', order);
        setSrc(null);
      }
    } else if (!printReportCards) {
      setSrc(null);
    } else {
      console.log('No order data or checkbox unchecked');
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