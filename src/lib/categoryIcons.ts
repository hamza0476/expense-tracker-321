import {
  ShoppingCart, ShoppingBag, GraduationCap, Car, UtensilsCrossed, Lightbulb,
  Film, Heart, Home, Shield, Gift, Package, Briefcase, Tag, TrendingUp, Wallet,
  Coffee, Pizza, Beer, Plane, Bus, Train, Bike, Fuel, Music, Gamepad2, Dumbbell,
  Stethoscope, Pill, Baby, PawPrint, Wrench, Phone, Wifi, Tv, BookOpen, Laptop,
  CreditCard, DollarSign, PiggyBank, Banknote, Receipt, Building2, TreePine,
  Sparkles, Camera, Shirt, Scissors, Sun, Moon, Star, Flame, Droplet, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type IconGroup = "Finance" | "Food" | "Transport" | "Shopping" | "Home" | "Lifestyle" | "Health" | "General";

export interface IconEntry {
  name: string;
  Icon: LucideIcon;
  group: IconGroup;
  keywords?: string[];
}

export const ICON_LIBRARY: IconEntry[] = [
  // Finance
  { name: "wallet", Icon: Wallet, group: "Finance", keywords: ["money", "cash"] },
  { name: "credit-card", Icon: CreditCard, group: "Finance", keywords: ["card", "payment"] },
  { name: "dollar", Icon: DollarSign, group: "Finance", keywords: ["money", "salary"] },
  { name: "banknote", Icon: Banknote, group: "Finance", keywords: ["cash", "money"] },
  { name: "piggy-bank", Icon: PiggyBank, group: "Finance", keywords: ["savings"] },
  { name: "trending-up", Icon: TrendingUp, group: "Finance", keywords: ["invest", "growth"] },
  { name: "briefcase", Icon: Briefcase, group: "Finance", keywords: ["work", "salary"] },
  { name: "receipt", Icon: Receipt, group: "Finance", keywords: ["bill", "invoice"] },
  { name: "tag", Icon: Tag, group: "Finance", keywords: ["sale", "price"] },

  // Food
  { name: "utensils", Icon: UtensilsCrossed, group: "Food", keywords: ["dining", "restaurant"] },
  { name: "coffee", Icon: Coffee, group: "Food", keywords: ["drink", "cafe"] },
  { name: "pizza", Icon: Pizza, group: "Food", keywords: ["fast food"] },
  { name: "beer", Icon: Beer, group: "Food", keywords: ["drink", "alcohol"] },
  { name: "cart", Icon: ShoppingCart, group: "Food", keywords: ["groceries", "supermarket"] },

  // Transport
  { name: "car", Icon: Car, group: "Transport", keywords: ["vehicle", "drive"] },
  { name: "bus", Icon: Bus, group: "Transport" },
  { name: "train", Icon: Train, group: "Transport" },
  { name: "plane", Icon: Plane, group: "Transport", keywords: ["flight", "travel"] },
  { name: "bike", Icon: Bike, group: "Transport" },
  { name: "fuel", Icon: Fuel, group: "Transport", keywords: ["gas", "petrol"] },

  // Shopping
  { name: "shopping-bag", Icon: ShoppingBag, group: "Shopping" },
  { name: "shirt", Icon: Shirt, group: "Shopping", keywords: ["clothes"] },
  { name: "gift", Icon: Gift, group: "Shopping" },
  { name: "package", Icon: Package, group: "Shopping" },

  // Home
  { name: "home", Icon: Home, group: "Home", keywords: ["rent", "house"] },
  { name: "lightbulb", Icon: Lightbulb, group: "Home", keywords: ["utilities", "electric"] },
  { name: "wifi", Icon: Wifi, group: "Home", keywords: ["internet"] },
  { name: "phone", Icon: Phone, group: "Home" },
  { name: "tv", Icon: Tv, group: "Home" },
  { name: "wrench", Icon: Wrench, group: "Home", keywords: ["repair", "maintenance"] },
  { name: "building", Icon: Building2, group: "Home" },
  { name: "droplet", Icon: Droplet, group: "Home", keywords: ["water"] },
  { name: "zap", Icon: Zap, group: "Home", keywords: ["electric", "power"] },
  { name: "flame", Icon: Flame, group: "Home", keywords: ["gas", "heat"] },

  // Lifestyle
  { name: "film", Icon: Film, group: "Lifestyle", keywords: ["movie", "entertainment"] },
  { name: "music", Icon: Music, group: "Lifestyle" },
  { name: "gamepad", Icon: Gamepad2, group: "Lifestyle", keywords: ["games"] },
  { name: "dumbbell", Icon: Dumbbell, group: "Lifestyle", keywords: ["gym", "fitness"] },
  { name: "camera", Icon: Camera, group: "Lifestyle" },
  { name: "scissors", Icon: Scissors, group: "Lifestyle", keywords: ["haircut", "salon"] },
  { name: "sparkles", Icon: Sparkles, group: "Lifestyle", keywords: ["beauty"] },
  { name: "book", Icon: BookOpen, group: "Lifestyle", keywords: ["reading"] },
  { name: "laptop", Icon: Laptop, group: "Lifestyle", keywords: ["tech"] },

  // Health
  { name: "heart", Icon: Heart, group: "Health" },
  { name: "stethoscope", Icon: Stethoscope, group: "Health", keywords: ["doctor"] },
  { name: "pill", Icon: Pill, group: "Health", keywords: ["medicine", "pharmacy"] },
  { name: "shield", Icon: Shield, group: "Health", keywords: ["insurance"] },
  { name: "baby", Icon: Baby, group: "Health" },
  { name: "paw", Icon: PawPrint, group: "Health", keywords: ["pet"] },

  // General
  { name: "graduation-cap", Icon: GraduationCap, group: "General", keywords: ["education", "school"] },
  { name: "sun", Icon: Sun, group: "General" },
  { name: "moon", Icon: Moon, group: "General" },
  { name: "star", Icon: Star, group: "General", keywords: ["favorite"] },
  { name: "tree", Icon: TreePine, group: "General", keywords: ["nature"] },
];

export const ICON_GROUPS: IconGroup[] = ["Finance", "Food", "Transport", "Shopping", "Home", "Lifestyle", "Health", "General"];

export const ICON_COLORS = [
  "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#EC4899", "#EF4444",
  "#F97316", "#F59E0B", "#EAB308", "#84CC16", "#22C55E", "#10B981",
  "#14B8A6", "#06B6D4", "#0EA5E9", "#64748B",
];

// Sensible defaults per built-in category
export const DEFAULT_CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  Groceries: { icon: "cart", color: "#22C55E" },
  Shopping: { icon: "shopping-bag", color: "#EC4899" },
  Education: { icon: "graduation-cap", color: "#6366F1" },
  Transport: { icon: "car", color: "#0EA5E9" },
  Dining: { icon: "utensils", color: "#F97316" },
  Utilities: { icon: "lightbulb", color: "#F59E0B" },
  Entertainment: { icon: "film", color: "#A855F7" },
  Health: { icon: "heart", color: "#EF4444" },
  Rent: { icon: "home", color: "#3B82F6" },
  Insurance: { icon: "shield", color: "#14B8A6" },
  Gifts: { icon: "gift", color: "#EC4899" },
  Other: { icon: "package", color: "#64748B" },
  Salary: { icon: "briefcase", color: "#10B981" },
  Selling: { icon: "tag", color: "#84CC16" },
  Business: { icon: "trending-up", color: "#22C55E" },
};

const STORAGE_KEY = "category-icon-overrides:v1";
const EVENT = "category-icons:updated";

type Overrides = Record<string, { icon: string; color: string }>;

const readOverrides = (): Overrides => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
};

const writeOverrides = (o: Overrides) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* noop */
  }
};

export const getCategoryIconConfig = (category: string): { icon: string; color: string } => {
  const overrides = readOverrides();
  return (
    overrides[category] ||
    DEFAULT_CATEGORY_ICONS[category] || { icon: "package", color: "#64748B" }
  );
};

export const setCategoryIconConfig = (
  category: string,
  config: { icon: string; color: string }
) => {
  const overrides = readOverrides();
  overrides[category] = config;
  writeOverrides(overrides);
};

export const resetCategoryIconConfig = (category: string) => {
  const overrides = readOverrides();
  delete overrides[category];
  writeOverrides(overrides);
};

export const getIconByName = (name: string): LucideIcon => {
  const found = ICON_LIBRARY.find((i) => i.name === name);
  return found?.Icon || Package;
};

export const CATEGORY_ICONS_EVENT = EVENT;
