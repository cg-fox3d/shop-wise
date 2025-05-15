
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Check } from 'lucide-react'; // Assuming Crown might be used for isVipPack
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function NumberPackCard({ packDetails, onBookNow, onAddToCart, onToggleFavorite, isFavorite, isInCart }) {
  const {
    id,
    name,
    numbers, // Array of { id, number, price }
    packPrice,
    totalOriginalPrice,
    isVipPack,
    imageUrl,
    imageHint,
    description
  } = packDetails;

  const discount = totalOriginalPrice && totalOriginalPrice > packPrice ? totalOriginalPrice - packPrice : null;

  return (
    <TooltipProvider>
      <Card className="w-full max-w-sm flex-shrink-0 overflow-hidden rounded-lg shadow-lg bg-card transform transition-all hover:scale-105 flex flex-col">
        <CardHeader className="p-0 relative">
          {imageUrl && (
            <div className="aspect-video relative w-full">
              <Image
                src={imageUrl}
                alt={name || 'Number Pack'}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                data-ai-hint={imageHint || "group items"}
              />
            </div>
          )}
          <div className={`p-3 flex justify-between items-center ${!imageUrl ? 'bg-primary/90 text-primary-foreground' : 'absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent text-white'}`}>
            <span className="font-semibold text-sm">
              {discount ? `Save ${discount}/-` : (totalOriginalPrice && totalOriginalPrice > packPrice ? `Save ${totalOriginalPrice - packPrice}/-` : 'Special Pack Price')}
            </span>
            <div className="flex items-center space-x-1.5">
              {isVipPack && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="warning" className="text-xs">VIP PACK</Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>VIP Pack</p></TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Heart
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(packDetails); }}
                    className={`h-5 w-5 cursor-pointer hover:text-red-400 ${isFavorite ? 'fill-red-500 text-red-500' : (imageUrl ? 'text-white' : 'text-primary-foreground')}`}
                  />
                </TooltipTrigger>
                <TooltipContent><p>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-xl font-bold mb-2">{name}</CardTitle>
          {description && <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</CardDescription>}
          
          <div className="space-y-1 mb-3">
            <p className="text-sm font-medium text-muted-foreground">Contains {numbers?.length || 0} numbers:</p>
            <ul className="list-disc list-inside text-sm max-h-24 overflow-y-auto scrollbar-hide">
              {numbers?.map((num, index) => (
                <li key={num.id || index} className="truncate">{num.number} - {num.price}/-</li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="p-4 flex flex-col items-stretch space-y-2">
            <div className="flex justify-between items-center">
                <div className="text-left">
                    {totalOriginalPrice && totalOriginalPrice > packPrice && (
                    <p className="text-sm text-muted-foreground line-through">
                        {totalOriginalPrice}/-
                    </p>
                    )}
                    <p className="text-2xl font-semibold text-primary">
                    {packPrice}/-
                    </p>
                </div>
                <Button onClick={() => onBookNow(packDetails)} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isInCart}>
                    {isInCart ? 'Added & Booked' : 'Book Now'}
                 </Button>
            </div>
             <Button onClick={() => onAddToCart(packDetails)} size="sm" variant="outline" disabled={isInCart}>
              {isInCart ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Add Pack to Cart
                </>
              )}
            </Button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
