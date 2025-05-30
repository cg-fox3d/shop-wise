
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Smartphone, Tags, DollarSign } from 'lucide-react';

export default function SearchBar() {
  const router = useRouter();
  const [activeSearchType, setActiveSearchType] = useState('digits'); // 'digits', 'price'
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [searchOptions, setSearchOptions] = useState({
    globalSearch: true,
    premiumSearch: false,
    numerologySearch: false,
    exactDigitPlacement: false,
    // mostContains: false, // This option was disabled, can be removed or kept as is
  });

  const handleSearchTypeChange = (type) => {
    setActiveSearchType(type);
    if (type !== 'digits') setSearchTerm('');
    if (type !== 'price') {
      setMinPrice('');
      setMaxPrice('');
    }
  };

  const handleOptionChange = (option) => {
    setSearchOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    const queryParams = new URLSearchParams();
    queryParams.append('type', activeSearchType);

    if (activeSearchType === 'digits' && searchTerm.trim()) {
        queryParams.append('term', searchTerm.trim());
    } else if (activeSearchType === 'price') {
        if (minPrice.trim()) queryParams.append('minPrice', minPrice.trim());
        if (maxPrice.trim()) queryParams.append('maxPrice', maxPrice.trim());
    }
    
    Object.entries(searchOptions).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, 'true');
      }
    });
    
    router.push(`/search-results?${queryParams.toString()}`);
  };

  return (
    <div className="p-4 md:p-6 bg-card shadow-md rounded-lg w-[90%] sm:w-[80%] md:w-[70%] lg:w-[70%] mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <Button
          variant={activeSearchType === 'digits' ? 'default' : 'outline'}
          onClick={() => handleSearchTypeChange('digits')}
          className="w-full justify-center py-3"
        >
          <Smartphone className="mr-2 h-5 w-5" /> Search by Digits
        </Button>
        <Button
          variant={activeSearchType === 'price' ? 'default' : 'outline'}
          onClick={() => handleSearchTypeChange('price')}
          className="w-full justify-center py-3"
        >
          <Tags className="mr-2 h-5 w-5" /> Search by Price
        </Button>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
        {activeSearchType === 'digits' && (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-grow relative">
              <Input
                id="search-input-digits"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="E.g. 987 or full number"
                className="h-12 text-base"
                aria-label="Enter Digits Here"
              />
               <Label htmlFor="search-input-digits" className="absolute -top-2 left-2 -mt-px inline-block bg-card px-1 text-xs font-medium text-muted-foreground">
                Enter Digits Here
              </Label>
            </div>
            <Button type="submit" className="h-12 px-6 sm:w-auto w-full">
              <Search className="mr-2 h-5 w-5" /> SEARCH
            </Button>
          </div>
        )}
        
        {activeSearchType === 'price' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="min-price"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min Price (₹)"
                  className="h-12 text-base pl-10"
                  aria-label="Minimum Price"
                  min="0"
                />
                <Label htmlFor="min-price" className="absolute -top-2 left-2 -mt-px inline-block bg-card px-1 text-xs font-medium text-muted-foreground">
                  Min Price (₹)
                </Label>
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="max-price"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max Price (₹)"
                  className="h-12 text-base pl-10"
                  aria-label="Maximum Price"
                  min="0"
                />
                 <Label htmlFor="max-price" className="absolute -top-2 left-2 -mt-px inline-block bg-card px-1 text-xs font-medium text-muted-foreground">
                  Max Price (₹)
                </Label>
              </div>
            </div>
            <Button type="submit" className="h-12 px-6 w-full sm:w-auto">
              <Search className="mr-2 h-5 w-5" /> SEARCH PRICE RANGE
            </Button>
          </div>
        )}
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="globalSearch" 
            checked={searchOptions.globalSearch} 
            onCheckedChange={() => handleOptionChange('globalSearch')}
          />
          <Label htmlFor="globalSearch" className="font-normal">Global Search <span className="text-muted-foreground text-xs">(price, etc.)</span></Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="premiumSearch" 
            checked={searchOptions.premiumSearch}
            onCheckedChange={() => handleOptionChange('premiumSearch')}
          />
          <Label htmlFor="premiumSearch" className="font-normal">Premium Only</Label>
        </div>
        {activeSearchType === 'digits' && (
            <>
                <div className="flex items-center space-x-2">
                <Checkbox 
                    id="numerologySearch" 
                    checked={searchOptions.numerologySearch}
                    onCheckedChange={() => handleOptionChange('numerologySearch')}
                />
                <Label htmlFor="numerologySearch" className="font-normal">Numerology (Sum)</Label>
                </div>
                <div className="flex items-center space-x-2">
                <Checkbox 
                    id="exactDigitPlacement" 
                    checked={searchOptions.exactDigitPlacement}
                    onCheckedChange={() => handleOptionChange('exactDigitPlacement')}
                />
                <Label htmlFor="exactDigitPlacement" className="font-normal">Exact Start</Label>
                </div>
            </>
        )}
      </div>
    </div>
  );
}
