
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
  // For debugging: log the pack being transformed and the map content if needed
  // console.log(`Transforming pack ${doc.id}`, data.numbers, allVipNumbersMap.size > 0 ? 'Map has entries' : 'Map is EMPTY');
  return {
    id: doc.id,
    ...data,
    packPrice: parseFloat(data.packPrice) || 0,
    totalOriginalPrice: data.totalOriginalPrice ? parseFloat(data.totalOriginalPrice) : undefined,
    type: 'pack',
    numbers: Array.isArray(data.numbers) ? data.numbers.map(num => {
        const vipNumberDetails = allVipNumbersMap.get(num.originalVipNumberId); // Corrected field name
        const currentStatus = vipNumberDetails ? vipNumberDetails.status : 'unknown'; // Default to 'unknown' if not found in vipNumbers
        // For debugging: log status mapping for each number in a pack
        // console.log(`Pack ${doc.id}, Num originalVipNumberId ${num.originalVipNumberId}: Found in map? ${!!vipNumberDetails}. Mapped Status: ${currentStatus}. Actual VIP status if found: ${vipNumberDetails?.status}`);
        return {
            ...num,
            price: parseFloat(num.price) || 0,
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

export default function Home() {
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingVipNumbers, setIsLoadingVipNumbers] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true); // General items loading
  const [categoriesData, setCategoriesData] = useState([]);
  const [allVipNumbers, setAllVipNumbers] = useState([]); // Store all VIP numbers for status checks
  
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    setIsLoadingVipNumbers(true);
    // Fetch all VIP numbers to get their statuses for pack updates
    const vipNumbersQuery = query(collection(db, "vipNumbers"));
    const unsubscribeVipNumbers = onSnapshot(vipNumbersQuery, (snapshot) => {
      setAllVipNumbers(snapshot.docs.map(transformVipNumberData));
      setIsLoadingVipNumbers(false);
    }, (error) => {
      console.error("Error fetching VIP numbers:", error);
      toast({ title: "Error", description: "Could not load VIP numbers data.", variant: "destructive" });
      setIsLoadingVipNumbers(false);
    });
    return () => unsubscribeVipNumbers();
  }, [toast]);

  useEffect(() => {
    if (isLoadingVipNumbers) return; // Wait for all VIP numbers to load their statuses

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
            where("status", "==", "available") // This status is for the pack document itself
          );
          const packSnapshot = await getDocs(itemsQuery);
          items = packSnapshot.docs
            .map(doc => transformNumberPackData(doc, allVipNumbersMap))
            .filter(pack => pack.numbers.some(num => num.status === 'available')); // Filter out packs where all numbers are sold
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
  }, [toast, isLoadingVipNumbers, allVipNumbers]);


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

  const overallLoading = isLoadingCategories || isLoadingItems || isLoadingVipNumbers;

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
          (category.items && category.items.length > 0) || category.type !== 'pack' ? // Render section if it has items, or if it's not a pack category (to show empty state within section)
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
          : null // Don't render the category section at all if it's a pack category and all its packs were filtered out
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
