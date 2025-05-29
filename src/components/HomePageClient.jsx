
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

// Helper to transform Firestore doc data for VIP numbers
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

// Helper to transform Firestore doc data for Number Packs
const transformNumberPackData = (doc, allVipNumbersMap) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    packPrice: parseFloat(data.packPrice) || 0,
    totalOriginalPrice: data.totalOriginalPrice ? parseFloat(data.totalOriginalPrice) : undefined,
    type: 'pack',
    numbers: Array.isArray(data.numbers) ? data.numbers.map(num => {
        const vipNumberDetails = allVipNumbersMap.get(num.originalVipNumberId);
        const currentStatus = vipNumberDetails ? vipNumberDetails.status : 'unknown';
        // Ensure individual number prices are parsed as float
        const individualPrice = parseFloat(num.price); 
        return {
            ...num,
            price: isNaN(individualPrice) ? 0 : individualPrice, // Default to 0 if parsing fails
            id: num.id || `num-${Math.random().toString(36).substr(2, 9)}`,
            status: currentStatus
        };
    }) : []
  };
};

const transformCategoryData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
  };
}

export default function HomePageClient() {
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingVipNumbersGlobal, setIsLoadingVipNumbersGlobal] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true); 
  const [categoriesData, setCategoriesData] = useState([]);
  const [allVipNumbers, setAllVipNumbers] = useState([]); 
  
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    setIsLoadingVipNumbersGlobal(true);
    const vipNumbersQuery = query(collection(db, "vipNumbers"));
    const unsubscribeVipNumbers = onSnapshot(vipNumbersQuery, (snapshot) => {
      setAllVipNumbers(snapshot.docs.map(transformVipNumberData));
      setIsLoadingVipNumbersGlobal(false);
    }, (error) => {
      console.error("Error fetching VIP numbers for global map:", error);
      toast({ title: "Error", description: "Could not load core number data.", variant: "destructive" });
      setIsLoadingVipNumbersGlobal(false);
    });
    return () => unsubscribeVipNumbers();
  }, [toast]);

  useEffect(() => {
    if (isLoadingVipNumbersGlobal) return; 

    setIsLoadingCategories(true);
    setIsLoadingItems(true);

    const categoriesQuery = query(collection(db, "categories"), orderBy("order", "asc"));
    const allVipNumbersMap = new Map(allVipNumbers.map(num => [num.id, num]));

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
          items = packSnapshot.docs
            .map(doc => transformNumberPackData(doc, allVipNumbersMap))
            .filter(pack => pack.numbers.some(num => num.status === 'available'));
        } else { 
          items = allVipNumbers.filter(
            num => num.categorySlug === category.slug && num.status === 'available'
          );
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
        // Still set categories so the UI doesn't just hang on loading
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
  }, [toast, isLoadingVipNumbersGlobal, allVipNumbers]);


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
    addToCart(item); 
    toast({
      title: "Added to Cart",
      description: `${itemName} ${item.type === 'pack' ? '(selection)' : ''} has been added to your cart. Proceeding to checkout.`,
    });
    router.push('/checkout');
  }, [addToCart, router, toast]);

  const handleAddToCart = useCallback((item) => {
    const itemName = item.type === 'pack' ? `${item.name} (Selection)` : item.number;
    addToCart(item);
    toast({
      title: "Added to Cart",
      description: `${itemName} has been added to your cart.`,
    });
  }, [addToCart, toast]);

  const handleToggleFavorite = useCallback((item) => {
    toggleFavorite(item); 
    const itemName = item.type === 'pack' ? item.name : item.number;
    toast({ title: isFavorite(item.id) ? `Removed ${itemName} from Favorites` : `Added ${itemName} to Favorites` });
  }, [toggleFavorite, isFavorite, toast]);

  const overallLoading = isLoadingCategories || isLoadingItems || isLoadingVipNumbersGlobal;

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
          (category.items && category.items.length > 0) || category.type !== 'pack' ? 
          <CategorySection
            key={category.id}
            title={category.title}
            slug={category.slug}
            items={category.items || []}
            isLoading={overallLoading && category.items === undefined} // Check if items for this specific category are loaded
            categoryType={category.type || 'individual'}
            onBookNow={(itemData) => executeOrPromptLogin(handleBookNow, itemData)}
            onAddToCart={(itemData) => executeOrPromptLogin(handleAddToCart, itemData)}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={(itemId) => isFavorite(itemId)}
            cartItems={cartItems} 
          />
          : null 
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
