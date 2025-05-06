"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Check } from 'lucide-react'; // Import Check icon
import { useToast } from "@/hooks/use-toast";


export default function ProductCard({ product }) {
  const { addToCart, cartItems } = useCart();
  const { toast } = useToast();

  // Check if the product is already in the cart
  const isInCart = cartItems.some(item => item.id === product.id);

  const handleAddToCart = () => {
    if (isInCart) {
      // Optionally, inform the user the item is already in the cart
      toast({
        title: "Already in Cart",
        description: `${product.name} is already in your cart.`,
      });
      return; // Prevent adding again
    }
    addToCart(product); // Add to cart only if not already present
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <Card className="w-full overflow-hidden flex flex-col">
      <CardHeader className="p-0">
         <div className="aspect-square relative w-full">
           <Image
             src={product.imageUrl}
             alt={product.name}
             fill
             sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
             className="object-cover"
             data-ai-hint={product.imageHint}
           />
         </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1">{product.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <span className="text-lg font-bold text-primary">
          ${product.price.toFixed(2)}
        </span>
        <Button onClick={handleAddToCart} size="sm" disabled={isInCart}>
          {isInCart ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Added
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
