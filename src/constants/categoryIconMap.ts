import {
  Receipt,
  GraduationCap,
  Gamepad2,
  Utensils,
  Gift,
  HeartPulse,
  Home,
  Baby,
  Bath,
  ConciergeBell,
  ShoppingBag,
  ArrowLeftRight,
  Car,
  Plane,
  Lightbulb,
  CircleDollarSign,
  Package,
  LucideIcon,
} from 'lucide-react';

export interface CategoryIconInfo {
  icon: LucideIcon;
  color: string;
  background: string;
}

export const CATEGORY_ICON_MAP: Record<string, CategoryIconInfo> = {
  Bills: { icon: Receipt, color: 'text-orange-600', background: 'bg-orange-100' },
  Education: { icon: GraduationCap, color: 'text-indigo-600', background: 'bg-indigo-100' },
  Entertainment: { icon: Gamepad2, color: 'text-purple-600', background: 'bg-purple-100' },
  Food: { icon: Utensils, color: 'text-amber-600', background: 'bg-amber-100' },
  'Gifts & Donations': { icon: Gift, color: 'text-pink-600', background: 'bg-pink-100' },
  Health: { icon: HeartPulse, color: 'text-red-600', background: 'bg-red-100' },
  Housing: { icon: Home, color: 'text-green-600', background: 'bg-green-100' },
  Kids: { icon: Baby, color: 'text-teal-600', background: 'bg-teal-100' },
  'Personal Care': { icon: Bath, color: 'text-fuchsia-600', background: 'bg-fuchsia-100' },
  Services: { icon: ConciergeBell, color: 'text-yellow-600', background: 'bg-yellow-100' },
  Shopping: { icon: ShoppingBag, color: 'text-rose-600', background: 'bg-rose-100' },
  Transfer: { icon: ArrowLeftRight, color: 'text-emerald-600', background: 'bg-emerald-100' },
  Transportation: { icon: Car, color: 'text-blue-600', background: 'bg-blue-100' },
  Travel: { icon: Plane, color: 'text-cyan-600', background: 'bg-cyan-100' },
  Utilities: { icon: Lightbulb, color: 'text-gray-600', background: 'bg-gray-100' },
  Income: { icon: CircleDollarSign, color: 'text-lime-600', background: 'bg-lime-100' },
  Other: { icon: Package, color: 'text-zinc-600', background: 'bg-zinc-100' },
};
