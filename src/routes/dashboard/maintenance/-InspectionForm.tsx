import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Loader2, Upload, X } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { DEFAULT_CHECKLIST_ITEMS } from '../../../../convex/inspections'

type InspectionType = 'pre_rental' | 'post_rental' | 'routine'
type ChecklistStatus = 'ok' | 'needs_attention' | 'not_applicable'
type OverallCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'

type ChecklistResult = {
  item: string
  status: ChecklistStatus
  notes?: string
}

type InspectionFormProps = {
  equipmentId?: string
  rentalId?: string
  type?: InspectionType
  onSuccess: () => void
  onCancel: () => void
}

const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  pre_rental: 'Pre-Rental',
  post_rental: 'Post-Rental',
  routine: 'Routine',
}

const CONDITION_OPTIONS: { value: OverallCondition; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'damaged', label: 'Damaged' },
]

export function InspectionForm({
  equipmentId: preSelectedEquipmentId,
  rentalId: preSelectedRentalId,
  type: preSelectedType,
  onSuccess,
  onCancel,
}: InspectionFormProps) {
  const equipment = useQuery(api.equipment.getAll)
  const createInspection = useMutation(api.inspections.create)
  const generateUploadUrl = useMutation(api.inspections.generateUploadUrl)

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    preSelectedEquipmentId ?? '',
  )
  const [inspectionType, setInspectionType] = useState<InspectionType>(
    preSelectedType ?? 'routine',
  )
  const [selectedRentalId, setSelectedRentalId] = useState<string>(
    preSelectedRentalId ?? '',
  )

  const initialChecklist = DEFAULT_CHECKLIST_ITEMS.map((item) => ({
    item,
    status: 'ok' as ChecklistStatus,
    notes: '',
  }))

  const [checklistResults, setChecklistResults] =
    useState<ChecklistResult[]>(initialChecklist)
  const [overallCondition, setOverallCondition] =
    useState<OverallCondition>('good')
  const [damageFound, setDamageFound] = useState(false)
  const [damageDescription, setDamageDescription] = useState('')
  const [damageCost, setDamageCost] = useState('')
  const [maintenanceRequired, setMaintenanceRequired] = useState(false)
  const [maintenanceNotes, setMaintenanceNotes] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateChecklistItem = useCallback(
    (index: number, field: 'status' | 'notes', value: string) => {
      setChecklistResults((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], [field]: value }
        return updated
      })
    },
    [],
  )

  const handlePhotoUpload = useCallback(async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const { storageId } = await result.json()
      setPhotos((prev) => [...prev, storageId])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Failed to upload photo:', error)
    } finally {
      setIsUploading(false)
    }
  }, [generateUploadUrl])

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!selectedEquipmentId) {
        return
      }

      setIsSubmitting(true)
      try {
        await createInspection({
          equipmentId: selectedEquipmentId as any,
          type: inspectionType,
          rentalId: selectedRentalId ? (selectedRentalId as any) : undefined,
          checklistResults: checklistResults.map((r) => ({
            item: r.item,
            status: r.status,
            notes: r.notes || undefined,
          })),
          overallCondition,
          damageFound,
          damageDescription: damageFound
            ? damageDescription || undefined
            : undefined,
          damageCost:
            damageFound && damageCost ? parseFloat(damageCost) : undefined,
          maintenanceRequired,
          maintenanceNotes: maintenanceRequired
            ? maintenanceNotes || undefined
            : undefined,
          photos: photos.length > 0 ? (photos as any[]) : undefined,
        })
        onSuccess()
      } catch (error) {
        console.error('Failed to create inspection:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      createInspection,
      selectedEquipmentId,
      inspectionType,
      selectedRentalId,
      checklistResults,
      overallCondition,
      damageFound,
      damageDescription,
      damageCost,
      maintenanceRequired,
      maintenanceNotes,
      photos,
      onSuccess,
    ],
  )

  const isLoading = equipment === undefined

  const canSubmit = selectedEquipmentId && !isSubmitting

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
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
            Inspection Type
          </Label>
          <Select
            value={inspectionType}
            onValueChange={(v) => setInspectionType(v as InspectionType)}
            disabled={!!preSelectedType}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(INSPECTION_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground">
          Checklist
        </Label>
        <div className="rounded-lg border">
          <div className="grid grid-cols-[1fr,auto,auto,auto,1fr] gap-2 border-b bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
            <span>Item</span>
            <span className="text-center">OK</span>
            <span className="text-center">Attention</span>
            <span className="text-center">N/A</span>
            <span>Notes</span>
          </div>
          {checklistResults.map((result, index) => (
            <div
              key={result.item}
              className="grid grid-cols-[1fr,auto,auto,auto,1fr] gap-2 border-b px-3 py-2 last:border-0"
            >
              <span className="text-sm font-medium">{result.item}</span>
              <div className="flex justify-center">
                <Checkbox
                  checked={result.status === 'ok'}
                  onCheckedChange={() =>
                    updateChecklistItem(index, 'status', 'ok')
                  }
                />
              </div>
              <div className="flex justify-center">
                <Checkbox
                  checked={result.status === 'needs_attention'}
                  onCheckedChange={() =>
                    updateChecklistItem(index, 'status', 'needs_attention')
                  }
                />
              </div>
              <div className="flex justify-center">
                <Checkbox
                  checked={result.status === 'not_applicable'}
                  onCheckedChange={() =>
                    updateChecklistItem(index, 'status', 'not_applicable')
                  }
                />
              </div>
              <Input
                value={result.notes ?? ''}
                onChange={(e) =>
                  updateChecklistItem(index, 'notes', e.target.value)
                }
                placeholder="Notes..."
                className="h-8"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Overall Condition
        </Label>
        <div className="flex flex-wrap gap-2">
          {CONDITION_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={
                overallCondition === option.value ? 'default' : 'outline'
              }
              size="sm"
              onClick={() => setOverallCondition(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={damageFound}
            onCheckedChange={(checked) => setDamageFound(checked as boolean)}
            id="damage-found"
          />
          <Label htmlFor="damage-found" className="text-sm font-medium">
            Damage Found
          </Label>
        </div>

        {damageFound && (
          <div className="space-y-3 pl-6">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Damage Description
              </Label>
              <Textarea
                value={damageDescription}
                onChange={(e) => setDamageDescription(e.target.value)}
                placeholder="Describe the damage..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Estimated Repair Cost ($)
              </Label>
              <Input
                type="number"
                value={damageCost}
                onChange={(e) => setDamageCost(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={maintenanceRequired}
            onCheckedChange={(checked) =>
              setMaintenanceRequired(checked as boolean)
            }
            id="maintenance-required"
          />
          <Label htmlFor="maintenance-required" className="text-sm font-medium">
            Maintenance Required
          </Label>
        </div>

        {maintenanceRequired && (
          <div className="space-y-2 pl-6">
            <Label className="text-xs text-muted-foreground">
              Maintenance Notes
            </Label>
            <Textarea
              value={maintenanceNotes}
              onChange={(e) => setMaintenanceNotes(e.target.value)}
              placeholder="Describe required maintenance..."
              rows={2}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground">
          Photos
        </Label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload Photo
          </Button>
          <span className="text-xs text-muted-foreground">
            {photos.length} photo(s) uploaded
          </span>
        </div>
        {photos.length > 0 && (
          <div className="flex gap-2">
            {photos.map((photoId, index) => (
              <div
                key={photoId}
                className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
              >
                Photo {index + 1}
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Create Inspection'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
