import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext'; // Added
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'ShopWave',
  description: 'Your favorite online store',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <AuthProvider>
          <FavoritesProvider> {/* Added */}
            <CartProvider>
              <Header />
              <main className="flex-grow container py-8 px-4 sm:px-6 lg:px-8">
                {children}
              </main>
              <Footer />
              <Toaster />
            </CartProvider>
          </FavoritesProvider> {/* Added */}
        </AuthProvider>
      </body>
    </html>
  );
}
