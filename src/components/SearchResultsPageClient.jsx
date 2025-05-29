
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
// Removed NumberPackCard as it's no longer used in search-results
// import NumberPackCard from '@/components/NumberPackCard';


const ITEMS_PER_PAGE = 8;

const transformVipNumberData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    price: parseFloat(data.price) || 0,
    originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : undefined,
    type: 'vipNumber' // Ensuring type is set
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
  // const mostContains = searchParamsHook.get('mostContains') === 'true'; // Not currently used in filtering

  useEffect(() => {
    setIsLoading(true);
    setPage(1); 

    // Search results page now only focuses on vipNumbers
    const itemsQuery = query(collection(db, "vipNumbers"), where("status", "==", "available"));

    const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
      const items = snapshot.docs.map(transformVipNumberData);
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
  }, [searchParamsHook.toString(), toast]); 

  useEffect(() => {
    if (allFetchedItems.length === 0 && !isLoading) { // Check isLoading to prevent premature empty state
      setFilteredItems([]);
      setDisplayedItems([]);
      setHasMore(false);
      return;
    }
    
    let results = [...allFetchedItems]; 
    const minPriceNum = minPriceParam ? parseFloat(minPriceParam) : null;
    const maxPriceNum = maxPriceParam ? parseFloat(maxPriceParam) : null;

    if (searchType === 'price') {
      results = results.filter(item => {
        const price = item.price; 
        if (minPriceNum !== null && price < minPriceNum) return false;
        if (maxPriceNum !== null && price > maxPriceNum) return false;
        return true;
      });
    }
    
    if (searchType === 'digits' && searchTerm.trim()) {
        results = results.filter(item => {
            let matches = item.number.includes(searchTerm.trim());
            if (globalSearch && !matches && String(item.price).includes(searchTerm.trim())) { 
                matches = true;
            }
            if (exactDigitPlacement && !matches && item.number.startsWith(searchTerm.trim())) {
                 matches = true;
            }
            if (numerologySearch && !matches) {
                const numSearchTerm = parseInt(searchTerm.trim());
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
    setDisplayedItems(results.slice(0, ITEMS_PER_PAGE * page)); 
    setHasMore(results.length > ITEMS_PER_PAGE * page);
    setIsLoading(false);
    
  }, [searchParamsHook, allFetchedItems, page, minPriceParam, maxPriceParam, searchTerm, searchType, globalSearch, premiumSearch, numerologySearch, exactDigitPlacement, isLoading]);


  const loadMoreItems = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    // Simulate network delay for loading more if needed, or remove setTimeout
    setTimeout(() => { 
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
    const itemName = item.number; 
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
    const itemName = item.number; 
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
            {isLoadingMore && renderSkeletons(2)} {/* Show skeletons when loading more */}
          </div>
          {hasMore && !isLoadingMore && (
            <div className="text-center mt-8">
              <Button onClick={loadMoreItems} variant="outline">
                Load More Results
              </Button>
            </div>
          )}
           {!hasMore && filteredItems.length > ITEMS_PER_PAGE && ( // Only show if there were enough items to paginate
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
