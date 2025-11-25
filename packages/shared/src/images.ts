export type ImageSpace = 'shop' | 'drops';

export interface Image {
  id: string;
  space: ImageSpace;
  fileKey: string;
  mime: string;
  width: number;
  height: number;
  sizeBytes: number;
  alt: string;
  dominantColor?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductImage {
  productId: string;
  imageId: string;
  position: number;
  isCover: boolean;
}

export interface DropImage {
  dropId: string;
  imageId: string;
  position: number;
}

export interface ImageUploadRequest {
  space: ImageSpace;
  files: File[];
  alt?: string;
}

// Request types for API
export interface ProductImageLinkRequest {
  imageIds: string[];
  insertAt?: number;
}

export interface ProductImageReorderRequest {
  orderedImageIds: string[];
  coverId?: string;
}

export interface DropImageLinkRequest {
  imageIds: string[];
}

export interface DropImageReorderRequest {
  orderedImageIds: string[];
}


export interface ImageUpdateRequest {
  alt?: string;
  replaceFile?: File;
}

export interface ImageVariant {
  size: 'original' | 'xl' | 'md' | 'sm';
  format: 'original' | 'webp' | 'avif';
  url: string;
  width: number;
  height: number;
}

export interface ImageWithVariants extends Image {
  variants: ImageVariant[];
  publicUrl: string;
}

// Additional response types for API
export interface ImageUploadResponse {
  success: boolean;
  data: {
    images: Image[];
    errors?: Array<{ file: string; error: string }>;
  };
  message?: string;
}

export interface ImageListResponse {
  success: boolean;
  data: {
    images: Image[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

