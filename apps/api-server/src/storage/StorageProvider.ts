export interface StorageProvider {
  upload(params: { 
    space: 'shop' | 'drops'; 
    file: Buffer; 
    mime: string; 
    preferredName?: string 
  }): Promise<{ fileKey: string }>;
  
  delete(fileKey: string): Promise<void>;
  
  getPublicUrl(fileKey: string): string;
}

export interface ImageVariants {
  original: Buffer;
  xl: Buffer;
  md: Buffer;
  sm: Buffer;
  webp: Buffer;
  avif?: Buffer;
}

export interface ImageMetadata {
  width: number;
  height: number;
  sizeBytes: number;
  mime: string;
  dominantColor?: string;
}




