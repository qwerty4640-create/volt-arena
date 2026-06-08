import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  GripVertical,
  Check,
  Layout,
  Save
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ALL_WIDGETS, ALL_PERFORMANCE_WIDGETS, Widget, PerformanceWidget } from '../constants/widgets';
import { WidgetId, PerformanceWidgetId } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';
import { Portal } from './Portal';

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWidgets: (WidgetId | PerformanceWidgetId)[];
  onSave: (widgets: any[]) => void;
  type: 'dashboard' | 'performance';
}

interface SortableItemProps {
  id: WidgetId | PerformanceWidgetId;
  isSelected: boolean;
  onToggle: (id: any) => void;
  label: string;
  allWidgets: (Widget | PerformanceWidget)[];
}

const SortableItem: React.FC<SortableItemProps> = ({ id, isSelected, onToggle, label, allWidgets }) => {
  const { t } = useSettings();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const widget = allWidgets.find(w => w.id === id);
  const Icon = widget?.icon || Layout;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-4 p-4 mb-2 bg-void/40 border border-white/5 transition-all outline-none",
        isDragging ? "opacity-50 scale-[1.02] border-volt/50 shadow-[0_0_20px_rgba(0,182,255,0.2)]" : "opacity-100",
        !isSelected && "opacity-40"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors p-2 -m-2"
      >
        <GripVertical size={18} />
      </div>

      <button
        onClick={() => onToggle(id)}
        className={cn(
          "w-6 h-6 border flex items-center justify-center transition-all",
          isSelected ? "bg-volt border-volt text-void" : "border-white/20 text-transparent"
        )}
      >
        {isSelected && <Check size={14} strokeWidth={4} />}
      </button>

      <div className="flex-1 flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 flex items-center justify-center transition-colors",
          isSelected ? "text-volt" : "text-zinc-600"
        )}>
          <Icon size={20} />
        </div>
        <span className={cn(
          "font-headline text-xs font-black uppercase tracking-widest transition-colors",
          isSelected ? "text-white" : "text-zinc-500"
        )}>
          {t(label as any)}
        </span>
      </div>
    </div>
  );
};

export const CustomizeDashboardModal = ({ isOpen, onClose, currentWidgets, onSave, type }: CustomizeDashboardModalProps) => {
  const { t } = useSettings();
  const allWidgets = type === 'dashboard' ? ALL_WIDGETS : ALL_PERFORMANCE_WIDGETS;

  const [tempWidgets, setTempWidgets] = useState<(WidgetId | PerformanceWidgetId)[]>(() => {
    const validCurrentWidgets = currentWidgets.filter(id => allWidgets.some(w => w.id === id));
    const otherWidgets = allWidgets.map(w => w.id).filter(id => !validCurrentWidgets.includes(id as any));
    return [...validCurrentWidgets, ...otherWidgets] as (WidgetId | PerformanceWidgetId)[];
  });

  const [selectedIds, setSelectedIds] = useState<Set<WidgetId | PerformanceWidgetId>>(() => {
    const validCurrentWidgets = currentWidgets.filter(id => allWidgets.some(w => w.id === id));
    return new Set(validCurrentWidgets);
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTempWidgets((items) => {
        const oldIndex = items.indexOf(active.id as any);
        const newIndex = items.indexOf(over.id as any);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleWidget = (id: WidgetId | PerformanceWidgetId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      if (newSelected.size > 1) {
        newSelected.delete(id);
      }
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSave = () => {
    const finalWidgets = tempWidgets.filter(id => selectedIds.has(id));
    onSave(finalWidgets);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-void/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-surface-container-lowest border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Layout className="text-volt" size={20} />
                  <h2 className="font-headline text-lg font-black uppercase tracking-tight text-white leading-tight">
                    {t('analysis.customizeDashboard')}
                  </h2>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={tempWidgets}
                    strategy={verticalListSortingStrategy}
                  >
                    {tempWidgets.map((id) => {
                      const widget = allWidgets.find(w => w.id === id);
                      return (
                        <SortableItem
                          key={id}
                          id={id}
                          isSelected={selectedIds.has(id)}
                          onToggle={toggleWidget}
                          label={widget?.label || id}
                          allWidgets={allWidgets}
                        />
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 flex gap-4">
                <button
                  onClick={onClose}
                  className="btn-secondary flex-1 py-4"
                >
                  <X size={14} />
                  {t('common.close')}
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary flex-1 py-4"
                >
                  <Save size={14} />
                  {t('common.save')}
                </button>
              </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
  );
};
