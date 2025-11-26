import { useState, useMemo, memo } from 'react';
import { FileText, Plus, Trash2, Edit2, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../ui/Toast';
import type { TicketCategory, TicketPriority } from '@nebula/shared/types';
import { cn } from '../../utils/cn';

export interface TicketTemplate {
  id: string;
  name: string;
  subject: string;
  summary: string;
  category: TicketCategory;
  priority: TicketPriority;
  tags: string[];
  message: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'ticket-templates';

interface TicketTemplatesProps {
  onSelectTemplate?: (template: TicketTemplate) => void;
  mode?: 'select' | 'manage';
}

export const TicketTemplates = memo(function TicketTemplates({
  onSelectTemplate,
  mode = 'select',
}: TicketTemplatesProps) {
  const [templates, setTemplates] = useLocalStorage<TicketTemplate[]>(STORAGE_KEY, []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null);
  const toast = useToast();

  const [formData, setFormData] = useState<Omit<TicketTemplate, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    subject: '',
    summary: '',
    category: 'other',
    priority: 'medium',
    tags: [],
    message: '',
  });

  const categoryOptions: TicketCategory[] = [
    'order',
    'product',
    'shipping',
    'payment',
    'account',
    'other',
    'support',
    'bug',
    'feature',
    'billing',
    'technical',
  ];

  const priorityOptions: TicketPriority[] = ['low', 'medium', 'high', 'critical'];

  const handleSaveTemplate = () => {
    if (!formData.name.trim() || !formData.subject.trim()) {
      toast.error('Required fields', 'Please fill in name and subject');
      return;
    }

    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id
            ? {
                ...t,
                ...formData,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );
      toast.success('Template updated', 'Template has been updated');
    } else {
      const newTemplate: TicketTemplate = {
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTemplates((prev) => [...prev, newTemplate]);
      toast.success('Template saved', 'Template has been saved');
    }

    setFormData({
      name: '',
      subject: '',
      summary: '',
      category: 'other',
      priority: 'medium',
      tags: [],
      message: '',
    });
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  const handleEditTemplate = (template: TicketTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      summary: template.summary,
      category: template.category,
      priority: template.priority,
      tags: template.tags,
      message: template.message,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success('Template deleted', 'Template has been removed');
  };

  const handleSelectTemplate = (template: TicketTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
      toast.success('Template selected', 'Template has been applied');
    }
  };

  const handleDuplicateTemplate = (template: TicketTemplate) => {
    const duplicated: TicketTemplate = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTemplates((prev) => [...prev, duplicated]);
    toast.success('Template duplicated', 'Template has been duplicated');
  };

  if (mode === 'manage') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Ticket Templates</h2>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted" />
              <p className="text-muted">No templates yet. Create your first template!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">{template.subject}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{template.category}</Badge>
                      <Badge variant="outline">{template.priority}</Badge>
                    </div>
                    {template.summary && (
                      <p className="text-sm text-muted line-clamp-2">{template.summary}</p>
                    )}
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Template Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Order Issue Template"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Subject *</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ticket subject"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Summary</label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Brief summary of the issue"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value as TicketCategory })
                    }
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value as TicketPriority })
                    }
                  >
                    {priorityOptions.map((prio) => (
                      <option key={prio} value={prio}>
                        {prio}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags (comma-separated)</label>
                <Input
                  value={formData.tags.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Message Template</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Message template (supports variables like {{customerName}})"
                  rows={6}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  {editingTemplate ? 'Update' : 'Save'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Select mode - show templates in a grid for selection
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Template</h3>
        <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted" />
            <p className="text-sm text-muted">No templates available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={cn(
                'cursor-pointer hover:shadow-md transition-all',
                'hover:border-accent/50'
              )}
              onClick={() => handleSelectTemplate(template)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription className="text-xs">{template.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {template.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Same dialog for creating templates */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form as above */}
            <div>
              <label className="text-sm font-medium mb-2 block">Template Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Order Issue Template"
              />
            </div>
            {/* ... rest of form ... */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
