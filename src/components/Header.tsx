
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, PieChart, List, Settings, User, Menu, X, LogOut } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

interface HeaderProps {
  className?: string;
}

const Header = ({ className }: HeaderProps) => {
  const location = useLocation();
  const { user, logOut } = useUser();
  
  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';
  
  // Don't show full header with navigation on sign in/sign up pages
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';
  
  if (isAuthPage) {
    return (
      <header className={cn(
        "sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border",
        className
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">E</span>
                </div>
                <span className="text-xl font-semibold tracking-tight">Expense Tracker</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>
    );
  }
  
  // Navigation items - only show non-auth pages if not on landing page
  const navItems = !isLandingPage ? [
    { title: 'Dashboard', path: '/dashboard', icon: Home },
    { title: 'Analytics', path: '/analytics', icon: PieChart },
    { title: 'Transactions', path: '/transactions', icon: List },
    { title: 'Settings', path: '/settings', icon: Settings },
    { title: 'Profile', path: '/profile', icon: User },
  ] : [];

  // Mobile navigation items
  const mobileNavItems = [
    { title: 'Dashboard', path: '/dashboard', icon: Home, description: 'Overview of your finances' },
    { title: 'Analytics', path: '/analytics', icon: PieChart, description: 'Detailed reports and charts' },
    { title: 'Transactions', path: '/transactions', icon: List, description: 'View and manage your transactions' },
    { title: 'Settings', path: '/settings', icon: Settings, description: 'Configure app preferences' },
    { title: 'Profile', path: '/profile', icon: User, description: 'Manage your profile' },
  ];
  
  // Auth links - only show on landing page
  const authLinks = isLandingPage ? (
    <div className="flex items-center space-x-4">
      <Link 
        to="/signin" 
        className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
      >
        Sign In
      </Link>
      <Link 
        to="/signup"
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Sign Up
      </Link>
    </div>
  ) : (
    <nav className="hidden md:block">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" alt={user?.fullName || 'User'} />
                    <AvatarFallback>
                      {user?.fullName ? user.fullName.charAt(0) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || user?.phone || 'No contact info'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500 cursor-pointer"
                  onClick={logOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );

  return (
    <header className={cn(
      "sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">E</span>
                </div>
                <span className="text-xl font-semibold tracking-tight">Expense Tracker</span>
              </Link>
            </motion.div>
            
            {navItems.length > 0 && (
              <motion.nav
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="hidden md:block ml-8"
              >
                <ul className="flex items-center space-x-1">
                  {navItems.map((item) => (
                    <li key={item.title}>
                      <Link 
                        to={item.path} 
                        className={cn(
                          "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          location.pathname === item.path 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        title={item.title}
                      >
                        <item.icon size={18} className="mr-2" />
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.nav>
            )}
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center"
          >
            {authLinks}
            
            {/* Mobile Navigation */}
            {!isLandingPage && !isAuthPage && (
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu size={20} />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                    <SheetHeader className="border-b pb-4 mb-4">
                      <SheetTitle className="flex items-center">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mr-2">
                          <span className="text-white font-semibold text-lg">E</span>
                        </div>
                        <span>Expense Tracker</span>
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
                        {mobileNavItems.map((item) => (
                          <SheetClose asChild key={item.title}>
                            <Link 
                              to={item.path} 
                              className={cn(
                                "flex items-center px-4 py-3 rounded-md hover:bg-accent transition-colors",
                                location.pathname === item.path 
                                  ? "bg-primary/10 text-primary" 
                                  : "text-foreground"
                              )}
                            >
                              <item.icon size={20} className="mr-3" />
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              </div>
                            </Link>
                          </SheetClose>
                        ))}
                      </nav>
                      
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
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;
