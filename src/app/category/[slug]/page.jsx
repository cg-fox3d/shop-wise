
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import VipNumberCard from '@/components/VipNumberCard';
import NumberPackCard from '@/components/NumberPackCard';
import VipNumberCardSkeleton from '@/components/skeletons/VipNumberCardSkeleton';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/LoginModal';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, doc, limit, getDoc } from 'firebase/firestore'; // Added getDoc
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Dynamic metadata generation removed as per user request

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
      return {
        ...num,
        price: parseFloat(num.price) || 0,
        id: num.id || `num-${Math.random().toString(36).substr(2, 9)}`,
        status: currentStatus,
        originalVipNumberId: num.originalVipNumberId // Ensure this is passed
      };
    }) : []
  };
};

const transformCategoryData = (docSnapshot) => {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    ...data,
  };
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [categoryDetails, setCategoryDetails] = useState(null);
  const [allVipNumbers, setAllVipNumbers] = useState([]);
  const [categoryItems, setCategoryItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);
  const [isLoadingVipNumbersGlobal, setIsLoadingVipNumbersGlobal] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [digitSearchTerm, setDigitSearchTerm] = useState('');
  const [selectedPackQuantity, setSelectedPackQuantity] = useState(null);

  const slug = params?.slug;
  const categoryDisplayType = searchParams.get('type') === 'packs' ? 'pack' : 'individual';
  const numQuantityOptions = Array.from({ length: 6 }, (_, i) => i + 2);

  useEffect(() => {
    setIsLoadingVipNumbersGlobal(true);
    const vipNumbersQuery = query(collection(db, "vipNumbers"));
    const unsubscribeVipNumbers = onSnapshot(vipNumbersQuery, (snapshot) => {
      setAllVipNumbers(snapshot.docs.map(transformVipNumberData));
      setIsLoadingVipNumbersGlobal(false);
    }, (error) => {
      console.error("Error fetching VIP numbers for pack status:", error);
      setIsLoadingVipNumbersGlobal(false);
    });
    return () => unsubscribeVipNumbers();
  }, []);

  useEffect(() => {
    if (slug) {
      setIsLoadingCategory(true);
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
          setCategoryDetails(null);
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

  useEffect(() => {
    if (slug && categoryDetails !== undefined && !isLoadingVipNumbersGlobal) {
      setIsLoadingItems(true);
      let itemsQuery;
      const allVipNumbersMap = new Map(allVipNumbers.map(num => [num.id, num]));

      if (categoryDisplayType === 'pack') {
        itemsQuery = query(
          collection(db, "numberPacks"),
          where("categorySlug", "==", slug),
          where("status", "==", "available")
        );
      } else {
        itemsQuery = query(
          collection(db, "vipNumbers"),
          where("categorySlug", "==", slug),
          where("status", "==", "available")
        );
      }

      const unsubscribeItems = onSnapshot(itemsQuery, (querySnapshot) => {
        let processedItems = [];
        if (categoryDisplayType === 'pack') {
          processedItems = querySnapshot.docs
            .map(doc => transformNumberPackData(doc, allVipNumbersMap))
            .filter(pack => pack.numbers.some(num => num.status === 'available'));
        } else {
          processedItems = querySnapshot.docs.map(doc => transformVipNumberData(doc));
        }
        setCategoryItems(processedItems);
        setIsLoadingItems(false);
      }, (error) => {
        console.error(`Error fetching items for category ${slug} (type: ${categoryDisplayType}):`, error);
        toast({ title: "Error", description: `Could not load items for category "${slug}".`, variant: "destructive" });
        setCategoryItems([]);
        setIsLoadingItems(false);
      });
      return () => unsubscribeItems();
    } else if (!slug) {
        setIsLoadingItems(false);
    }
  }, [slug, categoryDetails, categoryDisplayType, toast, isLoadingVipNumbersGlobal, allVipNumbers]);

  useEffect(() => {
    if (isLoadingItems) return;

    let filtered = [...categoryItems];

    if (categoryDisplayType === 'pack' && selectedPackQuantity) {
      filtered = filtered.filter(item => item.numbers && item.numbers.length === parseInt(selectedPackQuantity));
    }

    if (digitSearchTerm.trim() !== '') {
      filtered = filtered.filter(item => {
        if (item.type === 'pack') {
          return item.name?.toLowerCase().includes(digitSearchTerm.toLowerCase().trim()) ||
                 item.description?.toLowerCase().includes(digitSearchTerm.toLowerCase().trim()) ||
                 item.numbers?.some(numObj => numObj.number.toLowerCase().includes(digitSearchTerm.toLowerCase().trim()));
        }
        return item.number?.toLowerCase().includes(digitSearchTerm.toLowerCase().trim());
      });
    }
    setDisplayedItems(filtered);
  }, [digitSearchTerm, categoryItems, isLoadingItems, categoryDisplayType, selectedPackQuantity]);


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
  }, [addToCart, toast, router]);

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

  const renderSkeletons = (count) => (
    Array.from({ length: count }).map((_, index) => (
      <VipNumberCardSkeleton key={`skeleton-${index}`} />
    ))
  );

  const isLoading = isLoadingCategory || isLoadingItems || isLoadingVipNumbersGlobal;

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

  if (!categoryDetails && !isLoadingCategory) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <p className="text-muted-foreground mb-6">The category "{slug}" does not exist.</p>
        <Button asChild><Link href="/">Go to Homepage</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{categoryDetails?.title || "Category"}</h1>
        <p className="text-muted-foreground mt-1">
          Browse {categoryDisplayType === 'pack' ? 'packs' : 'VIP numbers'} in "{categoryDetails?.title}".
        </p>
      </div>

      {(categoryItems.length > 0 || digitSearchTerm || selectedPackQuantity) && (
        <div className="my-6 p-4 bg-card border rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-grow w-full md:w-auto">
            <Label htmlFor="category-search-input" className="text-base font-semibold mb-1 block">
              Search within "{categoryDetails?.title}"
            </Label>
            <Input
              id="category-search-input"
              type="text"
              placeholder={categoryDisplayType === 'pack' ? "Search pack name, number..." : "Enter digits..."}
              value={digitSearchTerm}
              onChange={(e) => setDigitSearchTerm(e.target.value)}
              className="max-w-md h-10 text-sm"
            />
          </div>
          {categoryDisplayType === 'pack' && (
            <div className="w-full md:w-auto">
              <Label htmlFor={`category-pack-qty-select-${slug}`} className="text-base font-semibold mb-1 block">Numbers in Pack:</Label>
              <Select
                value={selectedPackQuantity || ""}
                onValueChange={(value) => setSelectedPackQuantity(value === "all" ? null : value)}
              >
                <SelectTrigger id={`category-pack-qty-select-${slug}`} className="w-full md:w-[120px] h-10 text-sm">
                  <SelectValue placeholder="Any Qty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Qty</SelectItem>
                  {numQuantityOptions.map(qty => (
                    <SelectItem key={qty} value={String(qty)}>{qty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {displayedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedItems.map((item) => (
            item.type === 'pack' ? (
              <NumberPackCard
                key={item.id + (item.selectedNumbers ? JSON.stringify(item.selectedNumbers.map(sn => sn.id)) : '')}
                packDetails={item}
                onBookNow={(itemData) => executeOrPromptLogin(handleBookNow, itemData)}
                onAddToCart={(itemData) => executeOrPromptLogin(handleAddToCart, itemData)}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite(item.id)}
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
      ) : (
         <p className="text-center text-muted-foreground text-lg py-10">
            {isLoading ? "Loading items..." : `No ${categoryDisplayType === 'pack' ? 'packs' : 'VIP numbers'} found matching your criteria in this category.`}
          </p>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => { setIsLoginModalOpen(false); setPendingAction(null); }}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
