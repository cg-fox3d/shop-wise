
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://varshavipnumbers.in'; // Fallback, update with your actual URL

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'NumbersGuru: VIP & Fancy Indian Mobile Numbers',
    template: '%s | NumbersGuru',
  },
  description: 'Discover and purchase exclusive VIP, fancy, and choice Indian mobile numbers at NumbersGuru. Secure your unique phone number today!',
  keywords: ['VIP mobile numbers India', 'fancy numbers India', 'choice mobile numbers', 'buy Indian phone numbers', 'special phone numbers India', 'NumbersGuru', 'Indian VIP SIM', 'premium mobile numbers', 'numbers', 'phonenumbers', 'buy phone numbers India', 'premium phone numbers India', 'fancy numbers India', 'memorable phone numbers', 'buy Indian mobile numbers', 'verified phone numbers India', 'exclusive mobile numbers India', 'NumberGuru India', 'Indian phone numbers online', 'VIP mobile numbers India', 'unique phone numbers India', 'mobile number marketplace India'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'NumbersGuru: VIP & Fancy Indian Mobile Numbers',
    description: 'Find your perfect VIP or fancy mobile number in India. NumbersGuru offers a wide selection of exclusive and unique Indian phone numbers.',
    url: SITE_URL,
    siteName: 'NumbersGuru',
    images: [
      {
        url: '/logo.svg', // Replace with your actual OG image URL if different
        width: 512, // Adjust as needed
        height: 512, // Adjust as needed
        alt: 'NumbersGuru Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NumbersGuru: VIP & Fancy Indian Mobile Numbers',
    description: 'Discover and purchase exclusive VIP, fancy, and choice Indian mobile numbers at NumbersGuru.',
    images: ['/logo.svg'], // Replace with your actual OG image URL
    // site: '@yourtwitterhandle', // Optional: Add your Twitter handle
  },
  icons: {
    icon: '/favicon.ico', // Make sure you have a favicon.ico in your public folder
    // apple: '/apple-touch-icon.png', // Optional: Add apple touch icon
  },
  // verification: { // Optional: Add verification for Google Search Console, etc.
  //   google: 'your-google-site-verification-code',
  // },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <Header />
              <main className="flex-grow container py-8 px-4 sm:px-6 lg:px-8">
                {children}
              </main>
              <Footer />
              <Toaster />
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
