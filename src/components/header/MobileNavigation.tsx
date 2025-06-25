import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Menu, Home, PieChart, List, MessageSquare, Settings, User, Upload, BrainCircuit } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { getNavItems } from './route-constants';

// Map of icon names to their components
const iconMap = {
  'Home': Home,
  'PieChart': PieChart,
  'List': List,
  'MessageSquare': MessageSquare,
  'Settings': Settings,
  'User': User,
  'Upload': Upload,
  'BrainCircuit': BrainCircuit
};

interface MobileNavigationProps {
  currentPageTitle: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentPageTitle }) => {
  const location = useLocation();
  const { user, logOut } = useUser();
  const navItems = getNavItems();
  
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open navigation menu">
            <Menu size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-primary overflow-hidden flex items-center justify-center mr-2">
                <img 
                  src="/xpensia-logo.png" 
                  alt="Xpensia Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span>{currentPageTitle}</span>
            </SheetTitle>
          </SheetHeader>
          
          <div className="py-2">
            {user && (
              <div className="flex items-center space-x-3 p-4 mb-4 bg-muted/50 rounded-lg">
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt={user.fullName || 'User'} />
                  <AvatarFallback>
                    {user.fullName ? user.fullName.charAt(0) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.fullName || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user.email || user.phone || 'No contact info'}</p>
                </div>
              </div>
            )}
            
            <nav className="space-y-1">
              {navItems.map((item) => {
                // Get the icon component from our icon map
                const IconComponent = iconMap[item.icon as keyof typeof iconMap];
                
                return (
                  <SheetClose asChild key={item.title}>
                    <Link 
                      to={item.path} 
                      className={cn(
                        "flex items-center px-4 py-3 rounded-md hover:bg-accent transition-colors",
                        location.pathname === item.path 
                          ? "bg-primary/10 text-primary" 
                          : "text-foreground"
                      )}
                      aria-current={location.pathname === item.path ? "page" : undefined}
                    >
                      {IconComponent && <IconComponent size={20} className="mr-3" />}
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
            
            {user && (
              <div className="mt-8 pt-4 border-t">
                <Button 
                  variant="destructive" 
                  className="w-full justify-start" 
                  onClick={logOut}
                >
                  <LogOut size={18} className="mr-2" />
                  Log out
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
