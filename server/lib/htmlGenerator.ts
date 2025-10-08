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

function parseTitleForLabel(item: ShopifyLineItem): string {
  const title = item.title || item.name || '';
  
  // Extract dimensions from properties
  const widthProp = findPropertyValue(item.properties, 'Width');
  const lengthProp = findPropertyValue(item.properties, 'Length');
  const installLocation = findPropertyValue(item.properties, 'Install Location');
  const rugShape = findPropertyValue(item.properties, 'Rug Shape');
  const thickness = findPropertyValue(item.properties, 'Thickness');
  
  // If we have dimension properties, use them
  if (widthProp && lengthProp) {
    const width = widthProp;
    const length = lengthProp;
    const shape = rugShape || 'Rectangle';
    const thicknessStr = thickness ? ` - ${thickness}` : '';
    const location = installLocation ? ` - ${installLocation}` : '';
    return `<strong>${shape} (${width}" × ${length}")${thicknessStr}</strong>${location}`;
  }
  
  // Legacy parsing from title
  const dimensionRegex = /(\d+(?:\.\d+)?)['"]\s*[xX×]\s*(\d+(?:\.\d+)?)['"]/;
  const match = title.match(dimensionRegex);
  
  if (match) {
    const width = match[1];
    const length = match[2];
    
    const shapeRegex = /(Rectangle|Square|Circle|Oval|Runner|Custom|Diamond|Hexagon|Triangle)/i;
    const shapeMatch = title.match(shapeRegex) || rugShape;
    const shape = shapeMatch ? (typeof shapeMatch === 'string' ? shapeMatch : shapeMatch[1]) : 'Rectangle';
    
    const thicknessRegex = /(\d+(?:\.\d+)?)['"]\s*(?:Thick|thick)/;
    const thicknessMatch = title.match(thicknessRegex) || thickness;
    const thicknessStr = thicknessMatch ? 
      (typeof thicknessMatch === 'string' ? ` - ${thicknessMatch}` : ` - ${thicknessMatch[1]}" Thick`) : '';
    
    const locationStr = installLocation ? ` - ${installLocation}` : '';
    
    return `<strong>${shape} (${width}" × ${length}")${thicknessStr}</strong>${locationStr}`;
  }
  
  // Fallback
  return `<strong>${escapeHtml(title)}</strong>`;
}

function generateOrderHeaderHTML(order: ShopifyOrder): string {
  const clientName = escapeHtml(order.shippingAddress?.name || 
    `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim());
  const poNumber = escapeHtml(order.name);
  
  const address = order.shippingAddress;
  const addressLines = [];
  
  if (address?.company) addressLines.push(escapeHtml(address.company));
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
  
  const totalQuantity = order.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  
  return `
    <div class="order-header">
      <div class="logo">
        <img src="https://www.itsunderitall.com/cdn/shop/files/UnderItAll_Logo_FeltGrey_350x.png?v=1720724526" alt="UNDERITALL Logo">
      </div>
      
      <h2>Order ${poNumber} Summary</h2>
      <div class="header-details">
        <div class="header-column">
          <div class="header-label">Ship To:</div>
          <div class="header-value">${clientName}</div>
          ${addressLines.map(line => `<div class="header-value">${line}</div>`).join('')}
        </div>
        <div class="header-column">
          <div class="header-label">Order Details:</div>
          <div class="header-value">Order #: ${poNumber}</div>
          <div class="header-value">Total Cards: ${totalQuantity}</div>
          <div class="header-value">Date: ${new Date().toLocaleDateString('en-US')}</div>
        </div>
      </div>
    </div>
  `;
}

export function generateReportCardHTML(order: ShopifyOrder, hideHeader: boolean = false): string {
  const clientName = escapeHtml(order.shippingAddress?.name || 
    `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim());
  const poNumber = escapeHtml(order.name);
  const packagedDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

  const orderHeaderHtml = hideHeader ? '' : generateOrderHeaderHTML(order);

  const cardsHtml = order.lineItems.flatMap((item: ShopifyLineItem) => {
    const padDescription = parseTitleForLabel(item);
    const projectName = findPropertyValue(item.properties, 'Project Name');

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
            <div><span class="label">Project Name:</span> ${escapeHtml(projectName)}</div>
          </div>
        </div>

        <hr />

        <div class="pad-description">
          ${padDescription}
        </div>

        <hr />

        <div class="footer">
          <div class="thank-you">THANK YOU FOR YOUR ORDER !</div>
          <div class="contact-info">
            Phone: (404) 438-0986 - Email: info@underitall.com - Packaged Date: ${packagedDate}
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
      max-width: 100%;
      margin: 0 auto;
      padding: 0.5rem;
    }

    .order-header {
      background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
      border: 1px solid #333;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    .order-header .logo {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .order-header .logo img {
      height: 80px;
      width: auto;
      max-width: 70%;
      filter: brightness(0.9);
    }

    .order-header h2 {
      color: #ffffff;
      text-align: center;
      margin: 0 0 1.5rem 0;
      font-size: 1.8rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .header-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      color: #e0e0e0;
    }

    .header-column {
      padding: 0.5rem;
    }

    .header-label {
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .header-value {
      color: #cccccc;
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .card {
      width: 765px;
      height: 495px;
      background: linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%);
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 50px;
      margin: 0 auto 2rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #666 0%, #999 50%, #666 100%);
    }

    .card:nth-child(even) {
      background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
    }

    .logo {
      display: flex;
      justify-content: center;
      margin-bottom: 25px;
    }

    .logo img {
      height: 100px;
      width: auto;
      max-width: 70%;
      filter: grayscale(20%);
      opacity: 0.9;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .info-left, .info-right {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .label {
      font-weight: 600;
      color: #333;
      margin-right: 8px;
    }

    hr {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 20px 0;
    }

    .pad-description {
      font-size: 24px;
      text-align: center;
      padding: 30px 20px;
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1a1a1a;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
      line-height: 1.4;
    }

    .pad-description strong {
      font-weight: 600;
      color: #000;
    }

    .footer {
      text-align: center;
      margin-top: auto;
      padding-top: 20px;
    }

    .thank-you {
      font-size: 18px;
      font-weight: 700;
      color: #000;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .contact-info {
      font-size: 11px;
      color: #666;
      line-height: 1.4;
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
      
      .order-header {
        break-after: page;
        background: white !important;
        border: 1px solid #ddd !important;
        box-shadow: none !important;
        color: black !important;
      }
      
      .order-header h2,
      .header-label {
        color: black !important;
      }
      
      .header-value {
        color: #333 !important;
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