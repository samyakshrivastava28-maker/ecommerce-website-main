import emailjsBrowser from '@emailjs/browser';

// EmailJS Keys
const EMAIL_CONFIG = {
  signup: {
    serviceId: 'service_xavwsdd',
    templateUser: 'template_bnv795b',
    templateAdmin: 'template_yov75k3',
    publicKey: 'xdiix4UI5x2P7LVE2'
  },
  login: {
    serviceId: 'service_3mc4i0a',
    templateUser: 'template_qe2gx2m',
    templateAdmin: 'template_8kcg56c',
    publicKey: 'z23jLy3RVmEUYUin6'
  },
  order: {
    serviceId: 'service_a8w9xi7',
    templateCustomer: 'template_pem4aev',
    templateAdmin: 'template_r5nxgqn',
    publicKey: 'Buuw2UTdprSoJ3wVu'
  }
};

export const sendSignupEmail = async (userName: string, userEmail: string, userPhone: string = '', signupDate: string = '') => {
  try {
    const response = await fetch('/api/email/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, userEmail, userPhone, signupDate })
    });
    if (!response.ok) {
      throw new Error(`Server status ${response.status}`);
    }
  } catch (error) {
    console.error('[Email] API Signup dispatch failed, using direct browser fallback:', error);
    try {
      const templateParams = {
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
        signup_date: signupDate || new Date().toLocaleString()
      };
      
      await emailjsBrowser.send(
        EMAIL_CONFIG.signup.serviceId,
        EMAIL_CONFIG.signup.templateUser,
        templateParams,
        EMAIL_CONFIG.signup.publicKey
      );
      
      await emailjsBrowser.send(
        EMAIL_CONFIG.signup.serviceId,
        EMAIL_CONFIG.signup.templateAdmin,
        {
          ...templateParams,
          admin_email: 'prime.elitestore02@gmail.com'
        },
        EMAIL_CONFIG.signup.publicKey
      );
    } catch (fallbackError) {
      console.error('[Email] Direct browser signup fallback failed:', fallbackError);
    }
  }
};

export const sendLoginEmail = async (userName: string, userEmail: string, userPhone: string = '') => {
  try {
    const response = await fetch('/api/email/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, userEmail, userPhone })
    });
    if (!response.ok) {
      throw new Error(`Server status ${response.status}`);
    }
  } catch (error) {
    console.error('[Email] API Login dispatch failed, using direct browser fallback:', error);
    try {
      const templateParams = {
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
        login_time: new Date().toLocaleString()
      };
      
      await emailjsBrowser.send(
        EMAIL_CONFIG.login.serviceId,
        EMAIL_CONFIG.login.templateUser,
        templateParams,
        EMAIL_CONFIG.login.publicKey
      );
      
      await emailjsBrowser.send(
        EMAIL_CONFIG.login.serviceId,
        EMAIL_CONFIG.login.templateAdmin,
        {
          ...templateParams,
          admin_email: 'prime.elitestore02@gmail.com'
        },
        EMAIL_CONFIG.login.publicKey
      );
    } catch (fallbackError) {
      console.error('[Email] Direct browser login fallback failed:', fallbackError);
    }
  }
};

export const sendAdminOrderEmail = async (orderData: any) => {
  const productsHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #050505; color: #ffffff; border-radius: 12px; border: 1px solid #1a1a1a;">
      <h2 style="font-size: 20px; font-weight: 300; border-bottom: 1px solid #222; padding-bottom: 12px; margin-bottom: 20px;">
        <span style="color: #d4af37; font-weight: bold;">Order</span> Summary — Admin Notification
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="border-bottom: 2px solid #262626; background-color: #0e0e0e;">
            <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #888;">Image</th>
            <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #888;">Item</th>
            <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #888;">Qty</th>
            <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #888;">Price</th>
            <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #888;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${orderData.cartItems.map((item: any) => {
            const subtotal = item.price * item.quantity;
            return `
              <tr style="border-bottom: 1px solid #141414;">
                <td style="padding: 12px; text-align: left; vertical-align: middle;">
                  ${item.image ? `<img src="${item.image}" alt="${item.productName}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #222;" />` : `<div style="width: 48px; height: 48px; background-color: #111; border-radius: 6px; border: 1px solid #222;"></div>`}
                </td>
                <td style="padding: 12px; text-align: left; vertical-align: middle;">
                  <span style="font-weight: bold; font-size: 13px; color: #fff; display: block;">${item.productName}</span>
                  ${item.variant ? `<span style="font-size: 11px; color: #d4af37; background: rgba(212,175,55,0.08); padding: 1px 5px; border-radius: 3px; display: inline-block; margin-top: 3px;">Variant: ${item.variant}</span>` : ''}
                </td>
                <td style="padding: 12px; text-align: right; vertical-align: middle; font-size: 13px; font-weight: bold; color: #eee; font-family: monospace;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; vertical-align: middle; font-size: 12px; color: #aaa; font-family: monospace;">₹${item.price.toLocaleString()}</td>
                <td style="padding: 12px; text-align: right; vertical-align: middle; font-size: 13px; font-weight: bold; color: #d4af37; font-family: monospace;">₹${subtotal.toLocaleString()}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <div style="background-color: #0c0c0c; border: 1px solid #151515; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; color: #888;">Customer Name:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #fff;">${orderData.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Phone Number:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #fff;">${orderData.customerPhone}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888; vertical-align: top;">Delivery Address:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #fff;">${orderData.deliveryAddress}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Total Products:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #fff;">${orderData.cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Grand Total:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #d4af37; font-size: 16px; font-family: monospace;">₹${orderData.totalAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Payment Method:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #fff; text-transform: uppercase;">${orderData.paymentMethod}</td>
          </tr>
        </table>
      </div>
    </div>
  `;

  const productsPlain = orderData.cartItems.map((item: any, i: number) => {
    const subtotal = item.price * item.quantity;
    return `Product ${i + 1}:
${item.productName}
${item.variant ? `${item.variant} Variant` : 'Standard Variant'}
Qty: ${item.quantity}
Price: ₹${item.price.toLocaleString()}
Subtotal: ₹${subtotal.toLocaleString()}`;
  }).join('\n\n');

  const grandTotalStr = `₹${orderData.totalAmount.toLocaleString()}`;
  const totalProductsCount = orderData.cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0);

  const templateParams = {
    user_name: orderData.customerName,
    user_email: orderData.customerEmail,
    user_phone: orderData.customerPhone,
    user_phone_number: orderData.customerPhone,
    address: orderData.deliveryAddress,
    payment_method: orderData.paymentMethod === 'upi' ? 'UPI / QR Code' : orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Bank Transfer',
    order_id: orderData.id || 'N/A',
    total_products: totalProductsCount,
    grand_total: grandTotalStr,
    products_html: productsHtml,
    products_ordered: productsPlain,
    admin_email: 'prime.elitestore02@gmail.com'
  };

  try {
    const response = await fetch('/api/email/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'admin', templateParams })
    });
    if (!response.ok) {
      throw new Error(`Server status ${response.status}`);
    }
  } catch (error) {
    console.error('[Email] Admin order dispatch via API failed, using direct browser fallback:', error);
    try {
      await emailjsBrowser.send(
        EMAIL_CONFIG.order.serviceId,
        EMAIL_CONFIG.order.templateAdmin,
        templateParams,
        EMAIL_CONFIG.order.publicKey
      );
    } catch (fallbackError) {
      console.error('[Email] Direct browser admin order fallback failed:', fallbackError);
    }
  }
};

export const sendCustomerConfirmationEmail = async (orderData: any) => {
  const totalProducts = orderData.cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0);

  const productsHtml = `
    <div style="font-family: Arial, sans-serif; color: #000; max-width: 600px; margin: 0 auto; line-height: 1.5;">
      ${orderData.cartItems.map((item: any) => {
        const subtotal = item.price * item.quantity;
        return `
          <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #eee;">
            <div style="margin-bottom: 12px;">
              ${item.image ? `<img src="${item.image}" alt="Product Image" style="width: 100%; max-width: 300px; border-radius: 8px; object-fit: cover;" />` : `<div style="padding: 20px; background: #f5f5f5; text-align: center; color: #888;">Product Image</div>`}
            </div>
            <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #333;">${item.productName}</h3>
            <p style="margin: 4px 0; font-size: 14px; color: #555;">Variant: ${item.variant || item.selectedColor || 'Standard'}</p>
            ${item.selectedColor ? `<p style="margin: 4px 0; font-size: 14px; color: #555;">Color: ${item.selectedColor}</p>` : ''}
            <p style="margin: 4px 0; font-size: 14px; color: #555;">Quantity: ${item.quantity}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #555;">Price: ₹${item.price.toLocaleString()}</p>
            <div style="margin-top: 12px;">
              <p style="margin: 0; font-size: 14px; color: #555; text-transform: uppercase;">Product Total:</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; color: #000;">₹${subtotal.toLocaleString()}</p>
            </div>
          </div>
        `;
      }).join('')}

      <div style="background-color: #fafafa; padding: 24px; border-radius: 8px; margin-top: 32px; border: 1px solid #eaeaea;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #333; text-transform: uppercase; border-bottom: 1px solid #eaeaea; padding-bottom: 8px;">Order Summary</h3>
        <p style="margin: 8px 0; font-size: 14px; color: #555;">
          Order ID:<br/>
          <strong style="color: #000;">${orderData.id || 'N/A'}</strong>
        </p>
        <p style="margin: 8px 0; font-size: 14px; color: #555;">
          Customer Name:<br/>
          <strong style="color: #000;">${orderData.customerName}</strong>
        </p>
        <p style="margin: 8px 0; font-size: 14px; color: #555;">
          Phone Number:<br/>
          <strong style="color: #000;">${orderData.customerPhone}</strong>
        </p>
        <p style="margin: 8px 0; font-size: 14px; color: #555;">
          Delivery Address:<br/>
          <strong style="color: #000;">${orderData.deliveryAddress}</strong>
        </p>
        <p style="margin: 8px 0; font-size: 14px; color: #555;">
          Payment Method:<br/>
          <strong style="color: #000; text-transform: uppercase;">${orderData.paymentMethod}</strong>
        </p>
        <p style="margin: 8px 0; font-size: 14px; color: #555;">
          Total Products:<br/>
          <strong style="color: #000;">${totalProducts}</strong>
        </p>
        <p style="margin: 8px 0; font-size: 14px; color: #555;">
          Grand Total:<br/>
          <strong style="color: #000; font-size: 18px;">₹${orderData.totalAmount.toLocaleString()}</strong>
        </p>
      </div>
    </div>
  `;

  const productsPlain = orderData.cartItems.map((item: any, i: number) => {
    const subtotal = item.price * item.quantity;
    return `Product ${i + 1}:
${item.productName}
${item.variant ? `${item.variant} Variant` : 'Standard Variant'}
Qty: ${item.quantity}
Price: ₹${item.price.toLocaleString()}
Subtotal: ₹${subtotal.toLocaleString()}`;
  }).join('\n\n');

  const grandTotalStr = `₹${orderData.totalAmount.toLocaleString()}`;
  const totalProductsCount = orderData.cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0);

  const templateParams = {
    user_name: orderData.customerName,
    user_email: orderData.customerEmail,
    user_phone: orderData.customerPhone,
    user_phone_number: orderData.customerPhone,
    address: orderData.deliveryAddress,
    payment_method: orderData.paymentMethod === 'upi' ? 'UPI / QR Code' : orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Bank Transfer',
    order_id: orderData.id || 'N/A',
    total_products: totalProductsCount,
    grand_total: grandTotalStr,
    products_html: productsHtml,
    products_ordered: productsPlain,
    admin_email: 'prime.elitestore02@gmail.com'
  };

  try {
    const response = await fetch('/api/email/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'customer', templateParams })
    });
    if (!response.ok) {
      throw new Error(`Server status ${response.status}`);
    }
  } catch (error) {
    console.error('[Email] Customer order dispatch via API failed, using direct browser fallback:', error);
    try {
      await emailjsBrowser.send(
        EMAIL_CONFIG.order.serviceId,
        EMAIL_CONFIG.order.templateCustomer,
        templateParams,
        EMAIL_CONFIG.order.publicKey
      );
    } catch (fallbackError) {
      console.error('[Email] Direct browser customer order fallback failed:', fallbackError);
    }
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
