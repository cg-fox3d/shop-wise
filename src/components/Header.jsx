
"use client";
import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, LogOut, LogIn, Heart } from 'lucide-react'; // Removed ShieldCheck
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import CartSheetContent from './CartSheetContent';
import FavoritesSheetContent from './FavoritesSheetContent';
import LoginModal from './LoginModal';
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@shopwave.com"; // Removed

export default function Header() {
  const { getItemCount } = useCart();
  const { getFavoritesCount } = useFavorites();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const itemCount = getItemCount();
  const favoritesCount = getFavoritesCount();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // const isAdmin = user && user.email === ADMIN_EMAIL; // Removed

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged Out Successfully" });
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleLoginSuccess = () => {
     setIsLoginModalOpen(false);
     toast({ title: "Login Successful"});
  }

  const getInitials = (name) => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };


  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center space-x-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
              <path d="M12 2l-8 4 8 4 8-4-8-4z" />
              <path d="M4 10l8 4 8-4" />
              <path d="M4 18l8 4 8-4" />
              <path d="M4 14l8 4 8-4" />
            </svg>
            <span className="font-bold">NumbersGuru</span>
          </Link>
          <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Home
            </Link>
            {/* Add other navigation links here if needed */}
          </nav>
          <div className="flex items-center space-x-2"> {/* Reduced space for more icons */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className="h-5 w-5" />
                  {favoritesCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center rounded-full p-0">
                      {favoritesCount}
                    </Badge>
                  )}
                  <span className="sr-only">Open Favorites</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                <FavoritesSheetContent />
              </SheetContent>
            </Sheet>

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

            {user ? (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                     <Avatar className="h-8 w-8">
                       <AvatarImage src={user.photoURL || ''} alt={user.displayName || user.email} />
                       <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                     </Avatar>
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent className="w-56" align="end" forceMount>
                   <DropdownMenuLabel className="font-normal">
                     <div className="flex flex-col space-y-1">
                       <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                       <p className="text-xs leading-none text-muted-foreground">
                         {user.email}
                       </p>
                     </div>
                   </DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   {/* Admin Panel link removed */}
                   <DropdownMenuItem onClick={handleLogout}>
                     <LogOut className="mr-2 h-4 w-4" />
                     <span>Log out</span>
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setIsLoginModalOpen(true)}>
                <LogIn className="h-5 w-5" />
                <span className="sr-only">Log In</span>
              </Button>
            )}
          </div>
        </div>
      </header>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
    </>
  );
}
