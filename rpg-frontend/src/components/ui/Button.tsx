import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '@tanstack/react-router';

type ButtonVariant = 'primary' | 'secondary' | 'coin' | 'link';
type ButtonRoute = '/' | '/nutrition' | '/rewards' | '/profile';

const BASE = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-all';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'w-full border-2 border-[#0c0a08] bg-action text-[#0c0a08] shadow-[0_4px_0_0_#0c0a08] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_0_#0c0a08] disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'w-full border-2 border-line bg-raised text-ink shadow-[0_3px_0_0_#0c0a08] hover:border-ink-faint active:translate-y-[2px] active:shadow-[0_1px_0_0_#0c0a08] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0',
  coin: 'w-full border-2 border-[#0c0a08] bg-coin text-[#0c0a08] shadow-[0_4px_0_0_#0c0a08] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_0_#0c0a08]',
  link: 'min-h-[44px] px-2 font-medium text-ink-dim underline underline-offset-2 hover:text-ink',
};

interface CommonProps {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}

type ButtonAsLink = CommonProps & { to: ButtonRoute };
type ButtonAsButton = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { to?: undefined };

export type ButtonProps = ButtonAsLink | ButtonAsButton;

export function Button(props: ButtonProps) {
  const { variant = 'primary', className = '', children } = props;
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (props.to !== undefined) {
    return (
      <Link to={props.to} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant: _variant, className: _className, children: _children, to: _to, ...buttonProps } = props;
  return (
    <button type="button" {...buttonProps} className={classes}>
      {children}
    </button>
  );
}
