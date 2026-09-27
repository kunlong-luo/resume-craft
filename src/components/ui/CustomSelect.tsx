import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  size?: 'xs' | 'sm' | 'md';
  align?: 'left' | 'right';
  dropUp?: boolean;
  maxMenuHeight?: string;
  id?: string;
  compact?: boolean;
  ariaLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  size = 'sm',
  align = 'left',
  dropUp = false,
  maxMenuHeight = 'max-h-64',
  id,
  compact = false,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    isDropUp: boolean;
  } | null>(null);

  // Find the currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Calculate coordinates relative to trigger button
  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const isUp = dropUp || (spaceBelow < 220 && rect.top > 220);

    let left = align === 'right' ? rect.right : rect.left;
    let top = isUp ? rect.top - 6 : rect.bottom + 6;

    // Viewport bound safety
    if (align === 'right') {
      if (left < 160) left = 160;
    } else {
      if (left + 220 > window.innerWidth) {
        left = Math.max(10, window.innerWidth - 230);
      }
    }

    setCoords({
      top,
      left,
      width: Math.max(rect.width, 130),
      isDropUp: isUp,
    });
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      calculatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      calculatePosition();
    };

    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('touchstart', handleOutsideClick, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
      document.removeEventListener('touchstart', handleOutsideClick, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Scroll active item into view when opening
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const activeEl = menuRef.current.querySelector('[data-selected="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen]);

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px] h-6 rounded-md gap-1',
    sm: 'px-2.5 py-1 text-xs h-7.5 rounded-lg gap-1.5',
    md: 'px-3 py-2 text-sm h-9.5 rounded-lg gap-2',
  };

  const defaultTriggerStyles = `
    inline-flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800
    border border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/70 dark:hover:bg-slate-750
    transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
    shadow-[0_1px_2px_rgba(15,23,42,0.03)]
  `;

  // Format display label for trigger (clean up parenthetical suffixes in compact mode)
  const isPlaceholder = !selectedOption?.label;
  const rawLabel = selectedOption?.label ? selectedOption.label : (placeholder || '');
  const displayLabel = compact ? rawLabel.split('(')[0].split('（')[0].trim() : rawLabel;

  return (
    <div id={id} className={`relative inline-block text-left group ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        title={selectedOption?.label || placeholder}
        className={`
          ${sizeClasses[size]}
          ${defaultTriggerStyles}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 hover:bg-slate-100 border-slate-200' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-indigo-500/25 border-indigo-500 bg-white dark:bg-slate-800' : ''}
          ${compact ? 'max-w-[70px] sm:max-w-[90px] hover:max-w-[180px] transition-all duration-200 ease-out px-1.5' : ''}
          ${triggerClassName}
        `}
      >
        <span className="flex items-center gap-1.5 truncate flex-1 text-left">
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-400">{selectedOption.icon}</span>
          )}
          <span className={`truncate ${isPlaceholder ? 'text-slate-400 dark:text-slate-500 font-normal' : ''}`}>
            {displayLabel || '\u00A0'}
          </span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && coords && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: coords.isDropUp ? 4 : -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: coords.isDropUp ? 4 : -4 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: coords.isDropUp ? undefined : `${coords.top}px`,
                  bottom: coords.isDropUp ? `${window.innerHeight - coords.top}px` : undefined,
                  left: align === 'right' ? undefined : `${coords.left}px`,
                  right: align === 'right' ? `${window.innerWidth - coords.left}px` : undefined,
                  minWidth: `${coords.width}px`,
                  zIndex: 99999,
                }}
                role="listbox"
                data-custom-select-portal="true"
                className={`
                  max-w-[min(320px,calc(100vw-24px))] w-max
                  bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl
                  shadow-[0_12px_30px_-4px_rgba(15,23,42,0.16),0_4px_8px_-2px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.6)]
                  p-1 overflow-y-auto ${maxMenuHeight} scrollbar-thin
                  ${menuClassName}
                `}
              >
                {options.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-400 text-center">无可选选项</div>
                ) : (
                  options.map((option, idx) => {
                    const isSelected = option.value === value;
                    const isBlankOption = !option.label || option.label.trim() === '';
                    return (
                      <button
                        key={option.value || `__empty_${idx}`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        data-selected={isSelected}
                        disabled={option.disabled}
                        onClick={() => {
                          if (!option.disabled) {
                            onChange(option.value);
                            setIsOpen(false);
                          }
                        }}
                        className={`
                          w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg
                          transition-colors duration-100 text-left cursor-pointer
                          ${option.disabled ? 'opacity-40 cursor-not-allowed bg-transparent' : ''}
                          ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-300 font-bold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }
                        `}
                      >
                        <span className="flex items-center gap-2 truncate pr-2 min-h-[1.125rem]">
                          {option.icon && <span className="shrink-0">{option.icon}</span>}
                          <span className="truncate">
                            {isBlankOption ? (
                              <span className="text-transparent select-none inline-block w-4">&nbsp;</span>
                            ) : (
                              option.label
                            )}
                          </span>
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
