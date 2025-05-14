
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
import { db } from '@/lib/firebase'; // Import Firestore
import { collection, onSnapshot, query } from 'firebase/firestore'; // Import Firestore functions

const ITEMS_PER_PAGE = 8;

// Helper to transform Firestore doc data
const transformVipNumberData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id, // Use Firestore document ID
    ...data,
    expiryTimestamp: data.expiryTimestamp?.toDate ? data.expiryTimestamp.toDate().toISOString() : data.expiryTimestamp,
  };
};

export default function SearchResultsPage() {
  const searchParamsHook = useSearchParams(); // Renamed to avoid conflict with searchParams variable
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart: addProductToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [allFetchedNumbers, setAllFetchedNumbers] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Memoize search parameters to prevent re-triggering main useEffect unnecessarily
  const searchTerm = searchParamsHook.get('term') || '';
  const searchType = searchParamsHook.get('type') || 'digits';
  const globalSearch = searchParamsHook.get('globalSearch') === 'true';
  const premiumSearch = searchParamsHook.get('premiumSearch') === 'true';

  // Effect to fetch all numbers initially
  useEffect(() => {
    setIsLoading(true);
    const vipNumbersQuery = query(collection(db, "vipNumbers"));
    const unsubscribe = onSnapshot(vipNumbersQuery, (querySnapshot) => {
      const numbers = querySnapshot.docs.map(transformVipNumberData);
      setAllFetchedNumbers(numbers);
      // Initial loading is done, further filtering will happen in the next effect
    }, (error) => {
      console.error("Error fetching all VIP numbers for search:", error);
      toast({
        title: "Error",
        description: "Could not load numbers for search. Please try again later.",
        variant: "destructive",
      });
      setAllFetchedNumbers([]);
      setIsLoading(false); // Ensure loading stops on error
    });
    return () => unsubscribe();
  }, [toast]);

  // Effect to filter and paginate numbers when searchParams or allFetchedNumbers change
  useEffect(() => {
    if (allFetchedNumbers.length === 0 && !isLoading && !searchParamsHook.toString()) { 
        // if no numbers and not loading, and no search params (direct nav), then finish loading
        setIsLoading(false);
        return;
    }
    if (allFetchedNumbers.length > 0 || searchParamsHook.toString()) { // Process if numbers are loaded or search is active
      setIsLoading(true); // Start loading for filtering
      setPage(1); // Reset page on new search/filter

      let results = [...allFetchedNumbers]; // Create a mutable copy

      if (searchType === 'digits' && searchTerm) {
        results = results.filter(item => 
          item.number.includes(searchTerm) || 
          (globalSearch && (String(item.price).includes(searchTerm))) 
          // Note: id search might not be relevant for Firestore doc IDs unless explicitly set
        );
      } else if (searchType === 'price') {
        // Dummy price filter for now, as price range input isn't implemented
        results = results.filter(item => item.price < 50000); 
      } else if (searchType === 'family') {
        results = results.filter(item => item.isVip); // Example
      }

      if (premiumSearch) {
        results = results.filter(item => item.isVip);
      }
      
      setFilteredItems(results);
      setDisplayedItems(results.slice(0, ITEMS_PER_PAGE));
      setHasMore(results.length > ITEMS_PER_PAGE);
      setIsLoading(false); // Filtering complete
    }
  }, [searchParamsHook, allFetchedNumbers, searchTerm, searchType, globalSearch, premiumSearch, isLoading]);


  const loadMoreItems = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    // Simulate network delay for loading more, not strictly necessary with local filtering
    setTimeout(() => {
      const nextPage = page + 1;
      const newItems = filteredItems.slice(0, nextPage * ITEMS_PER_PAGE);
      setDisplayedItems(newItems);
      setPage(nextPage);
      setHasMore(newItems.length < filteredItems.length);
      setIsLoadingMore(false);
    }, 300); 
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
                onBookNow={(itemData) => executeOrPromptLogin(handleBookNow, itemData)}
                onAddToCart={(itemData) => executeOrPromptLogin(handleAddToCart, itemData)}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite(item.id)}
              />
            ))}
            {isLoadingMore && renderSkeletons(2)}
          </div>
          {hasMore && !isLoadingMore && (
            <div className="text-center mt-8">
              <Button onClick={loadMoreItems} variant="outline">
                Load More
              </Button>
            </div>
          )}
           {!hasMore && filteredItems.length > ITEMS_PER_PAGE && (
             <p className="text-center text-muted-foreground text-sm mt-8">End of results.</p>
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
