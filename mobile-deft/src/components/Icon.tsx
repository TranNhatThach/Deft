/**
 * Icon — Lucide React Native wrapper with name-based lookup.
 * Maps string icon names to lucide-react-native components.
 */
import React from 'react';
import {
  AlertTriangle, AlignLeft, ArrowDownRight, ArrowLeft, ArrowRight,
  ArrowUpRight, Bell, Calendar, Car, Check, ChevronRight, Coffee,
  CreditCard, Eye, EyeOff, Film, Filter, Fingerprint, FolderOpen,
  Gift, Headphones, Home, Landmark, List, Lock, LogOut, Mail, Moon,
  Pencil, Plus, RotateCcw, Search, Settings, ShieldCheck, ShoppingBag,
  Tag, Trash2, TrendingUp, Upload, User, Utensils, Wallet, X, Zap,
  Download, Target, ArrowRightLeft,
} from 'lucide-react-native';
import type { ViewStyle } from 'react-native';

// ─── Icon Registry ───────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  alertTriangle: AlertTriangle, alignLeft: AlignLeft,
  arrowDownRight: ArrowDownRight, arrowLeft: ArrowLeft,
  arrowRight: ArrowRight, arrowUpRight: ArrowUpRight,
  arrowRightLeft: ArrowRightLeft, bell: Bell, calendar: Calendar,
  car: Car, check: Check, chevronRight: ChevronRight, coffee: Coffee,
  creditCard: CreditCard, download: Download, eye: Eye, eyeOff: EyeOff,
  film: Film, filter: Filter, fingerprint: Fingerprint,
  folderOpen: FolderOpen, gift: Gift, headphones: Headphones,
  home: Home, landmark: Landmark, list: List, lock: Lock,
  logOut: LogOut, mail: Mail, moon: Moon, pencil: Pencil, plus: Plus,
  rotateCcw: RotateCcw, search: Search, settings: Settings,
  shieldCheck: ShieldCheck, 'shopping-bag': ShoppingBag,
  shoppingBag: ShoppingBag, tag: Tag, target: Target,
  trash2: Trash2, trendingUp: TrendingUp, upload: Upload,
  user: User, utensils: Utensils, wallet: Wallet, x: X, zap: Zap,
};

// ─── Props ───────────────────────────────────────────────
interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// ─── Component ───────────────────────────────────────────
export const Icon: React.FC<IconProps> = ({ name, size = 20, color = '#1E2233', style }) => {
  const Component = ICON_MAP[name] || Tag;
  return <Component size={size} color={color} style={style} />;
};
