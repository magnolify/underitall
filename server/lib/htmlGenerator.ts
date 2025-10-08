import { escape } from 'html-escaper';

interface ShopifyLineItem {
  id: string;
  title: string;
  quantity: number;
  sku: string;
  variantTitle?: string;
  name: string;
  properties: Array<{ key: string; value: string }>;
  customAttributes?: Array<{ key: string; value: string }>;
}

interface ShopifyAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  provinceCode?: string;
  zip?: string;
  country?: string;
  countryCode?: string;
  phone?: string;
  name?: string;
}

interface ShopifyOrder {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  lineItems: ShopifyLineItem[];
  shippingAddress?: ShopifyAddress;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

function escapeHtml(str: string | undefined): string {
  return escape(str || '');
}

function findPropertyValue(properties: Array<{ key: string; value: string }> | undefined, key: string): string {
  if (!properties) return '';
  const prop = properties.find(p => p.key.toLowerCase() === key.toLowerCase());
  return prop?.value || '';
}

function parseTitleForLabel(item: ShopifyLineItem): { title: string; properties: string[] } {
  const title = item.title || item.name || '';

  // Clean the title - remove Default_cpc suffix
  const cleanTitle = title.replace(/ - Default_cpc_.*$/, '').trim();

  // Filter and format properties - exclude _ZapietId and any empty values
  const relevantProperties = (item.properties || [])
    .filter(prop => {
      const name = prop.key.trim().toLowerCase();
      return prop.value &&
             prop.value.trim() !== '' &&
             !name.startsWith('_') &&
             name !== '_zapietid';
    })
    .map(prop => {
      // Format the property as "Name: Value"
      return `${prop.key.trim()}: ${prop.value.trim()}`;
    });

  return {
    title: escapeHtml(cleanTitle),
    properties: relevantProperties.map(p => escapeHtml(p))
  };
}

function formatOrderDate(dateString: string): string {
  const date = new Date(dateString);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  // Add ordinal suffix (st, nd, rd, th)
  const suffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return `${month} ${day}${suffix(day)}, ${year}`;
}

function generateOrderHeaderHTML(order: ShopifyOrder): string {
  const clientName = escapeHtml(order.shippingAddress?.name ||
    `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim());
  const orderNumber = escapeHtml(order.name.replace('#', ''));
  const orderDate = formatOrderDate(order.createdAt);

  // Extract PO# from line item properties
  let poNumber = '';
  for (const item of order.lineItems) {
    const po = findPropertyValue(item.properties, 'PO#');
    if (po) {
      poNumber = escapeHtml(po);
      break;
    }
  }

  const address = order.shippingAddress;
  const company = address?.company ? escapeHtml(address.company) : '';
  const addressLines = [];

  if (address?.address1) addressLines.push(escapeHtml(address.address1));
  if (address?.address2) addressLines.push(escapeHtml(address.address2));

  const cityStateZip = [];
  if (address?.city) cityStateZip.push(escapeHtml(address.city));
  if (address?.province) cityStateZip.push(escapeHtml(address.province));
  if (address?.zip) cityStateZip.push(escapeHtml(address.zip));
  if (cityStateZip.length > 0) addressLines.push(cityStateZip.join(', '));

  if (address?.country && address.country !== 'United States') {
    addressLines.push(escapeHtml(address.country));
  }

  return `
    <div class="card">
      <div class="logo">
        <img src="https://www.itsunderitall.com/cdn/shop/files/UnderItAll_Logo_FeltGrey_350x.png?v=1720724526" alt="UNDERITALL Logo">
      </div>

      <div class="info-grid">
        <div class="info-left">
          <div><span class="label">Ship To:</span></div>
          ${company ? `<div>${company}</div>` : ''}
          <div>Attn: ${clientName}</div>
          ${addressLines.map(line => `<div>${line}</div>`).join('')}
        </div>
        <div class="info-right">
          <div><span class="label">Order #:</span> ${orderNumber}</div>
          <div><span class="label">Order Date:</span> ${orderDate}</div>
          ${poNumber ? `<div><span class="label">PO #:</span> ${poNumber}</div>` : ''}
        </div>
      </div>

      <hr />

      <div class="pad-description">
        <div style="font-size: 14px; color: #6b7280; font-weight: 500;">
          Total Line Items: ${order.lineItems.length}
        </div>
      </div>

      <hr />

      <div class="footer">
        <div class="thank-you">THANK YOU FOR GOING SCISSORLESS!</div>
        <div class="contact-info">
          PHONE: (404) 439-0985 - EMAIL: INFO@ITSUNDERITALL.COM
        </div>
      </div>
    </div>
  `;
}

export function generateReportCardHTML(order: ShopifyOrder, hideHeader: boolean = false): string {
  const clientName = escapeHtml(order.shippingAddress?.name ||
    `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim());
  const orderNumber = escapeHtml(order.name.replace('#', ''));
  const orderDate = formatOrderDate(order.createdAt);
  const poNumber = escapeHtml(order.name);
  const packagedDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

  const orderHeaderHtml = hideHeader ? '' : generateOrderHeaderHTML(order);

  // Extract PO# from line item properties for item cards
  let itemPoNumber = '';
  for (const item of order.lineItems) {
    const po = findPropertyValue(item.properties, 'PO#');
    if (po) {
      itemPoNumber = escapeHtml(po);
      break;
    }
  }

  const address = order.shippingAddress;
  const company = address?.company ? escapeHtml(address.company) : '';
  const addressLines = [];

  if (address?.address1) addressLines.push(escapeHtml(address.address1));
  if (address?.address2) addressLines.push(escapeHtml(address.address2));

  const cityStateZip = [];
  if (address?.city) cityStateZip.push(escapeHtml(address.city));
  if (address?.province) cityStateZip.push(escapeHtml(address.province));
  if (address?.zip) cityStateZip.push(escapeHtml(address.zip));
  if (cityStateZip.length > 0) addressLines.push(cityStateZip.join(', '));

  const cardsHtml = order.lineItems.flatMap((item: ShopifyLineItem) => {
    const { title, properties } = parseTitleForLabel(item);

    return Array.from({ length: item.quantity }, (_, i) => `
      <div class="card">
        <div class="logo">
          <img src="https://www.itsunderitall.com/cdn/shop/files/UnderItAll_Logo_FeltGrey_350x.png?v=1720724526" alt="UNDERITALL Logo">
        </div>

        <div class="info-grid">
          <div class="info-left">
            <div><span class="label">Ship To:</span></div>
            ${company ? `<div>${company}</div>` : ''}
            <div>Attn: ${clientName}</div>
            ${addressLines.map(line => `<div>${line}</div>`).join('')}
          </div>
          <div class="info-right">
            <div><span class="label">Order #:</span> ${orderNumber}</div>
            <div><span class="label">Order Date:</span> ${orderDate}</div>
            ${itemPoNumber ? `<div><span class="label">PO #:</span> ${itemPoNumber}</div>` : ''}
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

    * {
      box-sizing: border-box;
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
      padding: 24px;
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
      overflow: hidden;
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
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
    }

    .logo img {
      width: 70%;
      height: auto;
      filter: grayscale(20%);
      opacity: 0.9;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 12px;
      font-size: 11px;
    }

    .info-left, .info-right {
      width: 50%;
    }

    .info-left div, .info-right div {
      margin-bottom: 1px;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .info-grid .label {
      font-weight: 600;
      color: #333;
      margin-right: 6px;
    }

    hr {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 12px 0;
    }

    .pad-description {
      padding: 20px 16px;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #1a1a1a;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
    }

    .item-title {
      font-size: 20px;
      font-weight: 700;
      line-height: 1.1;
    }

    .properties-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px 12px;
      width: 100%;
      max-width: 90%;
      font-size: 10px;
      text-align: left;
      color: #374151;
    }

    .property-item {
      line-height: 1.1;
    }

    .header-card .header-content {
      margin-bottom: 8px;
    }

    .footer {
      text-align: center;
      margin-top: auto;
      padding-top: 12px;
    }

    .thank-you {
      font-size: 12px;
      font-weight: 700;
      color: #000;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .contact-info {
      font-size: 10px;
      font-weight: 700;
      color: #4b5563;
      line-height: 1.1;
    }

    @media print {
      @page {
        size: 8.5in 5.5in landscape;
        margin: 0;
      }

      body {
        background-color: white !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .container {
        padding: 0 !important;
      }

      .card {
        break-after: page;
        box-shadow: none !important;
        border: 1px solid #ddd !important;
        background: white !important;
        margin: 0 !important;
        width: 100% !important;
        height: 100% !important;
        transform: scale(0.9);
        transform-origin: center center;
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