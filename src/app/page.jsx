
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import CategorySection from '@/components/CategorySection';
import SearchBar from '@/components/SearchBar';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/LoginModal';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { db } from '@/lib/firebase'; // Import Firestore
import { collection, onSnapshot, query } from 'firebase/firestore'; // Import Firestore functions

// Keep initialCategoryDefinitions to structure the page and define category slugs/titles
export const initialCategoryDefinitions = [
  { title: "Ending with 786", slug: "ending-with-786", itemsKey: 'endingWith786' }, // itemsKey is now illustrative
  { title: "Double Numbers", slug: "double-numbers", itemsKey: 'doubleNumbers' },
  { title: "Our Top Choice", slug: "our-top-choice", itemsKey: 'topChoice' },
];

// Helper to transform Firestore doc data
const transformVipNumberData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id, // Use Firestore document ID
    ...data,
    // Ensure expiryTimestamp is a string if it's a Firestore Timestamp object
    expiryTimestamp: data.expiryTimestamp?.toDate ? data.expiryTimestamp.toDate().toISOString() : data.expiryTimestamp,
  };
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [categoriesData, setCategoriesData] = useState([]);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart: addProductToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const vipNumbersQuery = query(collection(db, "vipNumbers"));

    const unsubscribe = onSnapshot(vipNumbersQuery, (querySnapshot) => {
      const allNumbers = querySnapshot.docs.map(transformVipNumberData);
      
      const categorizedVipNumbers = initialCategoryDefinitions.map(categoryDef => {
        const itemsForCategory = allNumbers.filter(num => num.categorySlug === categoryDef.slug);
        return {
          ...categoryDef,
          items: itemsForCategory,
        };
      });
      
      setCategoriesData(categorizedVipNumbers);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching VIP numbers:", error);
      toast({
        title: "Error",
        description: "Could not load VIP numbers. Please try again later.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [toast]);

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
    router.push('/checkout');
  }, [addProductToCart, router, toast, cartItems]);

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


  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Discover Your VIP Number</h1>
      <p className="text-muted-foreground mb-6">
        Choose from a wide range of exclusive and fancy mobile numbers.
      </p>

      <SearchBar />

      <div className="mt-8">
        {categoriesData.map((category, index) => (
          <CategorySection
            key={category.slug || index} // Use slug if available for a more stable key
            title={category.title}
            slug={category.slug}
            items={category.items}
            isLoading={isLoading}
            onBookNow={(item) => executeOrPromptLogin(handleBookNow, item)}
            onAddToCart={(item) => executeOrPromptLogin(handleAddToCart, item)}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={(itemId) => isFavorite(itemId)}
          />
        ))}
        {isLoading && initialCategoryDefinitions.map((categoryDef, index) => (
           // Show skeletons for defined categories while loading
          <CategorySection
            key={`loading-${categoryDef.slug || index}`}
            title={categoryDef.title}
            slug={categoryDef.slug}
            items={[]}
            isLoading={true}
          />
        ))}
      </div>

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
