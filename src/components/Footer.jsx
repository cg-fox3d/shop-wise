
import React from 'react';
import Link from 'next/link';
import { Phone, Mail, Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Column 1: Site Info & Social */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2 mb-2 group">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-accent group-hover:text-accent/90 transition-colors">
                  <path d="M12 2l-8 4 8 4 8-4-8-4z" />
                  <path d="M4 10l8 4 8-4" />
                  <path d="M4 18l8 4 8-4" />
                  <path d="M4 14l8 4 8-4" />
              </svg>
              <span className="text-2xl font-bold text-primary-foreground group-hover:text-primary-foreground/90 transition-colors">NumbersGuru</span>
            </Link>
            <p className="text-sm text-primary-foreground/80">
              India's premier marketplace for premium and memorable phone numbers.
            </p>
            <div className="flex space-x-4 pt-2">
              <Link href="#" aria-label="Facebook" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" aria-label="Instagram" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" aria-label="Twitter" className="text-primary-foreground/70 hover:text-accent transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:justify-self-center">
            <h3 className="text-lg font-semibold mb-4 text-primary-foreground/90">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-primary-foreground/80 hover:text-accent hover:underline">Home</Link></li>
              <li><Link href="/search-results" className="text-primary-foreground/80 hover:text-accent hover:underline">Search Numbers</Link></li>
              <li><Link href="/about-us" className="text-primary-foreground/80 hover:text-accent hover:underline">About Us</Link></li>
              <li><Link href="/contact" className="text-primary-foreground/80 hover:text-accent hover:underline">Contact</Link></li>
              <li><Link href="/terms-conditions" className="text-primary-foreground/80 hover:text-accent hover:underline">Terms &amp; Conditions</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact Us */}
          <div className="md:col-span-2 lg:col-span-1 lg:justify-self-end">
            <h3 className="text-lg font-semibold mb-4 text-primary-foreground/90">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
                <a href="tel:+919876543210" className="text-primary-foreground/80 hover:text-accent hover:underline">+91 98765 43210</a>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
                <a href="mailto:info@numbersguru.com" className="text-primary-foreground/80 hover:text-accent hover:underline">info@numbersguru.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-primary-foreground/20 pt-8 text-center">
          <p className="text-sm text-primary-foreground/70">
            © {new Date().getFullYear()} NumbersGuru. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
