
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
    numbers = [], 
    totalOriginalPrice, 
    isVipPack,
    imageUrl,
    imageHint,
    description
  } = packDetails;

  // Initialize selectedNumberIds to include only 'available' numbers by default
  const initiallySelectedIds = numbers
    .filter(n => n.status === 'available')
    .map(n => n.id);
  const [selectedNumberIds, setSelectedNumberIds] = useState(new Set(initiallySelectedIds));

  useEffect(() => {
    // Re-initialize if packDetails.numbers changes (e.g., status updates from parent)
    const availableNumbers = numbers.filter(n => n.status === 'available').map(n => n.id);
    setSelectedNumberIds(prevSelected => {
        // Keep previously selected available numbers, deselect any that became unavailable
        const newSelected = new Set();
        prevSelected.forEach(id => {
            if (availableNumbers.includes(id)) {
                newSelected.add(id);
            }
        });
        return newSelected;
    });
  }, [numbers]);


  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedNumberIds(new Set(numbers.filter(n => n.status === 'available').map(n => n.id)));
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

  const availableNumbersInPack = numbers.filter(n => n.status === 'available');
  const currentSelectedNumbers = numbers.filter(n => selectedNumberIds.has(n.id) && n.status === 'available');
  const currentDynamicPrice = currentSelectedNumbers.reduce((sum, num) => sum + (num.price || 0), 0);

  const allAvailableSelected = availableNumbersInPack.length > 0 && currentSelectedNumbers.length === availableNumbersInPack.length;
  
  const displayPrice = currentDynamicPrice;
  
  const handleAddToCartClick = () => {
    if (currentSelectedNumbers.length === 0) {
      alert("Please select at least one available number from the pack.");
      return;
    }
    const itemToAdd = {
      ...packDetails,
      numbers: packDetails.numbers, // Send all numbers with their statuses
      selectedNumbers: currentSelectedNumbers, // Only send actually selected and available
      price: displayPrice, 
      type: 'pack'
    };
    onAddToCart(itemToAdd);
  };

  const handleBookNowClick = () => {
    if (currentSelectedNumbers.length === 0) {
      alert("Please select at least one available number from the pack.");
      return;
    }
    const itemToBook = {
      ...packDetails,
      numbers: packDetails.numbers,
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
            <div className="flex items-center space-x-1.5">
              {isVipPack && (
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Badge variant="destructive" className="text-xs">VIP PACK</Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>VIP Pack</p></TooltipContent>
                </Tooltip>
              )}
            </div>
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
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-xl font-bold mb-1">{name}</CardTitle>
          {description && <CardDescription className="text-xs text-muted-foreground mb-3 line-clamp-2">{description}</CardDescription>}
          
          {numbers.length > 0 && (
            <div className="space-y-2 mb-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`select-all-${id}`}
                  checked={allAvailableSelected}
                  onCheckedChange={handleSelectAll}
                  disabled={availableNumbersInPack.length === 0}
                  aria-label="Select all available numbers in this pack"
                />
                <Label htmlFor={`select-all-${id}`} className={`text-sm font-medium ${availableNumbersInPack.length === 0 ? 'text-muted-foreground' : ''}`}>
                  Select All Available ({availableNumbersInPack.length})
                </Label>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-hide border p-2 rounded-md">
                {numbers.map((num) => (
                  <div key={num.id} className={`flex items-center justify-between ${num.status !== 'available' ? 'opacity-50' : ''}`}>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${id}-${num.id}`}
                        checked={selectedNumberIds.has(num.id)}
                        onCheckedChange={(checked) => handleNumberSelect(num.id, checked)}
                        disabled={num.status !== 'available'}
                      />
                      <Label htmlFor={`${id}-${num.id}`} className={`text-sm font-normal truncate ${num.status !== 'available' ? 'line-through' : ''}`} title={num.number}>
                        {num.number}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                        {num.status !== 'available' && <Badge variant="outline" className="text-xs py-0.5 px-1.5 border-destructive text-destructive">Sold</Badge>}
                        <span className={`text-sm ${num.status !== 'available' ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>₹{num.price}/-</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
           {availableNumbersInPack.length === 0 && numbers.length > 0 && (
             <p className="text-sm text-center text-destructive">All numbers in this pack are currently unavailable.</p>
           )}
        </CardContent>
        <CardFooter className="p-4 flex flex-col items-stretch space-y-2 border-t mt-auto">
            <div className="flex justify-between items-center mb-2">
                <div className="text-left">
                    <p className="text-2xl font-semibold text-primary">
                      ₹{displayPrice.toFixed(2)}/-
                    </p>
                </div>
                <Button 
                    onClick={handleBookNowClick} 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                    disabled={currentSelectedNumbers.length === 0 || availableNumbersInPack.length === 0}
                >
                    Book Selected
                 </Button>
            </div>
             <Button 
                onClick={handleAddToCartClick} 
                size="sm" 
                variant="outline" 
                disabled={currentSelectedNumbers.length === 0 || availableNumbersInPack.length === 0}
            >
                <ShoppingCart className="mr-2 h-4 w-4" /> 
                Add Selected to Cart ({currentSelectedNumbers.length})
            </Button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
