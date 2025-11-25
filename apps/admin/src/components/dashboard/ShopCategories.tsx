import { Card } from '../ui/Card';
import { categories, products } from '@nebula/shared';

export function ShopCategories() {
  const categoryProductCount = categories.map((category) => ({
    category,
    count: products.filter((product) => product.categoryId === category.id).length
  }));

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Shop Kategorien</h2>
      <div className="space-y-3">
        {categoryProductCount.map(({ category, count }) => (
          <div key={category.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <span className="flex items-center gap-2 text-text">
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </span>
            <span className="font-semibold text-text">{count} Produkte</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
