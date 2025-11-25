import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Settings, Plus, Trash2, Save, Play, Pause } from 'lucide-react';
import { OrderStatus } from './OrderStatusBadge';

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
}

export interface AutomationCondition {
  field: 'status' | 'paymentStatus' | 'totalAmount' | 'customerId' | 'createdAt';
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains';
  value: string | number;
}

export interface AutomationAction {
  type: 'updateStatus' | 'sendEmail' | 'addNote' | 'assignTo';
  params: Record<string, any>;
}

interface OrderAutomationProps {
  className?: string;
}

const statusOptions: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export function OrderAutomation({ className }: OrderAutomationProps) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actions, setActions] = useState<AutomationAction[]>([]);

  const handleSaveRule = () => {
    if (!ruleName.trim()) return;

    const newRule: AutomationRule = {
      id: editingRule?.id || `rule-${Date.now()}`,
      name: ruleName,
      enabled: editingRule?.enabled ?? true,
      conditions,
      actions,
      createdAt: editingRule?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingRule) {
      setRules(rules.map(r => r.id === editingRule.id ? newRule : r));
    } else {
      setRules([...rules, newRule]);
    }

    // Reset form
    setRuleName('');
    setConditions([]);
    setActions([]);
    setEditingRule(null);
    setIsDialogOpen(false);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId));
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const addCondition = () => {
    setConditions([...conditions, {
      field: 'status',
      operator: 'equals',
      value: '',
    }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<AutomationCondition>) => {
    setConditions(conditions.map((c, i) => i === index ? { ...c, ...updates } : c));
  };

  const addAction = () => {
    setActions([...actions, {
      type: 'updateStatus',
      params: {},
    }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, updates: Partial<AutomationAction>) => {
    setActions(actions.map((a, i) => i === index ? { ...a, ...updates } : a));
  };

  return (
    <div className={className}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Order Automation</h2>
            <p className="text-muted text-sm mt-1">
              Automate order processing with rules and workflows
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRule(null);
                setRuleName('');
                setConditions([]);
                setActions([]);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Automation Rule'}</DialogTitle>
                <DialogDescription>
                  Define conditions and actions to automate order processing
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rule Name</label>
                  <Input
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="e.g., Auto-process paid orders"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Conditions</label>
                    <Button variant="outline" size="sm" onClick={addCondition}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Condition
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {conditions.map((condition, index) => (
                      <div key={index} className="flex gap-2 items-end p-3 border border-white/10 rounded">
                        <Select
                          value={condition.field}
                          onValueChange={(value) => updateCondition(index, { field: value as any })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="paymentStatus">Payment Status</SelectItem>
                            <SelectItem value="totalAmount">Total Amount</SelectItem>
                            <SelectItem value="customerId">Customer ID</SelectItem>
                            <SelectItem value="createdAt">Created Date</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => updateCondition(index, { operator: value as any })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="notEquals">Not Equals</SelectItem>
                            <SelectItem value="greaterThan">Greater Than</SelectItem>
                            <SelectItem value="lessThan">Less Than</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                          placeholder="Value"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCondition(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Actions</label>
                    <Button variant="outline" size="sm" onClick={addAction}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Action
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {actions.map((action, index) => (
                      <div key={index} className="flex gap-2 items-end p-3 border border-white/10 rounded">
                        <Select
                          value={action.type}
                          onValueChange={(value) => updateAction(index, { type: value as any })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="updateStatus">Update Status</SelectItem>
                            <SelectItem value="sendEmail">Send Email</SelectItem>
                            <SelectItem value="addNote">Add Note</SelectItem>
                            <SelectItem value="assignTo">Assign To</SelectItem>
                          </SelectContent>
                        </Select>
                        {action.type === 'updateStatus' && (
                          <Select
                            value={action.params.status || ''}
                            onValueChange={(value) => updateAction(index, { 
                              params: { ...action.params, status: value } 
                            })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map(status => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {action.type === 'addNote' && (
                          <Input
                            value={action.params.note || ''}
                            onChange={(e) => updateAction(index, {
                              params: { ...action.params, note: e.target.value }
                            })}
                            placeholder="Note content"
                            className="flex-1"
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAction(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRule} disabled={!ruleName.trim() || conditions.length === 0 || actions.length === 0}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No automation rules yet</p>
              <p className="text-sm mt-2">Create your first rule to get started</p>
            </div>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{rule.name}</h3>
                      <Badge variant={rule.enabled ? 'success' : 'secondary'}>
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted space-y-1">
                      <p>Conditions: {rule.conditions.length}</p>
                      <p>Actions: {rule.actions.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleRule(rule.id)}
                    >
                      {rule.enabled ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Enable
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingRule(rule);
                        setRuleName(rule.name);
                        setConditions(rule.conditions);
                        setActions(rule.actions);
                        setIsDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

