import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useCategories, useBulkUpdateCategoryOrder, useUpdateCategory } from '../../lib/api/shopHooks';
import { useRealtimeShop, ShopRealtimeEvent } from '../../lib/websocket/useRealtimeShop';
import { ArrowDown, ArrowUp, CheckCircle2, Lightbulb, Shuffle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CategoryItem {
  id: string;
  name: string;
  order: number;
  featured?: boolean;
  tag?: string;
}

const smartAssignments = [
  { title: 'Drop Specials', description: 'Alle Produkte mit Access limited/vip zu Drop Specials verschieben.', badge: '🔥 Hot', tag: 'drop' },
  { title: 'VIP Exclusives', description: 'Produkte mit hoher Conversion in VIP Kategorie highlighten.', badge: '💎 VIP', tag: 'vip' },
  { title: 'Seasonal', description: 'Frische Drops in Seasonal Collections anzeigen.', badge: '🌿 Seasonal', tag: 'seasonal' },
];

export const CategoryOrganizer: React.FC = () => {
  const { data: categoriesResponse } = useCategories();
  const bulkUpdate = useBulkUpdateCategoryOrder();
  const updateCategory = useUpdateCategory();

  const categories: any[] = useMemo(() => {
    if (!categoriesResponse) return [];
    if (Array.isArray(categoriesResponse as any)) return categoriesResponse as any;
    if ((categoriesResponse as any).data) return (categoriesResponse as any).data;
    return [];
  }, [categoriesResponse]);

  const [categoryList, setCategoryList] = useState<CategoryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setCategoryList(categories.map((category, index) => ({
      id: category.id,
      name: category.name,
      order: category.order ?? index,
      featured: category.featured ?? false,
      tag: category.badge ?? undefined
    })));
  }, [categories]);

  const move = useCallback((index: number, direction: -1 | 1) => {
    setCategoryList((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((item, idx) => ({ ...item, order: idx }));
    });
  }, []);

  const toggleFeatured = useCallback((id: string) => {
    setCategoryList((prev) => prev.map((item) => item.id === id ? { ...item, featured: !item.featured } : item));
  }, []);

  const applySmartAssignment = useCallback((tag: string) => {
    setCategoryList((prev) => prev.map((item) => {
      if (tag === 'vip' && item.name.toLowerCase().includes('premium')) {
        return { ...item, featured: true, tag: 'VIP spotlight' };
      }
      if (tag === 'drop' && item.name.toLowerCase().includes('drop')) {
        return { ...item, featured: true, tag: 'Drop exclusive' };
      }
      if (tag === 'seasonal') {
        return { ...item, tag: 'Seasonal' };
      }
      return item;
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!categoryList.length) return;
    setSaving(true);
    try {
      const updates = categoryList.map((item, index) => ({ categoryId: item.id, order: index }));
      await bulkUpdate.mutateAsync(updates);
      await Promise.all(categoryList.map((item) => updateCategory.mutateAsync({ id: item.id, category: { featured: item.featured } })));
      setLastSavedAt(new Date().toISOString());
    } finally {
      setSaving(false);
    }
  }, [categoryList, bulkUpdate, updateCategory]);

  const handleCategoryRealtime = useCallback((event: ShopRealtimeEvent) => {
    const payload = event.payload ?? {};
    if (event.type === 'category:updated' && payload.id) {
      setCategoryList((prev) => prev.map((item) => item.id === payload.id ? { ...item, name: payload.name ?? item.name } : item));
    }
  }, []);

  useRealtimeShop({
    channels: ['categories'],
    onCategoryEvent: handleCategoryRealtime
  });

  return (
    <Card className="p-6 border border-white/10 bg-black/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Dynamic Category Organizer</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Sortiere Kategorien, aktiviere Smart Assignments und manage Featured Collections – alles live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSavedAt && (
            <Badge variant="outline" className="border-green-400/40 text-green-200 text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Saved {new Date(lastSavedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        <Card className="p-5 border border-white/10 bg-black/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">Reorder Categories</h4>
              <p className="text-xs text-muted-foreground">Drag-like ordering mit Up/Down Controls & Feature Toggles</p>
            </div>
            <Badge variant="outline" className="border-white/15 text-white/70">{categoryList.length} Kategorien</Badge>
          </div>
          <div className="space-y-2">
            {categoryList.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center text-[10px] text-muted-foreground">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(index, -1)} disabled={index === 0}>
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(index, 1)} disabled={index === categoryList.length - 1}>
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Order #{index + 1}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.tag && (
                    <Badge variant="outline" className="border-purple-400/40 text-purple-200 text-[11px]">{item.tag}</Badge>
                  )}
                  <Button
                    size="sm"
                    variant={item.featured ? 'default' : 'outline'}
                    className="gap-1 text-[11px]"
                    onClick={() => toggleFeatured(item.id)}
                  >
                    {item.featured ? 'Featured' : 'Feature'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 border border-white/10 bg-black/15">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">Smart Assignments</h4>
              <p className="text-xs text-muted-foreground">Empfehlungen basierend auf Performance & Tags</p>
            </div>
            <Badge variant="outline" className="border-white/15 text-white/70">AI Assisted</Badge>
          </div>
          <div className="space-y-3">
            {smartAssignments.map((assignment) => (
              <div key={assignment.title} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <Shuffle className="w-4 h-4 text-cyan-300" /> {assignment.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{assignment.description}</p>
                  </div>
                  <Badge variant="outline" className="border-cyan-400/40 text-cyan-200 text-[11px]">{assignment.badge}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" variant="outline" className="gap-1 text-[11px]" onClick={() => applySmartAssignment(assignment.tag)}>
                    <Lightbulb className="w-3 h-3" /> Apply Suggestion
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Card>
  );
};

