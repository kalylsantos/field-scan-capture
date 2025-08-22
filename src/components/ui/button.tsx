import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 smooth-transition",
  {
    variants: {
      variant: {
        default: "scanner-gradient text-white hover:scale-[1.02] hover:glow-shadow rounded-xl font-semibold",
        destructive: "danger-gradient text-white hover:scale-[1.02] hover:opacity-90 rounded-xl font-semibold",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-xl",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl font-semibold",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
        success: "success-gradient text-white hover:scale-[1.02] hover:glow-shadow rounded-xl font-semibold",
        warning: "warning-gradient text-white hover:scale-[1.02] hover:opacity-90 rounded-xl font-semibold",
        scanner: "scanner-gradient text-white hover:scale-[1.02] elegant-shadow rounded-xl font-bold",
        camera: "bg-white/20 text-white border border-white/30 hover:bg-white/30 backdrop-blur-sm rounded-full",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-xl px-4",
        lg: "h-14 rounded-xl px-8 text-base",
        icon: "h-12 w-12 rounded-full",
        xl: "h-16 rounded-xl px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
