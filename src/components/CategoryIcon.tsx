import React from 'react';
import {
  Utensils,
  ShoppingCart,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Coffee,
  ShoppingBag,
  Plane,
  Gift,
  PiggyBank,
  Sparkles,
  Banknote,
  Trophy,
  Briefcase,
  TrendingUp,
  Coins,
  ArrowRightLeft,
  CreditCard,
  Wallet,
  Landmark,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { CATEGORY_MAP } from '../constants';

interface CategoryIconProps {
  catKey: string;
  size?: number;
  className?: string;
  showBg?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  catKey,
  size = 20,
  className = '',
  showBg = true,
}) => {
  const cat = CATEGORY_MAP[catKey];

  const getIcon = () => {
    switch (catKey) {
      case 'an_uong':
        return <Utensils size={size} />;
      case 'cho_sieu_thi':
        return <ShoppingCart size={size} />;
      case 'di_lai':
        return <Car size={size} />;
      case 'nha_o':
        return <Home size={size} />;
      case 'suc_khoe':
        return <HeartPulse size={size} />;
      case 'giao_duc':
        return <GraduationCap size={size} />;
      case 'cafe':
        return <Coffee size={size} />;
      case 'mua_sam':
        return <ShoppingBag size={size} />;
      case 'giai_tri':
        return <Plane size={size} />;
      case 'hieu_hi':
        return <Gift size={size} />;
      case 'tiet_kiem':
        return <PiggyBank size={size} />;
      case 'luong':
        return <Banknote size={size} />;
      case 'thuong':
        return <Trophy size={size} />;
      case 'thu_phu':
        return <Briefcase size={size} />;
      case 'loi_dau_tu':
        return <TrendingUp size={size} />;
      case 'thu_khac':
        return <Coins size={size} />;
      case 'transfer':
      case 'chuyen_tien':
        return <ArrowRightLeft size={size} />;
      case 'credit_payment':
        return <CreditCard size={size} />;
      default:
        return <Sparkles size={size} />;
    }
  };

  const color = cat?.color || '#EC4899';
  const bgColor = cat?.bgColor || '#FCE7F3';

  if (!showBg) {
    return <span style={{ color }} className={className}>{getIcon()}</span>;
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl p-2.5 transition-transform hover:scale-105 ${className}`}
      style={{
        backgroundColor: bgColor,
        color: color,
      }}
    >
      {getIcon()}
    </div>
  );
};
