// Removed unused import
// EmailJS Keys
export const sendSignupEmail = async (userName: string, userEmail: string, userPhone: string = '', signupDate: string = '') => {
  try {
    const response = await fetch('/api/email/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, userEmail, userPhone, signupDate: signupDate || new Date().toLocaleString() })
    });
    if (!response.ok) throw new Error('Failed to send signup email');
    console.log('[Email] Server-side signup emails dispatched successfully.');
  } catch (error) {
    console.error('[Email] Server signup dispatch failed:', error);
  }
};

export const sendLoginEmail = async (userName: string, userEmail: string, userPhone: string = '') => {
  try {
    const response = await fetch('/api/email/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, userEmail, userPhone })
    });
    if (!response.ok) throw new Error('Failed to send login email');
    console.log('[Email] Server-side login emails dispatched safely.');
  } catch (error) {
    console.error('[Email] Server login dispatch failed:', error);
  }
};

const formatOrderJustItemsPlainText = (orderData: any) => {
  let itemLines = '';
  if (orderData.cartItems && orderData.cartItems.length > 0) {
    orderData.cartItems.forEach((item: any, idx: number) => {
      const subtotal = (item.price || 0) * (item.quantity || 1);
      const variantStr = item.variant || item.selectedColor || 'Standard';
      itemLines += `${idx + 1}. ${item.productName || 'Luxury Item'} (Variant: ${variantStr}) x ${item.quantity || 1} | Price: ₹${(item.price || 0).toLocaleString()} | Subtotal: ₹${subtotal.toLocaleString()}\n`;
    });
  } else {
    itemLines = 'No items found.\n';
  }
  return itemLines.trim();
};

const formatOrderJustItemsHtmlTable = (orderData: any) => {
  if (!orderData.cartItems || orderData.cartItems.length === 0) {
    return `<div style="padding: 12px; color: #888888; text-align: center; font-size: 13px;">No items found.</div>`;
  }

  return orderData.cartItems.map((item: any) => {
    const itemImage = item.image || '';
    const variantStr = item.variant || item.selectedColor || '';
    const variantSection = variantStr ? `<div style="font-size: 11px; color: #c5a85c; margin-top: 2px;">Variant: ${variantStr}</div>` : '';
    const qtyPriceStr = `${item.quantity || 1} x ₹${(item.price || 0).toLocaleString()}`;

    return `
      <div style="display: table; width: 100%; border-bottom: 1px solid #1c1c1c; padding: 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Product Image (Selected by user) -->
        <div style="display: table-cell; vertical-align: middle; width: 54px; padding-right: 12px;">
          ${itemImage 
            ? `<img src="${itemImage}" alt="${item.productName}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #333333; display: block;" referrerpolicy="no-referrer" />`
            : `<div style="width: 48px; height: 48px; background-color: #1a1a1a; border-radius: 6px; border: 1px solid #333333; line-height: 48px; text-align: center; font-size: 9px; color: #666666; display: block;">No Image</div>`
          }
        </div>
        <!-- Product Name & Variant -->
        <div style="display: table-cell; vertical-align: middle; text-align: left;">
          <div style="font-weight: 600; font-size: 13px; color: #ffffff; line-height: 1.4;">
            ${item.productName || 'Luxury Item'}
          </div>
          ${variantSection}
        </div>
        <!-- Price and quantity details -->
        <div style="display: table-cell; vertical-align: middle; text-align: right; font-size: 13px; font-weight: 700; color: #c5a85c; font-family: monospace;">
          ${qtyPriceStr}
        </div>
      </div>
    `;
  }).join('');
};

const formatOrderPlainText = (orderData: any) => {
  const totalProductsCount = orderData.cartItems ? orderData.cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0;
  const grandTotalStr = `₹${(orderData.totalAmount || 0).toLocaleString()}`;
  
  let itemLines = '';
  if (orderData.cartItems && orderData.cartItems.length > 0) {
    orderData.cartItems.forEach((item: any, idx: number) => {
      const subtotal = (item.price || 0) * (item.quantity || 1);
      const variantStr = item.variant || item.selectedColor || 'Standard';
      itemLines += `${idx + 1}. Product: ${item.productName || 'Luxury Item'}\n`;
      itemLines += `   Variant: ${variantStr}\n`;
      itemLines += `   Quantity: ${item.quantity || 1}  |  Price: ₹${(item.price || 0).toLocaleString()}\n`;
      itemLines += `   Subtotal: ₹${subtotal.toLocaleString()}\n`;
      itemLines += `--------------------------------------------------\n`;
    });
  } else {
    itemLines = 'No items found.\n';
  }

  return `==================================================
              PRIME ELITE STORE ORDER
==================================================
Order ID: ${orderData.id || 'N/A'}
Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
Payment Method: ${orderData.paymentMethod === 'upi' ? 'UPI / QR Code' : orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : orderData.paymentMethod ? orderData.paymentMethod.toUpperCase() : 'Not Specified'}
Total Items: ${totalProductsCount}
Grand Total: ${grandTotalStr}

CUSTOMER METADATA & DELIVERY DETAILS
--------------------------------------------------
Customer Name: ${orderData.customerName || 'N/A'}
Phone Number:  ${orderData.customerPhone || 'N/A'}
Email Address: ${orderData.customerEmail || 'N/A'}
Delivery Address:
${orderData.deliveryAddress || 'No Address Provided'}

ITEMIZED BREAKDOWN OF LUXURY MERCHANDISE
--------------------------------------------------
${itemLines}==================================================`;
};

const formatOrderHtml = (orderData: any, isCustomer = false) => {
  const totalProductsCount = orderData.cartItems ? orderData.cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0;
  const grandTotalStr = `₹${(orderData.totalAmount || 0).toLocaleString()}`;
  
  const itemsRows = (orderData.cartItems || []).map((item: any, idx: number) => {
    const subtotal = (item.price || 0) * (item.quantity || 1);
    const variantStr = item.variant || item.selectedColor || 'Standard';
    const itemImage = item.image || '';

    return `
      <tr style="border-bottom: 1px solid #1c1c1c;">
        <td style="padding: 12px; text-align: left; vertical-align: middle;">
          ${itemImage ? `<img src="${itemImage}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #333333;" />` : `<div style="width: 50px; height: 50px; background-color: #1a1a1a; border-radius: 6px; border: 1px solid #333333; line-height: 50px; text-align: center; font-size: 10px; color: #666666;">No Image</div>`}
        </td>
        <td style="padding: 12px; text-align: left; vertical-align: middle;">
          <div style="font-weight: 600; font-size: 14px; color: #ffffff;">${item.productName || 'Luxury Item'}</div>
          <div style="font-size: 11px; color: #c5a85c; margin-top: 3px;">Variant: ${variantStr}</div>
        </td>
        <td style="padding: 12px; text-align: right; vertical-align: middle; font-size: 13px; font-weight: 500; color: #dddddd; font-family: monospace;">${item.quantity || 1}</td>
        <td style="padding: 12px; text-align: right; vertical-align: middle; font-size: 13px; color: #aaaaaa; font-family: monospace;">₹${(item.price || 0).toLocaleString()}</td>
        <td style="padding: 12px; text-align: right; vertical-align: middle; font-size: 14px; font-weight: 700; color: #c5a85c; font-family: monospace;">₹${subtotal.toLocaleString()}</td>
      </tr>
    `;
  }).join('');

  const headline = isCustomer ? "Order Confirmed & Approved" : "New Luxury Order Received";
  const subheadline = isCustomer ? "Premium Customer Receipt & Delivery Active" : "Store Administrator Notice";

  const introText = isCustomer 
    ? `<p style="margin: 0 0 16px 0; font-size: 14px; color: #cccccc; line-height: 1.6;">Dear <strong>${orderData.customerName || 'Customer'}</strong>,</p>
       <p style="margin: 0 0 16px 0; font-size: 14px; color: #cccccc; line-height: 1.6;">We are pleased to inform you that your premium purchase from <strong>Prime Elite Store</strong> has been successfully reviewed, verified, and <strong>approved</strong> by our administration team. Your booking is validated, and dispatch preparations have commenced.</p>`
    : `<p style="margin: 0 0 16px 0; font-size: 14px; color: #cccccc; line-height: 1.6;">Attention Admin, a new luxury order has been completed by a customer. Please check the admin portal to manage delivery details and status updates.</p>`;

  const adminContactsPanel = isCustomer ? `
    <div style="background-color: #141414; border: 1px solid #1c1c1c; border-radius: 12px; padding: 22px; margin-top: 24px; text-align: center;">
      <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #c5a85c; margin: 0 0 12px 0; font-weight: bold;">Need Assistance? Contact Support</h3>
      <p style="font-size: 13px; color: #aaaaaa; margin: 0 0 18px 0; line-height: 1.5;">Feel free to reach out directly to coordinate dispatch timelines or clarify custom order requests.</p>
      
      <div style="margin-bottom: 20px;">
        <a href="https://wa.me/916263629683" target="_blank" style="display: inline-block; background-color: #c5a85c; color: #000000; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; box-shadow: 0 4px 12px rgba(197, 168, 92, 0.25);">
          💬 Chat on WhatsApp (+91 6263629683)
        </a>
      </div>
      
      <div style="border-top: 1px solid #222222; padding-top: 18px; font-size: 13px; color: #888888; line-height: 2;">
        Direct Contact: <strong style="color: #ffffff;">+91 6263629683</strong><br/>
        Instagram: <a href="https://www.instagram.com/prime_elite_store/?hl=en" target="_blank" style="color: #c5a85c; text-decoration: none; font-weight: 600;">@prime_elite_store</a><br/>
        Email Support: <a href="mailto:prime.elitestore02@gmail.com" style="color: #c5a85c; text-decoration: none;">prime.elitestore02@gmail.com</a>
      </div>
    </div>
  ` : '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0d; color: #ffffff; border-radius: 16px; border: 1px solid #1c1c1c; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.85);">
      <!-- Brand Header -->
      <div style="background-color: #050505; padding: 32px 24px; border-bottom: 1px solid #1c1c1c; text-align: center;">
        <span style="font-size: 11px; letter-spacing: 4px; color: #c5a85c; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 8px;">Prime Elite Store</span>
        <h1 style="font-size: 22px; margin: 0 0 4px 0; font-weight: 350; text-transform: uppercase; letter-spacing: 1.5px; color: #ffffff;">${headline}</h1>
        <span style="font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 1.5px;">${subheadline}</span>
      </div>

      <div style="padding: 24px;">
        <!-- Intro Message -->
        ${introText}

        <!-- Order & Customer Meta Cards -->
        <div style="background-color: #141414; border: 1px solid #1c1c1c; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
          <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #c5a85c; margin: 0 0 14px 0; border-bottom: 1px solid #222222; padding-bottom: 8px;">Customer & Delivery Details</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #888888;">Order ID:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #ffffff; font-family: monospace;">${orderData.id || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888888;">Customer Name:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #ffffff;">${orderData.customerName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888888;">Contact Phone:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #ffffff;">${orderData.customerPhone || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888888;">Email Address:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #ffffff;">${orderData.customerEmail || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888888; vertical-align: top;">Delivery Address:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #ffffff; max-width: 250px; word-break: break-word;">${orderData.deliveryAddress || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #888888;">Payment Method:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #c5a85c; text-transform: uppercase;">${orderData.paymentMethod === 'upi' ? 'UPI / QR Code' : orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : orderData.paymentMethod || 'Credit / Debit'}</td>
            </tr>
          </table>
        </div>

        <!-- Merchandise details -->
        <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #c5a85c; margin: 0 0 12px 0;">Itemized Luxury Merchandise</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #1c1c1c; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #141414; border-bottom: 2px solid #1c1c1c;">
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #888888; letter-spacing: 1px;">Preview</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #888888; letter-spacing: 1px;">Item</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #888888; letter-spacing: 1px;">Qty</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #888888; letter-spacing: 1px;">Price</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #888888; letter-spacing: 1px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Totals panel -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
          <tr>
            <td style="padding: 6px; color: #888888;">Total Products Selected:</td>
            <td style="padding: 6px; text-align: right; font-weight: bold; color: #ffffff;">${totalProductsCount} items</td>
          </tr>
          <tr style="border-top: 1px dashed #222222;">
            <td style="padding: 12px 6px; font-size: 15px; font-weight: bold; color: #ffffff;">Grand Total Price:</td>
            <td style="padding: 12px 6px; text-align: right; font-size: 18px; font-weight: 700; color: #c5a85c; font-family: monospace;">${grandTotalStr}</td>
          </tr>
        </table>

        <!-- Call-to-action details for customer -->
        ${adminContactsPanel}
      </div>

      <!-- Professional Footer -->
      <div style="background-color: #050505; padding: 24px; text-align: center; font-size: 11px; color: #666666; border-top: 1px solid #1c1c1c;">
        <p style="margin: 0 0 6px 0;">This official email was dispatched via Prime Elite Store administration server.</p>
        <p style="margin: 0; color: #c5a85c; font-weight: 600;">Authorized Approval & 50% Upfront Booking Active.</p>
      </div>
    </div>
  `;
};

export const sendAdminOrderEmail = async (orderData: any) => {
  const plainTextOrder = formatOrderPlainText(orderData);
  const htmlOrder = formatOrderHtml(orderData, false);
  const itemsHtmlTable = formatOrderJustItemsHtmlTable(orderData);
  const itemsPlainText = formatOrderJustItemsPlainText(orderData);
  const grandTotalStr = `₹${(orderData.totalAmount || 0).toLocaleString()}`;
  const totalProductsCount = orderData.cartItems ? orderData.cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0;

  const templateParams = {
    user_name: orderData.customerName,
    customer_name: orderData.customerName,
    user_email: 'prime.elitestore02@gmail.com', // Safe admin recipient default to prevent automatic emails to customers on checkout
    customer_email: orderData.customerEmail, // Customer's real email address
    user_phone: orderData.customerPhone,
    user_phone_number: orderData.customerPhone,
    address: orderData.deliveryAddress,
    payment_method: orderData.paymentMethod === 'upi' ? 'UPI / QR Code' : orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : orderData.paymentMethod,
    order_id: orderData.id || 'N/A',
    total_products: totalProductsCount,
    grand_total: grandTotalStr,
    
    // Admin details
    admin_phone: '6263629683',
    admin_whatsapp_url: 'https://wa.me/916263629683',
    admin_whatsapp: '+91 6263629683',
    admin_instagram_url: 'https://www.instagram.com/prime_elite_store/?hl=en',
    admin_instagram_handle: '@prime_elite_store',

    // HTML-compatible properties (needs triple curly braces on EmailJS dashboard like {{{product_html}}})
    product_html: itemsHtmlTable,
    products_html: itemsHtmlTable,
    products_table: itemsHtmlTable,
    html_content: itemsHtmlTable,
    
    // Plain-text alternative properties
    products_ordered: itemsPlainText,
    products: itemsPlainText,
    product_details: itemsPlainText,
    message: plainTextOrder,
    
    admin_email: 'prime.elitestore02@gmail.com'
  };

  try {
    const response = await fetch('/api/email/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'admin', templateParams })
    });
    if (!response.ok) throw new Error('Failed to send admin order email');
    console.log('[Email] Server-side fast admin order notification dispatched successfully.');
  } catch (error) {
    console.error('[Email] Server admin order dispatch failed:', error);
  }
};

export const sendCustomerConfirmationEmail = async (orderData: any) => {
  const plainTextOrder = formatOrderPlainText(orderData);
  const htmlOrder = formatOrderHtml(orderData, true);
  const itemsHtmlTable = formatOrderJustItemsHtmlTable(orderData);
  const itemsPlainText = formatOrderJustItemsPlainText(orderData);
  const grandTotalStr = `₹${(orderData.totalAmount || 0).toLocaleString()}`;
  const totalProductsCount = orderData.cartItems ? orderData.cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0;

  const templateParams = {
    user_name: orderData.customerName,
    customer_name: orderData.customerName,
    user_email: orderData.customerEmail,
    customer_email: orderData.customerEmail,
    user_phone: orderData.customerPhone,
    user_phone_number: orderData.customerPhone,
    address: orderData.deliveryAddress,
    payment_method: orderData.paymentMethod === 'upi' ? 'UPI / QR Code' : orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : orderData.paymentMethod,
    order_id: orderData.id || 'N/A',
    total_products: totalProductsCount,
    grand_total: grandTotalStr,
    
    // Admin details
    admin_phone: '6263629683',
    admin_whatsapp_url: 'https://wa.me/916263629683',
    admin_whatsapp: '+91 6263629683',
    admin_instagram_url: 'https://www.instagram.com/prime_elite_store/?hl=en',
    admin_instagram_handle: '@prime_elite_store',

    // HTML-compatible properties (needs triple curly braces on EmailJS dashboard like {{{product_html}}})
    product_html: itemsHtmlTable,
    products_html: itemsHtmlTable,
    products_table: itemsHtmlTable,
    html_content: itemsHtmlTable,
    
    // Plain-text alternative properties
    products_ordered: itemsPlainText,
    products: itemsPlainText,
    product_details: itemsPlainText,
    message: plainTextOrder,
    
    admin_email: 'prime.elitestore02@gmail.com'
  };

  try {
    const response = await fetch('/api/email/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'customer', templateParams })
    });
    if (!response.ok) throw new Error('Failed to send customer confirmation email');
    console.log('[Email] Server-side fast customer confirmation email dispatched successfully.');
  } catch (error) {
    console.error('[Email] Server customer confirmation dispatch failed:', error);
  }
};

// Legacy wrapper to avoid any bundle compilation or import failures across old modules
export const sendOrderEmail = async (orderData: any) => {
  const normalizedOrder = {
    id: orderData.order_id || 'Legacy-Order',
    customerName: orderData.user_name,
    customerEmail: orderData.user_email,
    customerPhone: orderData.user_phone_number || orderData.user_phone || '',
    deliveryAddress: orderData.address,
    paymentMethod: orderData.payment_method,
    totalAmount: parseFloat(String(orderData.total_amount || '0').replace(/[^\d]/g, '')) || 0,
    cartItems: orderData.cartItems || []
  };

  if (normalizedOrder.cartItems.length === 0 && orderData.products_ordered) {
    normalizedOrder.cartItems = [{
      productName: orderData.products_ordered,
      variant: '',
      image: '',
      quantity: 1,
      price: normalizedOrder.totalAmount
    }];
  }

  await sendAdminOrderEmail(normalizedOrder);
};
