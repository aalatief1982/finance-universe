
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import WireframeButton from '../../WireframeButton';
import { Check } from 'lucide-react';

interface SmsProviderSelectionScreenProps {
  onComplete: (selectedProviders: string[]) => void;
  availableProviders?: string[];
}

const schema = z.object({
  providers: z.array(z.string()).min(1, 'Please select at least one SMS provider')
});

type FormValues = z.infer<typeof schema>;

const SmsProviderSelectionScreen: React.FC<SmsProviderSelectionScreenProps> = ({
  onComplete,
  availableProviders = ['Bank ABC', 'Credit Card XYZ', 'Investment Corp', 'National Bank', 'City Credit Union']
}) => {
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  
  const { handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      providers: []
    }
  });

  const toggleProvider = (provider: string) => {
    setSelectedProviders(prev => 
      prev.includes(provider)
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  const onSubmit = () => {
    onComplete(selectedProviders);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold mb-2">Select SMS Providers</h2>
        <p className="text-gray-600 text-sm">
          We'll scan messages from these providers to automatically track your expenses.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3">
          {availableProviders.map(provider => (
            <div 
              key={provider}
              onClick={() => toggleProvider(provider)}
              className={`p-4 border rounded-lg flex items-center justify-between cursor-pointer transition ${
                selectedProviders.includes(provider) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              <span>{provider}</span>
              {selectedProviders.includes(provider) && (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {errors.providers && (
          <p className="text-red-500 text-sm">{errors.providers.message}</p>
        )}

        <WireframeButton type="submit" variant="primary" className="w-full">
          Continue
        </WireframeButton>
      </form>
    </div>
  );
};

export default SmsProviderSelectionScreen;
