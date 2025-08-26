'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, FileText } from 'lucide-react';

interface ContractFormProps {
  initialData?: {
    id?: string;
    contractTitle?: string;
    contractType?: string;
    counterparty?: string;
    startDate?: string;
    expirationDate?: string;
    content?: string;
  };
  onSave: (data: ContractFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export interface ContractFormData {
  contractTitle: string;
  contractType: string;
  counterparty: string;
  startDate: string;
  expirationDate: string;
  content: string;
}

const contractTypes = ['SERVICE', 'PURCHASE', 'SALES', 'PARTNERSHIP'];

export default function ContractForm({ 
  initialData, 
  onSave, 
  onCancel, 
  isEditing = false 
}: ContractFormProps) {
  const [formData, setFormData] = useState<ContractFormData>({
    contractTitle: initialData?.contractTitle || '',
    contractType: initialData?.contractType || 'SERVICE',
    counterparty: initialData?.counterparty || '',
    startDate: initialData?.startDate || '',
    expirationDate: initialData?.expirationDate || '',
    content: initialData?.content || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving contract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing ? 'Edit Contract' : 'Create New Contract'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Contract Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contractTitle">Contract Title *</Label>
                <Input
                  id="contractTitle"
                  value={formData.contractTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractTitle: e.target.value }))}
                  placeholder="Enter contract title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractType">Contract Type</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contractType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Counterparty Information */}
            <div className="space-y-2">
              <Label htmlFor="counterparty">Counterparty *</Label>
              <Input
                id="counterparty"
                value={formData.counterparty}
                onChange={(e) => setFormData(prev => ({ ...prev, counterparty: e.target.value }))}
                placeholder="Company or individual name"
                required
              />
            </div>

            {/* Date Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Contract Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Contract Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the main contract content, terms, and conditions..."
                rows={8}
                required
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Contract' : 'Create Contract'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
