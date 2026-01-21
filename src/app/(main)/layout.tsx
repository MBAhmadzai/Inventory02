
'use client';
import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import SidebarNav from '@/app/components/sidebar-nav';
import FirebaseStatus from '@/app/components/firebase-status';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, CircuitBoard, ScanLine, Smartphone, HardDrive } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { ProductForm } from '@/app/components/product-form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { PlusCircle } from 'lucide-react';
import { pageTitles, pageDescriptions } from '@/lib/page-info';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import type { IdentifierType } from '@/lib/definitions';
import { Card } from '@/components/ui/card';

function Logo() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="flex h-12 items-center justify-center overflow-hidden transition-all duration-300">
      <div className="flex items-center gap-2">
        <CircuitBoard className="h-6 w-6" />
        {!isCollapsed && <span className="font-semibold">East Coast</span>}
      </div>
    </div>
  );
}

function UserNav() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
    } catch (error: any) {
        console.error('Sign-out error:', error);
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: error.message || 'There was a problem signing out.',
        });
    }
  };

  if (!user) {
    return null;
  }

  const userInitial = user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const AddProductSelector = ({ onSelect }: { onSelect: (type: IdentifierType) => void }) => (
    <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-md">
            <Card
                className="flex flex-col items-center justify-center p-6 text-center hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                onClick={() => onSelect('imei')}
            >
                <Smartphone className="h-12 w-12 mb-4" />
                <h3 className="font-semibold text-lg">Product with IMEI</h3>
                <p className="text-sm text-muted-foreground">For phones, tablets, etc.</p>
            </Card>
            <Card
                className="flex flex-col items-center justify-center p-6 text-center hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                onClick={() => onSelect('barcode')}
            >
                <ScanLine className="h-12 w-12 mb-4" />
                <h3 className="font-semibold text-lg">Product with Barcode</h3>
                <p className="text-sm text-muted-foreground">For accessories, parts, etc.</p>
            </Card>
        </div>
    </div>
);


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [idType, setIdType] = useState<IdentifierType | null>(null);
  const { user, loading } = useAuth();
  
  React.useEffect(() => {
    if (!isSheetOpen) {
      const timer = setTimeout(() => {
          setIdType(null);
      }, 300); // Delay to allow sheet closing animation to finish
      return () => clearTimeout(timer);
    }
  }, [isSheetOpen]);

  const showAddProductButton = ['/products', '/products/for-sale', '/products/demo'].includes(pathname) && user?.role === 'superadmin';
  
  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-2">
                <HardDrive className="h-8 w-8 animate-spin" />
                <p className="text-muted-foreground">Loading Application...</p>
            </div>
        </div>
    );
  }

  if (!user) {
    // This should be handled by the useAuth hook's redirect, but as a fallback.
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="icon"
        className="border-r"
        variant="sidebar"
        side="left"
      >
        <SidebarHeader className="flex h-16 items-center justify-center border-b px-4">
          <Logo />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="md:hidden">
                <h1 className="text-xl font-semibold tracking-tight">
                    {pageTitles[pathname] || 'Dashboard'}
                </h1>
            </div>
          </div>
          <div className="hidden md:block">
            <h1 className="text-2xl font-semibold tracking-tight">
                {pageTitles[pathname] || 'Dashboard'}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
                {pageDescriptions[pathname] || 'Welcome back.'}
            </p>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
            {showAddProductButton && (
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button>
                  <PlusCircle className="md:mr-2" /> <span className="hidden md:inline">Add Product</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full max-w-full overflow-y-auto sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>
                    {idType ? 'Add a New Product' : 'Select Product Type'}
                  </SheetTitle>
                  <SheetDescription>
                    {idType ? 'Fill in the details below to add a new product to the inventory.' : 'Does this product have an IMEI or a Barcode?'}
                  </SheetDescription>
                </SheetHeader>
                {idType ? (
                  <ProductForm idType={idType} setSheetOpen={setSheetOpen} />
                ) : (
                  <AddProductSelector onSelect={setIdType} />
                )}
              </SheetContent>
            </Sheet>
            )}
            <FirebaseStatus />
            <Button variant="ghost" size="icon">
              <Bell />
              <span className="sr-only">Notifications</span>
            </Button>
            <UserNav />
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
