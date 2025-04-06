
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Settings, LogOut } from 'lucide-react';
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

interface UserMenuProps {
  isLandingPage: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ isLandingPage }) => {
  const { user, logOut, auth } = useUser();
  
  // Auth links - only show on landing page
  if (isLandingPage) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center space-x-4">
          <Link 
            to="/signin" 
            className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
            aria-label="Sign in to your account"
          >
            Sign In
          </Link>
          <Link 
            to="/signup"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            aria-label="Create a new account"
          >
            Sign Up
          </Link>
        </div>
      </motion.div>
    );
  }

  // If authenticated, show user menu
  if (auth.isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <nav className="hidden md:block">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="User profile and options">
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
      </motion.div>
    );
  }
  
  // Default fallback, return an empty div to maintain layout
  return <div></div>;
};
