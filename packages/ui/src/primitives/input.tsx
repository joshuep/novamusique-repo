'use client'

import {
  TextField,
  Label,
  Input as AriaInput,
  FieldError,
  Text,
  type TextFieldProps
} from 'react-aria-components'
import { cn } from '../utils/cn'

interface InputProps extends Omit<TextFieldProps, 'children'> {
  label?: string
  description?: string
  errorMessage?: string
  placeholder?: string
  className?: string
}

function Input({
  label,
  description,
  errorMessage,
  placeholder,
  className,
  ...props
}: InputProps) {
  return (
    <TextField className={cn('flex flex-col gap-1.5', className)} {...props}>
      {label && (
        <Label className="text-sm font-medium text-foreground">
          {label}
        </Label>
      )}
      <AriaInput
        placeholder={placeholder}
        className={cn(
          'h-11 w-full rounded-lg px-4 text-sm text-foreground',
          'bg-input border border-border',
          'placeholder:text-muted-foreground',
          'outline-none transition-all duration-200',
          'focus:border-flammeche focus:ring-2 focus:ring-flammeche/20',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      />
      {description && (
        <Text slot="description" className="text-xs text-muted-foreground">
          {description}
        </Text>
      )}
      <FieldError className="text-xs text-flammeche">
        {errorMessage}
      </FieldError>
    </TextField>
  )
}

export { Input }
export type { InputProps }
