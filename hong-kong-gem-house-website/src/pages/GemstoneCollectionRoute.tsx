import { Navigate, useParams } from 'react-router-dom';
import GemstoneCategoryCollectionPage from './GemstoneCategoryCollectionPage';

const supportedCategories = ['ruby', 'blue-sapphire', 'emerald', 'rare-gemstones'] as const;
type SupportedCategory = typeof supportedCategories[number];

export default function GemstoneCollectionRoute() {
  const { category = 'ruby' } = useParams();
  if ((supportedCategories as readonly string[]).includes(category)) {
    return <GemstoneCategoryCollectionPage slug={category as SupportedCategory} />;
  }
  return <Navigate to="/#our-gemstones" replace />;
}
