import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
const CHART_COLOR = 'var(--primary-color)';
import {
  Zap,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Info,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  X
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
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { CustomBlock, MissionPeriod } from '../contexts/SettingsContext';
import { BlockType, analyzeSequenceConflicts, expandPlan, BLOCK_TEMPLATES, BlockDefinition, applyFluidReorder } from '../constants/periodization';
import { cn } from '../lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ProgramDesignerProps {
  missionPeriod: MissionPeriod;
  onUpdate: (blocks: CustomBlock[]) => void;
  initialBlocks?: CustomBlock[];
}

const AVAILABLE_BLOCKS = [
  // Objectives
  { type: BlockType.PURE_STRENGTH, color: 'text-volt', bg: 'bg-volt/10', borderColor: 'border-volt/30' },
  { type: BlockType.POWERBUILDING, color: 'text-emerald-400', bg: 'bg-emerald-400/20', borderColor: 'border-emerald-400/30' },
  { type: BlockType.HYPERTROPHY, color: 'text-rose-500', bg: 'bg-rose-500/20', borderColor: 'border-rose-500/30' },
  { type: BlockType.LONGEVITY, color: 'text-cyan-400', bg: 'bg-cyan-400/20', borderColor: 'border-cyan-400/30' },
  { type: BlockType.TACTICAL, color: 'text-zinc-300', bg: 'bg-zinc-300/20', borderColor: 'border-zinc-300/30' },
  { type: BlockType.EXPLOSIVENESS, color: 'text-orange-500', bg: 'bg-orange-500/20', borderColor: 'border-orange-500/30' },
  { type: BlockType.ENDURANCE, color: 'text-blue-500', bg: 'bg-blue-500/20', borderColor: 'border-blue-500/30' },
  { type: BlockType.PREHAB, color: 'text-purple-300', bg: 'bg-purple-300/20', borderColor: 'border-purple-300/30' },
  { type: BlockType.RETENTION, color: 'text-rose-400', bg: 'bg-rose-400/20', borderColor: 'border-rose-400/30' }
];

const SortableBlock: React.FC<{
  block: CustomBlock,
  onRemove: (id: string) => void,
  onUpdateDuration: (id: string, delta: number) => void
}> = ({
  block,
  onRemove,
  onUpdateDuration
}) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: block.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      width: `auto`
    };

    const blockConfig = AVAILABLE_BLOCKS.find(b => b.type === block.type) || AVAILABLE_BLOCKS[0];

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "flex-shrink-0 flex flex-col justify-between p-3 border group min-h-[120px] transition-colors relative cursor-grab",
          blockConfig.borderColor,
          blockConfig.bg
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1">
            <p className={cn("text-[10px] font-black uppercase tracking-widest leading-none", blockConfig.color)}>{block.type}</p>
          </div>
          <button
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); onRemove(block.id); }}
            className="text-zinc-600 hover:text-crimson transition-colors ml-2"
          >
            <Trash2 size={12} />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-auto">
          <button
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); onUpdateDuration(block.id, -1); }}
            className="w-6 h-6 flex items-center justify-center bg-void/50 hover:bg-white text-zinc-400 hover:text-void transition-colors"
          >
            <ChevronLeft size={12} />
          </button>
          <div className="text-center px-2">
            <span className="font-headline text-lg font-black text-white leading-none">{block.durationWeeks}</span>
            <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500 block">WEEKS</span>
          </div>
          <button
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); onUpdateDuration(block.id, 1); }}
            className="w-6 h-6 flex items-center justify-center bg-void/50 hover:bg-white text-zinc-400 hover:text-void transition-colors"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    );
  }

export const ProgramDesigner: React.FC<ProgramDesignerProps> = ({
  missionPeriod,
  onUpdate,
  initialBlocks = []
}) => {
  const [blocks, setBlocks] = useState<CustomBlock[]>(Array.isArray(initialBlocks) ? initialBlocks : []);
  const totalWeeks = parseInt(missionPeriod) * 4;

  // Sync internal state with props
  useEffect(() => {
    if (initialBlocks && Array.isArray(initialBlocks) && JSON.stringify(initialBlocks) !== JSON.stringify(blocks)) {
      setBlocks(initialBlocks);
    }
  }, [initialBlocks]);

  const usedWeeks = useMemo(() => {
    if (!Array.isArray(blocks)) return 0;
    return blocks.reduce((acc, b) => acc + b.durationWeeks, 0);
  }, [blocks]);
  const remainsWeeks = totalWeeks - usedWeeks;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 12M Shortcut Logic Check
  useEffect(() => {
    const is12MShortcut = blocks.some(b => b.durationWeeks >= 48); // 12M = 48 weeks
    if (is12MShortcut && blocks.length > 1) {
      const shortcutBlock = blocks.find(b => b.durationWeeks >= 48);
      if (shortcutBlock) {
        setBlocks([shortcutBlock]);
        onUpdate([shortcutBlock]);
      }
    }
  }, [blocks, onUpdate]);

  const addBlock = (type: string) => {
    if (remainsWeeks <= 0) return;

    let duration = Math.min(4, remainsWeeks);
    if (type === '12M_BLOCK_PLACEHOLDER') {
      duration = 48; // Explicit 12M shortcut trigger
    }

    const newBlock: CustomBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      durationWeeks: duration
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    onUpdate(newBlocks);
  };

  const removeBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    setBlocks(newBlocks);
    onUpdate(newBlocks);
  };

  const updateBlockDuration = (id: string, delta: number) => {
    const newBlocks = blocks.map(b => {
      if (b.id === id) {
        const newDuration = Math.max(1, b.durationWeeks + delta);
        if (delta > 0 && remainsWeeks < delta) return b;
        return { ...b, durationWeeks: newDuration };
      }
      return b;
    });

    setBlocks(newBlocks);
    onUpdate(newBlocks);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);

      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      setBlocks(newBlocks);
      onUpdate(newBlocks);
    }
  };

  const graphData = useMemo(() => {
    const data: { week: number, intensity: number, type: string }[] = [];
    let weekAcc = 0;

    if (Array.isArray(blocks)) {
      // Create BlockDefinition array from CustomBlocks to expand
      const plainPlan = blocks.map(b => {
        const template = BLOCK_TEMPLATES[b.type] || BLOCK_TEMPLATES[BlockType.FOUNDATION];
        return {
          ...template,
          durationWeeks: b.durationWeeks,
          label: template.label || b.type
        } as BlockDefinition;
      });

      const detailedPlan = expandPlan(plainPlan);

      detailedPlan.forEach((block) => {
        for (let w = 1; w <= block.durationWeeks; w++) {
          weekAcc++;
          const intensity = block.baseIntensity + (w - 1) * block.intensityIncrementPerWeek;

          data.push({
            week: weekAcc,
            intensity: Math.round(intensity * 100),
            type: block.label || block.type
          });
        }
      });
    }

    for (let w = weekAcc + 1; w <= totalWeeks; w++) {
      data.push({ week: w, intensity: 40, type: 'EMPTY' });
    }
    return data;
  }, [blocks, totalWeeks]);

  const xTicks = useMemo(() => {
    const ticks = [];
    for (let i = 5; i < totalWeeks; i += 5) ticks.push(i);
    return [1, ...ticks, totalWeeks];
  }, [totalWeeks]);

  const advisories = useMemo(() => analyzeSequenceConflicts(blocks), [blocks]);

  const [activeAdvisoryIdx, setActiveAdvisoryIdx] = useState<number | null>(null);

  const applyRecommendation = () => {
    if (advisories.length === 0) return;

    const adv = advisories[0];
    const newBlocks = [...blocks];

    if (adv.actionType === 'INSERT' && adv.suggestedBlock) {
      const types = blocks.map(b => b.type);
      let insertionIdx = -1;

      if (adv.suggestedBlock === BlockType.STRENGTH) {
        if (adv.issue.includes("Deload to Peaking")) {
          const peakingIdx = types.indexOf(BlockType.PEAKING);
          insertionIdx = peakingIdx !== -1 ? peakingIdx : -1;
        } else if (adv.issue.includes("Power focus immediately followed")) {
          // Insert between POWER and HYPERTROPHY
          for (let i = 0; i < types.length - 1; i++) {
            if (types[i] === BlockType.POWER && types[i+1] === BlockType.HYPERTROPHY) {
              insertionIdx = i + 1;
              break;
            }
          }
        } else {
          // Default to middle if we don't know
          insertionIdx = Math.floor(blocks.length / 2);
        }
      } else if (adv.suggestedBlock === BlockType.HYPERTROPHY) {
        insertionIdx = 0; // Insert at the beginning to reset baseline
      } else if (adv.suggestedBlock === BlockType.RETENTION) {
         // Find the gap that needs retention
         for (let i = 0; i < types.length - 1; i++) {
           const current = types[i];
           const next = types[i+1];
           const isMaintenance = [BlockType.RETENTION, BlockType.DELOAD, BlockType.REGENERATION].includes(current as BlockType) ||
                                 [BlockType.RETENTION, BlockType.DELOAD, BlockType.REGENERATION].includes(next as BlockType);
           if (!isMaintenance && current !== next) {
             const currentBlockWeeks = blocks[i].durationWeeks;
             const nextBlockWeeks = blocks[i+1].durationWeeks;
             if (currentBlockWeeks >= 8 && nextBlockWeeks >= 8) {
                insertionIdx = i + 1;
                break;
             }
           }
         }
         if (insertionIdx === -1) {
            // fallback
            insertionIdx = Math.min(types.length - 1, 1);
         }
      }

      if (insertionIdx !== -1) {
        const newBlock: CustomBlock = {
          id: Math.random().toString(36).substr(2, 9),
          type: adv.suggestedBlock,
          durationWeeks: 2
        };
        newBlocks.splice(insertionIdx, 0, newBlock);

        let currentTotal = newBlocks.reduce((acc, b) => acc + b.durationWeeks, 0);
        while (currentTotal > totalWeeks) {
          const longest = newBlocks
            .filter(b => b.id !== newBlock.id && b.durationWeeks > 1)
            .sort((a, b) => b.durationWeeks - a.durationWeeks)[0];

          if (longest) {
            longest.durationWeeks -= 1;
            currentTotal -= 1;
          } else {
            break;
          }
        }
      }
    } else if (adv.actionType === 'REORDER') {
      const reordered = applyFluidReorder(newBlocks);
      setBlocks(reordered);
      onUpdate(reordered);
      return;
    }

    setBlocks(newBlocks);
    onUpdate(newBlocks);
  };
  
  return (
    <div className="space-y-6">
      {/* 1. Visual Intensity Graph */}
      <div className="glass-panel h-48 relative overflow-hidden bg-void pt-10">
        <div className="absolute top-4 left-6 flex items-center gap-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">INTENSITY CURVE</h4>
          <div className="inline-flex items-center justify-center w-4 h-4 border border-volt/40">
            <span className="text-[8px] font-black text-volt transform translate-y-[0.5px]">i</span>
          </div>
        </div>
        
        <div className="absolute top-4 right-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-volt">{totalWeeks}-WEEK CYCLE</h4>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
            <defs>
              <linearGradient id="pdIntensityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.6} />
                <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#ffffff10" vertical={false} />
            
            <XAxis 
              dataKey="week" 
              axisLine={false}
              tickLine={false}
              ticks={xTicks}
              tick={{ fill: '#52525b', fontSize: 9, fontWeight: 900, fontFamily: 'Inter' }}
              tickFormatter={(val) => `WEEK ${val}`}
              dy={10}
            />
            
            <YAxis 
              domain={[40, 100]}
              ticks={[40, 55, 70, 85, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#52525b', fontSize: 9, fontWeight: 900, fontFamily: 'Inter' }}
              dx={-5}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  if (d.type === 'EMPTY') return null;
                  return (
                    <div className="bg-void border border-volt/30 p-2 text-[8px] font-black uppercase tracking-widest text-volt shadow-lg">
                      Week {d.week}: {d.type} ({d.intensity}%)
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ stroke: CHART_COLOR, strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="linear"
              dataKey="intensity"
              stroke={CHART_COLOR}
              fillOpacity={1}
              fill="url(#pdIntensityGradient)"
              strokeWidth={3}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Drag and Drop Timeline */}
      <div className="space-y-2">
        <div className="flex flex-col items-start gap-1">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">PROGRAM TIMELINE</h4>
          {blocks.length > 0 && <span className="text-[10px] font-medium text-white/50">Drag and drop to rearrange blocks.</span>}
        </div>

        <div className="bg-void/50 border border-white/5 p-4 min-h-[160px] flex items-center overflow-x-auto custom-scrollbar">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map(b => b.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-2 min-w-max pb-2">
                {blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    onRemove={removeBlock}
                    onUpdateDuration={updateBlockDuration}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {blocks.length === 0 && (
            <div className="flex-1 w-full flex flex-col items-center justify-center p-8 text-center text-zinc-600">
              <Maximize2 size={24} className="mb-4 opacity-50" />
              <p className="text-[10px] font-black uppercase tracking-widest">Drag blocks or click to assign</p>
              <p className="text-[8px] mt-2 uppercase tracking-widest max-w-[200px]">Fill the timeline up to {totalWeeks} weeks to proceed.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Available Blocks Palette */}
        <div className="space-y-4 lg:col-span-3">
          <div className="flex flex-col items-start gap-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">BLOCK PALETTE</h4>
            <span className="text-[10px] font-medium text-zinc-500">Click to append blocks.</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_BLOCKS.map((block) => (
              <button
                key={block.type}
                onClick={() => addBlock(block.type)}
                disabled={remainsWeeks <= 0}
                className={cn(
                  "px-4 py-2 border font-headline text-[9px] font-black uppercase tracking-widest transition-all text-left flex items-center gap-3",
                  block.borderColor,
                  block.bg,
                  block.color,
                  "hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100"
                )}
              >
                {block.type}
              </button>
            ))}
          </div>
        </div>
      </div>
      {advisories.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-orange-400/5 border border-orange-400/20 space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 shrink-0 bg-orange-400/10 flex items-center justify-center text-orange-400">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
              {advisories.map((adv, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {adv.decayRisk > 0 && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                        -{Math.round(adv.decayRisk * 100)}% EFFICIENCY DETECTED
                      </span>
                    )}
                    <button 
                      onClick={() => setActiveAdvisoryIdx(idx)}
                      className="inline-flex items-center justify-center w-4 h-4 border border-orange-400/40 hover:border-orange-400 hover:bg-orange-400/10 transition-colors cursor-pointer pointer-events-auto"
                      title="View Analysis"
                    >
                      <span className="text-[8px] font-black text-orange-400 transform translate-y-[0.5px]">i</span>
                    </button>
                  </div>
                  <p className="text-[8px] font-black text-zinc-500">
                    {adv.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={applyRecommendation}
            className="flex items-center justify-center w-full gap-1.5 px-3 py-2 bg-volt text-void text-[9px] font-black uppercase tracking-widest hover:bg-white transition-colors"
          >
            Apply Optimization
            <ArrowRight size={10} />
          </button>
          
          {/* Tactical Modal Popup Pattern */}
          {activeAdvisoryIdx !== null && (
            <div 
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-void/90 backdrop-blur-md" 
              onClick={() => setActiveAdvisoryIdx(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-void border border-volt/20 p-8 max-w-sm w-full space-y-8 relative shadow-[0_0_50px_rgba(0,182,255,0.1)]"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-volt" />
                  <h3 className="font-black text-2xl uppercase tracking-tighter text-white">ADVISORY</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-zinc-900/40 border border-zinc-800/50 space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-volt">ANALYSIS</h4>
                    <p className="text-xs font-medium text-zinc-300 leading-relaxed">
                      {advisories[activeAdvisoryIdx].issue.charAt(0).toUpperCase() + advisories[activeAdvisoryIdx].issue.slice(1).toLowerCase()}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-900/40 border border-zinc-800/50 space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">GOAL</h4>
                    <p className="text-xs font-medium text-zinc-400 leading-relaxed">
                      {advisories[activeAdvisoryIdx].recommendation.charAt(0).toUpperCase() + advisories[activeAdvisoryIdx].recommendation.slice(1).toLowerCase()}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveAdvisoryIdx(null)}
                  className="w-full py-4 bg-zinc-900/60 border border-zinc-800 hover:bg-volt hover:text-void transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-void"
                >
                  <X size={14} className="transform -translate-y-[0.5px]" />
                  CLOSE
                </button>
              </motion.div>
            </div>
          )}
        </motion.div>
      ) : usedWeeks === totalWeeks && blocks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-[#0a110e]/50 border border-[#0f4e35]/60 flex items-start sm:items-center gap-4"
        >
          <div className="w-12 h-12 shrink-0 bg-[#0f2e20] flex items-center justify-center text-[#06d6a0]">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-black uppercase text-[#06d6a0]">SEQUENCE INTEGRITY: OPTIMAL</p>
            <p className="text-[10px] font-medium text-zinc-500 mt-1 leading-relaxed max-w-lg">
              Vanguard has verified your phase redistribution. Periodization logic adheres to standard force production models.
            </p>
          </div>
        </motion.div>
      )}

      {usedWeeks < totalWeeks && blocks.length > 0 && (
        <div className="p-4 bg-orange-400/5 border border-orange-400/20 flex items-center gap-4">
          <div className="w-10 h-10 shrink-0 bg-orange-400/10 flex items-center justify-center text-orange-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">SEQUENCE INCOMPLETE</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">
              Assigned: {usedWeeks}W / Goal: {totalWeeks}W. Allocate remaining {totalWeeks - usedWeeks} weeks to proceed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
