"use client";

import React from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(product);
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
        <Button onClick={handleAddToCart} size="sm">
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
