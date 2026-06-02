import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import { Home } from './pages/Home';
import { AdminRoute } from './components/AdminRoute';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy-load heavier secondary pages for progressive delivery & fast initial paints
const Products = React.lazy(() => import('./pages/Products').then(m => ({ default: m.Products })));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails').then(m => ({ default: m.ProductDetails })));
const Checkout = React.lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const Contact = React.lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Policies = React.lazy(() => import('./pages/Policies').then(m => ({ default: m.Policies })));
const Auth = React.lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Admin = React.lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));

// Elegant luxury-styled spinner fallback
const PremiumLoadingFallback = () => (
  <div className="min-h-[50vh] w-full flex flex-col items-center justify-center bg-transparent">
    <div className="relative flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border border-gold-500/10 border-t-gold-500 animate-spin" />
      <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-gold-500/50 animate-pulse">
        Securing Premium Stream...
      </span>
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          
          <Route path="products" element={
            <ProtectedRoute>
              <Suspense fallback={<PremiumLoadingFallback />}>
                <Products />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="products/:id" element={
            <ProtectedRoute>
              <Suspense fallback={<PremiumLoadingFallback />}>
                <ProductDetails />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="checkout" element={
            <ProtectedRoute>
              <Suspense fallback={<PremiumLoadingFallback />}>
                <Checkout />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="contact" element={
            <Suspense fallback={<PremiumLoadingFallback />}>
              <Contact />
            </Suspense>
          } />
          
          <Route path="policies" element={
            <Suspense fallback={<PremiumLoadingFallback />}>
              <Policies />
            </Suspense>
          } />
          
          <Route path="login" element={
            <Suspense fallback={<PremiumLoadingFallback />}>
              <Auth />
            </Suspense>
          } />
          
          <Route path="admin" element={
            <AdminRoute>
              <Suspense fallback={<PremiumLoadingFallback />}>
                <Admin />
              </Suspense>
            </AdminRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

