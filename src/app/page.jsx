
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
import { collection, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore';

// Helper to transform Firestore doc data
const transformVipNumberData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    price: parseFloat(data.price) || 0,
    originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : undefined,
    type: 'vipNumber' // Explicitly define type
  };
};

const transformNumberPackData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    packPrice: parseFloat(data.packPrice) || 0, // Price for the whole pack if bought as is
    totalOriginalPrice: data.totalOriginalPrice ? parseFloat(data.totalOriginalPrice) : undefined,
    type: 'pack', // Explicitly define type
    // Ensure numbers array and their prices are correctly formatted
    numbers: Array.isArray(data.numbers) ? data.numbers.map(num => ({
        ...num,
        price: parseFloat(num.price) || 0, // Ensure individual number price is float
        id: num.id || `num-${Math.random().toString(36).substr(2, 9)}` // Ensure num has an id
    })) : []
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
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [categoriesData, setCategoriesData] = useState([]);
  
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    setIsLoadingCategories(true);
    setIsLoadingItems(true);

    const categoriesQuery = query(collection(db, "categories"), orderBy("order", "asc"));

    const unsubscribeCategories = onSnapshot(categoriesQuery, async (querySnapshot) => {
      const fetchedCategories = querySnapshot.docs.map(transformCategoryData);
      
      const itemPromises = fetchedCategories.map(async (category) => {
        let items = [];
        let itemsQuery;
        if (category.type === 'pack') {
          itemsQuery = query(
            collection(db, "numberPacks"), 
            where("categorySlug", "==", category.slug),
            where("status", "==", "available")
          );
          const packSnapshot = await getDocs(itemsQuery);
          items = packSnapshot.docs.map(transformNumberPackData);
        } else { 
          itemsQuery = query(
            collection(db, "vipNumbers"), 
            where("categorySlug", "==", category.slug),
            where("status", "==", "available")
          );
          const numberSnapshot = await getDocs(itemsQuery);
          items = numberSnapshot.docs.map(transformVipNumberData);
        }
        return { ...category, items };
      });

      try {
        const combinedData = await Promise.all(itemPromises);
        setCategoriesData(combinedData);
      } catch (error) {
        console.error("Error fetching category items:", error);
        toast({
          title: "Error",
          description: "Could not load items for some categories.",
          variant: "destructive",
        });
        setCategoriesData(fetchedCategories.map(cat => ({ ...cat, items: [] })));
      } finally {
        setIsLoadingCategories(false);
        setIsLoadingItems(false);
      }
    }, (error) => {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Could not load categories.",
        variant: "destructive",
      });
      setIsLoadingCategories(false);
      setIsLoadingItems(false);
    });

    return () => unsubscribeCategories();
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
    // If item is a pack, it will include selectedNumbers and a calculated price
    const itemName = item.type === 'pack' ? item.name : item.number;
    // For packs with selections, cart logic might be more complex than just checking item.id
    // For now, assume addToCart handles uniqueness if needed, or a new item is created for new selections
    addToCart(item); 
    toast({
      title: "Added to Cart",
      description: `${itemName} (selection) has been added to your cart.`,
    });
    router.push('/checkout');
  }, [addToCart, router, toast]);

  const handleAddToCart = useCallback((item) => {
    // Item for 'pack' type will have 'selectedNumbers' and dynamic 'price'
    const itemName = item.type === 'pack' ? `${item.name} (Selection)` : item.number;
    // addToCart in CartContext should handle uniqueness logic for packs with selections
    addToCart(item);
    toast({
      title: "Added to Cart",
      description: `${itemName} has been added to your cart.`,
    });
  }, [addToCart, toast]);

  const handleToggleFavorite = useCallback((item) => {
    // Favorites will still target the main pack/item ID, not specific selections for simplicity
    toggleFavorite(item); 
    const itemName = item.type === 'pack' ? item.name : item.number;
    toast({ title: isFavorite(item.id) ? `Removed ${itemName} from Favorites` : `Added ${itemName} to Favorites` });
  }, [toggleFavorite, isFavorite, toast]);

  const overallLoading = isLoadingCategories || isLoadingItems;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2 text-center">Discover Your VIP Number</h1>
      <p className="text-muted-foreground mb-6 text-center">
        Choose from a wide range of exclusive and fancy mobile numbers & packs.
      </p>

      <SearchBar />

      <div className="mt-8">
        {overallLoading && categoriesData.length === 0 && (
          Array.from({ length: 3 }).map((_, index) => (
            <CategorySection
              key={`loading-skeleton-${index}`}
              title="Loading Category..."
              items={[]}
              isLoading={true}
              categoryType="individual" 
            />
          ))
        )}
        {!overallLoading && categoriesData.length === 0 && (
            <p className="text-center py-10 text-muted-foreground">No categories or items found.</p>
        )}
        {categoriesData.map((category) => (
          <CategorySection
            key={category.id}
            title={category.title}
            slug={category.slug}
            items={category.items || []}
            isLoading={overallLoading && category.items === undefined}
            categoryType={category.type || 'individual'}
            onBookNow={(itemData) => executeOrPromptLogin(handleBookNow, itemData)}
            onAddToCart={(itemData) => executeOrPromptLogin(handleAddToCart, itemData)}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={(itemId) => isFavorite(itemId)}
            cartItems={cartItems} 
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
