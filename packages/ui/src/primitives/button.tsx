'use client'

import React from "react"
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'
import { cn } from '../utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-normal transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-nova-bg disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-white/10 text-nova-text border border-white/20 hover:bg-white/15 hover:border-white/30 backdrop-blur-sm focus-visible:ring-white/50',
        outline:
          'bg-transparent text-nova-text border border-white/30 hover:bg-white/5 hover:border-white/40 focus-visible:ring-white/50',
        ghost:
          'bg-transparent text-nova-text hover:text-white focus-visible:ring-white/50',
        flammeche:
          'bg-flammeche/15 text-flammeche border border-flammeche/30 hover:bg-flammeche/25 focus-visible:ring-flammeche',
        azur:
          'bg-azur/15 text-azur border border-azur/30 hover:bg-azur/25 focus-visible:ring-azur',
        soleil:
          'bg-soleil/15 text-soleil border border-soleil/30 hover:bg-soleil/25 focus-visible:ring-soleil',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps extends AriaButtonProps, VariantProps<typeof buttonVariants> {
  className?: string
  children: React.ReactNode
}

function Button({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </AriaButton>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
