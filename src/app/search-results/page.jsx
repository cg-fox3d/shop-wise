
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import VipNumberCard from '@/components/VipNumberCard';
// NumberPackCard is removed as this page will now focus on VIP numbers
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

const transformVipNumberData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    price: parseFloat(data.price) || 0,
    originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : undefined,
    type: 'vipNumber' // Explicitly set type
  };
};

export default function SearchResultsPage() {
  const searchParamsHook = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart: addProductToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite: checkIsFavorite } = useFavorites();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [allFetchedItems, setAllFetchedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // itemType will always be 'vipNumber' now for this page
  const itemType = 'vipNumber'; 

  const searchTerm = searchParamsHook.get('term') || '';
  const searchType = searchParamsHook.get('type') || 'digits'; // 'digits' or 'price'
  const globalSearch = searchParamsHook.get('globalSearch') === 'true';
  const premiumSearch = searchParamsHook.get('premiumSearch') === 'true';
  const numerologySearch = searchParamsHook.get('numerologySearch') === 'true';
  const exactDigitPlacement = searchParamsHook.get('exactDigitPlacement') === 'true';
  const minPriceParam = searchParamsHook.get('minPrice');
  const maxPriceParam = searchParamsHook.get('maxPrice');


  useEffect(() => {
    setIsLoading(true);
    setPage(1);

    // This page now only fetches VIP numbers
    const itemsQuery = query(collection(db, "vipNumbers"), where("status", "==", "available"));

    const unsubscribe = onSnapshot(itemsQuery, (querySnapshot) => {
      const items = querySnapshot.docs.map(transformVipNumberData);
      setAllFetchedItems(items);
    }, (error) => {
      console.error("Error fetching VIP numbers for search:", error);
      toast({
        title: "Error",
        description: "Could not load VIP numbers for search.",
        variant: "destructive",
      });
      setAllFetchedItems([]);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]); // Only re-fetch if essential deps change, search params will trigger filtering

  useEffect(() => {
    if (allFetchedItems.length === 0 && !isLoading && !searchParamsHook.toString()) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true); 
    let results = [...allFetchedItems];

    // Price Filter (applies to VIP Numbers)
    const minPriceNum = minPriceParam ? parseFloat(minPriceParam) : null;
    const maxPriceNum = maxPriceParam ? parseFloat(maxPriceParam) : null;

    if (searchType === 'price' && (minPriceNum !== null || maxPriceNum !== null)) {
      results = results.filter(item => {
        const price = item.price; // item is always vipNumber now
        if (minPriceNum !== null && price < minPriceNum) return false;
        if (maxPriceNum !== null && price > maxPriceNum) return false;
        return true;
      });
    }
    
    // Term-based filters for VIP Numbers
    if (searchTerm && searchType === 'digits') {
        results = results.filter(item => {
            let matches = item.number.includes(searchTerm);
            if (globalSearch && !matches) { // Global search could include price if needed
                matches = String(item.price).includes(searchTerm);
            }
            if (exactDigitPlacement && !matches) {
                 // Check if item.number starts with searchTerm
                matches = item.number.startsWith(searchTerm);
            }
            if (numerologySearch && !matches) {
                const numSearchTerm = parseInt(searchTerm);
                if (!isNaN(numSearchTerm) && typeof item.sumOfDigits === 'number') {
                     matches = item.sumOfDigits === numSearchTerm;
                }
            }
            return matches;
        });
    }
    
    // Premium Filter
    if (premiumSearch) {
      results = results.filter(item => item.isVip);
    }
      
    setFilteredItems(results);
    setDisplayedItems(results.slice(0, ITEMS_PER_PAGE));
    setHasMore(results.length > ITEMS_PER_PAGE);
    setIsLoading(false);
    
  }, [searchParamsHook, allFetchedItems, isLoading]);


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
    const itemName = item.number;
    const isInCart = cartItems.some(cartItem => cartItem.id === item.id);

    if (!isInCart) {
      addProductToCart(item);
      toast({
        title: "Added to Cart",
        description: `${itemName} has been added to your cart.`,
      });
    }
    router.push('/checkout');
  }, [addProductToCart, toast, cartItems, router]);

  const handleAddToCart = useCallback((item) => {
    const itemName = item.number;
    const isInCart = cartItems.some(cartItem => cartItem.id === item.id);
    
    if (isInCart) {
      toast({
        title: "Already in Cart",
        description: `${itemName} is already in your cart.`,
      });
      return;
    }
    addProductToCart(item);
    toast({
      title: "Added to Cart",
      description: `${itemName} has been added to your cart.`,
    });
  }, [addProductToCart, toast, cartItems]);

  const handleToggleFavorite = useCallback((item) => {
    toggleFavorite(item);
    const itemName = item.number;
    toast({ title: checkIsFavorite(item.id) ? `Removed ${itemName} from Favorites` : `Added ${itemName} to Favorites` });
  }, [toggleFavorite, checkIsFavorite, toast]);
  
  const renderSkeletons = (count) => (
    Array.from({ length: count }).map((_, index) => (
      <VipNumberCardSkeleton key={`skeleton-${index}`} />
    ))
  );

  let pageTitle = "Search Results";
  if (searchTerm && searchType === 'digits') pageTitle += ` for "${searchTerm}"`;
  if (searchType === 'price') {
    let priceRangeDesc = "";
    if (minPriceParam && maxPriceParam) priceRangeDesc = ` from ₹${minPriceParam} to ₹${maxPriceParam}`;
    else if (minPriceParam) priceRangeDesc = ` above ₹${minPriceParam}`;
    else if (maxPriceParam) priceRangeDesc = ` up to ₹${maxPriceParam}`;
    if (priceRangeDesc) pageTitle = `VIP Numbers ${priceRangeDesc}`;
    else pageTitle = "VIP Numbers by Price";
  }


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">
        {pageTitle}
      </h1>

      {isLoading && displayedItems.length === 0 ? (
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
                isFavorite={checkIsFavorite(item.id)}
              />
            ))}
            {isLoadingMore && renderSkeletons(2)}
          </div>
          {hasMore && !isLoadingMore && (
            <div className="text-center mt-8">
              <Button onClick={loadMoreItems} variant="outline">
                Load More Results
              </Button>
            </div>
          )}
           {!hasMore && filteredItems.length > ITEMS_PER_PAGE && (
             <p className="text-center text-muted-foreground text-sm mt-8">End of results.</p>
           )}
        </>
      ) : (
        <p className="text-center text-muted-foreground text-lg py-10">
          No VIP numbers found matching your criteria. Try a different search or price range.
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
