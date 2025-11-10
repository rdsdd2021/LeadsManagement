'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Phone, School, MapPin, User, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface MobileLeadCardProps {
  lead: any
  selectable?: boolean
  selected?: boolean
  onSelect?: (id: string, checked: boolean) => void
}

export function MobileLeadCard({ lead, selectable, selected, onSelect }: MobileLeadCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header with name and checkbox */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-2 flex-1">
              {selectable && (
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => onSelect?.(lead.id, checked as boolean)}
                  className="mt-1"
                />
              )}
              <div>
                <h3 className="font-semibold text-base leading-tight">{lead.name}</h3>
                {lead.phone && (
                  <a 
                    href={`tel:${lead.phone}`}
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                  >
                    <Phone className="h-3 w-3" />
                    {lead.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="space-y-2 text-sm">
            {lead.school && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <School className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{lead.school}</span>
              </div>
            )}
            
            {lead.district && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{lead.district}</span>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
            {lead.gender && (
              <Badge variant="outline" className="text-xs">
                {lead.gender}
              </Badge>
            )}
            {lead.stream && (
              <Badge variant="outline" className="text-xs">
                {lead.stream}
              </Badge>
            )}
            {lead.assigned_user ? (
              <Badge variant="secondary" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                {lead.assigned_user.name || lead.assigned_user.email}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Unassigned
              </Badge>
            )}
          </div>

          {/* Assignment date */}
          {lead.assignment_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <Calendar className="h-3 w-3" />
              {new Date(lead.assignment_date).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
