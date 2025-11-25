// 🎯 Floating Label Input with Real-time Validation
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "../../utils/cn";
import { springConfigs } from "../../utils/springConfigs";

interface FloatingInputProps {
  label: string;
  type?: "text" | "email" | "password" | "tel" | "number" | "url";
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  mask?: (value: string) => string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
}

export const FloatingInput = ({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  success,
  disabled = false,
  required = false,
  placeholder,
  className,
  autoComplete,
  maxLength,
  minLength,
  pattern,
  mask,
  validation
}: FloatingInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Real-time validation
  const validateInput = (inputValue: string) => {
    if (!validation) return null;

    const { required, minLength, maxLength, pattern, custom } = validation;

    if (required && !inputValue.trim()) {
      return "Dieses Feld ist erforderlich";
    }

    if (minLength && inputValue.length < minLength) {
      return `Mindestens ${minLength} Zeichen erforderlich`;
    }

    if (maxLength && inputValue.length > maxLength) {
      return `Maximal ${maxLength} Zeichen erlaubt`;
    }

    if (pattern && !pattern.test(inputValue)) {
      return "Ungültiges Format";
    }

    if (custom) {
      return custom(inputValue);
    }

    return null;
  };

  // Debounced validation
  const handleValidation = (inputValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsValidating(true);
    
    timeoutRef.current = setTimeout(() => {
      const validationError = validateInput(inputValue);
      setInternalError(validationError);
      setIsValidating(false);
    }, 300);
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Apply mask if provided
    if (mask) {
      inputValue = mask(inputValue);
    }
    
    onChange(inputValue);
    
    // Real-time validation
    if (validation) {
      handleValidation(inputValue);
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
    
    // Final validation on blur
    if (validation) {
      const validationError = validateInput(value);
      setInternalError(validationError);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const hasValue = value.length > 0;
  const hasError = error || internalError;
  const isSuccess = success || (hasValue && !hasError && !isValidating);
  const inputType = type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "relative rounded-xl border-2 transition-all duration-200",
          "bg-slate-800/50 backdrop-blur-sm",
          isFocused && "border-accent shadow-lg shadow-accent/25",
          hasError && "border-red-500 shadow-lg shadow-red-500/25",
          isSuccess && "border-green-500 shadow-lg shadow-green-500/25",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          placeholder={isFocused ? placeholder : ""}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          className={cn(
            "w-full px-4 pt-6 pb-2 bg-transparent text-white",
            "placeholder:text-transparent focus:outline-none",
            "disabled:cursor-not-allowed"
          )}
        />
        
        {/* Floating Label */}
        <motion.label
          className={cn(
            "absolute left-4 transition-all duration-200 pointer-events-none",
            "text-gray-400",
            (isFocused || hasValue) && "text-accent",
            hasError && "text-red-400",
            isSuccess && "text-green-400"
          )}
          animate={{
            y: (isFocused || hasValue) ? -8 : 0,
            scale: (isFocused || hasValue) ? 0.85 : 1,
            x: (isFocused || hasValue) ? -4 : 0
          }}
          transition={springConfigs.gentle}
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </motion.label>

        {/* Right Icons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Password Toggle */}
          {type === "password" && (
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </motion.button>
          )}

          {/* Validation Icons */}
          <AnimatePresence>
            {isValidating && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isSuccess && !isValidating && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={springConfigs.bouncy}
              >
                <CheckCircle className="w-4 h-4 text-green-400" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {hasError && !isValidating && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={springConfigs.bouncy}
              >
                <AlertCircle className="w-4 h-4 text-red-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={springConfigs.gentle}
            className="mt-2 flex items-center gap-2 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error || internalError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Input Masks
export const inputMasks = {
  phone: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return match[1] + (match[2] ? `-${match[2]}` : '') + (match[3] ? `-${match[3]}` : '');
    }
    return cleaned;
  },
  
  postalCode: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.slice(0, 5);
  },
  
  creditCard: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (match) {
      return match[1] + (match[2] ? ` ${match[2]}` : '') + (match[3] ? ` ${match[3]}` : '') + (match[4] ? ` ${match[4]}` : '');
    }
    return cleaned;
  }
};

// Validation Rules
export const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Bitte gib eine gültige E-Mail-Adresse ein"
  },
  
  phone: {
    pattern: /^[\d\-\s\(\)]+$/,
    message: "Bitte gib eine gültige Telefonnummer ein"
  },
  
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: "Passwort muss mindestens 8 Zeichen, Groß- und Kleinbuchstaben sowie Zahlen enthalten"
  },
  
  required: {
    required: true,
    message: "Dieses Feld ist erforderlich"
  }
};




