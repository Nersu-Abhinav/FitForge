import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNutritionStore } from '@/store/useNutritionStore';
import { MealType } from '@/types';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { Zap, X } from 'lucide-react';

interface QuickAddMacroModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  targetDate: string;
}

export const QuickAddMacroModal: React.FC<QuickAddMacroModalProps> = ({
  isOpen,
  onClose,
  mealType,
  targetDate
}) => {
  const { quickAddMacros } = useNutritionStore();
  const { handleBackdropClick } = useModalBehavior({ isOpen, onClose });
  const [name, setName] = useState('Quick Add Meal');
  const [calories, setCalories] = useState('450');
  const [protein, setProtein] = useState('30');
  const [carbs, setCarbs] = useState('45');
  const [fat, setFat] = useState('15');
  const [fiber, setFiber] = useState('5');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    quickAddMacros(
      targetDate,
      mealType,
      parseFloat(calories) || 0,
      parseFloat(protein) || 0,
      parseFloat(carbs) || 0,
      parseFloat(fat) || 0,
      parseFloat(fiber) || 0,
      name.trim() || 'Quick Add Meal'
    );
    onClose();
  };

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm glass-card rounded-3xl p-5 border border-white/10 shadow-2xl animate-slide-up"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Fast Entry</span>
              <h3 className="text-base font-black text-white">Quick Add Macros</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Protein shake + bagel"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1 font-semibold">Calories (kcal)</label>
            <input
              type="number"
              required
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] font-mono text-cyan-400 mb-1">Protein</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full px-2 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono font-bold text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-amber-400 mb-1">Carbs</label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full px-2 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-rose-400 mb-1">Fat</label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="w-full px-2 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono font-bold text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-emerald-400 mb-1">Fiber</label>
              <input
                type="number"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
                className="w-full px-2 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg glow-amber hover:brightness-110 pressable transition-all"
            >
              Add To {mealType.replace('_', ' ')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
