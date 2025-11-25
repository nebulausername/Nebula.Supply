import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import {
  Folder,
  Save,
  X,
  Info,
  Globe,
  Sparkles,
  Tag,
  Image,
  RefreshCw
} from 'lucide-react';
import { useCreateCategory, useUpdateCategory, useCategories } from '../../lib/api/shopHooks';
import type { Category } from '../../lib/api/ecommerce';
import { useToast } from '../ui/Toast';
import { MAIN_CATEGORIES, SNEAKER_HIERARCHY, getCategoryTemplate } from '../../lib/utils/productTemplates';
import { cn } from '../../utils/cn';

interface CategoryEditorProps {
  open: boolean;
  onClose: () => void;
  category?: Category;
  parentId?: string;
  mode: 'create' | 'edit';
}

const CATEGORY_ICONS = [
  '👟', '👕', '👜', '💼', '📱', '⌚', '👓', '🎒', '🧢', '👔',
  '👗', '👠', '🩴', '🧦', '🧤', '🎩', '💍', '📿', '🪮', '🪡',
  '🏷️', '📦', '🎁', '⭐', '🔥', '💎', '👑', '🌟', '✨', '🎯'
];

// Kategorisierte Icons für bessere Auswahl
const ICON_CATEGORIES = {
  'Sneaker & Schuhe': ['👟', '👠', '🩴', '🧦'],
  'Kleidung': ['👕', '👔', '👗', '🧢', '🧤'],
  'Accessoires': ['👜', '💼', '🎒', '⌚', '👓', '🎩', '💍', '📿'],
  'Tech': ['📱', '🪮', '🪡'],
  'Marken & Labels': ['🏷️', '⭐', '🔥', '💎', '👑', '🌟', '✨', '🎯'],
  'Allgemein': ['📦', '🎁']
};

// Helper: Erstelle Slug aus Text
function createSlug(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// Berechne Level einer Kategorie basierend auf parentId-Hierarchie
function getCategoryLevel(category: Category | Partial<Category>, allCategories: Category[]): number {
  if (!category.parentId) return 0;
  
  let level = 0;
  let currentParentId: string | undefined = category.parentId;
  const visited = new Set<string>();
  
  while (currentParentId) {
    if (visited.has(currentParentId)) {
      // Zirkuläre Referenz erkannt
      return -1;
    }
    visited.add(currentParentId);
    
    const parent = allCategories.find(c => c.id === currentParentId);
    if (!parent) break;
    
    level++;
    currentParentId = parent.parentId;
    
    if (level > 10) break; // Sicherheit gegen Endlosschleifen
  }
  
  return level;
}

export function CategoryEditor({ open, onClose, category, parentId, mode }: CategoryEditorProps) {
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    icon: '📦',
    order: 0,
    featured: false,
    parentId: parentId || undefined
  });

  const [seoData, setSeoData] = useState({
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [] as string[],
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [keywordInput, setKeywordInput] = useState('');
  const [iconSearchTerm, setIconSearchTerm] = useState('');
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>('all');

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const { showToast } = useToast();

  const { data: categoriesData } = useCategories({ type: 'shop', limit: 1000 });
  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];

  // Berechne aktuelles Level
  const currentLevel = useMemo(() => {
    if (mode === 'edit' && category) {
      return getCategoryLevel(category, categories);
    }
    if (formData.parentId) {
      const parent = categories.find(c => c.id === formData.parentId);
      if (parent) {
        return getCategoryLevel(parent, categories) + 1;
      }
    }
    return 0;
  }, [category, formData.parentId, categories, mode]);

  // Level-Konfiguration für Farbcodierung
  const levelConfig = useMemo(() => {
    switch (currentLevel) {
      case 0:
        return { label: 'Hauptkategorie', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' };
      case 1:
        return { label: 'Marke', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' };
      case 2:
        return { label: 'Modell', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
      default:
        return { label: 'Kategorie', color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10' };
    }
  }, [currentLevel]);

  // Intelligente Parent-Filterung basierend auf Level
  const availableParents = useMemo(() => {
    // Level 0: Kein Parent möglich
    if (currentLevel === 0) return [];
    
    // Level 1: Nur Hauptkategorien (Level 0)
    if (currentLevel === 1) {
      return categories.filter(c => {
        const level = getCategoryLevel(c, categories);
        return level === 0;
      });
    }
    
    // Level 2: Nur Marken (Level 1)
    if (currentLevel === 2) {
      return categories.filter(c => {
        const level = getCategoryLevel(c, categories);
        return level === 1;
      });
    }
    
    // Level 3: Nur Modelle (Level 2)
    if (currentLevel === 3) {
      return categories.filter(c => {
        const level = getCategoryLevel(c, categories);
        return level === 2;
      });
    }
    
    // Fallback: Exclude self and children
    if (!category) return categories.filter(c => !c.parentId);
    
    const excludeIds = new Set([category.id]);
    const getChildrenIds = (catId: string): string[] => {
      const children = categories.filter(c => c.parentId === catId);
      const allChildren: string[] = [];
      children.forEach(child => {
        allChildren.push(child.id);
        allChildren.push(...getChildrenIds(child.id));
      });
      return allChildren;
    };
    
    const childrenIds = getChildrenIds(category.id);
    childrenIds.forEach(id => excludeIds.add(id));
    return categories.filter(c => !excludeIds.has(c.id));
  }, [categories, category, currentLevel]);

  // Template-Vorschau basierend auf Kategorie
  const categoryTemplate = useMemo(() => {
    if (!formData.slug) return null;
    
    // Prüfe SNEAKER Hierarchie
    if (formData.slug === 'sneaker' || formData.name === 'SNEAKER') {
      return MAIN_CATEGORIES.find(c => c.categorySlug === 'sneaker')?.productTemplate || null;
    }
    
    // Prüfe Marken
    const brand = SNEAKER_HIERARCHY.brands.find(b => b.slug === formData.slug || b.name === formData.name);
    if (brand) {
      return brand.template;
    }
    
    // Prüfe Modelle
    for (const brandItem of SNEAKER_HIERARCHY.brands) {
      if (brandItem.models.some(m => m.toLowerCase().replace(/\s+/g, '-') === formData.slug)) {
        return brandItem.template;
      }
    }
    
    // Fallback: Standard Template
    return getCategoryTemplate(formData.slug);
  }, [formData.slug, formData.name]);

  // Gefilterte Icons basierend auf Suche und Kategorie
  const filteredIcons = useMemo(() => {
    let icons = CATEGORY_ICONS;
    
    if (selectedIconCategory !== 'all') {
      icons = ICON_CATEGORIES[selectedIconCategory as keyof typeof ICON_CATEGORIES] || CATEGORY_ICONS;
    }
    
    if (iconSearchTerm) {
      // Icon-Suche ist schwierig, daher nur nach Kategorie filtern
      return icons;
    }
    
    return icons;
  }, [iconSearchTerm, selectedIconCategory]);

  useEffect(() => {
    if (category && mode === 'edit') {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        icon: category.icon || '📦',
        order: category.order || 0,
        featured: category.featured || false,
        parentId: category.parentId
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '📦',
        order: 0,
        featured: false,
        parentId: parentId || undefined
      });
    }
  }, [category, mode, parentId]);

  // Auto-generate slug from name mit Live-Vorschau
  useEffect(() => {
    if (mode === 'create' && formData.name) {
      const slug = createSlug(formData.name);
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    if (!formData.name || formData.name.trim().length === 0) {
      showToast({
        type: 'error',
        title: 'Validierungsfehler',
        message: 'Der Name ist erforderlich und darf nicht leer sein.'
      });
      return;
    }

    if (!formData.slug || formData.slug.trim().length === 0) {
      showToast({
        type: 'error',
        title: 'Validierungsfehler',
        message: 'Der Slug ist erforderlich und darf nicht leer sein.'
      });
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      showToast({
        type: 'error',
        title: 'Validierungsfehler',
        message: 'Der Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.'
      });
      return;
    }

    // Check for duplicate slug (only in create mode)
    if (mode === 'create') {
      const existingCategory = categories.find(c => c.slug === formData.slug);
      if (existingCategory) {
        showToast({
          type: 'error',
          title: 'Validierungsfehler',
          message: `Eine Kategorie mit dem Slug "${formData.slug}" existiert bereits.`
        });
        return;
      }
    }

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(formData);
        showToast({
          type: 'success',
          title: 'Kategorie erstellt',
          message: `Die Kategorie "${formData.name}" wurde erfolgreich erstellt.`
        });
        // Auto-close after successful creation
        setTimeout(() => {
          handleDialogClose(false);
        }, 500);
      } else if (category) {
        await updateMutation.mutateAsync({
          id: category.id,
          category: formData
        });
        showToast({
          type: 'success',
          title: 'Kategorie aktualisiert',
          message: `Die Kategorie "${formData.name}" wurde erfolgreich aktualisiert.`
        });
        // Auto-close after successful update
        setTimeout(() => {
          handleDialogClose(false);
        }, 500);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Die Kategorie konnte nicht gespeichert werden.';
      showToast({
        type: 'error',
        title: 'Fehler beim Speichern',
        message: errorMessage
      });
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !seoData.seoKeywords.includes(keywordInput.trim())) {
      setSeoData(prev => ({
        ...prev,
        seoKeywords: [...prev.seoKeywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setSeoData(prev => ({
      ...prev,
      seoKeywords: prev.seoKeywords.filter(k => k !== keyword)
    }));
  };

  const parentCategory = formData.parentId 
    ? categories.find(c => c.id === formData.parentId)
    : null;

  // Handle dialog close - ensure onClose is always called
  const handleDialogClose = (shouldClose: boolean) => {
    if (shouldClose) {
      // Reset form when closing
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '📦',
        order: 0,
        featured: false,
        parentId: parentId || undefined
      });
      setSeoData({
        seoTitle: '',
        seoDescription: '',
        seoKeywords: []
      });
      setActiveTab('basic');
      setKeywordInput('');
      setIconSearchTerm('');
      setSelectedIconCategory('all');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            {mode === 'create' ? 'Neue Kategorie' : 'Kategorie bearbeiten'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Erstellen Sie eine neue Kategorie für Ihren Shop.'
              : 'Bearbeiten Sie die Kategorie-Details.'}
          </DialogDescription>
          {/* Level-Indikator */}
          <div className="mt-2">
            <Badge className={cn('text-xs', levelConfig.bg, levelConfig.border, levelConfig.color)}>
              {levelConfig.label} (Level {currentLevel})
            </Badge>
            {currentLevel >= 3 && (
              <p className="text-xs text-yellow-400 mt-1">
                ⚠️ Maximum Level erreicht. Weitere Subkategorien sind nicht möglich.
              </p>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Grundlagen</TabsTrigger>
              <TabsTrigger value="hierarchy">Hierarchie</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. SNEAKER"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  Slug * {mode === 'create' && formData.name && (
                    <span className="text-xs text-white/40 ml-2">(wird automatisch generiert)</span>
                  )}
                </label>
                <div className="relative">
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: createSlug(e.target.value) }))}
                    placeholder="z.B. sneaker"
                    required
                  />
                  {mode === 'create' && formData.name && (
                    <div className="mt-1 text-xs text-white/60">
                      Vorschau: <code className="bg-white/10 px-1 rounded">{formData.slug || createSlug(formData.name)}</code>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  Beschreibung
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beschreibung der Kategorie..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  Icon
                </label>
                {/* Icon-Kategorie Filter */}
                <div className="mb-2">
                  <Select value={selectedIconCategory} onValueChange={setSelectedIconCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Alle Icons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Icons</SelectItem>
                      {Object.keys(ICON_CATEGORIES).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Icon Grid */}
                <div className="grid grid-cols-10 gap-2 p-3 bg-white/5 rounded-lg max-h-48 overflow-y-auto">
                  {filteredIcons.map(icon => (
                    <motion.button
                      key={icon}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        'w-10 h-10 flex items-center justify-center rounded-lg text-2xl transition-all',
                        formData.icon === icon 
                          ? 'bg-primary/30 border-2 border-primary' 
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      )}
                    >
                      {icon}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/20 bg-white/10"
                  />
                  <label htmlFor="featured" className="text-sm text-white/80">
                    Featured
                  </label>
                </div>

                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-white/80">
                    Reihenfolge
                  </label>
                  <Input
                    type="number"
                    value={formData.order || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hierarchy" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  Übergeordnete Kategorie
                  {currentLevel === 0 && (
                    <span className="text-xs text-white/40 ml-2">(Hauptkategorie - kein Parent möglich)</span>
                  )}
                  {currentLevel > 0 && (
                    <span className="text-xs text-white/40 ml-2">
                      (Nur {currentLevel === 1 ? 'Hauptkategorien' : currentLevel === 2 ? 'Marken' : 'Modelle'} erlaubt)
                    </span>
                  )}
                </label>
                <Select
                  value={formData.parentId || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value || undefined }))}
                  disabled={currentLevel === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={currentLevel === 0 ? "Hauptkategorie (kein Parent)" : "Wähle Parent-Kategorie"} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentLevel > 0 && (
                      <SelectItem value="">Keine (wird zur Hauptkategorie)</SelectItem>
                    )}
                    {availableParents.map(cat => {
                      const parentLevel = getCategoryLevel(cat, categories);
                      const parentLevelLabel = parentLevel === 0 ? 'Hauptkategorie' : parentLevel === 1 ? 'Marke' : 'Modell';
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                            <Badge variant="outline" className="text-xs ml-auto">
                              {parentLevelLabel}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {parentCategory && (
                  <div className="mt-2 p-2 bg-white/5 rounded text-sm text-white/60">
                    Unter: {parentCategory.icon} {parentCategory.name}
                  </div>
                )}
              </div>
              
              {/* Template-Vorschau */}
              {categoryTemplate && (
                <div className="mt-4 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-semibold text-white">Produkt-Template Vorschau</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Standard-Preis:</span>
                      <span className="text-white font-medium">{categoryTemplate.defaultPrice} €</span>
                    </div>
                    {categoryTemplate.defaultStock && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Standard-Lagerbestand:</span>
                        <span className="text-white font-medium">{categoryTemplate.defaultStock}</span>
                      </div>
                    )}
                    {categoryTemplate.defaultTags && categoryTemplate.defaultTags.length > 0 && (
                      <div>
                        <span className="text-white/60">Tags: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {categoryTemplate.defaultTags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {categoryTemplate.defaultDescription && (
                      <div className="mt-2">
                        <span className="text-white/60">Beschreibung:</span>
                        <p className="text-white/80 text-xs mt-1">{categoryTemplate.defaultDescription}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  SEO Title
                </label>
                <Input
                  value={seoData.seoTitle}
                  onChange={(e) => setSeoData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="SEO-optimierter Titel"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  SEO Beschreibung
                </label>
                <Textarea
                  value={seoData.seoDescription}
                  onChange={(e) => setSeoData(prev => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder="SEO-optimierte Beschreibung"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">
                  SEO Keywords
                </label>
                <div className="flex gap-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    placeholder="Keyword hinzufügen..."
                  />
                  <Button type="button" onClick={handleAddKeyword} variant="outline">
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {seoData.seoKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {seoData.seoKeywords.map(keyword => (
                      <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleDialogClose(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Abbrechen
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Erstelle...' : 'Speichere...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Erstellen' : 'Speichern'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

