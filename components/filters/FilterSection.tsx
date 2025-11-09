'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, X } from 'lucide-react'
import { useState } from 'react'

interface FilterSectionProps {
  title: string
  options: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  isLoading?: boolean
  counts?: Record<string, number>
}

export function FilterSection({
  title,
  options,
  selectedValues,
  onChange,
  isLoading = false,
  counts = {},
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  const handleToggle = (option: string) => {
    // Optimistic update - UI responds immediately
    if (selectedValues.includes(option)) {
      // Remove from selected
      onChange(selectedValues.filter((v) => v !== option))
    } else {
      // Add to selected
      onChange([...selectedValues, option])
    }
  }

  const handleClearSection = () => {
    onChange([])
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center justify-between w-full p-0 hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{title}</span>
              {selectedValues.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedValues.length}
                </Badge>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </Button>
        </CollapsibleTrigger>

        {selectedValues.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSection}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      <CollapsibleContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-2">
            Loading options...
          </div>
        ) : options.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2">
            No options available
          </div>
        ) : (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-2">
              {options.map((option) => {
                  const count = counts[option] || 0
                  return (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${title}-${option}`}
                        checked={selectedValues.includes(option)}
                        onCheckedChange={() => handleToggle(option)}
                      />
                      <Label
                        htmlFor={`${title}-${option}`}
                        className="text-sm font-normal cursor-pointer flex-1 flex items-center justify-between"
                      >
                        <span>{option}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({count})
                        </span>
                      </Label>
                    </div>
                  )
                })}
            </div>
          </ScrollArea>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}