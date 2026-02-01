import { useMemo } from "react"
import type { Control, FieldValues, Path } from "react-hook-form"

import type { PositionPublic } from "@/client"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const DEFAULT_POSITION_NAME = "Без должности"

interface PositionSelectProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: Path<TFieldValues>
  positions: PositionPublic[]
  label?: string
  placeholder?: string
  isRequired?: boolean
}

function PositionSelect<TFieldValues extends FieldValues>({
  control,
  name,
  positions,
  label = "Должность",
  placeholder = "Выберите должность",
  isRequired = false,
}: PositionSelectProps<TFieldValues>) {
  const orderedPositions = useMemo(() => {
    if (positions.length === 0) return []
    const fallback = positions.filter(
      (position) => position.name !== DEFAULT_POSITION_NAME
    )
    const defaultPosition = positions.find(
      (position) => position.name === DEFAULT_POSITION_NAME
    )
    return defaultPosition ? [defaultPosition, ...fallback] : fallback
  }, [positions])

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {isRequired ? <span className="text-destructive">*</span> : null}
          </FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {orderedPositions.map((position) => (
                <SelectItem key={position.id} value={position.id}>
                  {position.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default PositionSelect
