export function generateReportCardHTML(orderData, printType = 'all') {
  const { name, createdAt, totalPriceSet, shippingAddress, lineItems } = orderData;

  const orderDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const items = lineItems?.edges || [];
  
  let reportCards = '';

  reportCards += `
    <div class="report-card header-card">
      <div class="card-header">
        <h1>Order Report Card</h1>
        <div class="order-info">
          <p><strong>Order:</strong> ${name}</p>
          <p><strong>Date:</strong> ${orderDate}</p>
          <p><strong>Total:</strong> $${totalPriceSet.shopMoney.amount} ${totalPriceSet.shopMoney.currencyCode}</p>
        </div>
      </div>
      
      <div class="shipping-info">
        <h2>Shipping Address</h2>
        <p>${shippingAddress.firstName} ${shippingAddress.lastName}</p>
        <p>${shippingAddress.address1}</p>
        <p>${shippingAddress.city}, ${shippingAddress.province} ${shippingAddress.zip}</p>
        <p>${shippingAddress.country}</p>
      </div>

      <div class="line-items-summary">
        <h2>Line Items</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(({ node }) => `
              <tr>
                <td>${node.name}</td>
                <td>${node.sku || 'N/A'}</td>
                <td>${node.quantity}</td>
                <td>$${node.originalUnitPriceSet.shopMoney.amount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  items.forEach(({ node }) => {
    const customProps = node.customAttributes || [];
    const projectName = customProps.find(attr => attr.key === 'Project Name')?.value || '';
    const installLocation = customProps.find(attr => attr.key === 'Install Location')?.value || '';
    const dimensions = customProps.find(attr => attr.key === 'Dimensions')?.value || '';

    for (let i = 1; i <= node.quantity; i++) {
      reportCards += `
        <div class="report-card item-card">
          <div class="card-number">${i} of ${node.quantity}</div>
          <div class="item-details">
            <h2>${node.name}</h2>
            <p class="sku">SKU: ${node.sku || 'N/A'}</p>
            ${dimensions ? `<p class="dimensions"><strong>Dimensions:</strong> ${dimensions}</p>` : ''}
            ${projectName ? `<p class="project"><strong>Project:</strong> ${projectName}</p>` : ''}
            ${installLocation ? `<p class="location"><strong>Install Location:</strong> ${installLocation}</p>` : ''}
          </div>
          <div class="order-reference">
            <p>Order: ${name}</p>
            <p>Date: ${orderDate}</p>
          </div>
        </div>
      `;
    }
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Report Cards - ${name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: #1a1a1a;
          color: #333;
          padding: 20px;
        }

        .report-card {
          width: 8.5in;
          height: 5.5in;
          background: white;
          padding: 40px;
          margin: 20px auto;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header-card {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-header h1 {
          font-size: 32px;
          color: #000;
          margin-bottom: 10px;
        }

        .order-info {
          display: flex;
          gap: 20px;
          margin-top: 10px;
        }

        .order-info p {
          font-size: 14px;
        }

        .shipping-info {
          margin-top: 20px;
        }

        .shipping-info h2 {
          font-size: 18px;
          margin-bottom: 10px;
          color: #000;
        }

        .shipping-info p {
          font-size: 14px;
          margin: 2px 0;
        }

        .line-items-summary {
          margin-top: 20px;
        }

        .line-items-summary h2 {
          font-size: 18px;
          margin-bottom: 10px;
          color: #000;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        th {
          background: #f5f5f5;
          font-weight: 600;
        }

        .item-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-number {
          position: absolute;
          top: 20px;
          right: 20px;
          font-size: 14px;
          font-weight: 600;
          color: #666;
        }

        .item-details h2 {
          font-size: 28px;
          margin-bottom: 15px;
          color: #000;
        }

        .sku {
          font-size: 16px;
          color: #666;
          margin-bottom: 20px;
        }

        .dimensions, .project, .location {
          font-size: 16px;
          margin: 8px 0;
        }

        .order-reference {
          margin-top: auto;
          padding-top: 20px;
          border-top: 2px solid #000;
        }

        .order-reference p {
          font-size: 14px;
          color: #666;
        }

        @media print {
          body {
            background: white;
            padding: 0;
          }

          .report-card {
            width: 8.5in;
            height: 5.5in;
            margin: 0;
            padding: 40px;
            page-break-after: always;
            box-shadow: none;
            border-radius: 0;
          }

          .report-card:last-child {
            page-break-after: auto;
          }
        }

        @page {
          size: 8.5in 5.5in landscape;
          margin: 0;
        }
      </style>
    </head>
    <body>
      ${reportCards}
    </body>
    </html>
  `;
}
