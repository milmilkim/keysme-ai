import { useEffect } from 'react'
import { useModels } from '@keysme-ai/react'

interface ModelPickerProps {
  providerId: string
  value: string
  onChange: (model: string) => void
}

export function ModelPicker({ providerId, value, onChange }: ModelPickerProps) {
  const { models, isLoading, error, refetch } = useModels(providerId)

  useEffect(() => {
    if (providerId) refetch()
  }, [providerId, refetch])

  if (!providerId) {
    return <input placeholder="Select provider first" disabled />
  }

  if (isLoading) {
    return <span className="card-detail">Loading models...</span>
  }

  if (error || models.length === 0) {
    return (
      <div className="form-row">
        <input
          className="input-grow"
          placeholder="Model name (manual)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button className="sm" type="button" onClick={refetch}>Retry</button>
        {error && <span className="status-error test-error-detail">{error.message}</span>}
      </div>
    )
  }

  return (
    <div className="form-row">
      <select className="input-grow" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select model</option>
        {models.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <button className="sm" type="button" onClick={refetch}>Refresh</button>
    </div>
  )
}
