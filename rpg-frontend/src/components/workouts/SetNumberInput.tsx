import { useEffect, useState } from 'react';

interface SetNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  /** true: aceita casas decimais (kg); false: só inteiros (reps). */
  decimal?: boolean;
  className?: string;
}

/** Tira zeros à esquerda ("044" → "44", "007.5" → "7.5"), mantendo "0" e "0.5". */
function stripLeadingZeros(text: string): string {
  return text.replace(/^0+(?=\d)/, '');
}

function parse(text: string, decimal: boolean): number {
  const n = Number(text.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return 0;
  return decimal ? n : Math.round(n);
}

/**
 * Campo numérico de série (kg/reps). Guarda o texto digitado: um input type=number controlado
 * pelo número não reescreve "044" (vale 44, igual ao estado), e o zero ficava na frente.
 * No foco seleciona tudo, então digitar substitui o valor em vez de somar ao "0".
 */
export function SetNumberInput({ value, onChange, decimal = false, className }: SetNumberInputProps) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Mudança vinda de fora (pré-preenchimento, nova série): acompanha quando não está editando
  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  return (
    <input
      type="number"
      inputMode={decimal ? 'decimal' : 'numeric'}
      step={decimal ? 'any' : 1}
      min={0}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        e.currentTarget.select();
      }}
      onBlur={() => {
        setFocused(false);
        setText(String(value));
      }}
      onChange={(e) => {
        const next = stripLeadingZeros(e.target.value);
        setText(next);
        onChange(parse(next, decimal));
      }}
      className={className}
    />
  );
}
