import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home, PieChart, List, Settings, User, Menu, LogOut, MessageSquare, ArrowLeft,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface HeaderProps {
  className?: string;
  showNavigation?: boolean;
}

const routeTitleMap: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/analytics': 'Analytics',
  '/process-sms': 'Process SMS',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

const Header = ({ className, showNavigation = true }: HeaderProps) => {
  const location = useLocation();
  const { user, logOut, auth } = useUser();

  const currentPageTitle = routeTitleMap[location.pathname] || 'Xpensia';
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';
  const shouldShowNavigation = showNavigation && !isAuthPage;

  const navItems = [
    { title: 'Dashboard', path: '/dashboard', icon: Home },
    { title: 'Analytics', path: '/analytics', icon: PieChart },
    { title: 'Transactions', path: '/transactions', icon: List },
    { title: 'Process SMS', path: '/process-sms', icon: MessageSquare },
    { title: 'Settings', path: '/settings', icon: Settings },
    { title: 'Profile', path: '/profile', icon: User },
  ];

  return (    <header className={cn(
      'sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border',
      className    )}>      <div className="max-w-7xl mx-auto px-[var(--page-padding-x)] py-[var(--component-padding-y)]">
        <div className="flex items-center justify-between">
          {/* Logo and Page Title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}            className="flex items-center space-x-2"
          >
            {location.pathname !== '/dashboard' && !isLandingPage && !isAuthPage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-semibold text-lg">X</span>
              </div>
            </Link>
            <span className="text-xl font-semibold tracking-tight">
              {currentPageTitle}
            </span>
          </motion.div>

          {/* Right Side Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center space-x-2"
          >
            {/* User Menu - Only show on desktop */}
            {auth.isAuthenticated && (
              <nav className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage src="/placeholder.svg" alt={user?.fullName || 'User'} />
                        <AvatarFallback>{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
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
              </nav>
            )}

            {/* Hamburger Menu */}
            {shouldShowNavigation && (
              <Sheet>                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
                    <Menu className="h-8 w-8" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader className="border-b pb-4 mb-4">
                    <SheetTitle className="flex items-center">
                      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mr-2">
                        <span className="text-white font-semibold text-lg">X</span>
                      </div>
                      <span>{currentPageTitle}</span>
                    </SheetTitle>
                  </SheetHeader>

                  <nav className="space-y-1">
                    {/*
                      { title: 'Dashboard', path: '/dashboard', icon: Home },
                      { title: 'Analytics', path: '/analytics', icon: PieChart },
                      { title: 'Transactions', path: '/transactions', icon: List },
                      { title: 'Process SMS', path: '/process-sms', icon: MessageSquare },
                      { title: 'Settings', path: '/settings', icon: Settings },
                      { title: 'Profile', path: '/profile', icon: User },
                    */}
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}                        className={cn(
                          'flex items-center px-[var(--component-padding-x)] py-[var(--component-padding-y)] rounded-md hover:bg-accent transition-colors',
                          location.pathname === item.path ? 'bg-primary/10 text-primary' : 'text-foreground'
                        )}
                      >
                        <item.icon size={20} className="mr-3" />
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </nav>

                  {auth.isAuthenticated && (
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
                </SheetContent>
              </Sheet>
            )}
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;
