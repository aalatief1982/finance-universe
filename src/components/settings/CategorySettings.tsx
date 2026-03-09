/**
 * @file CategorySettings.tsx
 * @description Settings section for CategorySettings.
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
import { categorySuggestionService, CategorySuggestion } from '@/services/CategorySuggestionService';
import { useLanguage } from '@/i18n/LanguageContext';

interface CategorySettingsProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

const CategorySettings: React.FC<CategorySettingsProps> = ({ categories, onCategoriesChange }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('manage');
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [ruleSuggestions, setRuleSuggestions] = useState<CategorySuggestion[]>([]);

  const loadCategoryRules = () => {
    const rules = transactionService.getCategoryRules();
    setCategoryRules(rules);
  };

  useEffect(() => {
    loadCategoryRules();
  }, []);

  const handleCategoriesChange = (updatedCategories: Category[]) => {
    onCategoriesChange(updatedCategories);
  };

  const applyRulesToAll = () => {
    const changedCount = transactionService.applyCategorizationRules();
    toast({
      title: t('toast.rulesApplied'),
      description: t('toast.rulesAppliedDesc').replace('{count}', String(changedCount)),
    });
  };

  const generateSuggestions = () => {
    const suggestions = categorySuggestionService.generateRuleSuggestions();
    setRuleSuggestions(suggestions);
    
    if (suggestions.length === 0) {
      toast({
        title: t('toast.noSuggestionsFound'),
        description: t('toast.noSuggestionsFoundDesc'),
      });
    } else {
      toast({
        title: t('toast.suggestionsGenerated'),
        description: t('toast.suggestionsGeneratedDesc').replace('{count}', String(suggestions.length)),
      });
    }
  };

  const applySuggestions = (minConfidence: number = 80) => {
    const appliedCount = categorySuggestionService.applyRuleSuggestions(minConfidence);
    
    if (appliedCount > 0) {
      toast({
        title: t('toast.suggestionsApplied'),
        description: t('toast.suggestionsAppliedDesc').replace('{count}', String(appliedCount)),
      });
      loadCategoryRules();
      setRuleSuggestions([]);
    } else {
      toast({
        title: t('toast.noSuggestionsApplied'),
        description: t('toast.noSuggestionsAppliedDesc'),
      });
    }
  };

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
          <h2 className="text-2xl font-bold tracking-tight">{t('catSettings.title')}</h2>
          <p className="text-muted-foreground">{t('catSettings.subtitle')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            <span className="hidden sm:inline">{t('catSettings.manageCategories')}</span>
            <span className="sm:hidden">{t('catSettings.manage')}</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t('catSettings.categorizationRules')}</span>
            <span className="sm:hidden">{t('catSettings.rules')}</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">{t('catSettings.ruleSuggestions')}</span>
            <span className="sm:hidden">{t('catSettings.suggest')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="mt-6">
          <CategoryManager 
            categories={categories}
            onCategoriesChange={handleCategoriesChange}
          />
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">{t('catSettings.categorizationRules')}</CardTitle>
              <Button size="sm" onClick={applyRulesToAll}>
                {t('catSettings.applyRulesToAll')}
              </Button>
            </CardHeader>
            <CardContent>
              {categoryRules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">{t('catSettings.noRulesYet')}</p>
                  <p className="text-sm text-muted-foreground mb-4">{t('catSettings.rulesDesc')}</p>
                  <Button variant="outline" onClick={() => setActiveTab('suggestions')}>
                    {t('catSettings.generateRuleSuggestions')}
                    <ArrowRight className="ltr:ml-2 rtl:mr-2 h-4 w-4" />
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
                                {rule.description || t('catSettings.matchesContaining').replace('{pattern}', rule.pattern)}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" className="h-8">
                              {t('catSettings.edit')}
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{t('catSettings.assignsTo')}</span>
                            <span className="px-2 py-1 bg-primary/10 rounded-md text-xs">
                              {getCategoryName(rule.categoryId)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{t('catSettings.matchType')}</span>
                            <span>{rule.isRegex ? t('catSettings.regex') : t('catSettings.simpleMatch')}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{t('catSettings.priority')}</span>
                            <span>{rule.priority} {rule.priority > 75 ? t('catSettings.high') : rule.priority > 50 ? t('catSettings.medium') : t('catSettings.low')}</span>
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

        <TabsContent value="suggestions" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">{t('catSettings.ruleSuggestions')}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={generateSuggestions}>
                  {t('catSettings.generateSuggestions')}
                </Button>
                {ruleSuggestions.length > 0 && (
                  <Button onClick={() => applySuggestions(80)}>
                    {t('catSettings.applyHighConfidence')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!ruleSuggestions.length ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">{t('catSettings.generateSuggestionsDesc')}</p>
                  <p className="text-sm text-muted-foreground mb-6">{t('catSettings.analyzeSuggestionsDesc')}</p>
                  <Button onClick={generateSuggestions}>
                    {t('catSettings.generateSuggestions')}
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
                              <h3 className="font-medium">{t('catSettings.pattern')} "{suggestion.pattern}"</h3>
                              <p className="text-sm text-muted-foreground">
                                {t('catSettings.wouldMatch').replace('{count}', String(suggestion.matchCount))}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span className={`px-2 py-1 rounded-md text-xs ${
                                suggestion.confidence >= 80 ? 'bg-success/10 text-success' :
                                suggestion.confidence >= 60 ? 'bg-warning/10 text-warning' :
                                'bg-destructive/10 text-destructive'
                              }`}>
                                {t('catSettings.confidence').replace('{percent}', String(suggestion.confidence))}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{t('catSettings.suggestedCategory')}</span>
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
                                  description: t('catSettings.autoGenerated')
                                };
                                
                                transactionService.addCategoryRule(newRule);
                                toast({
                                  title: t('toast.ruleCreated'),
                                  description: t('toast.ruleCreatedDesc').replace('{pattern}', suggestion.pattern),
                                });
                                
                                setRuleSuggestions(prev => 
                                  prev.filter((_, i) => i !== index)
                                );
                                loadCategoryRules();
                              }}
                            >
                              {t('catSettings.applyThisRule')}
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
