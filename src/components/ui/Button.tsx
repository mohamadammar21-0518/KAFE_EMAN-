import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Link, type LinkProps } from "react-router-dom";
import { RollIcon, RollText } from "@/components/motion/RollText";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  to?: LinkProps["to"];
  children?: ReactNode;
  showIcon?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-ref-primary",
  secondary: "btn-ref-secondary",
  ghost: "btn-ref-ghost",
};

function RefButtonInner({
  children,
  variant,
  showIcon,
  hovered,
  className,
}: {
  children: ReactNode;
  variant: ButtonVariant;
  showIcon?: boolean;
  hovered: boolean;
  className?: string;
}) {
  const isPrimary = variant === "primary";
  const textClass = cn(
    "text-sm font-normal leading-[1.2]",
    isPrimary ? "text-white" : "text-coffee-dark",
  );

  return (
    <span
      className={cn(
        "relative flex items-center gap-[9px] overflow-hidden",
        isPrimary ? "pl-3.5 pr-6 py-2.5" : "px-5 py-2.5",
        className,
      )}
    >
      {isPrimary && showIcon !== false && (
        <RollIcon hovered={hovered}>
          <CalendarCheck className="h-5 w-5 text-white" strokeWidth={1.75} />
        </RollIcon>
      )}
      <RollText hovered={hovered} height={22} gap={13} textClassName={textClass}>
        {children}
      </RollText>
    </span>
  );
}

export function Button({
  variant = "primary",
  className,
  children,
  to,
  showIcon,
  disabled,
  type = "button",
  onClick,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const classes = cn(
    "cafe-button inline-flex items-center justify-center rounded-full",
    variantClasses[variant],
    className,
  );
  const content = (
    <motion.span whileTap={disabled ? undefined : { scale: 0.98 }} className="inline-flex">
      <RefButtonInner variant={variant} showIcon={showIcon} hovered={hovered && !disabled}>
        {children}
      </RefButtonInner>
    </motion.span>
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : props.tabIndex}
        id={props.id} title={props.title} aria-label={props["aria-label"]}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)} onBlur={() => setHovered(false)}
        onClick={(event) => {
          if (disabled) event.preventDefault();
          else (onClick as unknown as React.MouseEventHandler<HTMLAnchorElement> | undefined)?.(event);
        }}>
        {content}
      </Link>
    );
  }

  return (
    <button {...props} type={type} disabled={disabled} onClick={onClick} className={classes}
      onMouseEnter={(event) => { setHovered(true); props.onMouseEnter?.(event); }}
      onMouseLeave={(event) => { setHovered(false); props.onMouseLeave?.(event); }}
      onFocus={(event) => { setHovered(true); props.onFocus?.(event); }}
      onBlur={(event) => { setHovered(false); props.onBlur?.(event); }}>
      {content}
    </button>
  );
}
