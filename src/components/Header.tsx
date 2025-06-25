import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home, PieChart, List, Settings, User, Menu, LogOut, MessageSquare,
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
  SheetTrigger, SheetClose,
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
  '/process-sms': 'Import SMS',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

const Header = ({ className, showNavigation = true }: HeaderProps) => {
  const location = useLocation();
  const { user, logOut, auth } = useUser();

  const currentPageTitle = routeTitleMap[location.pathname] || 'Xpensia';
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/onboarding';

  const shouldShowNavigation = showNavigation && !isAuthPage;

  const navItems = [
    { title: 'Dashboard', path: '/dashboard', icon: Home, description: 'Overview of your finances' },
    { title: 'Analytics', path: '/analytics', icon: PieChart, description: 'Detailed reports and charts' },
    { title: 'Transactions', path: '/transactions', icon: List, description: 'View and manage your transactions' },
    { title: 'Import SMS', path: '/process-sms', icon: MessageSquare, description: 'Import transactions from SMS' },
    { title: 'Settings', path: '/settings', icon: Settings, description: 'Configure app preferences' },
    { title: 'Profile', path: '/profile', icon: User, description: 'Manage your profile' },
  ];

  return (
    <header className={cn(
      'sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border',
      className
    )}>
      <div className="max-w-7xl mx-auto px-[var(--page-padding-x)] py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">X</span>
                </div>
                <span className="text-xl font-semibold tracking-tight">{isLandingPage ? 'Xpensia' : currentPageTitle}</span>
              </Link>
            </motion.div>

            {shouldShowNavigation && (
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
                          'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          location.pathname === item.path
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                        title={item.title}
                        aria-current={location.pathname === item.path ? 'page' : undefined}
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
            {auth.isAuthenticated && (
              <nav className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="User profile and options">
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

            {/* Mobile Nav */}
            {shouldShowNavigation && (
              <div className="md:hidden ml-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                      <Menu size={24} />
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
                        {navItems.map((item) => (
                          <SheetClose asChild key={item.title}>
                            <Link
                              to={item.path}
                              className={cn(
                                'flex items-center px-4 py-3 rounded-md hover:bg-accent transition-colors',
                                location.pathname === item.path
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-foreground'
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
