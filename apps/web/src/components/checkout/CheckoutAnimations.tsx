import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface CheckoutAnimationProps {
  children: ReactNode;
  delay?: number;
}

export const CheckoutAnimation = ({ children, delay = 0 }: CheckoutAnimationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  );
};

export const CheckoutStepAnimation = ({ children }: CheckoutAnimationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
};

export const CheckoutProgressAnimation = ({ children }: CheckoutAnimationProps) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export const CheckoutSuccessAnimation = ({ children }: CheckoutAnimationProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        duration: 0.6, 
        ease: "easeOut",
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
    >
      {children}
    </motion.div>
  );
};

export const CheckoutErrorAnimation = ({ children }: CheckoutAnimationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export const CheckoutLoadingAnimation = ({ children }: CheckoutAnimationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

export const CheckoutFormAnimation = ({ children }: CheckoutAnimationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export const CheckoutCardAnimation = ({ children, index = 0 }: CheckoutAnimationProps & { index?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
};

export const CheckoutStaggerAnimation = ({ children }: CheckoutAnimationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.3,
        staggerChildren: 0.1
      }}
    >
      {children}
    </motion.div>
  );
};

export const CheckoutStaggerItem = ({ children }: CheckoutAnimationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

