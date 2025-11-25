import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './Dialog';
import { Button } from './Button';
import { Badge } from './Badge';
import {
  Download,
  FileSpreadsheet,
  FileText,
  File,
  CheckCircle,
  Calendar
} from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  filename?: string;
}

type ExportFormat = 'csv' | 'excel' | 'pdf';

const formats = [
  { value: 'csv', label: 'CSV', icon: FileText, description: 'Comma-separated values' },
  { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel format' },
  { value: 'pdf', label: 'PDF', icon: File, description: 'Portable Document Format' },
] as const;

export function ExportDialog({ open, onClose, title, data, filename }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In real implementation, trigger download here
    const exportFilename = filename || `export-${Date.now()}`;
    console.log(`Exporting ${data.length} items to ${selectedFormat} as ${exportFilename}`);
    
    setIsExporting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Download className="w-6 h-6 text-blue-400" />
            Export {title}
          </DialogTitle>
          <DialogDescription>
            Export {data.length} item{data.length !== 1 ? 's' : ''} in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium text-white mb-3 block">
              Select Export Format
            </label>
            <div className="grid gap-3">
              {formats.map((format) => {
                const Icon = format.icon;
                const isSelected = selectedFormat === format.value;
                
                return (
                  <motion.button
                    key={format.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedFormat(format.value as ExportFormat)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-white/10 bg-gray-800/30 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-blue-500/20' : 'bg-gray-800/50'
                        }`}>
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                            {format.label}
                          </p>
                          <p className="text-sm text-muted-foreground">{format.description}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg bg-gray-800/50 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span>Export Preview</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-white">
                <span className="text-muted-foreground">Filename:</span> {filename || 'export'}.{selectedFormat}
              </p>
              <p className="text-white">
                <span className="text-muted-foreground">Items:</span> {data.length}
              </p>
              <p className="text-white">
                <span className="text-muted-foreground">Date:</span> {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isExporting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <Download className="w-4 h-4" />
                </motion.div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

