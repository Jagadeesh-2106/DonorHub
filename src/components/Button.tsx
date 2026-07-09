import React, { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className,
  ...rest
}) => {
  const baseStyle =
    'py-2.5 px-5 rounded font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ease-out transform active:scale-[0.98] select-none';

  const variantStyle = clsx({
    'bg-primary text-white hover:bg-primary-hover focus:ring-primary shadow-premium hover:shadow-lg':
      variant === 'primary' && !disabled,
    'bg-white text-secondary border border-border hover:bg-secondary-light hover:text-textPrimary focus:ring-secondary shadow-subtle':
      variant === 'secondary' && !disabled,
    'opacity-50 cursor-not-allowed transform-none': disabled || loading,
  });

  return (
    <button className={clsx(baseStyle, variantStyle, className)} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className="flex items-center justify-center space-x-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
