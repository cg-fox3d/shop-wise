
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Check, PackagePlus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function NumberPackCard({ packDetails, onBookNow, onAddToCart, onToggleFavorite, isFavorite }) {
  const {
    id,
    name,
    numbers = [], // Ensure numbers is an array // Original price if all selected or a special bundle price
    totalOriginalPrice, // Sum of all individual numbers if bought separately
    isVipPack,
    imageUrl,
    imageHint,
    description
  } = packDetails;

  const [selectedNumberIds, setSelectedNumberIds] = useState(new Set(numbers.map(n => n.id))); // Default to all selected

  const handleSelectAll = (checked) => {
    if (checked) {
      console.log('packDetails:', packDetails);
      console.log('numbers:', new Set(numbers.map(n => n.id)));
      setSelectedNumberIds(new Set(numbers.map(n => n.id)));
    } else {
      setSelectedNumberIds(new Set());
    }
  };

  const handleNumberSelect = (numberId, checked) => {
    setSelectedNumberIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(numberId);
      } else {
        newSet.delete(numberId);
      }
      return newSet;
    });
  };

  const currentSelectedNumbers = numbers.filter(n => selectedNumberIds.has(n.id));
  const currentDynamicPrice = currentSelectedNumbers.reduce((sum, num) => sum + (num.price || 0), 0);

  const allSelected = currentSelectedNumbers.length === numbers.length && numbers.length > 0;
  const someSelected = currentSelectedNumbers.length > 0 && !allSelected;

  // Determine if there's a bundle discount if all are selected
  // const effectivePackPrice = (packPrice && packPrice < totalOriginalPrice) ? packPrice : totalOriginalPrice;
  const displayPrice = currentDynamicPrice;
  
  const discount = totalOriginalPrice && totalOriginalPrice > displayPrice ? totalOriginalPrice - displayPrice : 0;


  const handleAddToCartClick = () => {
    if (currentSelectedNumbers.length === 0) {
      // Optionally show a toast message to select at least one number
      alert("Please select at least one number from the pack.");
      return;
    }
    const itemToAdd = {
      ...packDetails,
      selectedNumbers: currentSelectedNumbers,
      price: displayPrice, // Use the dynamically calculated price or bundle price
      type: 'pack' // Keep type as pack, cart context will handle selectedNumbers
    };
    console.log(itemToAdd);
    onAddToCart(itemToAdd);
  };

  const handleBookNowClick = () => {
    if (currentSelectedNumbers.length === 0) {
      alert("Please select at least one number from the pack.");
      return;
    }
    const itemToBook = {
      ...packDetails,
      selectedNumbers: currentSelectedNumbers,
      price: displayPrice,
      type: 'pack'
    };
    onBookNow(itemToBook);
  };


  return (
    <TooltipProvider>
      <Card className="w-full max-w-md flex-shrink-0 overflow-hidden rounded-lg shadow-lg bg-card flex flex-col">
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
            {/* <span className="font-semibold text-sm">
              {discount > 0 ? `Save ₹${discount.toFixed(2)}/-` : 'Special Pack'}
            </span> */}
            <div className="flex items-center space-x-1.5">
              {isVipPack && (
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Badge variant="warning" className="text-xs border-yellow-400 text-yellow-400 bg-transparent group-hover:border-yellow-300 group-hover:text-yellow-300">VIP PACK</Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>VIP Pack</p></TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(packDetails); }}
                    className={`h-7 w-7 p-1 rounded-full hover:bg-white/20 ${isFavorite ? 'text-red-500' : (imageUrl ? 'text-white' : 'text-primary-foreground')}`}
                  >
                    <Heart
                      className={`h-5 w-5 hover:text-red-400 ${isFavorite ? 'fill-red-500' : ''}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-xl font-bold mb-1">{name}</CardTitle>
          {description && <CardDescription className="text-xs text-muted-foreground mb-3 line-clamp-2">{description}</CardDescription>}
          
          {numbers.length > 0 && (
            <div className="space-y-2 mb-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`select-all-${id}`}
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all numbers in this pack"
                />
                <Label htmlFor={`select-all-${id}`} className="text-sm font-medium">
                  Select All ({numbers.length} numbers)
                </Label>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-hide border p-2 rounded-md">
                {numbers.map((num) => (
                  <div key={num.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${id}-${num.id}`}
                        checked={selectedNumberIds.has(num.id)}
                        onCheckedChange={(checked) => handleNumberSelect(num.id, checked)}
                      />
                      <Label htmlFor={`${id}-${num.id}`} className="text-sm font-normal truncate" title={num.number}>
                        {num.number}
                      </Label>
                    </div>
                    <span className="text-sm text-muted-foreground">₹{num.price}/-</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 flex flex-col items-stretch space-y-2 border-t mt-auto">
            <div className="flex justify-between items-center mb-2">
                <div className="text-left">
                    {allSelected < currentDynamicPrice && (
                       <p className="text-xs text-muted-foreground">
                           Total Price:
                       </p>
                    )}
                     {/* {(currentSelectedNumbers.length > 0 && currentSelectedNumbers.length < numbers.length && currentDynamicPrice < numbers.filter(n => selectedNumberIds.has(n.id)).reduce((sum, n) => sum + (totalOriginalPrice/numbers.length), 0) ) && (
                         <p className="text-xs text-muted-foreground line-through">
                           Original: ₹{numbers.filter(n => selectedNumberIds.has(n.id)).reduce((sum, n) => sum + (totalOriginalPrice/numbers.length), 0).toFixed(2)}/-
                       </p>
                    )} */}
                    <p className="text-2xl font-semibold text-primary">
                      ₹{displayPrice.toFixed(2)}/-
                    </p>
                </div>
                <Button onClick={handleBookNowClick} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={currentSelectedNumbers.length === 0}>
                    Book Selected
                 </Button>
            </div>
             <Button onClick={handleAddToCartClick} size="sm" variant="outline" disabled={currentSelectedNumbers.length === 0}>
                <ShoppingCart className="mr-2 h-4 w-4" /> 
                Add Selected to Cart ({currentSelectedNumbers.length})
            </Button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
