
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Added useRouter
import VipNumberCard from '@/components/VipNumberCard';
import VipNumberCardSkeleton from '@/components/skeletons/VipNumberCardSkeleton';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/LoginModal';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const ITEMS_PER_PAGE = 8;

// Helper to transform Firestore doc data (simplified)
const transformVipNumberData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    price: parseFloat(data.price) || 0,
    originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : undefined,
  };
};

export default function SearchResultsPage() {
  const searchParamsHook = useSearchParams();
  const router = useRouter(); // Added router
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

  const searchTerm = searchParamsHook.get('term') || '';
  const searchType = searchParamsHook.get('type') || 'digits';
  const globalSearch = searchParamsHook.get('globalSearch') === 'true';
  const premiumSearch = searchParamsHook.get('premiumSearch') === 'true';

  useEffect(() => {
    setIsLoading(true);
    // Fetch only 'available' numbers for search results
    const vipNumbersQuery = query(collection(db, "vipNumbers"), where("status", "==", "available"));
    const unsubscribe = onSnapshot(vipNumbersQuery, (querySnapshot) => {
      const numbers = querySnapshot.docs.map(transformVipNumberData);
      setAllFetchedNumbers(numbers);
    }, (error) => {
      console.error("Error fetching all VIP numbers for search:", error);
      toast({
        title: "Error",
        description: "Could not load numbers for search. Please try again later.",
        variant: "destructive",
      });
      setAllFetchedNumbers([]);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (allFetchedNumbers.length === 0 && !isLoading && !searchParamsHook.toString()) {
        setIsLoading(false);
        return;
    }
    if (allFetchedNumbers.length > 0 || searchParamsHook.toString()) {
      setIsLoading(true);
      setPage(1);

      let results = [...allFetchedNumbers];

      if (searchType === 'digits' && searchTerm) {
        results = results.filter(item => 
          item.number.includes(searchTerm) || 
          (globalSearch && (String(item.price).includes(searchTerm)))
        );
      } else if (searchType === 'price') {
        // Placeholder: Actual price filtering logic would go here (e.g., from a range input)
        // For now, just shows all available if "Search by Price" is clicked without specific criteria
      } else if (searchType === 'family') {
         // Placeholder: Actual family pack filtering logic would go here
        // For now, just shows all available if "Family Pack" is clicked without specific criteria
      }

      if (premiumSearch) {
        results = results.filter(item => item.isVip);
      }
      
      setFilteredItems(results);
      setDisplayedItems(results.slice(0, ITEMS_PER_PAGE));
      setHasMore(results.length > ITEMS_PER_PAGE);
      setIsLoading(false);
    }
  }, [searchParamsHook, allFetchedNumbers, searchTerm, searchType, globalSearch, premiumSearch, isLoading]);


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
    router.push('/checkout'); // Navigate to checkout
  }, [addProductToCart, toast, cartItems, router]);

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
