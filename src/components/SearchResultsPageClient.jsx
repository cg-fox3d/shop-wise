
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import VipNumberCard from '@/components/VipNumberCard';
// NumberPackCard and related logic for packs were removed as per earlier instruction
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
    type: 'vipNumber'
  };
};

export default function SearchResultsPageClient() {
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
  
  const searchTerm = searchParamsHook.get('term') || '';
  const searchType = searchParamsHook.get('type') || 'digits'; 
  const minPriceParam = searchParamsHook.get('minPrice');
  const maxPriceParam = searchParamsHook.get('maxPrice');
  const globalSearch = searchParamsHook.get('globalSearch') === 'true';
  const premiumSearch = searchParamsHook.get('premiumSearch') === 'true';
  const numerologySearch = searchParamsHook.get('numerologySearch') === 'true';
  const exactDigitPlacement = searchParamsHook.get('exactDigitPlacement') === 'true';

  useEffect(() => {
    setIsLoading(true);
    setPage(1); // Reset page on new search

    // Since "family pack" search was removed, this page primarily deals with vipNumbers
    const itemsQuery = query(collection(db, "vipNumbers"), where("status", "==", "available"));

    const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
      const items = snapshot.docs.map(transformVipNumberData);
      setAllFetchedItems(items);
      // Filtering will now happen in the next useEffect
    }, (error) => {
      console.error("Error fetching VIP numbers for search:", error);
      toast({
        title: "Error",
        description: "Could not load VIP numbers for search.",
        variant: "destructive",
      });
      setAllFetchedItems([]);
      setIsLoading(false); // Ensure loading stops on error
    });
    return () => unsubscribe();
  }, [searchParamsHook.toString(), toast]); // Re-run if search params change to fetch new base data

  useEffect(() => {
    // This effect handles filtering whenever allFetchedItems or searchParams change
    if (allFetchedItems.length === 0 && searchParamsHook.toString()) {
      setIsLoading(false); // No items to filter, stop loading
      setFilteredItems([]);
      setDisplayedItems([]);
      setHasMore(false);
      return;
    }
    if(allFetchedItems.length > 0) setIsLoading(true);


    let results = [...allFetchedItems]; // Start with all available VIP numbers

    const minPriceNum = minPriceParam ? parseFloat(minPriceParam) : null;
    const maxPriceNum = maxPriceParam ? parseFloat(maxPriceParam) : null;

    if (searchType === 'price' && (minPriceNum !== null || maxPriceNum !== null)) {
      results = results.filter(item => {
        const price = item.price; 
        if (minPriceNum !== null && price < minPriceNum) return false;
        if (maxPriceNum !== null && price > maxPriceNum) return false;
        return true;
      });
    }
    
    if (searchTerm && searchType === 'digits') {
        results = results.filter(item => {
            let matches = item.number.includes(searchTerm);
            if (globalSearch && !matches) { 
                matches = String(item.price).includes(searchTerm);
            }
            if (exactDigitPlacement && !matches && item.number.startsWith(searchTerm)) {
                 matches = true;
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
    
    if (premiumSearch) {
      results = results.filter(item => item.isVip);
    }
      
    setFilteredItems(results);
    setDisplayedItems(results.slice(0, ITEMS_PER_PAGE * page)); // Use current page
    setHasMore(results.length > ITEMS_PER_PAGE * page);
    setIsLoading(false);
    
  }, [searchParamsHook, allFetchedItems, page, minPriceParam, maxPriceParam, searchTerm, searchType, globalSearch, premiumSearch, numerologySearch, exactDigitPlacement]);


  const loadMoreItems = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    // Simulate async loading for better UX, though data is already client-side
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
    const itemName = item.number; // Assuming itemType is 'vipNumber'
    const isInCart = cartItems.some(cartItem => cartItem.id === item.id && cartItem.type === item.type);

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
    const itemName = item.number; // Assuming itemType is 'vipNumber'
    const isInCart = cartItems.some(cartItem => cartItem.id === item.id && cartItem.type === item.type);
    
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
    const itemName = item.number; // Assuming itemType is 'vipNumber'
    toast({ title: checkIsFavorite(item.id) ? `Removed ${itemName} from Favorites` : `Added ${itemName} to Favorites` });
  }, [toggleFavorite, checkIsFavorite, toast]);
  
  const renderSkeletons = (count) => (
    Array.from({ length: count }).map((_, index) => (
      <VipNumberCardSkeleton key={`skeleton-${index}`} />
    ))
  );

  let pageTitleText = "Search Results";
  if (searchTerm && searchType === 'digits') pageTitleText += ` for "${searchTerm}"`;
  if (searchType === 'price') {
    let priceRangeDesc = "";
    if (minPriceParam && maxPriceParam) priceRangeDesc = ` from ₹${minPriceParam} to ₹${maxPriceParam}`;
    else if (minPriceParam) priceRangeDesc = ` above ₹${minPriceParam}`;
    else if (maxPriceParam) priceRangeDesc = ` up to ₹${maxPriceParam}`;
    if (priceRangeDesc) pageTitleText = `VIP Numbers ${priceRangeDesc}`;
    else pageTitleText = "VIP Numbers by Price";
  }


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">
        {pageTitleText}
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
