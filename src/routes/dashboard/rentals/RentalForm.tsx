import { useState, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DialogFooter } from '@/components/ui/dialog'

type EquipmentCategory =
  | 'earthmoving'
  | 'mewp'
  | 'material_handling'
  | 'power_generation'
  | 'air_compressors'
  | 'lawn_garden'
  | 'compaction_paving'
  | 'concrete_masonry'
  | 'lighting'
  | 'trucks_transportation'

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  earthmoving: 'Earthmoving',
  mewp: 'MEWP',
  material_handling: 'Material Handling',
  power_generation: 'Power Generation',
  air_compressors: 'Air Compressors',
  lawn_garden: 'Lawn & Garden',
  compaction_paving: 'Compaction & Paving',
  concrete_masonry: 'Concrete & Masonry',
  lighting: 'Lighting',
  trucks_transportation: 'Trucks & Transportation',
}

function formatDateForInput(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd')
}

function parseDateFromInput(dateString: string): number {
  return new Date(dateString).getTime()
}

export function RentalForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const availableEquipment = useQuery(api.equipment.getAvailable)
  const customers = useQuery(api.customers.getAll)
  const createCustomer = useMutation(api.customers.create)
  const createRental = useMutation(api.rentals.create)

  const [equipmentId, setEquipmentId] = useState<string>('')
  const [customerId, setCustomerId] = useState<string>('')
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()
  const [startDate, setStartDate] = useState(formatDateForInput(todayTimestamp))
  const [endDate, setEndDate] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)

  const handleCustomerSelect = useCallback((value: string | null) => {
    if (!value) return
    if (value === 'add_new') {
      setShowNewCustomerForm(true)
      setCustomerId('')
    } else {
      setShowNewCustomerForm(false)
      setCustomerId(value)
    }
  }, [])

  const handleCreateCustomer = useCallback(async () => {
    if (!newCustomerName.trim()) return

    setIsCreatingCustomer(true)
    try {
      const id = await createCustomer({
        name: newCustomerName.trim(),
        email: newCustomerEmail.trim() || undefined,
        phone: newCustomerPhone.trim() || undefined,
      })
      setCustomerId(id)
      setShowNewCustomerForm(false)
      setNewCustomerName('')
      setNewCustomerEmail('')
      setNewCustomerPhone('')
    } catch (error) {
      console.error('Failed to create customer:', error)
    } finally {
      setIsCreatingCustomer(false)
    }
  }, [createCustomer, newCustomerName, newCustomerEmail, newCustomerPhone])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!equipmentId || !customerId || !startDate || !endDate || !dailyRate) {
        return
      }

      const startTimestamp = parseDateFromInput(startDate)
      const endTimestamp = parseDateFromInput(endDate)

      if (endTimestamp <= startTimestamp) {
        return
      }

      setIsSubmitting(true)
      try {
        await createRental({
          equipmentId: equipmentId as any,
          customerId: customerId as any,
          startDate: startTimestamp,
          endDate: endTimestamp,
          dailyRate: parseFloat(dailyRate),
          notes: notes.trim() || undefined,
        })
        onSuccess()
      } catch (error) {
        console.error('Failed to create rental:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      createRental,
      equipmentId,
      customerId,
      startDate,
      endDate,
      dailyRate,
      notes,
      onSuccess,
    ],
  )

  const isLoading = availableEquipment === undefined || customers === undefined

  const startTimestamp = startDate ? parseDateFromInput(startDate) : 0
  const endTimestamp = endDate ? parseDateFromInput(endDate) : 0
  const isEndDateInvalid = endDate && endTimestamp <= startTimestamp

  const canSubmit =
    equipmentId &&
    customerId &&
    startDate &&
    endDate &&
    dailyRate &&
    !isEndDateInvalid &&
    !isSubmitting

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
        <label className="text-xs font-medium text-muted-foreground">
          Equipment
        </label>
        <Select
          value={equipmentId}
          onValueChange={(v) => v && setEquipmentId(v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select equipment" />
          </SelectTrigger>
          <SelectContent>
            {availableEquipment?.length === 0 ? (
              <SelectItem value="_none" disabled>
                No available equipment
              </SelectItem>
            ) : (
              availableEquipment?.map((equipment) => (
                <SelectItem key={equipment._id} value={equipment._id}>
                  <span className="font-medium">{equipment.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    ({CATEGORY_LABELS[equipment.category]})
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Customer
        </label>
        <Select value={customerId} onValueChange={handleCustomerSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add_new">+ Add New Customer</SelectItem>
            {customers?.map((customer: { _id: string; name: string }) => (
              <SelectItem key={customer._id} value={customer._id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showNewCustomerForm && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">New Customer</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNewCustomerForm(false)}
            >
              Cancel
            </Button>
          </div>
          <div className="space-y-2">
            <Input
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="Customer name *"
              required
            />
            <Input
              value={newCustomerEmail}
              onChange={(e) => setNewCustomerEmail(e.target.value)}
              placeholder="Email (optional)"
              type="email"
            />
            <Input
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              placeholder="Phone (optional)"
            />
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={handleCreateCustomer}
              disabled={!newCustomerName.trim() || isCreatingCustomer}
            >
              {isCreatingCustomer ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Create Customer'
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Start Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            End Date
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            required
          />
          {isEndDateInvalid && (
            <p className="text-xs text-destructive">
              End date must be after start date
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Daily Rate ($)
        </label>
        <Input
          type="number"
          value={dailyRate}
          onChange={(e) => setDailyRate(e.target.value)}
          placeholder="0"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Notes
        </label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
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
            'Create Rental'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
