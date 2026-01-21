
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Boxes,
    Store,
    ShoppingCart,
    Undo,
    Wrench,
    CheckCircle,
    Cog,
    BadgePercent,
    Presentation
} from 'lucide-react';
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupLabel
} from '@/components/ui/sidebar';

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const productNav = [
  { href: '/products', label: 'All Products', icon: Boxes },
  { href: '/products/for-sale', label: 'For Sale', icon: Store },
  { href: '/products/used', label: 'Used', icon: BadgePercent },
  { href: '/products/sold', label: 'Sold', icon: ShoppingCart },
  { href: '/products/returns', label: 'Returns', icon: Undo },
  { href: '/products/repairs', label: 'In Repair', icon: Wrench },
  { href: '/products/fixed', label: 'Fixed', icon: CheckCircle },
  { href: '/products/parts-used', label: 'Parts Used', icon: Cog },
  { href: '/products/demo', label: 'Demo', icon: Presentation },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4">
        <SidebarMenu>
        {mainNav.map((item) => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        ))}
        </SidebarMenu>
        
        <SidebarGroup>
            <SidebarGroupLabel>Inventory</SidebarGroupLabel>
            <SidebarMenu>
                 {productNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                            <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    </div>
  );
}
