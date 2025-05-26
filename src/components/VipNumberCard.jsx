
"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, ShoppingCart, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export default function VipNumberCard({ numberDetails, onBookNow, onAddToCart, onToggleFavorite, isFavorite }) {
  const {
    id,
    number,
    price,
    originalPrice,
    totalDigits,
    sumOfDigits,
    isVip,
    discount,
    similarNumbersLink = "#"
  } = numberDetails;

  const formattedNumber = number ? number.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4') : "N/A";

  return (
    <TooltipProvider>
      <Card className="w-full max-w-xs flex-shrink-0 overflow-hidden rounded-lg shadow-lg bg-card transform transition-all hover:scale-105 flex flex-col">
        <CardHeader className="p-0 relative">
          <div className="bg-primary/90 text-primary-foreground p-3 flex justify-between items-center">
            <span className="font-semibold text-sm">
              {discount ? `Save ₹${discount}/-` : (originalPrice && originalPrice > price ? `Save ₹${originalPrice - price}/-` : 'Best Price')}
            </span>
            <div className="flex items-center space-x-1.5">
              {isVip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Badge variant="warning" className="text-xs border-yellow-400 text-yellow-400 bg-transparent group-hover:border-yellow-300 group-hover:text-yellow-300">VIP</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>VIP Number</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onAddToCart(numberDetails)} className="h-7 w-7 p-1 rounded-full hover:bg-white/20 text-primary-foreground">
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to Cart</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(numberDetails)} className={`h-7 w-7 p-1 rounded-full hover:bg-white/20 ${isFavorite ? 'text-red-500' : 'text-primary-foreground'}`}>
                    <Heart
                      className={`h-5 w-5 hover:text-red-400 ${isFavorite ? 'fill-red-500' : ''}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 text-center space-y-3 pt-5 flex-grow flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <a href={similarNumbersLink} className="hover:underline hover:text-primary">Similar Numbers</a>
              <div className="text-right">
                <p>Total-{totalDigits || 'N/A'}</p>
                <p>Sum-{sumOfDigits || 'N/A'}</p>
              </div>
            </div>
            
            <h3 className="text-3xl font-bold tracking-tighter text-foreground my-3">
              {formattedNumber}
            </h3>
          </div>

          <div className="flex justify-between items-end mt-auto">
            <div className="text-left">
              {originalPrice && originalPrice > price && (
                <p className="text-sm text-muted-foreground line-through">
                  ₹{originalPrice}/-
                </p>
              )}
              <p className="text-xl font-semibold text-primary">
                ₹{price}/-
              </p>
            </div>
            <Button onClick={() => onBookNow(numberDetails)} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Book Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
