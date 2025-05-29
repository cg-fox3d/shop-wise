
/**
 * @file CategorySection.jsx
 * @description A component to display a category of items with a title.
 * Items are displayed in a horizontally scrollable row with navigation arrows.
 * Can display individual VIP numbers or number packs.
 */
"use client";

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import VipNumberCard from '@/components/VipNumberCard';
import NumberPackCard from '@/components/NumberPackCard';
import VipNumberCardSkeleton from '@/components/skeletons/VipNumberCardSkeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

const ITEMS_PER_SECTION = 10;
const SCROLL_AMOUNT = 300; // Amount to scroll in pixels

export default function CategorySection({
  title,
  slug,
  items,
  isLoading,
  categoryType = 'individual', // 'individual' or 'pack'
  onBookNow,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
  cartItems
}) {
  const scrollContainerRef = useRef(null);
  const [selectedNumQuantity, setSelectedNumQuantity] = useState(null); // For pack quantity filter
  const [filteredDisplayItems, setFilteredDisplayItems] = useState([]);

  const safeItems = items || [];

  useEffect(() => {
    let displayableItems = safeItems;
    if (categoryType === 'pack' && selectedNumQuantity) {
      displayableItems = safeItems.filter(item => item.numbers && item.numbers.length === parseInt(selectedNumQuantity));
    }
    setFilteredDisplayItems(displayableItems.slice(0, ITEMS_PER_SECTION));
  }, [safeItems, selectedNumQuantity, categoryType]);


  const showSeeMoreButton = !isLoading && safeItems.length > ITEMS_PER_SECTION && (categoryType === 'pack' ? filteredDisplayItems.length > 0 : true) ;
  // For packs, only show see more if current filter yields results or no filter applied

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
    }
  };

  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <div key={`skeleton-${index}`} className="flex-shrink-0 w-[290px] md:w-[310px] lg:w-[330px]">
         {/* For pack skeletons, you might want a different one if layout is very distinct */}
        <VipNumberCardSkeleton />
      </div>
    ))
  );

  const renderItems = () => (
    filteredDisplayItems.map((item) => (
      <div key={item.id} className="flex-shrink-0 w-[290px] md:w-[310px] lg:w-[330px]">
        {categoryType === 'pack' ? (
          <NumberPackCard
            packDetails={item}
            onBookNow={onBookNow}
            onAddToCart={onAddToCart}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite(item.id)}
            // isInCart prop for packs could be complex with selections; handled internally or by context
          />
        ) : (
          <VipNumberCard
            numberDetails={item}
            onBookNow={onBookNow}
            onAddToCart={onAddToCart}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite(item.id)}
          />
        )}
      </div>
    ))
  );

  const seeMoreLink = categoryType === 'pack' ? `/category/${slug}?type=packs` : `/category/${slug}`;

  const numQuantityOptions = Array.from({ length: 6 }, (_, i) => i + 2); // 2 to 7

  return (
    <section className="py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center space-x-2 flex-wrap justify-end">
          {categoryType === 'pack' && (
            <div className="flex items-center space-x-2">
              <Label htmlFor={`pack-qty-select-${slug}`} className="text-sm whitespace-nowrap">Numbers in Pack:</Label>
              <Select
                value={selectedNumQuantity || ""}
                onValueChange={(value) => setSelectedNumQuantity(value === "all" ? null : value)}
              >
                <SelectTrigger id={`pack-qty-select-${slug}`} className="w-[100px] h-9">
                  <SelectValue placeholder="Qty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {numQuantityOptions.map(qty => (
                    <SelectItem key={qty} value={String(qty)}>{qty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!isLoading && filteredDisplayItems.length > 0 && (
            <>
              <Button variant="outline" size="icon" onClick={scrollLeft} aria-label="Scroll left" className="h-9 w-9">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={scrollRight} aria-label="Scroll right" className="h-9 w-9">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          {showSeeMoreButton && slug && (
            <Button variant="outline" asChild className="h-9">
              <Link href={seeMoreLink}>
                See More
                {safeItems.length > ITEMS_PER_SECTION && ` (${categoryType === 'pack' && selectedNumQuantity ? safeItems.filter(item => item.numbers && item.numbers.length === parseInt(selectedNumQuantity)).length : safeItems.length} total)`}
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide"
      >
        {isLoading ? renderSkeletons() : (filteredDisplayItems.length > 0 ? renderItems() :
          <p className="text-muted-foreground text-center py-4 w-full">
            No {categoryType === 'pack' ? (selectedNumQuantity ? `packs with ${selectedNumQuantity} numbers` : 'packs') : 'items'} found in this category.
          </p>
        )}
      </div>
      {!isLoading && safeItems.length === 0 && (
         <p className="text-muted-foreground text-center py-4">No items in this category yet.</p>
      )}
    </section>
  );
}
