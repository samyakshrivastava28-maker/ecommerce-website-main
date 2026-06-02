import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  url?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  schema?: object;
}

export function SEO({
  title = 'Prime Elite Store | Premium Watches, Smart Watches, Earbuds & Electronics',
  description = 'Shop premium watches, smart watches, earbuds, headphones and electronic accessories at Prime Elite Store. High quality products, secure ordering and premium customer support.',
  keywords = 'premium watches, rolex watches, tissot watches, smart watches, earbuds, headphones, electronics store, luxury watches, online watch store india',
  url = 'https://primeelitestore.netlify.app',
  image = 'https://primeelitestore.netlify.app/og-image.jpg', // Placeholder image URL, ideally a real image
  type = 'website',
  schema,
}: SEOProps) {
  // Precompute organization schema by default
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Prime Elite Store",
    "url": "https://primeelitestore.netlify.app",
    "logo": "https://primeelitestore.netlify.app/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-6263629683",
      "email": "prime.elitestore02@gmail.com",
      "contactType": "customer service"
    }
  };

  const finalSchema = schema || defaultSchema;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />
      <link rel="icon" type="image/webp" href="https://res.cloudinary.com/dxegdaylf/image/upload/v1779965351/prime_elite_store_mrgmmc.webp" />
      <link rel="shortcut icon" type="image/webp" href="https://res.cloudinary.com/dxegdaylf/image/upload/v1779965351/prime_elite_store_mrgmmc.webp" />
      <link rel="apple-touch-icon" href="https://res.cloudinary.com/dxegdaylf/image/upload/v1779965351/prime_elite_store_mrgmmc.webp" />

      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Prime Elite Store" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data Schema */}
      <script type="application/ld+json">
        {JSON.stringify(finalSchema)}
      </script>
    </Helmet>
  );
}
