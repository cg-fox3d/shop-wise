/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    const globalCSP = `
      default-src 'self';
      script-src 'self' https://www.gstatic.com https://www.google.com https://www.gstatic.com/feedback/ https://support.google.com;
      style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
      img-src 'self' data: https://picsum.photos https://www.google.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://firestore.googleapis.com https://*.firebaseio.com https://firebase.googleapis.com https://www.googleapis.com https://www.gstatic.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://numbers-guru.netlify.app;
      frame-src 'none';
      object-src 'none';
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim();

    const checkoutCSP = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.google.com https://checkout.razorpay.com;
      style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
      img-src 'self' data: https://picsum.photos https://www.google.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://firestore.googleapis.com https://*.firebaseio.com https://firebase.googleapis.com https://www.googleapis.com https://www.gstatic.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://api.razorpay.com https://lumberjack.razorpay.com https://numbers-guru.netlify.app;
      frame-src 'self' https://api.razorpay.com;
      object-src 'none';
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      // Strict CSP for all routes except checkout
      {
        source: '/((?!checkout).*)',
        headers: [
          { key: 'Content-Security-Policy', value: globalCSP },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      // Relaxed CSP for Razorpay checkout page
      {
        source: '/checkout',
        headers: [
          { key: 'Content-Security-Policy', value: checkoutCSP },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },

  // Other Next.js configs here
};

module.exports = nextConfig;