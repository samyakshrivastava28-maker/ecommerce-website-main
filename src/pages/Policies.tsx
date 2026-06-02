import React from 'react';
import { SEO } from '../components/SEO';

export const Policies = () => {
  return (
    <div className="pt-32 min-h-screen max-w-4xl mx-auto px-6 lg:px-12 pb-20">
      <SEO 
        title="Privacy & Policies | Prime Elite Store"
        description="Read the privacy policy, payment terms, and conditions for Prime Elite Store."
        url="https://primeelitestore.netlify.app/policies"
      />
      <h1 className="text-4xl font-display font-light mb-12 text-center text-white">Company <span className="font-bold gold-gradient-text">Policies</span></h1>
      
      <div className="space-y-12 text-gray-300 text-sm leading-relaxed">
        
        <section>
          <h2 className="text-2xl font-bold text-gold-500 mb-4">Payment Policy</h2>
          <p>
            At Prime Elite Store, our strict payment policy dictates a 50% advance payment prior to any order processing.
            By placing an order, customers agree and acknowledge they must finalize half of the transaction immediately after checkout via our supported payment gateways.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-bold text-gold-500 mb-4">Privacy Policy</h2>
          <p>
            We take user data seriously. Any data collected during sign up, checkout, or newsletter interactions is used specifically to streamline customer support, order fulfillment, and premium account services. We do not sell or provide user data to unassociated third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gold-500 mb-4">Terms & Conditions</h2>
          <p>
            Users engaging with Prime Elite Store must be of legal purchasing age. All products listed are subjected to stock verification. 
            The minimum order quantity applies across the store catalog to preserve the premium logistics flow. 
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gold-500 mb-4">Return & Refund Policy</h2>
          <p>
            If any ordered product is unavailable or we are otherwise unable to deliver your order, we will issue a full refund of the 50% advance reservation payment made by you. Please allow a few business days for the refund process to be completed and credited back to your original source of payment.
          </p>
        </section>

      </div>
    </div>
  );
};
