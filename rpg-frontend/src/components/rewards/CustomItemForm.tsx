import { useState } from 'react';
import { Plus } from 'lucide-react';
import { newDraftId, type ExtraDraft } from '@/src/lib/meal-draft';

interface CustomItemFormProps {
  onAdd: (draft: ExtraDraft) => void;
}

/** Item avulso com a kcal digitada pela pessoa (fonte `custom`). */
export function CustomItemForm({ onAdd }: CustomItemFormProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('porção');
  const [kcal, setKcal] = useState('');
  const [qty, setQty] = useState('1');

  const kcalValue = Number(kcal);
  const qtyValue = Number(qty);
  const valid = name.trim() !== '' && unit.trim() !== '' && kcalValue > 0 && qtyValue > 0;

  function handleAdd() {
    if (!valid) return;
    onAdd({
      id: newDraftId(),
      name: name.trim(),
      unit: unit.trim(),
      kcalPerUnit: kcalValue,
      qty: qtyValue,
      source: { kind: 'custom' },
    });
    setName('');
    setKcal('');
    setQty('1');
  }

  const inputClass =
    'h-12 w-full rounded-lg border-2 border-line bg-raised px-3 text-base text-ink placeholder:text-ink-faint focus:border-action focus:outline-none';

  return (
    <div className="space-y-2">
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (ex: Sorvete)" className={inputClass} />
      <div className="grid grid-cols-3 gap-2">
        <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unidade" className={inputClass} />
        <input
          type="number"
          inputMode="decimal"
          min={1}
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          placeholder="kcal/un."
          className={inputClass}
        />
        <input
          type="number"
          inputMode="decimal"
          min={0.5}
          step={0.5}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Qtd"
          className={inputClass}
        />
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!valid}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border-2 border-line bg-raised px-3 text-sm font-semibold text-ink hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar item
      </button>
    </div>
  );
}
