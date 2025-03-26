
import React, { useState } from 'react';
import { 
  ChevronRight, 
  Camera, 
  Calendar, 
  User, 
  CreditCard, 
  PieChart, 
  List, 
  Settings,
  Plus,
  Filter,
  Download,
  Edit,
  Trash2
} from 'lucide-react';

// Wireframe Components 
const WireframeContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-gray-100 w-96 h-[640px] border-4 border-black rounded-2xl p-4 flex flex-col overflow-auto">
    {children}
  </div>
);

const WireframeHeader = ({ title, onBack }: { title: string, onBack?: () => void }) => (
  <div className="flex items-center bg-blue-600 text-white p-3 rounded-t-lg mb-4">
    {onBack && (
      <button onClick={onBack} className="mr-2">
        <ChevronRight className="transform rotate-180" size={24} />
      </button>
    )}
    <div className="flex-grow text-center font-bold">{title}</div>
  </div>
);

const WireframeButton = ({ 
  children, 
  variant = 'primary', 
  onClick 
}: { 
  children: React.ReactNode, 
  variant?: 'primary' | 'secondary', 
  onClick?: () => void 
}) => {
  const baseClasses = "py-2 px-4 rounded-lg text-center font-semibold transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-black hover:bg-gray-300"
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} w-full`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// Comprehensive Wireframe Screens
const OnboardingScreen = ({ onNext }: { onNext: () => void }) => {
  const [step, setStep] = useState(0);

  const screens = [
    {
      title: "Welcome",
      content: (
        <div className="text-center">
          <div className="bg-blue-100 h-48 flex items-center justify-center mb-4">
            <img src="/api/placeholder/200/200" alt="App Logo" className="w-48 h-48" />
          </div>
          <h2 className="text-xl font-bold mb-4">Expense Tracker</h2>
          <p className="text-gray-600 mb-4">Track your expenses effortlessly</p>
          <WireframeButton onClick={() => setStep(1)}>Get Started</WireframeButton>
        </div>
      )
    },
    {
      title: "Phone Verification",
      content: (
        <div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Enter Mobile Number</label>
            <input 
              type="tel" 
              placeholder="+1 (000) 000-0000" 
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <WireframeButton onClick={() => setStep(2)}>Send Verification Code</WireframeButton>
        </div>
      )
    },
    {
      title: "Profile Creation",
      content: (
        <div>
          <div className="flex justify-center mb-4">
            <div className="bg-gray-200 w-32 h-32 rounded-full flex items-center justify-center">
              <Camera className="text-gray-500" size={48} />
            </div>
          </div>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Full Name" 
              className="w-full p-2 border rounded-lg"
            />
            <div className="flex space-x-2">
              <button className="flex-1 py-2 border rounded-lg">Male</button>
              <button className="flex-1 py-2 border rounded-lg">Female</button>
            </div>
            <div className="flex items-center border rounded-lg p-2">
              <Calendar className="mr-2 text-gray-500" size={24} />
              <span>Select Birth Date</span>
            </div>
            <input 
              type="email" 
              placeholder="Email (Optional)" 
              className="w-full p-2 border rounded-lg"
            />
            <WireframeButton onClick={onNext}>Create Profile</WireframeButton>
          </div>
        </div>
      )
    }
  ];

  return (
    <WireframeContainer>
      <WireframeHeader title={screens[step].title} />
      {screens[step].content}
    </WireframeContainer>
  );
};

const SMSProviderScreen = ({ onNext }: { onNext: () => void }) => {
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);

  const providers = [
    { id: 1, name: "Bank ABC" },
    { id: 2, name: "Credit Card XYZ" },
    { id: 3, name: "Investment Corp" }
  ];

  const toggleProvider = (providerId: number) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  return (
    <WireframeContainer>
      <WireframeHeader title="Select SMS Providers" />
      <div className="space-y-2">
        <input 
          type="text" 
          placeholder="Search SMS Contacts" 
          className="w-full p-2 border rounded-lg mb-4"
        />
        {providers.map(provider => (
          <div 
            key={provider.id} 
            className={`p-3 border rounded-lg flex items-center justify-between ${
              selectedProviders.includes(provider.id) 
                ? 'bg-blue-100 border-blue-300' 
                : 'bg-white'
            }`}
            onClick={() => toggleProvider(provider.id)}
          >
            <span>{provider.name}</span>
            {selectedProviders.includes(provider.id) && (
              <ChevronRight className="text-blue-600" size={24} />
            )}
          </div>
        ))}
        <div className="mt-4 space-y-2">
          <label className="block text-gray-700">Select Start Date</label>
          <div className="flex items-center border rounded-lg p-2">
            <Calendar className="mr-2 text-gray-500" size={24} />
            <span>Choose Date (Up to 6 months)</span>
          </div>
        </div>
        <WireframeButton onClick={onNext}>Continue</WireframeButton>
      </div>
    </WireframeContainer>
  );
};

const DashboardScreen = ({ 
  onAddTransaction, 
  onReports 
}: { 
  onAddTransaction: () => void, 
  onReports: () => void 
}) => {
  return (
    <WireframeContainer>
      <WireframeHeader title="Dashboard" />
      <div className="space-y-4">
        <div className="bg-blue-600 text-white p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span>Total Balance</span>
            <span>USD</span>
          </div>
          <h2 className="text-2xl font-bold">$5,342.56</h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-100 p-3 rounded-lg text-center">
            <div className="flex justify-center mb-2">
              <CreditCard className="text-green-600" size={32} />
            </div>
            <span className="text-sm">Income</span>
            <div className="font-bold text-green-700">$7,500</div>
          </div>
          <div className="bg-red-100 p-3 rounded-lg text-center">
            <div className="flex justify-center mb-2">
              <List className="text-red-600" size={32} />
            </div>
            <span className="text-sm">Expenses</span>
            <div className="font-bold text-red-700">$2,157</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="font-bold">Recent Transactions</span>
            <PieChart className="text-blue-600" size={24} />
          </div>
          {[
            { name: "Grocery Shopping", amount: "-$150", color: "text-red-500" },
            { name: "Salary", amount: "+$5,000", color: "text-green-500" },
            { name: "Gas", amount: "-$75", color: "text-red-500" }
          ].map((transaction, index) => (
            <div 
              key={index} 
              className="flex justify-between py-2 border-b last:border-b-0"
            >
              <span>{transaction.name}</span>
              <span className={transaction.color}>{transaction.amount}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-around bg-gray-100 p-2 rounded-lg">
          <button onClick={onAddTransaction}>
            <Plus className="text-blue-600" size={32} />
          </button>
          <button onClick={onReports}>
            <PieChart className="text-blue-600" size={32} />
          </button>
          <CreditCard className="text-blue-600" size={32} />
          <Settings className="text-blue-600" size={32} />
        </div>
      </div>
    </WireframeContainer>
  );
};

const AddTransactionScreen = ({ onCancel }: { onCancel: () => void }) => {
  const [transactionType, setTransactionType] = useState('expense');
  const categories = {
    expense: ['Shopping', 'Car', 'Health', 'Education', 'Others'],
    income: ['Salary', 'Investment', 'Transfer'],
    transfer: ['Local Bank', 'International Bank']
  };

  return (
    <WireframeContainer>
      <WireframeHeader title="Add Transaction" onBack={onCancel} />
      <div className="space-y-4">
        <div className="flex space-x-2">
          {['expense', 'income', 'transfer'].map(type => (
            <button
              key={type}
              className={`flex-1 py-2 rounded-lg ${
                transactionType === type 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-black'
              }`}
              onClick={() => setTransactionType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input 
            type="number" 
            placeholder="Amount" 
            className="w-full p-2 border rounded-lg"
          />
          <select className="w-full p-2 border rounded-lg">
            <option>Select Currency</option>
            <option>USD</option>
            <option>SAR</option>
            <option>EGP</option>
          </select>
          <select className="w-full p-2 border rounded-lg">
            <option>Select Category</option>
            {categories[transactionType as keyof typeof categories].map(category => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <select className="w-full p-2 border rounded-lg">
            <option>Select Person (Optional)</option>
            <option>Ahmed</option>
            <option>Marwa</option>
            <option>Youssef</option>
          </select>
          <input 
            type="text" 
            placeholder="Description (Optional)" 
            className="w-full p-2 border rounded-lg"
          />
          <WireframeButton>Save Transaction</WireframeButton>
        </div>
      </div>
    </WireframeContainer>
  );
};

const ReportsScreen = () => {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <WireframeContainer>
      <WireframeHeader title="Reports" />
      <div className="space-y-4">
        <div className="flex space-x-2 mb-4">
          {['Summary', 'Detailed', 'Trends'].map(tab => (
            <button
              key={tab.toLowerCase()}
              className={`flex-1 py-2 rounded-lg ${
                activeTab === tab.toLowerCase()
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-black'
              }`}
              onClick={() => setActiveTab(tab.toLowerCase())}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <Filter className="text-blue-600" size={24} />
            <span>Filters</span>
          </div>
          <button>
            <Download className="text-blue-600" size={24} />
          </button>
        </div>

        <div className="bg-white p-3 rounded-lg">
          {activeTab === 'summary' && (
            <div>
              <div className="flex justify-between mb-2">
                <span>Total Income</span>
                <span className="text-green-600">$7,500</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Total Expenses</span>
                <span className="text-red-600">$2,157</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Net Balance</span>
                <span>$5,343</span>
              </div>
            </div>
          )}
          {activeTab === 'detailed' && (
            <div>
              {[
                { date: "01 Mar", category: "Grocery", amount: "-$150" },
                { date: "15 Mar", category: "Salary", amount: "+$5,000" },
                { date: "20 Mar", category: "Gas", amount: "-$75" }
              ].map((transaction, index) => (
                <div 
                  key={index} 
                  className="flex justify-between py-2 border-b last:border-b-0"
                >
                  <span>{transaction.date}</span>
                  <span>{transaction.category}</span>
                  <span className={transaction.amount.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                    {transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'trends' && (
            <div className="bg-gray-100 h-48 flex items-center justify-center">
              <span>Trend Chart Placeholder</span>
            </div>
          )}
        </div>
      </div>
    </WireframeContainer>
  );
};

const SettingsScreen = () => {
  return (
    <WireframeContainer>
      <WireframeHeader title="Settings" />
      <div className="space-y-4">
        <div className="bg-white rounded-lg">
          <div className="p-3 border-b flex justify-between items-center">
            <span>Profile</span>
            <Edit className="text-blue-600" size={24} />
          </div>
          <div className="p-3 border-b flex justify-between items-center">
            <span>SMS Providers</span>
            <ChevronRight className="text-gray-500" size={24} />
          </div>
          <div className="p-3 border-b flex justify-between items-center">
            <span>Currency Preferences</span>
            <ChevronRight className="text-gray-500" size={24} />
          </div>
          <div className="p-3 flex justify-between items-center">
            <span className="text-red-600">Delete Account</span>
            <Trash2 className="text-red-600" size={24} />
          </div>
        </div>
      </div>
    </WireframeContainer>
  );
};

// Main Wireframe Component
const ExpenseTrackerWireframes = () => {
  const [currentScreen, setCurrentScreen] = useState('onboarding');

  const screens: {[key: string]: JSX.Element} = {
    onboarding: <OnboardingScreen onNext={() => setCurrentScreen('smsProvider')} />,
    smsProvider: <SMSProviderScreen onNext={() => setCurrentScreen('dashboard')} />,
    dashboard: (
      <DashboardScreen 
        onAddTransaction={() => setCurrentScreen('addTransaction')}
        onReports={() => setCurrentScreen('reports')}
      />
    ),
    addTransaction: <AddTransactionScreen onCancel={() => setCurrentScreen('dashboard')} />,
    reports: <ReportsScreen />,
    settings: <SettingsScreen />
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Expense Tracker Wireframes</h1>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {Object.keys(screens).map(screen => (
          <button 
            key={screen}
            onClick={() => setCurrentScreen(screen)}
            className={`px-4 py-2 rounded ${
              currentScreen === screen 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200'
            }`}
          >
            {screen.charAt(0).toUpperCase() + screen.slice(1)}
          </button>
        ))}
      </div>
      {screens[currentScreen]}
    </div>
  );
};

export default ExpenseTrackerWireframes;
