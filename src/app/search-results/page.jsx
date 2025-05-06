"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import VipNumberCard from '@/components/VipNumberCard';
import VipNumberCardSkeleton from '@/components/skeletons/VipNumberCardSkeleton';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/LoginModal';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Button } from '@/components/ui/button';

// Sample data - replace with actual data source and filtering logic
const allVipNumbers = [
  { id: 'vip1', number: '9090507860', price: 3999, originalPrice: 5299, totalDigits: 10, sumOfDigits: 4, isVip: true, discount: 1300, expiryTimestamp: new Date(Date.now() + 86400000).toISOString(), imageHint: "vip number" },
  { id: 'vip2', number: '8888887861', price: 4999, originalPrice: 6299, totalDigits: 10, sumOfDigits: 5, isVip: true, discount: 1300, expiryTimestamp: new Date(Date.now() + 2 * 86400000).toISOString(), imageHint: "mobile number" },
  { id: 'vip3', number: '9123457862', price: 2999, originalPrice: 4299, totalDigits: 10, sumOfDigits: 6, isVip: false, discount: 1300, expiryTimestamp: new Date(Date.now() + 0.5 * 86400000).toISOString(), imageHint: "sim card" },
  { id: 'vip4', number: '9988776655', price: 1999, originalPrice: 3299, totalDigits: 10, sumOfDigits: 8, isVip: false, discount: 1300, expiryTimestamp: new Date(Date.now() + 3 * 86400000).toISOString(), imageHint: "fancy number" },
  { id: 'vip5', number: '7777112233', price: 2499, originalPrice: 3799, totalDigits: 10, sumOfDigits: 1, isVip: true, discount: 1300, expiryTimestamp: new Date(Date.now() + 1.5 * 86400000).toISOString(), imageHint: "special number" },
  { id: 'vip6', number: '9000000001', price: 9999, originalPrice: 11299, totalDigits: 10, sumOfDigits: 1, isVip: true, discount: 1300, expiryTimestamp: new Date(Date.now() + 5 * 86400000).toISOString(), imageHint: "premium number" },
  { id: 'vip7', number: '8000000008', price: 8999, originalPrice: 10299, totalDigits: 10, sumOfDigits: 8, isVip: true, discount: 1300, expiryTimestamp: new Date(Date.now() + 0.2 * 86400000).toISOString(), imageHint: "exclusive number" },
  { id: 'vip8', number: '7770001111', price: 7999, originalPrice: 9299, totalDigits: 10, sumOfDigits: 7, isVip: false, discount: 1300, expiryTimestamp: new Date(Date.now() + 4 * 86400000).toISOString(), imageHint: "collection number" },
  // Add more for pagination/lazy loading testing
  { id: 'vip9', number: '1234567890', price: 1500, originalPrice: 2000, totalDigits: 10, sumOfDigits: 5, isVip: false, discount: 500, expiryTimestamp: new Date(Date.now() + 86400000).toISOString(), imageHint: "standard number" },
  { id: 'vip10', number: '0987654321', price: 1800, originalPrice: 2200, totalDigits: 10, sumOfDigits: 6, isVip: false, discount: 400, expiryTimestamp: new Date(Date.now() + 2*86400000).toISOString(), imageHint: "simple number" },
  { id: 'vip11', number: '1122334455', price: 2200, originalPrice: 2800, totalDigits: 10, sumOfDigits: 7, isVip: true, discount: 600, expiryTimestamp: new Date(Date.now() + 3*86400000).toISOString(), imageHint: "pattern number" },
  { id: 'vip12', number: '5544332211', price: 2100, originalPrice: 2700, totalDigits: 10, sumOfDigits: 8, isVip: true, discount: 600, expiryTimestamp: new Date(Date.now() + 4*86400000).toISOString(), imageHint: "sequential number" },
];

const ITEMS_PER_PAGE = 8;

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart: addProductToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [filteredItems, setFilteredItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const searchTerm = searchParams.get('term') || '';
  const searchType = searchParams.get('type') || 'digits';
  // Get other search options
  const globalSearch = searchParams.get('globalSearch') === 'true';
  const premiumSearch = searchParams.get('premiumSearch') === 'true';
  // ... and so on for other options

  // Simulate filtering based on search params
  useEffect(() => {
    setIsLoading(true);
    setPage(1); // Reset page on new search

    // Simulate API call / complex filtering
    setTimeout(() => {
      let results = allVipNumbers;
      if (searchType === 'digits' && searchTerm) {
        results = allVipNumbers.filter(item => 
          item.number.includes(searchTerm) || 
          (globalSearch && (item.id.includes(searchTerm) || String(item.price).includes(searchTerm)))
          // Add more complex logic based on premiumSearch, exactDigitPlacement etc.
        );
      } else if (searchType === 'price') {
        // Implement price filtering logic here based on params
        // For now, just show some items if no specific term
        results = allVipNumbers.filter(item => item.price < 5000); 
      } else if (searchType === 'family') {
        // Implement family pack logic here based on params
         results = allVipNumbers.filter(item => item.isVip); // Example
      }
      // Apply other options like premiumSearch, numerologySearch etc.
      if (premiumSearch) {
        results = results.filter(item => item.isVip);
      }

      setFilteredItems(results);
      setDisplayedItems(results.slice(0, ITEMS_PER_PAGE));
      setHasMore(results.length > ITEMS_PER_PAGE);
      setIsLoading(false);
    }, 1000);
  }, [searchParams, searchTerm, searchType, globalSearch, premiumSearch]);


  const loadMoreItems = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      const nextPage = page + 1;
      const newItems = filteredItems.slice(0, nextPage * ITEMS_PER_PAGE);
      setDisplayedItems(newItems);
      setPage(nextPage);
      setHasMore(newItems.length < filteredItems.length);
      setIsLoadingMore(false);
    }, 500); // Simulate network delay
  }, [page, filteredItems, hasMore, isLoadingMore]);

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    toast({ title: "Login Successful" });
    if (pendingAction) {
      pendingAction.action(pendingAction.item);
      setPendingAction(null);
    }
  };

  const executeOrPromptLogin = (action, item) => {
    if (!user) {
      setPendingAction({ action, item });
      setIsLoginModalOpen(true);
    } else {
      action(item);
    }
  };

  const handleBookNow = useCallback((item) => {
    const isInCart = cartItems.some(cartItem => cartItem.id === item.id);
    if (!isInCart) {
      addProductToCart(item);
      toast({
        title: "Added to Cart",
        description: `${item.number} has been added to your cart.`,
      });
    }
    // Intentionally not navigating to checkout from search results page to allow further browsing
    // router.push('/checkout'); 
  }, [addProductToCart, toast, cartItems]);

  const handleAddToCart = useCallback((item) => {
    const isInCart = cartItems.some(cartItem => cartItem.id === item.id);
    if (isInCart) {
      toast({
        title: "Already in Cart",
        description: `${item.number} is already in your cart.`,
      });
      return;
    }
    addProductToCart(item);
    toast({
      title: "Added to Cart",
      description: `${item.number} has been added to your cart.`,
    });
  }, [addProductToCart, toast, cartItems]);

  const handleToggleFavorite = useCallback((item) => {
    toggleFavorite(item);
    toast({ title: isFavorite(item.id) ? "Removed from Favorites" : "Added to Favorites" });
  }, [toggleFavorite, isFavorite, toast]);
  
  const renderSkeletons = (count) => (
    Array.from({ length: count }).map((_, index) => (
      <VipNumberCardSkeleton key={`skeleton-${index}`} />
    ))
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">
        Search Results {searchTerm && `for "${searchTerm}"`}
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {renderSkeletons(ITEMS_PER_PAGE)}
        </div>
      ) : displayedItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedItems.map((item) => (
              <VipNumberCard
                key={item.id}
                numberDetails={item}
                onBookNow={(item) => executeOrPromptLogin(handleBookNow, item)}
                onAddToCart={(item) => executeOrPromptLogin(handleAddToCart, item)}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite(item.id)}
              />
            ))}
            {isLoadingMore && renderSkeletons(2)} {/* Show a couple of skeletons when loading more */}
          </div>
          {hasMore && !isLoadingMore && (
            <div className="text-center mt-8">
              <Button onClick={loadMoreItems} variant="outline">
                Load More
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-muted-foreground text-lg py-10">
          No VIP numbers found matching your criteria. Try a different search.
        </p>
      )}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => {
          setIsLoginModalOpen(false);
          setPendingAction(null); 
        }} 
        onLoginSuccess={handleLoginSuccess} 
      />
    </div>
  );
}
