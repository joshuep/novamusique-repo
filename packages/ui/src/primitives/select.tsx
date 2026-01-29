'use client'

import {
  Select as AriaSelect,
  SelectValue,
  Label,
  Button,
  Popover,
  ListBox,
  ListBoxItem,
  type SelectProps as AriaSelectProps,
} from 'react-aria-components'
import { ChevronDown } from 'lucide-react'
import { cn } from '../utils/cn'

interface SelectOption {
  id: string
  label: string
}

interface SelectProps extends Omit<AriaSelectProps<SelectOption>, 'children'> {
  label?: string
  options: SelectOption[]
  placeholder?: string
  className?: string
}

function Select({
  label,
  options,
  placeholder = 'Sélectionner...',
  className,
  ...props
}: SelectProps) {
  return (
    <AriaSelect className={cn('flex flex-col gap-1.5', className)} {...props}>
      {label && (
        <Label className="text-sm font-medium text-foreground">
          {label}
        </Label>
      )}
      <Button
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-lg px-4 text-sm',
          'bg-input border border-border text-foreground',
          'outline-none transition-all duration-200',
          'focus:border-flammeche focus:ring-2 focus:ring-flammeche/20',
          'cursor-pointer'
        )}
      >
        <SelectValue className="text-left flex-1 truncate placeholder:text-muted-foreground">
          {({ selectedText }) => selectedText || <span className="text-muted-foreground">{placeholder}</span>}
        </SelectValue>
        <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
      </Button>
      <Popover
        className={cn(
          'w-[var(--trigger-width)] glass-card p-1 overflow-hidden',
          'entering:animate-in entering:fade-in entering:zoom-in-95',
          'exiting:animate-out exiting:fade-out exiting:zoom-out-95'
        )}
      >
        <ListBox className="outline-none max-h-60 overflow-auto">
          {options.map((option) => (
            <ListBoxItem
              key={option.id}
              id={option.id}
              textValue={option.label}
              className={cn(
                'px-3 py-2 text-sm rounded-md cursor-pointer outline-none',
                'text-foreground transition-colors',
                'hover:bg-flammeche/20',
                'focus:bg-flammeche/20',
                'selected:bg-flammeche selected:text-nova-bg'
              )}
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  )
}

export { Select }
export type { SelectProps, SelectOption }
