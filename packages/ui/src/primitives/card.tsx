'use client'

import React from "react"
import { cn } from '../utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  accent?: 'flammeche' | 'azur' | 'soleil' | 'none'
  hoverable?: boolean
}

function Card({
  children,
  className,
  accent = 'none',
  hoverable = false
}: CardProps) {
  const accentClasses = {
    flammeche: 'glass-card-flammeche',
    azur: 'glass-card-azur',
    soleil: 'border-l-3 border-l-soleil glass-card',
    none: 'glass-card',
  }

  return (
    <div
      className={cn(
        accentClasses[accent],
        'p-6',
        hoverable && 'transition-all duration-300 hover:scale-[1.02] hover:border-flammeche/30',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-xl font-bold text-foreground', className)}>
      {children}
    </h3>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('text-muted-foreground', className)}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardContent }
export type { CardProps, CardHeaderProps, CardTitleProps, CardContentProps }
