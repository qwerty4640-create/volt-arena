import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Settings2, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

interface LibraryDropdownProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const LibraryDropdown: React.FC<LibraryDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  isOpen,
  onToggle,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const allOptions = ["All", ...options];
  
  // Track the highlighted index for keyboard selection
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  // Sync highlightedIndex when value changes or dropdown opens
  useEffect(() => {
    if (isOpen) {
      const currentIdx = allOptions.indexOf(value);
      setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
    }
  }, [isOpen, value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Scroll active option into view when highlighted via arrow keys
  useEffect(() => {
    if (isOpen && optionsRef.current) {
      const highlightedElement = optionsRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        onToggle();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % allOptions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + allOptions.length) % allOptions.length);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        const selectedValue = allOptions[highlightedIndex];
        onChange(selectedValue);
        onClose();
        break;
      case "Escape":
      case "Tab":
        onClose();
        break;
      default:
        break;
    }
  };

  const getDisplayLabel = () => {
    if (value === "All") {
      return label; // e.g. "ALL CATEGORIES"
    }
    return value;
  };

  return (
    <div 
      className={cn("relative w-full transition-all duration-150 rounded-none", isOpen ? "z-50" : "z-20")}
      ref={containerRef}
    >
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "w-full bg-surface p-3 pl-10 pr-10 border text-white font-mono text-xs uppercase focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-all cursor-pointer text-left flex items-center justify-between relative rounded-none select-none group",
          isOpen ? "border-volt bg-zinc-800/80 ring-1 ring-volt" : "border-white/5 hover:bg-zinc-800/50"
        )}
        style={{ borderRadius: 0 }}
      >
        <Settings2
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
            isOpen ? "text-volt" : "text-zinc-500 group-focus:text-volt"
          )}
          size={16}
        />
        <span className="truncate mr-2 font-black tracking-widest">
          {getDisplayLabel()}
        </span>
        <ChevronDown
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 shrink-0",
            isOpen ? "rotate-180 text-volt" : "text-zinc-500 group-focus:text-volt"
          )}
          size={16}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1 bg-zinc-950 border border-white/10 max-h-60 overflow-y-auto font-mono text-xs uppercase shadow-2xl custom-scrollbar rounded-none z-[60]"
            style={{ borderRadius: 0 }}
          >
            <div 
              ref={optionsRef} 
              role="listbox" 
              tabIndex={-1}
              className="outline-none"
            >
              {allOptions.map((opt, idx) => {
                const isSelected = opt === value;
                const isHighlighted = idx === highlightedIndex;
                const isFirstOption = idx === 0;

                return (
                  <div
                    key={opt}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt);
                      onClose();
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "p-3 cursor-pointer transition-colors text-left font-black tracking-wider select-none",
                      isFirstOption && "border-b border-white/5",
                      isHighlighted 
                        ? "bg-volt text-void" 
                        : isSelected 
                          ? "text-volt bg-white/5" 
                          : "text-zinc-400"
                    )}
                    style={{ borderRadius: 0 }}
                  >
                    {opt === "All" ? label : opt}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
