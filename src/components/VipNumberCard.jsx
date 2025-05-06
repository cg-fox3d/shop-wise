"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, ShoppingCart, Heart, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CountdownTimer = ({ expiryTimestamp }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(expiryTimestamp) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isMounted, setIsMounted] = useState(false); // To avoid hydration mismatch

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      if (isMounted) {
        setTimeLeft(calculateTimeLeft());
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      setIsMounted(false);
    }
  }, [timeLeft, isMounted, expiryTimestamp]); // Added expiryTimestamp to dependencies

  if (!isMounted) {
    return (
        <Badge variant="outline" className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 text-sm shadow-md">
        Loading...
      </Badge>
    );
  }

  const timerComponents = [];
  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval] && interval !== 'seconds' && Object.keys(timeLeft).length > 1 && timeLeft.hours === 0 && timeLeft.minutes === 0) { 
      return;
    }
    timerComponents.push(
      <span key={interval}>
        {String(timeLeft[interval]).padStart(2, '0')}
      </span>
    );
  });

  return (
    <Badge variant="destructive" className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 text-sm shadow-md bg-yellow-400 text-black">
      {timerComponents.length ? timerComponents.reduce((prev, curr) => [prev, ':', curr]) : <span>Expired!</span>} Left
    </Badge>
  );
};


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
    expiryTimestamp, 
    similarNumbersLink = "#"
  } = numberDetails;

  const formattedNumber = number.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4');

  return (
    <TooltipProvider>
      <Card className="w-full max-w-xs flex-shrink-0 overflow-hidden rounded-lg shadow-lg bg-card transform transition-all hover:scale-105">
        <CardHeader className="p-0 relative">
          <div className="bg-primary/90 text-primary-foreground p-3 flex justify-between items-center">
            <span className="font-semibold text-sm">Save {discount}/-</span>
            <div className="flex items-center space-x-1.5">
              {isVip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Crown className="h-5 w-5 text-yellow-400 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>VIP Number</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <ShoppingCart onClick={() => onAddToCart(numberDetails)} className="h-5 w-5 cursor-pointer hover:text-accent-foreground/80" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to Cart</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Heart
                    onClick={() => onToggleFavorite(numberDetails)} // Pass the full item
                    className={`h-5 w-5 cursor-pointer hover:text-red-400 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          {expiryTimestamp && <CountdownTimer expiryTimestamp={expiryTimestamp} />}
        </CardHeader>
        <CardContent className="p-4 text-center space-y-3 pt-8"> 
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <a href={similarNumbersLink} className="hover:underline hover:text-primary">Similar Numbers</a>
            <div className="text-right">
              <p>Total-{totalDigits}</p>
              <p>Sum-{sumOfDigits}</p>
            </div>
          </div>
          
          <h3 className="text-3xl font-bold tracking-tighter text-foreground my-3">
            {formattedNumber}
          </h3>

          <div className="flex justify-between items-end">
            <div className="text-left">
              {originalPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  {originalPrice}/-
                </p>
              )}
              <p className="text-xl font-semibold text-primary">
                {price}/-
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
