import React, { useRef, useState, useCallback } from 'react';
import { Button } from '../ui/Button';
import { X, Upload, GripVertical, ZoomIn, Move, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ImagePickerProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  showPreview?: boolean;
  maxImages?: number;
  className?: string;
}

export function ImagePicker({ 
  value = [], 
  onChange, 
  multiple = true,
  showPreview = true,
  maxImages,
  className
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSelect = () => inputRef.current?.click();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const remainingSlots = maxImages ? maxImages - value.length : Infinity;
    if (remainingSlots <= 0) return;
    
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const urls: string[] = [...value];
    
    for (const file of filesToUpload) {
      const form = new FormData();
      form.append('file', file);
      try {
        const resp = await fetch((import.meta as any).env?.VITE_API_URL + '/api/admin/media/upload', {
          method: 'POST',
          headers: {
            Authorization: localStorage.getItem('nebula_access_token') ? `Bearer ${localStorage.getItem('nebula_access_token')}` : ''
          },
          body: form
        });
        const data = await resp.json();
        if (data?.success && data.data?.url) {
          urls.push(data.data.url);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
    onChange(urls);
  };

  const handleRemove = async (url: string) => {
    try {
      await fetch((import.meta as any).env?.VITE_API_URL + '/api/admin/media', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('nebula_access_token') ? `Bearer ${localStorage.getItem('nebula_access_token')}` : ''
        },
        body: JSON.stringify({ url })
      });
    } catch (error) {
      console.error('Error deleting image:', error);
    } finally {
      onChange(value.filter((v) => v !== url));
    }
  };

  // Drag & Drop for reordering
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    const newUrls = [...value];
    const [removed] = newUrls.splice(draggedIndex, 1);
    newUrls.splice(targetIndex, 0, removed);
    
    onChange(newUrls);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, value, onChange]);

  // Drag & Drop for file upload
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeaveArea = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDropArea = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const handleDragOverArea = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Image Grid */}
      {showPreview && value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {value.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                "relative group aspect-square rounded-lg overflow-hidden border-2 border-white/20 bg-gray-900/50 transition-all cursor-move",
                draggedIndex === index && "opacity-50 scale-95",
                dragOverIndex === index && "border-blue-500 scale-105 ring-2 ring-blue-500/50"
              )}
            >
              <img 
                src={url} 
                alt={`Image ${index + 1}`}
                className="object-cover w-full h-full"
                onClick={() => setZoomedImage(url)}
              />
              
              {/* Overlay with controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomedImage(url)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  title="Zoom"
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Drag handle */}
              <div className="absolute top-1 left-1 p-1 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3 text-white" />
              </div>

              {/* Image number badge */}
              <div className="absolute top-1 right-1 px-2 py-1 bg-black/60 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOverArea}
        onDragLeave={handleDragLeaveArea}
        onDrop={handleDropArea}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all",
          isDragging 
            ? "border-blue-500 bg-blue-500/10 scale-105" 
            : "border-white/20 hover:border-white/40 bg-white/5"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <Upload className={cn(
            "w-8 h-8 transition-colors",
            isDragging ? "text-blue-400" : "text-muted-foreground"
          )} />
          <div>
            <p className="text-sm font-medium mb-1">
              {isDragging ? "Bilder hier ablegen" : "Bilder per Drag & Drop hochladen"}
            </p>
            <p className="text-xs text-muted-foreground">
              oder klicken zum Auswählen
            </p>
            {maxImages && (
              <p className="text-xs text-muted-foreground mt-1">
                {value.length} / {maxImages} Bilder
              </p>
            )}
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleSelect}
            disabled={maxImages ? value.length >= maxImages : false}
          >
            <Upload className="w-4 h-4 mr-2" />
            {multiple ? "Bilder auswählen" : "Bild auswählen"}
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input 
        ref={inputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)} 
      />

      {/* Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh]">
            <img 
              src={zoomedImage} 
              alt="Zoomed"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
