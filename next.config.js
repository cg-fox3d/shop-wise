/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Recommended for Next.js
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https://placehold.co;
      font-src 'self';
      connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://api.razorpay.com https://lumberjack-events.razorpay.com https://numbers-guru.netlify.app;
      frame-src 'self' https://checkout.razorpay.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'self';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim(); // Remove unnecessary whitespace and newlines

    return [
      {
        source: '/:path*', // Apply these headers to all routes
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  // Your existing Next.js config options can go here
  // For example:
  // images: {
  //   domains: ['example.com'],
  // },
};

module.exports = nextConfig;
