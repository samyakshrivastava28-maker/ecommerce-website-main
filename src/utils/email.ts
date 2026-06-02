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

export const sendAdminOrderEmail = async (orderData: any) => {
  const plainTextOrder = formatOrderPlainText(orderData);
  const grandTotalStr = `₹${(orderData.totalAmount || 0).toLocaleString()}`;
  const totalProductsCount = orderData.cartItems ? orderData.cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0;

  const templateParams = {
    user_name: orderData.customerName,
    user_email: orderData.customerEmail,
    user_phone: orderData.customerPhone,
    user_phone_number: orderData.customerPhone,
    address: orderData.deliveryAddress,
    payment_method: orderData.paymentMethod === 'upi' ? 'UPI / QR Code' : orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : orderData.paymentMethod,
    order_id: orderData.id || 'N/A',
    total_products: totalProductsCount,
    grand_total: grandTotalStr,
    products_html: plainTextOrder,
    products_ordered: plainTextOrder,
    products: plainTextOrder,
    product_details: plainTextOrder,
    message: plainTextOrder,
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
  const plainTextOrder = formatOrderPlainText(orderData);
  const grandTotalStr = `₹${(orderData.totalAmount || 0).toLocaleString()}`;
  const totalProductsCount = orderData.cartItems ? orderData.cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0;

  const templateParams = {
    user_name: orderData.customerName,
    user_email: orderData.customerEmail,
    user_phone: orderData.customerPhone,
    user_phone_number: orderData.customerPhone,
    address: orderData.deliveryAddress,
    payment_method: orderData.paymentMethod === 'upi' ? 'UPI / QR Code' : orderData.paymentMethod === 'cash' ? 'Cash on Delivery' : orderData.paymentMethod,
    order_id: orderData.id || 'N/A',
    total_products: totalProductsCount,
    grand_total: grandTotalStr,
    products_html: plainTextOrder,
    products_ordered: plainTextOrder,
    products: plainTextOrder,
    product_details: plainTextOrder,
    message: plainTextOrder,
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
