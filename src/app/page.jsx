
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

// Helper to generate a future date for countdown
const getFutureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

// Sample product data (replace with actual data fetching later)
// Exporting this to be used by the category page as well
export const sampleVipNumbers = {
  endingWith786: [
    { id: 'vip1', number: '9090507860', price: 3999, originalPrice: 5299, totalDigits: 10, sumOfDigits: 4, isVip: true, discount: 1300, expiryTimestamp: getFutureDate(1), imageHint: "vip number" },
    { id: 'vip2', number: '8888887861', price: 4999, originalPrice: 6299, totalDigits: 10, sumOfDigits: 5, isVip: true, discount: 1300, expiryTimestamp: getFutureDate(2), imageHint: "mobile number" },
    { id: 'vip3', number: '9123457862', price: 2999, originalPrice: 4299, totalDigits: 10, sumOfDigits: 6, isVip: false, discount: 1300, expiryTimestamp: getFutureDate(0.5), imageHint: "sim card" },
    { id: 'vip4', number: '9090507860', price: 3999, originalPrice: 5299, totalDigits: 10, sumOfDigits: 4, isVip: true, discount: 1300, expiryTimestamp: getFutureDate(1), imageHint: "vip number" },
    { id: 'vip5', number: '8888887861', price: 4999, originalPrice: 6299, totalDigits: 10, sumOfDigits: 5, isVip: true, discount: 1300, expiryTimestamp: getFutureDate(2), imageHint: "mobile number" },
    { id: 'vip6', number: '9123457862', price: 2999, originalPrice: 4299, totalDigits: 10, sumOfDigits: 6, isVip: false, discount: 1300, expiryTimestamp: getFutureDate(0.5), imageHint: "sim card" },
    { id: 'vip7', number: '9090507860', price: 3999, originalPrice: 5299, totalDigits: 10, sumOfDigits: 4, isVip: true, discount: 1300, expiryTimestamp: getFutureDate(1), imageHint: "vip number" },
    { id: 'vip8', number: '8888887861', price: 4999, originalPrice: 6299, totalDigits: 10, sumOfDigits: 5, isVip: true, discount: 1300, expiryTimestamp: getFutureDate(2), imageHint: "mobile number" },
    { id: 'vip9', number: '9123457862', price: 2999, originalPrice: 4299, totalDigits: 10, sumOfDigits: 6, isVip: false, discount: 1300, expiryTimestamp: getFutureDate(0.5), imageHint: "sim card" },
    { id: 'vip10', number: '9090507860', price: 3999, originalPrice: 5299, totalDigits: 10, sumOfDigits: 4, isVip: true, discount: 1300, expiryTimestamp: getFutureDate(1), imageHint: "vip number" },
    { id: 'vip11', number: '8888887861', price: 4999, originalPrice: 6299, totalDigits: 10, sumOfDigits: 5, isVip: true, discount: 1300, expiryTimestamp: getFutureDate(2), imageHint: "mobile number" },
    { id: 'vip12', number: '9123457862', price: 2999, originalPrice: 4299, totalDigits: 10, sumOfDigits: 6, isVip: false, discount: 1300, expiryTimestamp: getFutureDate(0.5), imageHint: "sim card" },
  ],
  doubleNumbers: [
    { id: 'vip4', number: '9988776655', price: 1999, originalPrice: 3299, totalDigits: 10, sumOfDigits: 8, isVip: false, discount: 1300, expiryTimestamp: getFutureDate(3), imageHint: "fancy number" },
    { id: 'vip5', number: '7777112233', price: 2499, originalPrice: 3799, totalDigits: 10, sumOfDigits: 1, isVip: true, discount: 1300, expiryTimestamp: getFutureDate(1.5), imageHint: "special number" },
  ],
  topChoice: [
    { id: 'vip6', number: '9000000001', price: 9999, originalPrice: 11299, totalDigits: 10, sumOfDigits: 1, isVip: true, discount: 1300, expiryTimestamp: getFutureDate(5), imageHint: "premium number" },
    { id: 'vip7', number: '8000000008', price: 8999, originalPrice: 10299, totalDigits: 10, sumOfDigits: 8, isVip: true, discount: 1300, expiryTimestamp: getFutureDate(0.2), imageHint: "exclusive number" },
    { id: 'vip8', number: '7770001111', price: 7999, originalPrice: 9299, totalDigits: 10, sumOfDigits: 7, isVip: false, discount: 1300, expiryTimestamp: getFutureDate(4), imageHint: "collection number" },
  ],
};

export const initialCategoryDefinitions = [
  { title: "Ending with 786", slug: "ending-with-786", itemsKey: 'endingWith786' },
  { title: "Double Numbers", slug: "double-numbers", itemsKey: 'doubleNumbers' },
  { title: "Our Top Choice", slug: "our-top-choice", itemsKey: 'topChoice' },
];


export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart: addProductToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);


  useEffect(() => {
    const timer = setTimeout(() => {
      setCategories(
        initialCategoryDefinitions.map(cat => ({
          ...cat,
          items: sampleVipNumbers[cat.itemsKey] || []
        }))
      );
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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
        {categories.map((category, index) => (
          <CategorySection
            key={index}
            title={category.title}
            slug={category.slug} // Pass slug to CategorySection
            items={category.items}
            isLoading={isLoading}
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
