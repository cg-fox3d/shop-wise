
"use client";

import React from 'react';
import Link from 'next/link';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, ShoppingCart, Package } from 'lucide-react';
import {
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

export default function FavoritesSheetContent() {
  const { favoriteItems, removeFromFavorites, getFavoritesCount } = useFavorites();
  const { addToCart, cartItems } = useCart();
  const { toast } = useToast();

  const handleAddToCartFromFavorites = (item) => {
    const itemName = item.type === 'pack' ? item.name : item.number;
    const isInCart = cartItems.some(cartItem => cartItem.id === item.id);
    if (isInCart) {
      toast({
        title: "Already in Cart",
        description: `${itemName} is already in your cart.`,
      });
      return;
    }
    addToCart(item);
    toast({
      title: "Added to Cart",
      description: `${itemName} has been added to your cart.`,
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
                <Link href="/">Discover Numbers & Packs</Link>
             </Button>
          </SheetClose>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
             <div className="divide-y divide-border">
                {favoriteItems.map((item) => {
                  const isPack = item.type === 'pack';
                  const name = isPack ? item.name : item.number;
                  const price = isPack ? item.packPrice : item.price;
                  const originalPrice = isPack ? item.totalOriginalPrice : item.originalPrice;

                  return (
                    <div key={item.id} className="px-6 py-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-base text-foreground flex-grow pr-2">
                          {isPack && <Package className="inline h-4 w-4 mr-1 text-muted-foreground" />}
                          {name}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0 -mr-2"
                          onClick={() => removeFromFavorites(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {isPack && item.numbers && (
                        <ul className="text-xs text-muted-foreground list-disc list-inside pl-1 mb-1 max-h-16 overflow-y-auto scrollbar-hide">
                          {item.numbers.map((num, idx) => (
                            <li key={idx} className="truncate">{num.number}</li>
                          ))}
                        </ul>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-primary font-medium">${price?.toFixed(2)}</span>
                          {originalPrice && originalPrice > price && (
                            <span className="ml-2 line-through text-muted-foreground">
                              ${originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
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
                  );
                })}
             </div>
          </ScrollArea>
          <Separator />
          <SheetFooter className="mt-auto px-6">
             <SheetClose asChild>
               <Button asChild className="w-full my-4">
                  <Link href="/">Continue Shopping</Link>
               </Button>
            </SheetClose>
          </SheetFooter>
        </>
      )}
    </>
  );
}
