
import SearchResultsPageClient from '@/components/SearchResultsPageClient';

// Dynamic metadata generation
export async function generateMetadata({ searchParams: urlSearchParams }) {
  const searchTerm = urlSearchParams.get('term') || '';
  const searchType = urlSearchParams.get('type') || 'digits';
  const minPriceParam = urlSearchParams.get('minPrice');
  const maxPriceParam = urlSearchParams.get('maxPrice');

  let title = "Search Results | NumbersGuru";
  let description = "Find VIP and fancy Indian mobile numbers matching your search at NumbersGuru.";

  if (searchType === 'digits' && searchTerm) {
    title = `VIP Numbers matching "${searchTerm}" | NumbersGuru`;
    description = `Search results for VIP Indian mobile numbers containing "${searchTerm}" at NumbersGuru.`;
  } else if (searchType === 'price') {
    let priceDesc = "by Price";
    if (minPriceParam && maxPriceParam) {
      priceDesc = `between ₹${minPriceParam} - ₹${maxPriceParam}`;
    } else if (minPriceParam) {
      priceDesc = `above ₹${minPriceParam}`;
    } else if (maxPriceParam) {
      priceDesc = `up to ₹${maxPriceParam}`;
    }
    title = `VIP Numbers ${priceDesc} | NumbersGuru`;
    description = `Find VIP Indian mobile numbers in your preferred price range at NumbersGuru.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default function SearchResultsPage() {
  return <SearchResultsPageClient />;
}
