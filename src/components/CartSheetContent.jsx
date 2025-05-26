
"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { X, Minus, Plus, Package } from 'lucide-react';
import {
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";


export default function CartSheetContent() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const handleDecrement = (item) => {
    if (item.type === 'pack' || item.quantity <= 1) {
      removeFromCart(item.cartId);
    } else {
      updateQuantity(item.cartId, item.quantity - 1);
    }
  };

  const handleIncrement = (item) => {
    // Packs with selections usually have quantity 1.
    // If you want to allow >1 quantity for VIP numbers:
    if (item.type !== 'pack') {
       updateQuantity(item.cartId, item.quantity + 1);
    }
    // For packs, increment is disabled as quantity is fixed at 1.
  };

  const cartTotal = getCartTotal();

  return (
    <>
      <SheetHeader>
        <SheetTitle>Shopping Cart</SheetTitle>
      </SheetHeader>
      <Separator />
      {cartItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <SheetClose asChild>
             <Button variant="link" asChild className="mt-4">
                <Link href="/">Start Shopping</Link>
             </Button>
          </SheetClose>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
             <div className="divide-y divide-border">
                {cartItems.map((item) => {
                  const isPackSelection = item.type === 'pack' && item.selectedNumbers;
                  const name = isPackSelection ? item.name : item.number; // For packs, use pack name
                  const price = item.price; // This is already calculated sum for packs or individual price
                  const originalPrice = isPackSelection ? item.originalPackFullPrice : item.originalPrice;

                  return (
                    <div key={item.cartId} className="px-6 py-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-base text-foreground flex-grow pr-2">
                          {isPackSelection && <Package className="inline h-4 w-4 mr-1 text-muted-foreground" />}
                          {name} {isPackSelection ? `(Custom Selection)`: ''}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0 -mr-2"
                          onClick={() => removeFromCart(item.cartId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {isPackSelection && item.selectedNumbers && (
                        <div className="mb-1">
                            <p className="text-xs text-muted-foreground">Selected numbers ({item.selectedNumbers.length}):</p>
                            <ul className="text-xs text-muted-foreground list-disc list-inside pl-1 max-h-16 overflow-y-auto scrollbar-hide">
                            {item.selectedNumbers.map((num, idx) => (
                                <li key={num.id || idx} className="truncate">{num.number} ({num.price}/-)</li>
                            ))}
                            </ul>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-primary font-medium">${price?.toFixed(2)}</span>
                          {/* Original price for packs might be complex to show if it's a dynamic selection vs full pack original */}
                          {/* For individual items: */}
                          {!isPackSelection && originalPrice && originalPrice > price && (
                            <span className="ml-2 line-through text-muted-foreground">
                              ${originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {/* <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDecrement(item)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                             type="number"
                             min="1"
                             value={item.quantity}
                             readOnly={item.type === 'pack'} // Quantity is fixed for packs
                             onChange={(e) => item.type !== 'pack' && updateQuantity(item.cartId, parseInt(e.target.value))}
                             className="h-6 w-10 text-center px-1"
                           />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleIncrement(item)}
                            disabled={item.type === 'pack'} // Max quantity is 1 for pack selections
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div> */}
                      </div>
                    </div>
                  );
                })}
             </div>
          </ScrollArea>
          <Separator />
          <SheetFooter className="mt-auto px-6 sm:flex-col sm:space-y-4 sm:items-stretch">
             <div className="flex justify-between items-center font-medium py-4">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
             </div>
             <Button variant="outline" onClick={clearCart} className="w-full">Clear Cart</Button>
             <SheetClose asChild>
               <Button asChild className="w-full">
                  <Link href="/checkout">Proceed to Checkout</Link>
               </Button>
            </SheetClose>
          </SheetFooter>
        </>
      )}
    </>
  );
}
