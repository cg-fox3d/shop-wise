
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
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';

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

const transformCategoryData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
  };
}

export default function Home() {
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(true);
  const [allCategories, setAllCategories] = useState([]);
  const [allVipNumbers, setAllVipNumbers] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart: addProductToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Fetch categories
  useEffect(() => {
    setIsLoadingCategories(true);
    const categoriesQuery = query(collection(db, "categories"), orderBy("order", "asc")); // Assuming 'order' field for sorting

    const unsubscribeCategories = onSnapshot(categoriesQuery, (querySnapshot) => {
      const fetchedCategories = querySnapshot.docs.map(transformCategoryData);
      setAllCategories(fetchedCategories);
      setIsLoadingCategories(false);
    }, (error) => {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Could not load categories.",
        variant: "destructive",
      });
      setIsLoadingCategories(false);
    });

    return () => unsubscribeCategories();
  }, [toast]);

  // Fetch VIP numbers (only available ones)
  useEffect(() => {
    setIsLoadingNumbers(true);
    // Fetch only 'available' numbers for the homepage display
    const vipNumbersQuery = query(collection(db, "vipNumbers"), where("status", "==", "available"));

    const unsubscribeNumbers = onSnapshot(vipNumbersQuery, (querySnapshot) => {
      const fetchedNumbers = querySnapshot.docs.map(transformVipNumberData);
      setAllVipNumbers(fetchedNumbers);
      setIsLoadingNumbers(false);
    }, (error) => {
      console.error("Error fetching VIP numbers:", error);
      toast({
        title: "Error",
        description: "Could not load VIP numbers.",
        variant: "destructive",
      });
      setIsLoadingNumbers(false);
    });

    return () => unsubscribeNumbers();
  }, [toast]);

  // Combine categories and numbers
  useEffect(() => {
    if (!isLoadingCategories && !isLoadingNumbers) {
      const combinedData = allCategories.map(category => ({
        ...category,
        items: allVipNumbers.filter(num => num.categorySlug === category.slug),
      }));
      setCategoriesData(combinedData);
    }
  }, [allCategories, allVipNumbers, isLoadingCategories, isLoadingNumbers]);

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

  const overallLoading = isLoadingCategories || isLoadingNumbers;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Discover Your VIP Number</h1>
      <p className="text-muted-foreground mb-6">
        Choose from a wide range of exclusive and fancy mobile numbers.
      </p>

      <SearchBar />

      <div className="mt-8">
        {overallLoading && allCategories.length === 0 && (
          // Show skeletons based on a predefined number if categories haven't loaded yet
          Array.from({ length: 3 }).map((_, index) => (
            <CategorySection
              key={`loading-skeleton-${index}`}
              title="Loading Category..."
              items={[]}
              isLoading={true}
            />
          ))
        )}
        {!overallLoading && categoriesData.length === 0 && (
            <p className="text-center py-10 text-muted-foreground">No categories or numbers found.</p>
        )}
        {categoriesData.map((category) => (
          <CategorySection
            key={category.id}
            title={category.title}
            slug={category.slug}
            items={category.items}
            isLoading={overallLoading} // Pass overall loading state
            onBookNow={(item) => executeOrPromptLogin(handleBookNow, item)}
            onAddToCart={(item) => executeOrPromptLogin(handleAddToCart, item)}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={(itemId) => isFavorite(itemId)}
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
