import React from 'react';
import { CONTACT_INFO } from '../config';
import { SEO } from '../components/SEO';

export const Contact = () => {
  return (
    <div className="pt-32 min-h-screen max-w-7xl mx-auto px-6 lg:px-12 pb-20">
      <SEO 
        title="Contact Us | Prime Elite Store"
        description="Get in touch with Prime Elite Store support. Contact us via phone, email, WhatsApp, or Instagram."
        url="https://primeelitestore.netlify.app/contact"
      />
      <h1 className="text-4xl font-display font-light mb-12 text-center">Contact <span className="font-bold gold-gradient-text">Elite Support</span></h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
          <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
          <form className="flex flex-col gap-4">
            <input type="text" placeholder="Your Name" className="bg-black/50 border border-white/10 p-3 rounded text-sm focus:border-gold-500/50 outline-none" />
            <input type="email" placeholder="Your Email" className="bg-black/50 border border-white/10 p-3 rounded text-sm focus:border-gold-500/50 outline-none" />
            <textarea placeholder="Message" className="bg-black/50 border border-white/10 p-3 rounded text-sm focus:border-gold-500/50 outline-none h-32 resize-none" />
            <button className="gold-gradient-bg text-black font-bold uppercase tracking-widest py-3 rounded mt-2 hover:opacity-90 transition-opacity">
              Send Message
            </button>
          </form>
        </div>
        
        <div className="flex flex-col gap-8">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold mb-4">Direct Contact</h2>
            <div className="space-y-4 text-gray-400 text-sm">
              <p>
                <strong className="text-white">Phone:</strong><br/>
                <a href={`tel:${CONTACT_INFO.phone}`} className="text-gold-400 hover:underline">{CONTACT_INFO.phone}</a>
              </p>
              <p>
                <strong className="text-white">WhatsApp:</strong><br/>
                <a href={CONTACT_INFO.whatsapp} target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:underline">Message us on WhatsApp</a>
              </p>
              <p>
                <strong className="text-white">Email:</strong><br/>
                <a href={`mailto:${CONTACT_INFO.email}`} className="text-gold-400 hover:underline">{CONTACT_INFO.email}</a>
              </p>
              <p>
                <strong className="text-white">Instagram:</strong><br/>
                <a href={CONTACT_INFO.instagram} target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:underline">@prime_elite_store</a>
              </p>
            </div>
          </div>
          
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
             <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                <span>FAQ Support</span>
             </h2>
             <div className="space-y-4">
               <div className="border-b border-white/10 pb-4">
                 <p className="font-bold text-sm text-white">What is the minimum order quantity?</p>
                 <p className="text-sm text-gray-400 mt-1">We cater strictly to premium bulk or duo orders. A minimum quantity of 2 units is required.</p>
               </div>
               <div>
                 <p className="font-bold text-sm text-white">What is the payment policy?</p>
                 <p className="text-sm text-gray-400 mt-1">We require a 50% advance payment to process and ship orders. The remaining balance is handled subsequently.</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
