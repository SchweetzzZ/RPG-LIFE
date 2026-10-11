import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { QuantityStepper } from './QuantityStepper';
import { FoodSearchPicker } from './FoodSearchPicker';
import { CustomItemForm } from './CustomItemForm';
import { stepFor, type ExtraDraft } from '@/src/lib/meal-draft';
import { formatNumber } from '@/src/lib/format';

interface ExtraItemsEditorProps {
  items: ExtraDraft[];
  onChange: (items: ExtraDraft[]) => void;
}

/** Itens avulsos: da busca de alimentos ou com a kcal digitada. */
export function ExtraItemsEditor({ items, onChange }: ExtraItemsEditorProps) {
  const [mode, setMode] = useState<'search' | 'custom'>('search');

  const add = (draft: ExtraDraft) => onChange([...items, draft]);

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] p-2.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-zinc-200">{item.name}</p>
                <p className="font-mono text-[10px] text-zinc-500">
                  {item.unit} • {formatNumber(item.kcalPerUnit)} kcal cada
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <QuantityStepper
                  label={item.name}
                  value={item.qty}
                  step={stepFor(item.unit)}
                  min={stepFor(item.unit)}
                  onChange={(qty) => onChange(items.map((i) => (i.id === item.id ? { ...i, qty } : i)))}
                />
                <button
                  type="button"
                  aria-label={`Remover ${item.name}`}
                  onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 rounded-xl border border-white/[0.08] bg-[#08090a] p-1 text-xs font-semibold">
        {(['search', 'custom'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`min-h-[36px] rounded-lg ${mode === value ? 'bg-[#14171d] text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {value === 'search' ? 'Buscar alimento' : 'Digitar kcal'}
          </button>
        ))}
      </div>

      {mode === 'search' ? <FoodSearchPicker onPick={add} /> : <CustomItemForm onAdd={add} />}
    </div>
  );
}
