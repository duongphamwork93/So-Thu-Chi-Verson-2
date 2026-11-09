import React, { useState } from 'react';
import { X, Sparkles, Check, Heart, Palette, User, Smile } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, PastelThemeKey } from '../types';
import { AVATAR_OPTIONS, PASTEL_THEMES } from '../constants';

interface PersonalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
}

export const PersonalizeModal: React.FC<PersonalizeModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [name, setName] = useState(profile.name || 'Bé Yêu');
  const [avatar, setAvatar] = useState(profile.avatar || 'bunny');
  const [pastelTheme, setPastelTheme] = useState<PastelThemeKey>(
    profile.pastelTheme || 'sakura'
  );
  const [customGreeting, setCustomGreeting] = useState(
    profile.customGreeting || 'Chào buổi sáng, nàng thơ tài chính ✨'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...profile,
      name,
      avatar,
      pastelTheme,
      customGreeting,
    });
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  const currentThemeObj =
    PASTEL_THEMES.find((t) => t.id === pastelTheme) || PASTEL_THEMES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-[#231c35] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100/80 pb-3 dark:border-purple-900/40">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-pink-600 dark:bg-purple-900/50 dark:text-purple-300">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-gray-800 dark:text-purple-100">
                Cá Nhân Hoá Ứng Dụng
              </h3>
              <p className="text-[11px] text-gray-400">
                Tự thiết kế tên gọi, avatar và tông màu pastel yêu thích
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-pink-50 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar pr-0.5">
          {/* Preview Card */}
          <div
            className="rounded-2xl p-4 text-white shadow-md transition-all"
            style={{ background: currentThemeObj.cardGradient }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-xs ring-2 ring-white/30">
                {AVATAR_OPTIONS.find((a) => a.id === avatar)?.icon || '🐰'}
              </div>
              <div>
                <span className="text-[10px] font-semibold tracking-wider text-pink-100/90 uppercase">
                  Sổ thu chi của
                </span>
                <h4 className="font-heading text-lg font-bold text-white truncate max-w-[220px]">
                  {name || 'Tên của bạn'}
                </h4>
                <p className="text-[11px] text-pink-100/80 truncate max-w-[220px]">
                  {customGreeting}
                </p>
              </div>
            </div>
          </div>

          {/* 1. Chọn Linh vật / Avatar */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1.5">
              Chọn Avatar linh vật xinh xắn
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_OPTIONS.map((item) => {
                const isSelected = avatar === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAvatar(item.id)}
                    className={`flex flex-col items-center justify-center rounded-2xl p-2 transition-all ${
                      isSelected
                        ? 'border-2 border-pink-500 bg-pink-50 shadow-xs dark:border-pink-400 dark:bg-purple-900/60 scale-105'
                        : 'border border-pink-100/70 bg-white hover:bg-pink-50/40 dark:border-purple-900/40 dark:bg-[#1a1428]'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[9px] font-medium text-gray-600 dark:text-purple-300 mt-1 truncate max-w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn Tông màu Pastel chủ đạo */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1.5">
              Chọn tông màu pastel
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PASTEL_THEMES.map((th) => {
                const isSelected = pastelTheme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setPastelTheme(th.id as PastelThemeKey)}
                    className={`flex items-center gap-2.5 rounded-2xl p-2.5 text-left border transition-all ${
                      isSelected
                        ? 'border-2 border-pink-500 bg-pink-50/70 shadow-xs dark:border-pink-400 dark:bg-purple-900/40'
                        : 'border-pink-100/70 bg-white hover:bg-pink-50/30 dark:border-purple-900/40 dark:bg-[#1a1428]'
                    }`}
                  >
                    <span className="text-lg">{th.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 dark:text-purple-100 truncate">
                        {th.name}
                      </p>
                      <div
                        className="h-2 w-12 rounded-full mt-1"
                        style={{ backgroundColor: th.primary }}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Tên người dùng */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
              Tên gọi của bạn (Ví dụ: Mai Anh, Bé Bắp, Linh...)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên của bạn..."
              required
              className="w-full rounded-2xl border border-pink-100 bg-white p-3 text-xs sm:text-sm font-semibold text-gray-800 focus:border-pink-400 focus:outline-hidden dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
            />
          </div>

          {/* 4. Lời chào cá nhân */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-purple-200 block mb-1">
              Lời chào yêu thích
            </label>
            <input
              type="text"
              value={customGreeting}
              onChange={(e) => setCustomGreeting(e.target.value)}
              placeholder="Lời chào mỗi ngày..."
              className="w-full rounded-2xl border border-pink-100 bg-white p-3 text-xs text-gray-800 focus:border-pink-400 focus:outline-hidden dark:border-purple-900/50 dark:bg-[#1a1428] dark:text-purple-100"
            />
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-2 pt-3 border-t border-pink-50 dark:border-purple-900/40">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-purple-900/40 dark:text-purple-300"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 py-2.5 text-xs font-semibold text-white shadow-md shadow-pink-200 hover:scale-102 active:scale-95 transition-all"
            >
              Áp dụng cá nhân hoá
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
