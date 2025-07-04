import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, FolderOpen, Plus, Edit, Trash, ChevronDown, 
  ChevronUp, Save, X, PaintBucket, Settings, PlusCircle 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

import { 
  Category, CategoryMetadata, CategoryIcon 
} from '@/types/transaction';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage 
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define the form schema for category editing
const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  parentId: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  budget: z.number().optional(),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// Color options for categories
const colorOptions = [
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#D946EF', label: 'Pink' },
  { value: '#F97316', label: 'Orange' },
  { value: '#0EA5E9', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#64748B', label: 'Slate' },
];

// Icon options for categories
const iconOptions = [
  { value: 'home', label: 'Home' },
  { value: 'shopping-bag', label: 'Shopping' },
  { value: 'utensils', label: 'Food' },
  { value: 'car', label: 'Transport' },
  { value: 'heartbeat', label: 'Health' },
  { value: 'graduation-cap', label: 'Education' },
  { value: 'film', label: 'Entertainment' },
  { value: 'briefcase', label: 'Work' },
  { value: 'gift', label: 'Gifts' },
  { value: 'piggy-bank', label: 'Savings' },
];

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  categories, 
  onCategoriesChange 
}) => {
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [parentIdForNewCategory, setParentIdForNewCategory] = useState<string | undefined>(undefined);

  // Form setup
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      parentId: undefined,
      icon: undefined,
      color: '#8B5CF6', // Default color
      budget: undefined,
      description: '',
    }
  });

  // Reset form when editing category changes
  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        parentId: editingCategory.parentId,
        icon: editingCategory.metadata?.icon?.name,
        color: editingCategory.metadata?.color,
        budget: editingCategory.metadata?.budget,
        description: editingCategory.metadata?.description,
      });
    } else if (isAddingCategory) {
      form.reset({
        name: '',
        parentId: parentIdForNewCategory,
        icon: undefined,
        color: '#8B5CF6',
        budget: undefined,
        description: '',
      });
    }
  }, [editingCategory, isAddingCategory, parentIdForNewCategory, form]);

  // Toggle category expansion
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Start editing a category
  const startEditing = (category: Category) => {
    setEditingCategory(category);
    setIsAddingCategory(false);
  };

  // Start adding a new category
  const startAddingCategory = (parentId?: string) => {
    setIsAddingCategory(true);
    setEditingCategory(null);
    setParentIdForNewCategory(parentId);
  };

  // Cancel editing or adding
  const cancelEditing = () => {
    setEditingCategory(null);
    setIsAddingCategory(false);
  };

  // Save category changes
  const saveCategory = (values: CategoryFormValues) => {
    const now = new Date().toISOString();
    
    if (editingCategory) {
      // Update existing category
      const updatedCategories = updateCategoryInTree(categories, {
        ...editingCategory,
        name: values.name,
        parentId: values.parentId,
        metadata: {
          ...editingCategory.metadata,
          description: values.description,
          icon: values.icon ? { name: values.icon } : undefined,
          color: values.color,
          budget: values.budget,
          updatedAt: now,
        }
      });
      
      onCategoriesChange(updatedCategories);
      toast({
        title: "Category updated",
        description: `Category "${values.name}" has been updated.`,
      });
    } else if (isAddingCategory) {
      // Add new category
      const newCategory: Category = {
        id: uuidv4(),
        name: values.name,
        parentId: values.parentId,
        user: true,
        metadata: {
          description: values.description,
          icon: values.icon ? { name: values.icon } : undefined,
          color: values.color,
          budget: values.budget,
          isHidden: false,
          isSystem: false,
          createdAt: now,
          updatedAt: now,
        }
      };
      
      const updatedCategories = [...categories, newCategory];
      onCategoriesChange(updatedCategories);
      
      // Automatically expand parent category
      if (values.parentId) {
        setExpandedCategories(prev => ({
          ...prev,
          [values.parentId!]: true
        }));
      }
      
      toast({
        title: "Category created",
        description: `New category "${values.name}" has been created.`,
      });
    }
    
    setEditingCategory(null);
    setIsAddingCategory(false);
  };

  // Delete a category
  const deleteCategory = (categoryId: string) => {
    // Check if category has subcategories
    const hasSubcategories = categories.some(c => c.parentId === categoryId);
    
    if (hasSubcategories) {
      toast({
        title: "Cannot delete category",
        description: "This category has subcategories. Please delete or reassign them first.",
        variant: "destructive"
      });
      return;
    }
    
    const updatedCategories = categories.filter(c => c.id !== categoryId);
    onCategoriesChange(updatedCategories);
    
    toast({
      title: "Category deleted",
      description: "Category has been deleted successfully.",
    });
  };

  // Helper function to update a category in the tree
  const updateCategoryInTree = (categories: Category[], updatedCategory: Category): Category[] => {
    return categories.map(category => {
      if (category.id === updatedCategory.id) {
        return updatedCategory;
      }
      return category;
    });
  };

  // Build category tree from flat list
  const buildCategoryTree = (categories: Category[], parentId?: string): Category[] => {
    return categories
      .filter(category => category.parentId === parentId)
      .map(category => ({
        ...category,
        subcategories: buildCategoryTree(categories, category.id)
      }));
  };

  // Render a category item with its subcategories
  const renderCategoryItem = (category: Category, level = 0) => {
    const isExpanded = expandedCategories[category.id] || false;
    const hasSubcategories = categories.some(c => c.parentId === category.id);
    
    return (
      <div key={category.id} className="category-item">
        <div 
          className={`flex items-center p-2 rounded-md hover:bg-muted/50 ${
            level > 0 ? 'ml-6' : ''
          }`}
        >
          <div className="flex-1 flex items-center">
            {hasSubcategories && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1 mr-1" 
                onClick={() => toggleExpand(category.id)}
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </Button>
            )}
            
            <div 
              className="w-4 h-4 mr-2 rounded-full" 
              style={{ backgroundColor: category.metadata?.color || '#8B5CF6' }} 
            />
            
            {hasSubcategories ? (
              isExpanded ? <FolderOpen size={18} className="mr-2" /> : <Folder size={18} className="mr-2" />
            ) : null}
            
            <span className="font-medium">{category.name}</span>
            
            {category.metadata?.budget && (
              <span className="ml-2 text-sm text-muted-foreground">
                Budget: ${category.metadata.budget}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1"
              onClick={() => startAddingCategory(category.id)}
            >
              <Plus size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1"
              onClick={() => startEditing(category)}
            >
              <Edit size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              onClick={() => deleteCategory(category.id)}
            >
              <Trash size={16} />
            </Button>
          </div>
        </div>
        
        {/* Subcategories */}
        {isExpanded && hasSubcategories && (
          <div className="ml-6 border-l-2 border-muted pl-2 mt-1">
            {categories
              .filter(c => c.parentId === category.id)
              .map(subcategory => renderCategoryItem(subcategory, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get all root categories
  const rootCategories = categories.filter(c => !c.parentId);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Category Manager</CardTitle>
        <Button onClick={() => startAddingCategory()} size="sm">
          <Plus size={16} className="mr-1" /> Add Category
        </Button>
      </CardHeader>
      
      <CardContent>
        {/* Category Editor */}
        <AnimatePresence>
          {(editingCategory || isAddingCategory) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {editingCategory ? 'Edit Category' : 'New Category'}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(saveCategory)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Category name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="parentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="None (Root Category)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">None (Root Category)</SelectItem>
                                {categories.map(category => (
                                  <SelectItem 
                                    key={category.id} 
                                    value={category.id}
                                    // Prevent setting itself as parent
                                    disabled={editingCategory?.id === category.id}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                  >
                                    <div
                                      className="w-4 h-4 rounded-full mr-2"
                                      style={{ backgroundColor: field.value || '#8B5CF6' }}
                                    />
                                    <span>{
                                      colorOptions.find(c => c.value === field.value)?.label || 'Select color'
                                    }</span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-3">
                                  <div className="grid grid-cols-3 gap-2">
                                    {colorOptions.map(color => (
                                      <div
                                        key={color.value}
                                        className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                                          field.value === color.value ? 'border-black' : 'border-transparent'
                                        }`}
                                        style={{ backgroundColor: color.value }}
                                        onClick={() => form.setValue('color', color.value)}
                                      />
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="icon"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Icon</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select icon" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {iconOptions.map(icon => (
                                    <SelectItem key={icon.value} value={icon.value}>
                                      {icon.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget (optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? undefined : Number(e.target.value);
                                  form.setValue('budget', value as any);
                                }}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button variant="outline" type="button" onClick={cancelEditing}>
                          <X size={16} className="mr-1" /> Cancel
                        </Button>
                        <Button type="submit">
                          <Save size={16} className="mr-1" /> Save
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Categories List */}
        <div className="space-y-1 mt-4">
          {rootCategories.length > 0 ? (
            rootCategories.map(category => renderCategoryItem(category))
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-2">No categories found</div>
              <Button onClick={() => startAddingCategory()}>
                <PlusCircle size={16} className="mr-1" /> Create your first category
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryManager;
