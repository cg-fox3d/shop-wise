
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation'; // To get slug from URL
import Link from 'next/link';
import VipNumberCard from '@/components/VipNumberCard';
import VipNumberCardSkeleton from '@/components/skeletons/VipNumberCardSkeleton';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Added missing import
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/LoginModal';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Button } from '@/components/ui/button';
import { sampleVipNumbers, initialCategoryDefinitions } from '@/app/page'; // Import data and definitions

// Helper to find category details by slug
const getCategoryBySlug = (slug) => {
  return initialCategoryDefinitions.find(cat => cat.slug === slug);
};

export default function CategoryPage() {
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart: addProductToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [categoryDetails, setCategoryDetails] = useState(null);
  const [categoryItems, setCategoryItems] = useState([]); // All items for this category
  const [displayedItems, setDisplayedItems] = useState([]); // Items to show after search/filter
  const [isLoading, setIsLoading] = useState(true);
  const [digitSearchTerm, setDigitSearchTerm] = useState('');

  const slug = params?.slug;

  useEffect(() => {
    if (slug) {
      setIsLoading(true);
      setDigitSearchTerm(''); // Reset search on category change
      // Simulate data fetching / processing
      setTimeout(() => {
        const foundCategory = getCategoryBySlug(slug);
        if (foundCategory) {
          setCategoryDetails(foundCategory);
          const items = sampleVipNumbers[foundCategory.itemsKey] || [];
          setCategoryItems(items);
          // setDisplayedItems(items); // Will be handled by the search useEffect
        } else {
          toast({
            title: "Category Not Found",
            description: `The category "${slug}" does not exist.`,
            variant: "destructive",
          });
          setCategoryItems([]); // Ensure items are cleared if category not found
          // setDisplayedItems([]);
        }
        setIsLoading(false);
      }, 500);
    }
  }, [slug, toast]);

  useEffect(() => {
    if (isLoading) return;

    if (digitSearchTerm.trim() === '') {
      setDisplayedItems(categoryItems);
    } else {
      const filtered = categoryItems.filter(item =>
        item.number.toLowerCase().includes(digitSearchTerm.toLowerCase().trim())
      );
      setDisplayedItems(filtered);
    }
  }, [digitSearchTerm, categoryItems, isLoading]);


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
    // router.push('/checkout'); // No auto-navigation from category page
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

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/2 rounded-md" />
        <Skeleton className="h-10 w-1/3 rounded-md mt-4 mb-6" /> {/* Skeleton for search input area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {renderSkeletons(8)}
        </div>
      </div>
    );
  }

  if (!categoryDetails && !isLoading) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The category you're looking for doesn't exist or has been moved.
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
          Browse all VIP numbers in the "{categoryDetails?.title}" category.
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
            placeholder="Enter digits to search numbers..."
            value={digitSearchTerm}
            onChange={(e) => setDigitSearchTerm(e.target.value)}
            className="max-w-md h-11 text-base"
          />
        </div>
      )}

      {categoryItems.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground text-lg py-10">
          No VIP numbers found in this category.
        </p>
      )}

      {categoryItems.length > 0 && displayedItems.length > 0 && (
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
        </div>
      )}

      {categoryItems.length > 0 && displayedItems.length === 0 && digitSearchTerm.trim() !== '' && (
        <p className="text-center text-muted-foreground text-lg py-10">
          No VIP numbers found matching your search criteria in this category.
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
