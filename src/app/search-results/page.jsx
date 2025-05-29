
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import VipNumberCard from '@/components/VipNumberCard';
import NumberPackCard from '@/components/NumberPackCard'; // Added for pack results
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

const transformNumberPackData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    packPrice: parseFloat(data.packPrice) || 0,
    totalOriginalPrice: data.totalOriginalPrice ? parseFloat(data.totalOriginalPrice) : undefined,
    type: 'pack',
    numbers: Array.isArray(data.numbers) ? data.numbers.map(num => ({
        ...num,
        price: parseFloat(num.price) || 0,
        id: num.id || `num-${Math.random().toString(36).substr(2, 9)}`
    })) : []
  };
};


export default function SearchResultsPage() {
  const searchParamsHook = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart: addProductToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite: checkIsFavorite } = useFavorites(); // Renamed to avoid conflict
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [allFetchedItems, setAllFetchedItems] = useState([]); // Can hold VIP numbers or packs
  const [filteredItems, setFilteredItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [itemType, setItemType] = useState('vipNumber'); // 'vipNumber' or 'pack'

  const searchTerm = searchParamsHook.get('term') || '';
  const searchType = searchParamsHook.get('type') || 'digits';
  const globalSearch = searchParamsHook.get('globalSearch') === 'true';
  const premiumSearch = searchParamsHook.get('premiumSearch') === 'true';
  const numerologySearch = searchParamsHook.get('numerologySearch') === 'true';
  const exactDigitPlacement = searchParamsHook.get('exactDigitPlacement') === 'true';
  const minPriceParam = searchParamsHook.get('minPrice');
  const maxPriceParam = searchParamsHook.get('maxPrice');


  useEffect(() => {
    setIsLoading(true);
    setPage(1); // Reset page on new search

    let itemsQuery;
    let currentItemType = 'vipNumber'; // Default
    let transformFn = transformVipNumberData;

    if (searchType === 'family') {
      itemsQuery = query(collection(db, "numberPacks"), where("status", "==", "available"));
      currentItemType = 'pack';
      transformFn = transformNumberPackData;
    } else { // 'digits' or 'price' search targets VIP numbers
      itemsQuery = query(collection(db, "vipNumbers"), where("status", "==", "available"));
      currentItemType = 'vipNumber';
      transformFn = transformVipNumberData;
    }
    setItemType(currentItemType);

    const unsubscribe = onSnapshot(itemsQuery, (querySnapshot) => {
      const items = querySnapshot.docs.map(transformFn);
      setAllFetchedItems(items);
      // Initial filtering will happen in the next useEffect
    }, (error) => {
      console.error(`Error fetching ${currentItemType}s for search:`, error);
      toast({
        title: "Error",
        description: `Could not load ${currentItemType}s for search.`,
        variant: "destructive",
      });
      setAllFetchedItems([]);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [searchType, toast]); // Re-fetch if searchType changes (e.g. from digits to family)

  useEffect(() => {
    if (allFetchedItems.length === 0 && !isLoading && !searchParamsHook.toString()) {
        setIsLoading(false);
        return;
    }
    // This effect applies filters once allFetchedItems is populated or searchParams change
    setIsLoading(true); 
    let results = [...allFetchedItems];

    // Price Filter (applies to both VIP Numbers and Packs)
    const minPriceNum = minPriceParam ? parseFloat(minPriceParam) : null;
    const maxPriceNum = maxPriceParam ? parseFloat(maxPriceParam) : null;

    if (searchType === 'price' && (minPriceNum !== null || maxPriceNum !== null)) {
      results = results.filter(item => {
        const price = itemType === 'pack' ? item.packPrice : item.price;
        if (minPriceNum !== null && price < minPriceNum) return false;
        if (maxPriceNum !== null && price > maxPriceNum) return false;
        return true;
      });
    }
    
    // Term-based filters
    if (searchTerm) {
        if (itemType === 'vipNumber' && searchType === 'digits') {
            results = results.filter(item => {
                let matches = item.number.includes(searchTerm);
                if (globalSearch && !matches) {
                    matches = String(item.price).includes(searchTerm);
                }
                if (exactDigitPlacement && !matches) {
                    matches = item.number.startsWith(searchTerm);
                }
                if (numerologySearch && !matches) {
                    // Ensure searchTerm is a number for sumOfDigits comparison
                    const numSearchTerm = parseInt(searchTerm);
                    if (!isNaN(numSearchTerm)) {
                         matches = item.sumOfDigits === numSearchTerm;
                    }
                }
                return matches;
            });
        } else if (itemType === 'pack' && searchType === 'family') {
             results = results.filter(item => 
                (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
             );
        }
    }

    // Premium Filter
    if (premiumSearch) {
      results = results.filter(item => itemType === 'pack' ? item.isVipPack : item.isVip);
    }
      
    setFilteredItems(results);
    setDisplayedItems(results.slice(0, ITEMS_PER_PAGE));
    setHasMore(results.length > ITEMS_PER_PAGE);
    setIsLoading(false);
    
  }, [searchParamsHook, allFetchedItems, itemType, isLoading]); // Rerun when params or fetched items change


  const loadMoreItems = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => { // Simulate network delay for loading more
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
    const itemName = itemType === 'pack' ? item.name : item.number;
    const cartId = item.type === 'pack' && item.selectedNumbers ? `${item.id}-${item.selectedNumbers.map(n=>n.id).sort().join(',')}` : item.id;
    const isInCart = cartItems.some(cartItem => (cartItem.cartId || cartItem.id) === cartId);

    if (!isInCart) {
      addProductToCart(item); // addProductToCart handles selectedNumbers for packs
      toast({
        title: "Added to Cart",
        description: `${itemName} has been added to your cart.`,
      });
    }
    router.push('/checkout');
  }, [addProductToCart, toast, cartItems, router, itemType]);

  const handleAddToCart = useCallback((item) => {
    const itemName = itemType === 'pack' ? (item.selectedNumbers ? `${item.name} (Selection)`: item.name) : item.number;
    const cartId = item.type === 'pack' && item.selectedNumbers ? `${item.id}-${item.selectedNumbers.map(n=>n.id).sort().join(',')}` : item.id;
    const isInCart = cartItems.some(cartItem => (cartItem.cartId || cartItem.id) === cartId);
    
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
  }, [addProductToCart, toast, cartItems, itemType]);

  const handleToggleFavorite = useCallback((item) => {
    toggleFavorite(item); // Favorites use main item.id for both types
    const itemName = itemType === 'pack' ? item.name : item.number;
    toast({ title: checkIsFavorite(item.id) ? `Removed ${itemName} from Favorites` : `Added ${itemName} to Favorites` });
  }, [toggleFavorite, checkIsFavorite, toast, itemType]);
  
  const renderSkeletons = (count) => (
    Array.from({ length: count }).map((_, index) => (
      <VipNumberCardSkeleton key={`skeleton-${index}`} /> // Consider a pack skeleton if very different
    ))
  );

  let pageTitle = "Search Results";
  if (searchTerm) pageTitle += ` for "${searchTerm}"`;
  if (searchType === 'price') {
    let priceRangeDesc = "";
    if (minPriceParam && maxPriceParam) priceRangeDesc = ` from ₹${minPriceParam} to ₹${maxPriceParam}`;
    else if (minPriceParam) priceRangeDesc = ` above ₹${minPriceParam}`;
    else if (maxPriceParam) priceRangeDesc = ` up to ₹${maxPriceParam}`;
    if (priceRangeDesc) pageTitle = `Numbers/Packs ${priceRangeDesc}`;
  }


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">
        {pageTitle}
      </h1>

      {isLoading && displayedItems.length === 0 ? ( // Show skeletons only on initial load
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {renderSkeletons(ITEMS_PER_PAGE)}
        </div>
      ) : displayedItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedItems.map((item) => (
              itemType === 'pack' ? (
                <NumberPackCard
                  key={item.id + (item.selectedNumbers ? JSON.stringify(item.selectedNumbers.map(sn => sn.id)) : '')}
                  packDetails={item}
                  onBookNow={(itemData) => executeOrPromptLogin(handleBookNow, itemData)}
                  onAddToCart={(itemData) => executeOrPromptLogin(handleAddToCart, itemData)}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={checkIsFavorite(item.id)}
                />
              ) : (
                <VipNumberCard
                  key={item.id}
                  numberDetails={item}
                  onBookNow={(itemData) => executeOrPromptLogin(handleBookNow, itemData)}
                  onAddToCart={(itemData) => executeOrPromptLogin(handleAddToCart, itemData)}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={checkIsFavorite(item.id)}
                />
              )
            ))}
            {isLoadingMore && renderSkeletons(2)} {/* Skeletons for loading more items */}
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
          No {itemType === 'pack' ? 'packs' : 'VIP numbers'} found matching your criteria. Try a different search or price range.
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
