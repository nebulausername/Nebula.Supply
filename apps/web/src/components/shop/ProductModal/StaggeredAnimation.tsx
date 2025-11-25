import { memo, ReactNode, Children, isValidElement, cloneElement } from "react";

interface StaggeredAnimationProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "fade";
}

// 🎯 Staggered Animation Container für Listen
export const StaggeredAnimation = memo(({ 
  children, 
  staggerDelay = 100,
  className = "",
  direction = "up"
}: StaggeredAnimationProps) => {
  const childrenArray = Children.toArray(children);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => {
        if (isValidElement(child)) {
          return cloneElement(child, {
            ...child.props,
            style: {
              ...child.props.style,
              animationDelay: `${index * staggerDelay}ms`
            },
            className: `${child.props.className || ''} animate-in ${
              direction === "up" ? "slide-in-from-bottom-4" :
              direction === "down" ? "slide-in-from-top-4" :
              direction === "left" ? "slide-in-from-right-4" :
              direction === "right" ? "slide-in-from-left-4" :
              "fade-in"
            } fade-in duration-300 ease-out`
          });
        }
        return child;
      })}
    </div>
  );
});

StaggeredAnimation.displayName = 'StaggeredAnimation';
