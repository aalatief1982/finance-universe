/**
 * @file CategorySettings.tsx
 * @description Settings section for CategorySettings.
 *
 * @module components/settings/CategorySettings
 *
 * @responsibilities
 * 1. Render settings controls and labels
 * 2. Persist setting changes via callbacks/services
 * 3. Provide validation or feedback where required
 *
 * @review-tags
 * - @ui: settings state wiring
 *
 * @review-checklist
 * - [ ] Settings state reflects stored preferences
 * - [ ] Changes are persisted or bubbled up
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PaintBucket, FolderTree, Settings, MessageSquare, ArrowRight, Plus } from 'lucide-react';
import CategoryManager from '@/components/categories/CategoryManager';
import CategoryHierarchy from '@/components/categories/CategoryHierarchy';
import { Category, CategoryRule } from '@/types/transaction';
import { transactionService } from '@/services/TransactionService';
import { categorySuggestionService } from '@/services/CategorySuggestionService';

const CategorySettings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('manage');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [ruleSuggestions, setRuleSuggestions] = useState<{ 
    pattern: string;
    matchCount: number;
    suggestedCategoryId: string;
    confidence: number;
  }[]>([]);

  // Load categories and rules
  useEffect(() => {
    loadCategories();
    loadCategoryRules();
  }, []);

  // Load categories from service
  const loadCategories = () => {
    const cats = transactionService.getCategories();
    setCategories(cats);
  };

  // Load category rules from service
  const loadCategoryRules = () => {
    const rules = transactionService.getCategoryRules();
    setCategoryRules(rules);
  };

  // Handle category changes
  const handleCategoriesChange = (updatedCategories: Category[]) => {
    transactionService.saveCategories(updatedCategories);
    setCategories(updatedCategories);
    
    toast({
      title: "Categories updated",
      description: "Your category changes have been saved.",
    });
  };

  // Apply rules to all transactions
  const applyRulesToAll = () => {
    const changedCount = transactionService.applyAllCategoryRules();
    
    toast({
      title: "Rules applied",
      description: `${changedCount} transaction${changedCount !== 1 ? 's' : ''} ${changedCount !== 1 ? 'have' : 'has'} been recategorized.`,
    });
  };

  // Generate rule suggestions
  const generateSuggestions = () => {
    const suggestions = categorySuggestionService.generateRuleSuggestions();
    setRuleSuggestions(suggestions);
    
    if (suggestions.length === 0) {
      toast({
        title: "No suggestions found",
        description: "We couldn't generate any rule suggestions based on your transaction data.",
      });
    } else {
      toast({
        title: "Suggestions generated",
        description: `Found ${suggestions.length} potential rules to improve your categorization.`,
      });
    }
  };

  // Apply rule suggestions
  const applySuggestions = (minConfidence: number = 80) => {
    const appliedCount = categorySuggestionService.applyRuleSuggestions(minConfidence);
    
    if (appliedCount > 0) {
      toast({
        title: "Suggestions applied",
        description: `Created ${appliedCount} new categorization rules from suggestions.`,
      });
      
      // Refresh rules
      loadCategoryRules();
      // Clear suggestions
      setRuleSuggestions([]);
    } else {
      toast({
        title: "No suggestions applied",
        description: "No suggestions met the minimum confidence threshold.",
      });
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    return transactionService.getCategoryPath(categoryId).join(' > ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Category Settings</h2>
          <p className="text-muted-foreground">
            Manage categories, set up rules, and customize your categorization system.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            <span className="hidden sm:inline">Manage Categories</span>
            <span className="sm:hidden">Manage</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Categorization Rules</span>
            <span className="sm:hidden">Rules</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Rule Suggestions</span>
            <span className="sm:hidden">Suggest</span>
          </TabsTrigger>
        </TabsList>

        {/* Categories Management Tab */}
        <TabsContent value="manage" className="mt-6">
          <CategoryManager 
            categories={categories}
            onCategoriesChange={handleCategoriesChange}
          />
        </TabsContent>

        {/* Categorization Rules Tab */}
        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Categorization Rules</CardTitle>
              <Button size="sm" onClick={applyRulesToAll}>
                Apply Rules to All Transactions
              </Button>
            </CardHeader>
            <CardContent>
              {categoryRules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No categorization rules have been created yet.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Rules automatically assign categories to transactions based on patterns in their title or description.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('suggestions')}>
                    Generate Rule Suggestions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {categoryRules.map((rule) => (
                      <Card key={rule.id} className="p-[var(--card-padding)]">
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{rule.pattern}</h3>
                              <p className="text-sm text-muted-foreground">
                                {rule.description || `Matches transactions containing "${rule.pattern}"`}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" className="h-8">
                              Edit
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Assigns to:</span>
                            <span className="px-2 py-1 bg-primary/10 rounded-md text-xs">
                              {getCategoryName(rule.categoryId)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Match type:</span>
                            <span>{rule.isRegex ? 'Regular expression' : 'Simple text match'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Priority:</span>
                            <span>{rule.priority} {rule.priority > 75 ? '(High)' : rule.priority > 50 ? '(Medium)' : '(Low)'}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rule Suggestions Tab */}
        <TabsContent value="suggestions" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Rule Suggestions</CardTitle>
              <div className="space-x-2">
                <Button variant="outline" onClick={generateSuggestions}>
                  Generate Suggestions
                </Button>
                {ruleSuggestions.length > 0 && (
                  <Button onClick={() => applySuggestions(80)}>
                    Apply High Confidence Rules
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!ruleSuggestions.length ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Generate rule suggestions based on your transaction history.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    We&apos;ll analyze your transactions and suggest rules to automatically categorize similar transactions in the future.
                  </p>
                  <Button onClick={generateSuggestions}>
                    Generate Suggestions
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {ruleSuggestions.map((suggestion, index) => (
                      <Card key={index} className="p-[var(--card-padding)]">
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">Pattern: &quot;{suggestion.pattern}&quot;</h3>
                              <p className="text-sm text-muted-foreground">
                                Would match {suggestion.matchCount} transactions
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span className={`px-2 py-1 rounded-md text-xs ${
                                suggestion.confidence >= 80 ? 'bg-success/10 text-success' :
                                suggestion.confidence >= 60 ? 'bg-warning/10 text-warning' :
                                'bg-destructive/10 text-destructive'
                              }`}>
                                {suggestion.confidence}% confidence
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Suggested category:</span>
                            <span className="px-2 py-1 bg-primary/10 rounded-md text-xs">
                              {getCategoryName(suggestion.suggestedCategoryId)}
                            </span>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const newRule: Omit<CategoryRule, 'id'> = {
                                  pattern: suggestion.pattern,
                                  categoryId: suggestion.suggestedCategoryId,
                                  isRegex: false,
                                  priority: 50,
                                  description: `Auto-generated rule from suggestion`
                                };
                                
                                transactionService.addCategoryRule(newRule);
                                toast({
                                  title: "Rule created",
                                  description: `New rule for "${suggestion.pattern}" has been created.`,
                                });
                                
                                // Remove this suggestion
                                setRuleSuggestions(prev => 
                                  prev.filter((_, i) => i !== index)
                                );
                                
                                // Refresh rules
                                loadCategoryRules();
                              }}
                            >
                              Apply This Rule
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default CategorySettings;
