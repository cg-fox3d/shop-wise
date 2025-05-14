
/**
 * @file CategorySection.jsx
 * @description A component to display a category of items with a title.
 * Items are displayed in a horizontally scrollable row with navigation arrows.
 */
"use client";

import React, { useRef } from 'react';
import Link from 'next/link'; // Import Link
import VipNumberCard from '@/components/VipNumberCard';
import VipNumberCardSkeleton from '@/components/skeletons/VipNumberCardSkeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_SECTION = 10;
const SCROLL_AMOUNT = 300; // Amount to scroll in pixels

export default function CategorySection({ title, slug, items, isLoading, onBookNow, onAddToCart, onToggleFavorite, isFavorite }) {
  const scrollContainerRef = useRef(null);
  const safeItems = items || [];

  const itemsToDisplay = isLoading ? [] : safeItems.slice(0, ITEMS_PER_SECTION);
  const showSeeMoreButton = !isLoading && safeItems.length > ITEMS_PER_SECTION;

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
      <div key={`skeleton-${index}`} className="flex-shrink-0">
        <VipNumberCardSkeleton />
      </div>
    ))
  );

  const renderItems = () => (
    itemsToDisplay.map((item) => (
      <div key={item.id} className="flex-shrink-0 w-[280px] md:w-[300px]"> {/* Fixed width for cards */}
        <VipNumberCard
          numberDetails={item}
          onBookNow={onBookNow}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite(item.id)}
        />
      </div>
    ))
  );

  return (
    <section className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center space-x-2">
          {!isLoading && itemsToDisplay.length > 0 && (
            <>
              <Button variant="outline" size="icon" onClick={scrollLeft} aria-label="Scroll left">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={scrollRight} aria-label="Scroll right">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          {showSeeMoreButton && slug && (
            <Button variant="outline" asChild>
              <Link href={`/category/${slug}`}>
                See More ({safeItems.length - ITEMS_PER_SECTION} more)
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide"
      >
        {isLoading ? renderSkeletons() : renderItems()}
      </div>
      {!isLoading && itemsToDisplay.length === 0 && safeItems.length === 0 && (
         <p className="text-muted-foreground text-center py-4">No items in this category yet.</p>
      )}
    </section>
  );
}
