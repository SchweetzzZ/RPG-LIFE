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
            <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border-2 border-line bg-raised p-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                <p className="text-xs text-ink-faint">
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
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-faint hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 rounded-lg border-2 border-line bg-raised p-1 text-xs font-semibold">
        {(['search', 'custom'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`min-h-[44px] rounded-lg ${mode === value ? 'bg-surface text-ink' : 'text-ink-faint hover:text-ink'}`}
          >
            {value === 'search' ? 'Buscar alimento' : 'Digitar kcal'}
          </button>
        ))}
      </div>

      {mode === 'search' ? <FoodSearchPicker onPick={add} /> : <CustomItemForm onAdd={add} />}
    </div>
  );
}
