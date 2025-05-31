/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Recommended for Next.js
  async headers() {
    const cspHeader = `
        default-src 'self';
        script-src 'self' https://www.gstatic.com https://www.google.com https://www.gstatic.com/feedback/ https://support.google.com https://checkout.razorpay.com;
        style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
        img-src 'self' data: https://picsum.photos https://www.google.com;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://firestore.googleapis.com https://*.firebaseio.com https://firebase.googleapis.com https://www.googleapis.com https://www.gstatic.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://api.razorpay.com https://lumberjack.razorpay.com https://numbers-guru.netlify.app;
        frame-src 'self' https://api.razorpay.com;
        object-src 'none';
        frame-ancestors 'none';
      `.replace(/\s{2,}/g, ' ').trim();// Remove unnecessary whitespace and newlines

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
