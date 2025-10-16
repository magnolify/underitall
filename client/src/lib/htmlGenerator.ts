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

const findProjectName = (properties: ShopifyLineItemProperty[]): string => {
  // Search for "Project Name", "Project Name ", or "Project Name/Sidemark "
  const prop = properties.find(p => {
    const name = p.name.trim().toLowerCase();
    return name === 'project name' ||
           name === 'project name/sidemark' ||
           name.startsWith('project name');
  });
  return prop?.value?.trim() || '';
};

const parseTitleForLabel = (item: ShopifyLineItem): { title: string; properties: string[]; dimensions: string; poNumber: string; projectName: string } => {
  // Clean the title - remove Default_cpc suffix
  const cleanTitle = item.title.replace(/ - Default_cpc_.*$/, '').trim();

  // Extract special properties
  const poNumber = findPropertyValue(item.properties, 'PO#');
  const projectName = findProjectName(item.properties);

  // Extract dimension properties - search for properties containing "width" and "length"
  const widthFtProp = item.properties.find(p => p.name.toLowerCase().includes('width') && p.name.toLowerCase().includes('(ft)'));
  const widthInProp = item.properties.find(p => p.name.toLowerCase().includes('width') && p.name.toLowerCase().includes('(in)'));
  const lengthFtProp = item.properties.find(p => p.name.toLowerCase().includes('length') && p.name.toLowerCase().includes('(ft)'));
  const lengthInProp = item.properties.find(p => p.name.toLowerCase().includes('length') && p.name.toLowerCase().includes('(in)'));

  // Build dimension strings
  let width = '';
  if (widthFtProp?.value || widthInProp?.value) {
    const ft = widthFtProp?.value?.trim() || '';
    const inches = widthInProp?.value?.trim() || '';
    if (ft && inches && inches !== '0 in') {
      width = `${ft} ${inches}`;
    } else if (ft) {
      width = ft;
    } else if (inches) {
      width = inches;
    }
  }

  let length = '';
  if (lengthFtProp?.value || lengthInProp?.value) {
    const ft = lengthFtProp?.value?.trim() || '';
    const inches = lengthInProp?.value?.trim() || '';
    if (ft && inches && inches !== '0 in') {
      length = `${ft} ${inches}`;
    } else if (ft) {
      length = ft;
    } else if (inches) {
      length = inches;
    }
  }

  // Build dimensions string if we have length and/or width
  let dimensions = '';
  if (width && length) {
    dimensions = `DIMENSIONS: ${width} W x ${length} L`;
  } else if (width) {
    dimensions = `DIMENSIONS: ${width}`;
  } else if (length) {
    dimensions = `DIMENSIONS: ${length}`;
  }

  // Filter and format properties - exclude dimension properties, _ZapietId, PO#, Project Name, and any empty values
  const excludedPatterns = ['width', 'length'];
  const excludedKeys = ['_zapietid', 'po#', 'project name'];
  const relevantProperties = item.properties
    .filter(prop => {
      const name = prop.name.trim().toLowerCase();
      return prop.value &&
             prop.value.trim() !== '' &&
             !name.startsWith('_') &&
             !excludedKeys.includes(name) &&
             !excludedPatterns.some(pattern => name.includes(pattern));
    })
    .map(prop => {
      // Format the property as "Name: Value"
      return `${prop.name.trim()}: ${prop.value.trim()}`;
    });

  return {
    title: escapeHtml(cleanTitle),
    properties: relevantProperties.map(p => escapeHtml(p)),
    dimensions: escapeHtml(dimensions),
    poNumber: escapeHtml(poNumber),
    projectName: escapeHtml(projectName)
  };
};

const formatOrderDate = (dateString: string): string => {
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
};

const generateOrderHeaderHTML = (order: ShopifyOrder): string => {
  const clientName = escapeHtml(order.shipping_address?.name || `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim());
  const company = order.shipping_address?.company ? escapeHtml(order.shipping_address.company) : '';
  const orderNumber = escapeHtml(order.name.replace('#', ''));
  const orderDate = formatOrderDate(order.created_at);

  // Extract PO# and Project Name from line item properties
  let poNumber = '';
  let projectName = '';
  for (const item of order.line_items) {
    const po = findPropertyValue(item.properties, 'PO#');
    if (po) {
      poNumber = escapeHtml(po);
    }
    const project = findProjectName(item.properties);
    if (project) {
      projectName = escapeHtml(project);
    }
    if (poNumber && projectName) break;
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

  // Generate line items summary
  const lineItemsSummary = order.line_items.map(item => {
    const { title, dimensions } = parseTitleForLabel(item);
    const location = findPropertyValue(item.properties, 'Install Location') || findPropertyValue(item.properties, 'Location');

    const parts = [title];
    if (dimensions) parts.push(dimensions.replace('DIMENSIONS: ', ''));
    if (location) parts.push(`Location: ${escapeHtml(location)}`);

    return `<div class="summary-item">• ${parts.join(' - ')}</div>`;
  }).join('');

  return `
    <div class="card">
      <div class="logo">
        <img src="${window.location.origin}/uia_logo.png" alt="UNDERITALL Logo">
      </div>

      <div class="info-grid">
        <div class="info-left">
          <div><span class="label">Ship To:</span></div>
          ${company ? `<div>${company}</div>` : ''}
          <div>Attn: ${clientName}</div>
          ${addressLines.map(line => `<div>${line}</div>`).join('')}
        </div>
        <div class="info-right">
          <div><span class="label">UIA Order #:</span> ${orderNumber}</div>
          <div><span class="label">Order Date:</span> ${orderDate}</div>
          <div><span class="label">PO #:</span> ${poNumber || 'Not Provided'}</div>
          <div><span class="label">Project Name/Sidemark:</span><br/>${projectName || 'Not Provided'}</div>
        </div>
      </div>

      <hr />

      <div class="pad-description summary-section">
        <div style="font-size: 14px; color: #1a1a1a; font-weight: 600;">
          ORDER SUMMARY ( ${order.line_items.length} ITEM${order.line_items.length !== 1 ? 'S' : ''} )
        </div>
        ${lineItemsSummary}
      </div>

      <hr />

      <div class="footer">
        <div class="thank-you">THANK YOU FOR GOING SCISSORLESS!</div>
        <div class="contact-info">
          PHONE: (404) 436-0985 - EMAIL: INFO@ITSUNDERITALL.COM
        </div>
      </div>
    </div>
  `;
};

export function generateReportCardHTML(order: ShopifyOrder, hideHeader: boolean = false): string {
  const clientName = escapeHtml(order.shipping_address?.name || `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim());
  const orderNumber = escapeHtml(order.name.replace('#', ''));
  const orderDate = formatOrderDate(order.created_at);
  const poNumber = escapeHtml(order.name);
  const packagedDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });

  const orderHeaderHtml = hideHeader ? '' : generateOrderHeaderHTML(order);

  // Extract PO# from line item properties for item cards
  let itemPoNumber = '';
  for (const item of order.line_items) {
    const po = findPropertyValue(item.properties, 'PO#');
    if (po) {
      itemPoNumber = escapeHtml(po);
      break;
    }
  }

  const company = order.shipping_address?.company ? escapeHtml(order.shipping_address.company) : '';
  const addressLines = [];
  if (order.shipping_address?.address1) addressLines.push(escapeHtml(order.shipping_address.address1));
  if (order.shipping_address?.address2) addressLines.push(escapeHtml(order.shipping_address.address2));

  const cityStateZip = [];
  if (order.shipping_address?.city) cityStateZip.push(escapeHtml(order.shipping_address.city));
  if (order.shipping_address?.province_code) cityStateZip.push(escapeHtml(order.shipping_address.province_code));
  if (order.shipping_address?.zip) cityStateZip.push(escapeHtml(order.shipping_address.zip));
  if (cityStateZip.length > 0) addressLines.push(cityStateZip.join(', '));

  const cardsHtml = order.line_items.flatMap((item: ShopifyLineItem) => {
    const { title, properties, dimensions, poNumber: itemPo, projectName } = parseTitleForLabel(item);

    return Array.from({ length: item.quantity }, (_, i) => `
      <div class="card">
        <div class="logo">
          <img src="${window.location.origin}/uia_logo.png" alt="UNDERITALL Logo">
        </div>

        <div class="info-grid">
          <div class="info-left">
            <div><span class="label">Ship To:</span></div>
            ${company ? `<div>${company}</div>` : ''}
            <div>Attn: ${clientName}</div>
            ${addressLines.map(line => `<div>${line}</div>`).join('')}
          </div>
          <div class="info-right">
            <div><span class="label">Order Date:</span> ${orderDate}</div>
            <div><span class="label">UIA Order #:</span> ${orderNumber}</div>
            <div><span class="label">PO #:</span> ${itemPo || 'Not Provided'}</div>
            <div><span class="label">Project Name/Sidemark:</span><br/>${projectName || 'Not Provided'}</div>
          </div>
        </div>

        <hr />

        <div class="pad-description">
          <div class="item-title">${title}</div>
          ${dimensions ? `<div class="dimensions-line">${dimensions}</div>` : ''}
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
            PHONE: (404) 436-0985 - EMAIL: INFO@ITSUNDERITALL.COM
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
    @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Vazirmatn:wght@400;500;600;700&family=Lora:ital@1&display=swap');

    body {
      font-family: 'Vazirmatn', Arial, sans-serif;
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
      padding: 20px;
      box-sizing: border-box;
      width: 8in;
      height: 4in;
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
        transform: scale(0.95);
      }
      .container {
        padding: 0 1rem;
      }
    }

    @media screen and (max-width: 768px) {
      .card {
        transform: scale(0.9);
      }
      .container {
        padding: 0 0.5rem;
      }
    }

    .logo {
      text-align: center;
      padding-bottom: 12px;
    }

    .logo img {
      width: 200px;
      max-width: 250px;
      height: auto;
      filter: none;
    }

    .info-grid {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 600;
      color: #1f2937;
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
      display: inline-block;
      width: 90px;
      color: #6b7280;
      font-weight: 500;
    }

    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 12px 0;
    }

    .pad-description {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #111827;
      gap: 0px;
      padding: 0;
    }

    .summary-section {
      text-align: left;
      padding: 0px 0px;
    }

    .summary-item {
      margin-bottom: 2px;
      font-size: 10px;
      line-height: 1.2;
      color: #374151;
    }

    .item-title {
      font-family: 'Archivo', Arial, sans-serif;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.1;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .dimensions-line {
      font-family: 'Archivo', Arial, sans-serif;
      font-size: 20px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0;
      color: #000000;
      text-align: center;
    }

    .properties-grid {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      width: 100%;
      font-size: 10px;
      text-align: center;
      color: #374151;
      margin-top: 6px;
    }

    .property-item {
      line-height: 1.2;
    }

    .header-card .header-content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .header-title {
      text-align: center;
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 16px 0;
      color: #111827;
    }

    .header-info-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .info-col {
      font-size: 14px;
      font-weight: 600;
      width: 48%;
    }

    .info-item {
      margin-bottom: 6px;
    }

    .info-item .label, .address-info .label {
      color: #6b7280;
      font-weight: 500;
      margin-right: 6px;
    }

    .address-info {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.3;
    }

    .footer {
      text-align: center;
    }

    .footer .thank-you {
      font-weight: 700;
      font-size: 12px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4b5563;
    }

    .footer .contact-info {
      font-size: 10px;
      font-weight: 700;
      color: #4b5563;
      line-height: 0.8;
    }

    @media print {
      @page {
        size: 8in 4in landscape;
        margin-top: 0.5in;
        margin-right: 0.5in;
        margin-bottom: 0.5in;
        margin-left: 0.5in;
      }
      body {
        background-color: white !important;
        padding: 0;
        margin: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
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
        page-break-inside: avoid;
        break-after: page;
        break-inside: avoid;
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
        break-after: auto;
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