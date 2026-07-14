"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** Normalize time string: "1" → "1:00", "13" → "13:00", "1:30" → "1:30" */
function normalizeTimeString(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""

  if (trimmed.includes(":")) {
    const [h, m] = trimmed.split(":")
    const hour = Math.min(23, Math.max(0, parseInt(h || "0", 10) || 0))
    const min = Math.min(59, Math.max(0, parseInt(m || "0", 10) || 0))
    return `${hour}:${String(min).padStart(2, "0")}`
  }

  const num = parseInt(trimmed, 10)
  if (Number.isNaN(num)) return ""
  const hour = Math.min(23, Math.max(0, num))
  return `${hour}:00`
}

export interface TimeInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value?: string
  onChange?: (value: string) => void
}

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, value = "", onChange, onBlur, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value)

    React.useEffect(() => {
      setInternalValue(value)
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      if (v === "" || /^\d{0,2}(:\d{0,2})?$/.test(v)) {
        setInternalValue(v)
        onChange?.(v)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const normalized = normalizeTimeString(internalValue)
      if (normalized !== internalValue) {
        setInternalValue(normalized)
        onChange?.(normalized)
      }
      onBlur?.(e)
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder="0:00"
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(className)}
        {...props}
      />
    )
  },
)

TimeInput.displayName = "TimeInput"

export { TimeInput, normalizeTimeString }
