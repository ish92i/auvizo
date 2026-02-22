import { useState, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type MaintenanceSource =
  | 'inspection_flagged'
  | 'preventive_time'
  | 'preventive_hours'

type MaintenanceFormProps = {
  equipmentId?: string
  inspectionId?: string
  onSuccess: () => void
  onCancel: () => void
}

const SOURCE_LABELS: Record<MaintenanceSource, string> = {
  inspection_flagged: 'Flagged from Inspection',
  preventive_time: 'Preventive (Time-based)',
  preventive_hours: 'Preventive (Hours-based)',
}

export function MaintenanceForm({
  equipmentId: preSelectedEquipmentId,
  inspectionId: preSelectedInspectionId,
  onSuccess,
  onCancel,
}: MaintenanceFormProps) {
  const equipment = useQuery(api.equipment.getAll)
  const createMaintenance = useMutation(api.maintenance.create)

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    preSelectedEquipmentId ?? '',
  )
  const [source, setSource] = useState<MaintenanceSource>(
    preSelectedInspectionId ? 'inspection_flagged' : 'preventive_time',
  )
  const [workOrder, setWorkOrder] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!selectedEquipmentId || !workOrder.trim()) {
        return
      }

      setIsSubmitting(true)
      try {
        await createMaintenance({
          equipmentId: selectedEquipmentId as any,
          source,
          inspectionId: preSelectedInspectionId
            ? (preSelectedInspectionId as any)
            : undefined,
          workOrder: workOrder.trim(),
          assignedTo: assignedTo.trim() || undefined,
          notes: notes.trim() || undefined,
        })
        onSuccess()
      } catch (error) {
        console.error('Failed to create maintenance record:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      createMaintenance,
      selectedEquipmentId,
      source,
      preSelectedInspectionId,
      workOrder,
      assignedTo,
      notes,
      onSuccess,
    ],
  )

  const isLoading = equipment === undefined

  const canSubmit = selectedEquipmentId && workOrder.trim() && !isSubmitting

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Equipment
        </Label>
        <Select
          value={selectedEquipmentId}
          onValueChange={(v) => v && setSelectedEquipmentId(v)}
          disabled={!!preSelectedEquipmentId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select equipment" />
          </SelectTrigger>
          <SelectContent>
            {equipment?.map((eq) => (
              <SelectItem key={eq._id} value={eq._id}>
                {eq.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Source
        </Label>
        <Select
          value={source}
          onValueChange={(v) => setSource(v as MaintenanceSource)}
          disabled={!!preSelectedInspectionId}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Work Order *
        </Label>
        <Textarea
          value={workOrder}
          onChange={(e) => setWorkOrder(e.target.value)}
          placeholder="Describe the maintenance work required..."
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Assigned To
        </Label>
        <Input
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          placeholder="Technician or team name"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Notes
        </Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Create Work Order'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
