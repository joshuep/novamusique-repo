'use client'

import React from "react"
import { cn } from '../utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full text-sm font-normal px-5 py-2.5 transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-transparent text-nova-text border border-white/30',
        flammeche: 'bg-transparent text-flammeche border border-flammeche/50',
        azur: 'bg-transparent text-azur border border-azur/50',
        soleil: 'bg-transparent text-soleil border border-soleil/50',
        filled: 'bg-white/10 text-nova-text border border-white/20 backdrop-blur-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode
  className?: string
}

function Badge({ children, variant, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))}>
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
export type { BadgeProps }
