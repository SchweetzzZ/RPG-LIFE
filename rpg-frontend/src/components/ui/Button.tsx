import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '@tanstack/react-router';

type ButtonVariant = 'primary' | 'secondary' | 'coin' | 'link';
type ButtonRoute = '/' | '/nutrition' | '/rewards' | '/profile';

const BASE = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-all';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'w-full border-2 border-black bg-action text-black shadow-[0_4px_0_0_#000] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'w-full border-2 border-line bg-raised text-zinc-100 hover:border-zinc-500 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50',
  coin: 'w-full border-2 border-coin/60 bg-raised text-coin hover:border-coin active:translate-y-[1px]',
  link: 'min-h-[44px] px-2 font-medium text-zinc-400 underline underline-offset-2 hover:text-zinc-200',
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
