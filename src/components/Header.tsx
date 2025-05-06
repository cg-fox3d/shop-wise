"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import CartSheetContent from './CartSheetContent';


export default function Header() {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
             <path d="M12 2l-8 4 8 4 8-4-8-4z" />
             <path d="M4 10l8 4 8-4" />
             <path d="M4 18l8 4 8-4" />
             <path d="M4 14l8 4 8-4" />
           </svg>
          <span className="font-bold">ShopWave</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Home
          </Link>
           {/* Add other navigation links here if needed */}
        </nav>
        <div className="flex items-center space-x-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center rounded-full p-0">
                    {itemCount}
                  </Badge>
                )}
                <span className="sr-only">Open Cart</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                <CartSheetContent />
            </SheetContent>
          </Sheet>
          {/* Add User Profile button/icon if needed */}
          {/* <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
            <span className="sr-only">User Profile</span>
          </Button> */}
        </div>
      </div>
    </header>
  );
}
