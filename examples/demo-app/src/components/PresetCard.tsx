import type { Preset } from '@keysme-ai/core'

interface PresetCardProps {
  preset: Preset
  isActive: boolean
  onSetActive: () => void
  onRemove: () => void
}

export function PresetCard({ preset, isActive, onSetActive, onRemove }: PresetCardProps) {
  const params = formatParams(preset.params)

  return (
    <div className="card">
      <span className="card-name">{preset.name}</span>
      <span className="card-detail">{preset.model}</span>
      {params && <span className="card-detail">{params}</span>}
      <button className={isActive ? 'sm active' : 'sm'} onClick={onSetActive}>
        {isActive ? 'Active' : 'Set Active'}
      </button>
      <button className="sm delete" onClick={onRemove}>Delete</button>
    </div>
  )
}

function formatParams(params: Preset['params']): string {
  if (!params) return ''
  return Object.entries(params)
    .filter(([key, value]) => value !== undefined && key !== 'extraBody')
    .map(([key, value]) => `${key}=${value}`)
    .join(' · ')
}
