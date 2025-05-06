import ProductCard from '@/components/ProductCard';

// Sample product data (replace with actual data fetching later)
const products = [
  {
    id: 'prod_1',
    name: 'Classic Tee',
    description: 'A comfortable and stylish classic t-shirt made from 100% cotton.',
    price: 25.00,
    imageUrl: 'https://picsum.photos/seed/tee/400/400',
    imageHint: 'tshirt clothing',
  },
  {
    id: 'prod_2',
    name: 'Denim Jeans',
    description: 'High-quality denim jeans with a modern slim fit.',
    price: 60.00,
    imageUrl: 'https://picsum.photos/seed/jeans/400/400',
    imageHint: 'jeans pants',
  },
  {
    id: 'prod_3',
    name: 'Running Shoes',
    description: 'Lightweight and breathable running shoes for maximum comfort.',
    price: 85.00,
    imageUrl: 'https://picsum.photos/seed/shoes/400/400',
    imageHint: 'shoes sneakers',
  },
  {
    id: 'prod_4',
    name: 'Leather Wallet',
    description: 'A classic bifold wallet made from genuine leather.',
    price: 40.00,
    imageUrl: 'https://picsum.photos/seed/wallet/400/400',
    imageHint: 'wallet accessory',
  },
    {
    id: 'prod_5',
    name: 'Sunglasses',
    description: 'Stylish sunglasses with UV protection.',
    price: 50.00,
    imageUrl: 'https://picsum.photos/seed/sunglasses/400/400',
    imageHint: 'sunglasses accessory',
  },
    {
    id: 'prod_6',
    name: 'Backpack',
    description: 'Durable and spacious backpack for everyday use.',
    price: 70.00,
    imageUrl: 'https://picsum.photos/seed/backpack/400/400',
    imageHint: 'backpack bag',
  },
];

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Featured Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
