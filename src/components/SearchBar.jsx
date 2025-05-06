"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Smartphone, Tags, Users } from 'lucide-react'; // Using Smartphone for digits, Tags for price, Users for family

export default function SearchBar() {
  const router = useRouter();
  const [activeSearchType, setActiveSearchType] = useState('digits'); // 'digits', 'price', 'family'
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOptions, setSearchOptions] = useState({
    globalSearch: true,
    premiumSearch: false,
    numerologySearch: false,
    exactDigitPlacement: false,
    mostContains: false,
  });

  const handleSearchTypeChange = (type) => {
    setActiveSearchType(type);
    // Reset options or specific logic for search type if needed
  };

  const handleOptionChange = (option) => {
    setSearchOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim() && activeSearchType === 'digits') { // Only require searchTerm for digit search
        // Potentially show a toast or validation message
        return;
    }
    
    const queryParams = new URLSearchParams();
    queryParams.append('type', activeSearchType);
    if (searchTerm.trim()) {
        queryParams.append('term', searchTerm.trim());
    }
    Object.entries(searchOptions).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, 'true');
      }
    });
    
    router.push(`/search-results?${queryParams.toString()}`);
  };

  return (
    <div className="p-4 md:p-6 bg-card shadow-md rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
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
        <Button
          variant={activeSearchType === 'family' ? 'default' : 'outline'}
          onClick={() => handleSearchTypeChange('family')}
          className="w-full justify-center py-3"
        >
          <Users className="mr-2 h-5 w-5" /> Family Pack
        </Button>
      </div>

      {activeSearchType === 'digits' && (
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-grow relative">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="E.g. 987"
                className="h-12 text-base"
                aria-label="Enter Digits Here"
              />
               <Label htmlFor="search-input" className="absolute -top-2 left-2 -mt-px inline-block bg-card px-1 text-xs font-medium text-muted-foreground">
                Enter Digits Here
              </Label>
            </div>
            <Button type="submit" className="h-12 px-6 sm:w-auto w-full">
              <Search className="mr-2 h-5 w-5" /> SEARCH
            </Button>
          </div>
        </form>
      )}
      
      {/* Search options for price and family pack can be added here if needed */}
      {activeSearchType === 'price' && (
         <p className="text-muted-foreground text-center my-4">Price search options coming soon.</p>
         /* Example:
         <form onSubmit={handleSearch} className="mb-4"> ... inputs for price range ... </form> 
         */
      )}
      {activeSearchType === 'family' && (
         <p className="text-muted-foreground text-center my-4">Family pack search options coming soon.</p>
        /* Example:
         <form onSubmit={handleSearch} className="mb-4"> ... inputs for family pack criteria ... </form> 
         */
      )}


      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="globalSearch" 
            checked={searchOptions.globalSearch} 
            onCheckedChange={() => handleOptionChange('globalSearch')}
          />
          <Label htmlFor="globalSearch" className="font-normal">Global Search <span className="text-muted-foreground text-xs">(Recommended)</span></Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="premiumSearch" 
            checked={searchOptions.premiumSearch}
            onCheckedChange={() => handleOptionChange('premiumSearch')}
          />
          <Label htmlFor="premiumSearch" className="font-normal">Premium Search</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="numerologySearch" 
            checked={searchOptions.numerologySearch}
            onCheckedChange={() => handleOptionChange('numerologySearch')}
          />
          <Label htmlFor="numerologySearch" className="font-normal">Numerology Search</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="exactDigitPlacement" 
            checked={searchOptions.exactDigitPlacement}
            onCheckedChange={() => handleOptionChange('exactDigitPlacement')}
          />
          <Label htmlFor="exactDigitPlacement" className="font-normal">Exact Digit Placement</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="mostContains" 
            checked={searchOptions.mostContains}
            onCheckedChange={() => handleOptionChange('mostContains')}
          />
          <Label htmlFor="mostContains" className="font-normal">Most Contains</Label>
        </div>
      </div>
    </div>
  );
}
