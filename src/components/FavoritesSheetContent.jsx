"use client";

import React from 'react';
import Link from 'next/link';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, ShoppingCart } from 'lucide-react';
import {
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image'; // Assuming VIP numbers might have images later

export default function FavoritesSheetContent() {
  const { favoriteItems, removeFromFavorites, getFavoritesCount } = useFavorites();
  const { addToCart, cartItems } = useCart();
  const { toast } = useToast();

  const handleAddToCartFromFavorites = (item) => {
    const isInCart = cartItems.some(cartItem => cartItem.id === item.id);
    if (isInCart) {
      toast({
        title: "Already in Cart",
        description: `${item.number} is already in your cart.`,
      });
      return;
    }
    addToCart(item);
    toast({
      title: "Added to Cart",
      description: `${item.number} has been added to your cart.`,
    });
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Your Favorites ({getFavoritesCount()})</SheetTitle>
      </SheetHeader>
      <Separator />
      {favoriteItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-muted-foreground">You have no favorite items yet.</p>
          <SheetClose asChild>
             <Button variant="link" asChild className="mt-4">
                <Link href="/">Discover Numbers</Link>
             </Button>
          </SheetClose>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 -mx-6">
             <div className="px-6">
                {favoriteItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 py-4">
                    {/* Placeholder for image - adapt if VIP numbers get images */}
                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                       {/* <Image
                          src={item.imageUrl || `https://picsum.photos/seed/${item.id}/64`}
                          alt={item.name || item.number}
                          fill
                          sizes="64px"
                          className="object-cover"
                          data-ai-hint={item.imageHint || "number"}
                        /> */}
                        <span className="text-xs text-muted-foreground">No Image</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm">{item.number}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive -mr-2"
                          onClick={() => removeFromFavorites(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                       </div>
                       <div className="flex items-center justify-between mt-1">
                        <p className="text-sm font-medium text-primary">
                          ${item.price.toFixed(2)}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToCartFromFavorites(item)}
                          disabled={cartItems.some(cartItem => cartItem.id === item.id)}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {cartItems.some(cartItem => cartItem.id === item.id) ? "In Cart" : "Add to Cart"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </ScrollArea>
          <SheetFooter className="mt-auto">
             <SheetClose asChild>
               <Button asChild className="w-full">
                  <Link href="/">Continue Shopping</Link>
               </Button>
            </SheetClose>
          </SheetFooter>
        </>
      )}
    </>
  );
}
