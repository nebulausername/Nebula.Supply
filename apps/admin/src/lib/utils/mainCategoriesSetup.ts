import type { Category } from '../../lib/api/ecommerce';
import { MAIN_CATEGORIES, SNEAKER_HIERARCHY } from './productTemplates';

export interface MainCategorySetup {
  category: any; // CategoryTemplateConfig
  exists: boolean;
  categoryId?: string;
}

/**
 * Prüft ob Hauptkategorien existieren und erstellt sie falls nötig
 */
export async function checkAndSetupMainCategories(
  existingCategories: Category[],
  createCategoryFn: (category: Partial<Category>) => Promise<Category>
): Promise<MainCategorySetup[]> {
  const results: MainCategorySetup[] = [];
  
  for (const mainCategory of MAIN_CATEGORIES) {
    const existing = existingCategories.find(
      cat => cat.slug === mainCategory.categorySlug || 
             cat.name.toLowerCase() === mainCategory.categoryName.toLowerCase()
    );
    
    if (existing) {
      results.push({
        category: mainCategory,
        exists: true,
        categoryId: existing.id
      });
    } else {
      // Erstelle Hauptkategorie
      try {
        const created = await createCategoryFn({
          name: mainCategory.categoryName,
          slug: mainCategory.categorySlug,
          icon: mainCategory.categoryIcon,
          description: mainCategory.categoryDescription,
          order: MAIN_CATEGORIES.indexOf(mainCategory),
          featured: true,
          parentId: undefined
        });
        
        results.push({
          category: mainCategory,
          exists: false,
          categoryId: created.id
        });
      } catch (error) {
        console.error(`Failed to create category ${mainCategory.categoryName}:`, error);
        results.push({
          category: mainCategory,
          exists: false
        });
      }
    }
  }
  
  return results;
}

/**
 * Erstellt Subkategorien für eine Hauptkategorie
 */
export async function createSubcategories(
  parentCategoryId: string,
  subcategories: string[],
  createCategoryFn: (category: Partial<Category>) => Promise<Category>
): Promise<Category[]> {
  const created: Category[] = [];
  
  for (let i = 0; i < subcategories.length; i++) {
    const subcategoryName = subcategories[i];
    try {
      const subcategory = await createCategoryFn({
        name: subcategoryName,
        slug: subcategoryName.toLowerCase().replace(/\s+/g, '-'),
        icon: '📦',
        description: `Subkategorie: ${subcategoryName}`,
        order: i,
        featured: false,
        parentId: parentCategoryId
      });
      
      created.push(subcategory);
    } catch (error) {
      console.error(`Failed to create subcategory ${subcategoryName}:`, error);
    }
  }
  
  return created;
}

/**
 * Setup-Interface für Progress-Tracking
 */
export interface SetupProgress {
  current: number;
  total: number;
  label: string;
  stage: 'main' | 'brands' | 'models';
}

/**
 * Erstellt die vollständige 3-Level SNEAKER Hierarchie
 * Level 1: SNEAKER (Hauptkategorie)
 * Level 2: Marken (NIKE, AIR JORDAN, etc.)
 * Level 3: Modelle (AIRMAX 95, AIR JORDAN 1 HIGH, etc.)
 */
export async function setupSneakerHierarchy(
  existingCategories: Category[],
  createCategoryFn: (category: Partial<Category>) => Promise<Category>,
  onProgress?: (progress: SetupProgress) => void
): Promise<{
  mainCategory: Category | null;
  brands: Category[];
  models: Category[];
  errors: string[];
}> {
  const errors: string[] = [];
  let mainCategory: Category | null = null;
  const brands: Category[] = [];
  const models: Category[] = [];
  
  const totalSteps = 1 + SNEAKER_HIERARCHY.brands.length + 
    SNEAKER_HIERARCHY.brands.reduce((sum, brand) => sum + brand.models.length, 0);
  let currentStep = 0;
  
  // Step 1: Erstelle oder finde SNEAKER Hauptkategorie
  onProgress?.({
    current: currentStep++,
    total: totalSteps,
    label: 'Erstelle SNEAKER Hauptkategorie...',
    stage: 'main'
  });
  
  const sneakerMain = MAIN_CATEGORIES.find(c => c.categorySlug === 'sneaker');
  if (!sneakerMain) {
    errors.push('SNEAKER Hauptkategorie nicht in MAIN_CATEGORIES gefunden');
    return { mainCategory: null, brands, models, errors };
  }
  
  let existingMain = existingCategories.find(
    cat => cat.slug === 'sneaker' || 
           cat.name.toLowerCase() === 'sneaker'
  );
  
  if (!existingMain) {
    try {
      mainCategory = await createCategoryFn({
        name: sneakerMain.categoryName,
        slug: sneakerMain.categorySlug,
        icon: sneakerMain.categoryIcon,
        description: sneakerMain.categoryDescription,
        order: 0,
        featured: true,
        parentId: undefined
      });
    } catch (error) {
      const errorMsg = `Fehler beim Erstellen der SNEAKER Hauptkategorie: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
      return { mainCategory: null, brands, models, errors };
    }
  } else {
    mainCategory = existingMain;
  }
  
  if (!mainCategory) {
    errors.push('SNEAKER Hauptkategorie konnte nicht erstellt werden');
    return { mainCategory: null, brands, models, errors };
  }
  
  // Step 2: Erstelle alle Marken (Level 2)
  for (const brand of SNEAKER_HIERARCHY.brands) {
    onProgress?.({
      current: currentStep++,
      total: totalSteps,
      label: `Erstelle Marke: ${brand.name}...`,
      stage: 'brands'
    });
    
    // Prüfe ob Marke bereits existiert
    const existingBrand = existingCategories.find(
      cat => cat.parentId === mainCategory!.id && 
             (cat.slug === brand.slug || cat.name.toLowerCase() === brand.name.toLowerCase())
    );
    
    if (existingBrand) {
      brands.push(existingBrand);
      // Überspringe Modelle für diese Marke
      currentStep += brand.models.length;
      continue;
    }
    
    try {
      const createdBrand = await createCategoryFn({
        name: brand.name,
        slug: brand.slug,
        icon: '🏷️',
        description: `${brand.name} Sneaker`,
        order: SNEAKER_HIERARCHY.brands.indexOf(brand),
        featured: false,
        parentId: mainCategory.id
      });
      
      brands.push(createdBrand);
      
      // Step 3: Erstelle alle Modelle für diese Marke (Level 3)
      for (const model of brand.models) {
        onProgress?.({
          current: currentStep++,
          total: totalSteps,
          label: `Erstelle Modell: ${brand.name} ${model}...`,
          stage: 'models'
        });
        
        // Prüfe ob Modell bereits existiert
        const existingModel = existingCategories.find(
          cat => cat.parentId === createdBrand.id && 
                 cat.name.toLowerCase() === model.toLowerCase()
        );
        
        if (existingModel) {
          models.push(existingModel);
          continue;
        }
        
        try {
          const modelSlug = model.toLowerCase().replace(/\s+/g, '-');
          const createdModel = await createCategoryFn({
            name: model,
            slug: modelSlug,
            icon: '👟',
            description: `${brand.name} ${model}`,
            order: brand.models.indexOf(model),
            featured: false,
            parentId: createdBrand.id
          });
          
          models.push(createdModel);
        } catch (error) {
          const errorMsg = `Fehler beim Erstellen des Modells ${brand.name} ${model}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }
    } catch (error) {
      const errorMsg = `Fehler beim Erstellen der Marke ${brand.name}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
      // Überspringe Modelle für diese Marke
      currentStep += brand.models.length;
    }
  }
  
  onProgress?.({
    current: totalSteps,
    total: totalSteps,
    label: 'SNEAKER Hierarchie Setup abgeschlossen!',
    stage: 'models'
  });
  
  return { mainCategory, brands, models, errors };
}

