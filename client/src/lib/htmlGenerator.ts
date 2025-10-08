import { ShopifyOrder, ShopifyLineItem, ShopifyLineItemProperty } from "@shared/schema";

const escapeHtml = (unsafe: string | null | undefined): string => {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const findPropertyValue = (properties: ShopifyLineItemProperty[], name: string): string => {
  const prop = properties.find(p =>
    p.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
  return prop?.value?.trim() || '';
};

const parseTitleForLabel = (item: ShopifyLineItem): { title: string; properties: string[] } => {
  // Clean the title - remove Default_cpc suffix
  const cleanTitle = item.title.replace(/ - Default_cpc_.*$/, '').trim();
  
  // Filter and format properties - exclude _ZapietId and any empty values
  const relevantProperties = item.properties
    .filter(prop => {
      const name = prop.name.trim().toLowerCase();
      return prop.value && 
             prop.value.trim() !== '' && 
             !name.startsWith('_') &&
             name !== '_zapietid';
    })
    .map(prop => {
      // Format the property as "Name: Value"
      return `${prop.name.trim()}: ${prop.value.trim()}`;
    });
  
  return {
    title: escapeHtml(cleanTitle),
    properties: relevantProperties.map(p => escapeHtml(p))
  };
};

const generateOrderHeaderHTML = (order: ShopifyOrder): string => {
  const clientName = escapeHtml(order.shipping_address?.name || `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim());
  const company = order.shipping_address?.company ? escapeHtml(order.shipping_address.company) : '';
  const orderNumber = escapeHtml(order.name.replace('#', ''));
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US');
  
  // Extract PO# from line item properties
  let poNumber = '';
  for (const item of order.line_items) {
    const po = findPropertyValue(item.properties, 'PO#');
    if (po) {
      poNumber = escapeHtml(po);
      break;
    }
  }
  
  const addressLines = [];
  if (order.shipping_address?.address1) addressLines.push(escapeHtml(order.shipping_address.address1));
  if (order.shipping_address?.address2) addressLines.push(escapeHtml(order.shipping_address.address2));
  
  const cityStateZip = [];
  if (order.shipping_address?.city) cityStateZip.push(escapeHtml(order.shipping_address.city));
  if (order.shipping_address?.province_code) cityStateZip.push(escapeHtml(order.shipping_address.province_code));
  if (order.shipping_address?.zip) cityStateZip.push(escapeHtml(order.shipping_address.zip));
  if (cityStateZip.length > 0) addressLines.push(cityStateZip.join(', '));
  
  if (order.shipping_address?.country && order.shipping_address.country !== 'United States') {
    addressLines.push(escapeHtml(order.shipping_address.country));
  }

  return `
    <div class="card header-card">
      <div class="logo">
        <img src="https://www.itsunderitall.com/cdn/shop/files/UnderItAll_Logo_FeltGrey_350x.png?v=1720724526" alt="UNDERITALL Logo">
      </div>
      <div class="header-content">
        <div class="header-info-grid">
          <div class="info-col">
            <div class="info-item"><span class="label">Ship To:</span></div>
            ${company ? `<div class="info-item">${company}</div>` : ''}
            <div class="info-item">Attn: ${clientName}</div>
            ${addressLines.map(line => `<div class="info-item">${line}</div>`).join('')}
          </div>
          <div class="info-col">
            <div class="info-item">Order: ${orderNumber}</div>
            <div class="info-item">Order Date: ${orderDate}</div>
            ${poNumber ? `<div class="info-item">PO #: ${poNumber}</div>` : ''}
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="thank-you">THANK YOU FOR GOING SCISSORLESS!</div>
        <div class="contact-info">
          PHONE: (404) 439-0985 - EMAIL: INFO@ITSUNDERITALL.COM
        </div>
      </div>
    </div>
  `;
};

export function generateReportCardHTML(order: ShopifyOrder, hideHeader: boolean = false): string {
  const clientName = escapeHtml(order.shipping_address?.name || `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim());
  const poNumber = escapeHtml(order.name);
  const packagedDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

  const orderHeaderHtml = hideHeader ? '' : generateOrderHeaderHTML(order);

  const cardsHtml = order.line_items.flatMap((item: ShopifyLineItem) => {
    const { title, properties } = parseTitleForLabel(item);

    return Array.from({ length: item.quantity }, (_, i) => `
      <div class="card">
        <div class="logo">
          <img src="https://www.itsunderitall.com/cdn/shop/files/UnderItAll_Logo_FeltGrey_350x.png?v=1720724526" alt="UNDERITALL Logo">
        </div>

        <div class="info-grid">
          <div class="info-left">
            <div><span class="label">Client Name:</span> ${clientName}</div>
            <div><span class="label">Sidemark:</span> UnderItAll</div>
          </div>
          <div class="info-right">
            <div><span class="label">PO #:</span> ${poNumber}</div>
            <div><span class="label">Packaged:</span> ${packagedDate}</div>
          </div>
        </div>

        <hr />

        <div class="pad-description">
          <div class="item-title">${title}</div>
          ${properties.length > 0 ? `
            <div class="properties-grid">
              ${properties.map(prop => `<div class="property-item">• ${prop}</div>`).join('')}
            </div>
          ` : ''}
        </div>

        <hr />

        <div class="footer">
          <div class="thank-you">THANK YOU FOR GOING SCISSORLESS!</div>
          <div class="contact-info">
            PHONE: (404) 439-0985 - EMAIL: INFO@ITSUNDERITALL.COM
          </div>
        </div>
      </div>
    `);
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Cards for Order ${escapeHtml(order.name)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    body {
      font-family: 'Inter', sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #000000;
      margin: 0;
      padding: 0.5rem;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 0 2rem;
      max-width: 100vw;
      overflow-x: hidden;
    }

    .card {
      background-color: white;
      border: 1px solid #e5e7eb;
      padding: 32px;
      box-sizing: border-box;
      width: 8.5in;
      height: 5.5in;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      page-break-inside: avoid;
      color: #111827;
      transform-origin: top center;
      transform: scale(0.85);
    }

    @media screen and (max-width: 1000px) {
      .card {
        transform: scale(0.75);
      }
      .container {
        padding: 0 1rem;
      }
    }

    @media screen and (max-width: 768px) {
      .card {
        transform: scale(0.6);
      }
      .container {
        padding: 0 0.5rem;
      }
    }

    .logo {
      text-align: center;
      padding-bottom: 24px;
    }

    .logo img {
      width: 250px;
      height: auto;
      filter: none;
    }

    .info-grid {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .info-left, .info-right {
      width: 48%;
    }

    .info-left div, .info-right div {
      margin-bottom: 6px;
    }

    .info-grid .label {
      display: inline-block;
      width: 110px;
      color: #6b7280;
      font-weight: 500;
    }

    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 20px 0;
    }

    .pad-description {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #111827;
      gap: 16px;
    }

    .item-title {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;
    }

    .properties-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 16px;
      width: 100%;
      max-width: 90%;
      font-size: 11px;
      text-align: left;
      color: #374151;
    }

    .property-item {
      line-height: 1.4;
    }

    .header-card .header-content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .header-title {
      text-align: center;
      font-size: 36px;
      font-weight: 700;
      margin: 0 0 24px 0;
      color: #111827;
    }

    .header-info-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .info-col {
      font-size: 16px;
      font-weight: 600;
      width: 48%;
    }

    .info-item {
      margin-bottom: 8px;
    }

    .info-item .label, .address-info .label {
      color: #6b7280;
      font-weight: 500;
      margin-right: 8px;
    }

    .address-info {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.5;
    }

    .footer {
      text-align: center;
    }

    .footer .thank-you {
      font-weight: 700;
      font-size: 12px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4b5563;
    }

    .footer .contact-info {
      font-size: 12px;
      font-weight: 700;
      color: #4b5563;
    }

    @media print {
      @page {
        size: landscape;
        margin: 0;
      }
      body {
        background-color: white !important;
        padding: 0;
        margin: 0;
        -webkit-print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
      .container {
        gap: 0;
        margin: 0;
        padding: 0;
        width: 100%;
        align-items: initial;
      }
      .card {
        width: 100%;
        height: 100vh;
        border: none !important;
        box-shadow: none !important;
        page-break-after: always;
        padding: 32px;
        box-sizing: border-box;
        margin: 0;
        background-color: white !important;
        color: black !important;
      }
      .card * {
        color: black !important;
      }
      .card:last-of-type {
        page-break-after: auto;
      }
      .logo img {
        filter: none !important;
      }
      hr {
        border-top: 1px solid #ddd !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${orderHeaderHtml}
    ${cardsHtml}
  </div>
</body>
</html>
  `.trim();
}