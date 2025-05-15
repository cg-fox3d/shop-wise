
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import VipNumberCard from '@/components/VipNumberCard';
import NumberPackCard from '@/components/NumberPackCard'; // Added
import VipNumberCardSkeleton from '@/components/skeletons/VipNumberCardSkeleton';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Make sure Label is imported
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/LoginModal';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc, limit } from 'firebase/firestore'; // Added getDoc, doc


// Helper to transform Firestore doc data
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
    type: 'pack'
  };
};

const transformCategoryData = (docSnapshot) => { // Changed to accept docSnapshot
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    ...data,
  };
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams(); // To check for ?type=packs
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [categoryDetails, setCategoryDetails] = useState(null);
  const [categoryItems, setCategoryItems] = useState([]); // Can be VIP numbers or packs
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [digitSearchTerm, setDigitSearchTerm] = useState('');

  const slug = params?.slug;
  const categoryDisplayType = searchParams.get('type') === 'packs' ? 'pack' : 'individual';

  // Fetch category details
  useEffect(() => {
    if (slug) {
      setIsLoadingCategory(true);
      // Firestore query for a single category by slug
      const q = query(collection(db, "categories"), where("slug", "==", slug), limit(1));
      
      const unsubscribeCategory = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const categoryDoc = querySnapshot.docs[0];
          setCategoryDetails(transformCategoryData(categoryDoc));
        } else {
          toast({
            title: "Category Not Found",
            description: `The category "${slug}" does not exist.`,
            variant: "destructive",
          });
          setCategoryDetails(null); // Explicitly set to null
        }
        setIsLoadingCategory(false);
      }, (error) => {
        console.error(`Error fetching category details for ${slug}:`, error);
        toast({ title: "Error", description: "Could not load category details.", variant: "destructive" });
        setIsLoadingCategory(false);
      });

      return () => unsubscribeCategory();
    }
  }, [slug, toast]);

  // Fetch items for the category
  useEffect(() => {
    if (slug && categoryDetails !== undefined) { // Proceed if slug is present and categoryDetails fetch attempt is done
      setIsLoadingItems(true);
      let itemsQuery;

      if (categoryDisplayType === 'pack') {
        itemsQuery = query(
          collection(db, "numberPacks"), 
          where("categorySlug", "==", slug),
          where("status", "==", "available")
        );
      } else { // Default to vipNumbers
        itemsQuery = query(
          collection(db, "vipNumbers"), 
          where("categorySlug", "==", slug),
          where("status", "==", "available")
        );
      }
      
      const unsubscribeItems = onSnapshot(itemsQuery, (querySnapshot) => {
        const items = querySnapshot.docs.map(
          categoryDisplayType === 'pack' ? transformNumberPackData : transformVipNumberData
        );
        setCategoryItems(items);
        setIsLoadingItems(false);
      }, (error) => {
        console.error(`Error fetching items for category ${slug} (type: ${categoryDisplayType}):`, error);
        toast({
          title: "Error",
          description: `Could not load items for category "${slug}".`,
          variant: "destructive",
        });
        setCategoryItems([]);
        setIsLoadingItems(false);
      });

      return () => unsubscribeItems();
    } else if (!slug) {
        setIsLoadingItems(false); // If no slug, no items to load
    }
  }, [slug, categoryDetails, categoryDisplayType, toast]);

  // Filter items based on search term
  useEffect(() => {
    if (isLoadingItems) return;

    if (digitSearchTerm.trim() === '') {
      setDisplayedItems(categoryItems);
    } else {
      const filtered = categoryItems.filter(item => {
        if (item.type === 'pack') {
          // Search in pack name or description, or numbers within the pack
          return item.name?.toLowerCase().includes(digitSearchTerm.toLowerCase().trim()) ||
                 item.description?.toLowerCase().includes(digitSearchTerm.toLowerCase().trim()) ||
                 item.numbers?.some(numObj => numObj.number.toLowerCase().includes(digitSearchTerm.toLowerCase().trim()));
        }
        // For individual VIP numbers, search in the number string
        return item.number?.toLowerCase().includes(digitSearchTerm.toLowerCase().trim());
      });
      setDisplayedItems(filtered);
    }
  }, [digitSearchTerm, categoryItems, isLoadingItems]);


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
    const itemName = item.type === 'pack' ? item.name : item.number;
    const isInCart = cartItems.some(cartItem => cartItem.id === item.id);
    if (!isInCart) {
      addToCart(item);
      toast({
        title: "Added to Cart",
        description: `${itemName} has been added to your cart.`,
      });
    }
    router.push('/checkout');
  }, [addToCart, toast, cartItems, router]);

  const handleAddToCart = useCallback((item) => {
    const itemName = item.type === 'pack' ? item.name : item.number;
    const isInCart = cartItems.some(cartItem => cartItem.id === item.id);
    if (isInCart) {
      toast({
        title: "Already in Cart",
        description: `${itemName} is already in your cart.`,
      });
      return;
    }
    addToCart(item);
    toast({
      title: "Added to Cart",
      description: `${itemName} has been added to your cart.`,
    });
  }, [addToCart, toast, cartItems]);

  const handleToggleFavorite = useCallback((item) => {
    toggleFavorite(item);
    const itemName = item.type === 'pack' ? item.name : item.number;
    toast({ title: isFavorite(item.id) ? `Removed ${itemName} from Favorites` : `Added ${itemName} to Favorites` });
  }, [toggleFavorite, isFavorite, toast]);

  const renderSkeletons = (count) => (
    Array.from({ length: count }).map((_, index) => (
      <VipNumberCardSkeleton key={`skeleton-${index}`} />
    ))
  );

  const isLoading = isLoadingCategory || isLoadingItems;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/2 rounded-md" />
        <Skeleton className="h-10 w-1/3 rounded-md mt-4 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {renderSkeletons(8)}
        </div>
      </div>
    );
  }
  
  if (!categoryDetails && !isLoadingCategory) { // Check after loading attempts
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The category "{slug}" does not exist or could not be loaded.
        </p>
        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {categoryDetails?.title || "Category"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse all {categoryDisplayType === 'pack' ? 'packs' : 'VIP numbers'} in the "{categoryDetails?.title}" category.
        </p>
      </div>

      {categoryItems.length > 0 && (
        <div className="my-6">
          <Label htmlFor="category-search-input" className="text-lg font-semibold mb-2 block">
            Search within "{categoryDetails?.title}"
          </Label>
          <Input
            id="category-search-input"
            type="text"
            placeholder={categoryDisplayType === 'pack' ? "Search packs by name, number..." : "Enter digits to search numbers..."}
            value={digitSearchTerm}
            onChange={(e) => setDigitSearchTerm(e.target.value)}
            className="max-w-md h-11 text-base"
          />
        </div>
      )}

      {categoryItems.length === 0 && !isLoadingItems && (
        <p className="text-center text-muted-foreground text-lg py-10">
          No {categoryDisplayType === 'pack' ? 'packs' : 'VIP numbers'} found in this category.
        </p>
      )}

      {displayedItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedItems.map((item) => (
            item.type === 'pack' ? (
              <NumberPackCard
                key={item.id}
                packDetails={item}
                onBookNow={(itemData) => executeOrPromptLogin(handleBookNow, itemData)}
                onAddToCart={(itemData) => executeOrPromptLogin(handleAddToCart, itemData)}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite(item.id)}
                isInCart={cartItems.some(ci => ci.id === item.id && ci.type === 'pack')}
              />
            ) : (
              <VipNumberCard
                key={item.id}
                numberDetails={item}
                onBookNow={(itemData) => executeOrPromptLogin(handleBookNow, itemData)}
                onAddToCart={(itemData) => executeOrPromptLogin(handleAddToCart, itemData)}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite(item.id)}
              />
            )
          ))}
        </div>
      )}

      {categoryItems.length > 0 && displayedItems.length === 0 && digitSearchTerm.trim() !== '' && (
        <p className="text-center text-muted-foreground text-lg py-10">
          No {categoryDisplayType === 'pack' ? 'packs' : 'VIP numbers'} found matching your search criteria in this category.
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
