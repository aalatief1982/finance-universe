
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { Category } from '@/types/transaction';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import CategoryPill from '@/components/CategoryPill';

interface CategoryHierarchyProps {
  categories: Category[];
  selectedCategoryId?: string;
  onSelectCategory?: (categoryId: string) => void;
  showBudgets?: boolean;
  collapsible?: boolean;
  maxHeight?: string | number;
}

/**
 * CategoryHierarchy component displays categories in a hierarchical tree structure
 * allowing for navigation and selection
 */
const CategoryHierarchy: React.FC<CategoryHierarchyProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  showBudgets = false,
  collapsible = true,
  maxHeight,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const handleToggleExpand = (categoryId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCategoryClick = (categoryId: string) => {
    if (onSelectCategory) {
      onSelectCategory(categoryId);
    }
  };

  // Build the hierarchy structure (categories with their subcategories)
  const buildCategoryHierarchy = (categories: Category[], parentId?: string): Category[] => {
    return categories
      .filter(category => category.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(category => ({
        ...category,
        subcategories: buildCategoryHierarchy(categories, category.id)
      }));
  };

  // Get the hierarchical structure
  const categoryHierarchy = buildCategoryHierarchy(categories);

  // Render each category item recursively
  const renderCategoryItem = (category: Category, depth = 0) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories[category.id] || false;
    const isSelected = category.id === selectedCategoryId;
    
    return (
      <div key={category.id} className="category-item">
        <div 
          className={cn(
            "flex items-center py-1.5 px-2 rounded-md transition-colors",
            isSelected ? "bg-primary/10" : "hover:bg-muted/50",
            "cursor-pointer"
          )}
          onClick={() => handleCategoryClick(category.id)}
          style={{ paddingLeft: `${(depth * 12) + 8}px` }}
        >
          {hasSubcategories && collapsible ? (
            <Button 
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 mr-1"
              onClick={(e) => handleToggleExpand(category.id, e)}
            >
              {isExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          ) : (
            <div className="w-7" /> // Spacer to align items without expand button
          )}
          
          {hasSubcategories ? (
            isExpanded ? 
              <FolderOpen className="h-4 w-4 mr-2 text-muted-foreground" /> : 
              <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
          ) : (
            <div className="w-6" /> // Spacer for leaf nodes
          )}
          
          <div className="flex items-center flex-1">
            <div
              className="h-3 w-3 rounded-full mr-2"
              style={{ backgroundColor: category.metadata?.color || '#8B5CF6' }}
            />
            <span className={cn(
              "text-sm",
              isSelected ? "font-medium" : "font-normal"
            )}>
              {category.name}
            </span>
          </div>
          
          {showBudgets && category.metadata?.budget && (
            <span className="text-xs text-muted-foreground ml-auto">
              ${category.metadata.budget.toLocaleString()}
            </span>
          )}
        </div>
        
        {hasSubcategories && isExpanded && (
          <div className="subcategories">
            {category.subcategories?.map(subcat => 
              renderCategoryItem(subcat, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Alternative accordion view for mobile/responsive design
  const renderAccordionView = () => {
    const renderAccordionCategory = (category: Category) => {
      const hasSubcategories = category.subcategories && category.subcategories.length > 0;
      
      return (
        <AccordionItem key={category.id} value={category.id}>
          {hasSubcategories ? (
            <>
              <AccordionTrigger className="hover:no-underline py-2">
                <div className="flex items-center">
                  <div
                    className="h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: category.metadata?.color || '#8B5CF6' }}
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 space-y-1">
                  {category.subcategories?.map(subcat => (
                    <div 
                      key={subcat.id} 
                      className={cn(
                        "flex items-center py-1.5 px-2 rounded-md transition-colors",
                        subcat.id === selectedCategoryId ? "bg-primary/10" : "hover:bg-muted/50",
                        "cursor-pointer"
                      )}
                      onClick={() => handleCategoryClick(subcat.id)}
                    >
                      <div
                        className="h-3 w-3 rounded-full mr-2"
                        style={{ backgroundColor: subcat.metadata?.color || '#8B5CF6' }}
                      />
                      <span className="text-sm">{subcat.name}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </>
          ) : (
            <div 
              className={cn(
                "flex items-center py-1.5 px-2 rounded-md transition-colors",
                category.id === selectedCategoryId ? "bg-primary/10" : "hover:bg-muted/50",
                "cursor-pointer"
              )}
              onClick={() => handleCategoryClick(category.id)}
            >
              <div
                className="h-3 w-3 rounded-full mr-2"
                style={{ backgroundColor: category.metadata?.color || '#8B5CF6' }}
              />
              <span className="text-sm">{category.name}</span>
            </div>
          )}
        </AccordionItem>
      );
    };
    
    return (
      <Accordion type="multiple" className="w-full">
        {categoryHierarchy.map(renderAccordionCategory)}
      </Accordion>
    );
  };

  // Render category pills for a compact horizontal view
  const renderCategoryPills = () => {
    // Flatten all categories for a simple pill display
    const allCategories = categories.sort((a, b) => a.name.localeCompare(b.name));
    
    return (
      <div className="flex flex-wrap gap-2">
        {allCategories.map(category => (
          <CategoryPill
            key={category.id}
            category={category.name}
            onClick={() => handleCategoryClick(category.id)}
            active={category.id === selectedCategoryId}
          />
        ))}
      </div>
    );
  };

  // Wrap content in ScrollArea if maxHeight is specified
  const content = (
    <div className="category-hierarchy">
      {collapsible ? (
        // Tree view with expandable nodes
        <div className="space-y-0.5">
          {categoryHierarchy.map(category => renderCategoryItem(category))}
        </div>
      ) : (
        // Simple category pills when not collapsible
        renderCategoryPills()
      )}
    </div>
  );

  return maxHeight ? (
    <ScrollArea className="w-full" style={{ height: maxHeight }}>
      <div className="pr-4">{content}</div>
    </ScrollArea>
  ) : content;
};

export default CategoryHierarchy;
