/**
 * @file CategorySection.jsx
 * @description A component to display a category of items with a title.
 * Items are displayed in a responsive vertical grid.
 */
"use client";

import React, { Suspense } from 'react';
import VipNumberCard from '@/components/VipNumberCard';
import VipNumberCardSkeleton from '@/components/skeletons/VipNumberCardSkeleton';

export default function CategorySection({ title, items, isLoading, onBookNow, onAddToCart, onToggleFavorite, isFavorite }) {
  // Fallback for items if it's undefined or null during loading or error
  const safeItems = items || [];

  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <div key={`skeleton-${index}`}>
        <VipNumberCardSkeleton />
      </div>
    ))
  );

  const renderItems = () => (
    safeItems.map((item) => (
      <div key={item.id}>
        <VipNumberCard
          numberDetails={item}
          onBookNow={onBookNow}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite} // Pass the item itself
          isFavorite={isFavorite(item.id)} // Call isFavorite with item.id
        />
      </div>
    ))
  );

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <Suspense fallback={<>{renderSkeletons()}</>}>
          {isLoading ? renderSkeletons() : renderItems()}
        </Suspense>
      </div>
    </section>
  );
}
