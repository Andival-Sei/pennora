"use client";

import * as React from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  checkPasswordRequirements,
  calculatePasswordStrength,
  getPasswordStrengthLevel,
} from "@/lib/validations/auth";

interface PasswordInputProps extends Omit<
  React.ComponentProps<"input">,
  "type"
> {
  showStrengthIndicator?: boolean;
  strengthLabels?: {
    weak: string;
    fair: string;
    good: string;
    strong: string;
  };
  requirementLabels?: {
    minLength: string;
    hasUppercase: string;
    hasLowercase: string;
    hasNumber: string;
  };
}

const strengthColors = {
  weak: "bg-red-500",
  fair: "bg-orange-500",
  good: "bg-yellow-500",
  strong: "bg-green-500",
};

const strengthWidths = {
  weak: "25%",
  fair: "50%",
  good: "75%",
  strong: "100%",
};

function PasswordInput({
  className,
  showStrengthIndicator = false,
  strengthLabels,
  requirementLabels,
  onChange,
  value,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);

  // Используем либо controlled value, либо internal
  const currentValue = value !== undefined ? String(value) : internalValue;
  const hasValue = currentValue.length > 0;
  const strength = calculatePasswordStrength(currentValue);
  const requirements = checkPasswordRequirements(currentValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    onChange?.(e);
  };

  const strengthLevel = getPasswordStrengthLevel(strength);
  const showIndicator = showStrengthIndicator && hasValue;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            hasValue && "pr-10",
            className
          )}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        <AnimatePresence>
          {hasValue && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 overflow-hidden"
          >
            {/* Индикатор силы */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    strengthColors[strengthLevel]
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: strengthWidths[strengthLevel] }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              {strengthLabels && (
                <p
                  className={cn(
                    "text-xs transition-colors",
                    strengthLevel === "weak" && "text-red-500",
                    strengthLevel === "fair" && "text-orange-500",
                    strengthLevel === "good" &&
                      "text-yellow-600 dark:text-yellow-500",
                    strengthLevel === "strong" && "text-green-500"
                  )}
                >
                  {strengthLabels[strengthLevel]}
                </p>
              )}
            </div>

            {/* Список требований - показываем при фокусе или если есть невыполненные */}
            {requirementLabels &&
              (isFocused || !Object.values(requirements).every(Boolean)) && (
                <motion.ul
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-1 text-xs"
                >
                  {Object.entries(requirements).map(([key, passed]) => (
                    <li
                      key={key}
                      className={cn(
                        "flex items-center gap-1.5 transition-colors",
                        passed
                          ? "text-green-600 dark:text-green-500"
                          : "text-muted-foreground"
                      )}
                    >
                      {passed ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      {requirementLabels[key as keyof typeof requirementLabels]}
                    </li>
                  ))}
                </motion.ul>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { PasswordInput };
