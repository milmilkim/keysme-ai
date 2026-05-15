import { useState } from 'react'
import { useProviders, usePresets, useModelCapabilities } from '@keysme-ai/react'
import {
  REASONING_EFFORT,
  VERBOSITY,
  type GenerationParams,
  type ModelCapabilities,
  type ParamKey,
} from '@keysme-ai/core'
import { ModelPicker } from './ModelPicker'

interface Draft {
  name: string
  providerId: string
  model: string
  params: GenerationParams
}

const EMPTY: Draft = { name: '', providerId: '', model: '', params: {} }

function isSupported(param: ParamKey, caps: ModelCapabilities | null): boolean {
  if (!caps) return true
  if (caps.excludes?.includes(param)) return false
  if (caps.supports && !caps.supports.includes(param)) return false
  return true
}

export function PresetForm() {
  const { providers } = useProviders()
  const { addPreset } = usePresets()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const caps = useModelCapabilities(draft.model)

  const updateParam = <K extends keyof GenerationParams>(key: K, value: GenerationParams[K]) => {
    setDraft({ ...draft, params: { ...draft.params, [key]: value } })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.name || !draft.providerId || !draft.model) return
    await addPreset({
      id: crypto.randomUUID(),
      name: draft.name,
      providerId: draft.providerId,
      model: draft.model,
      params: draft.params,
    })
    setDraft(EMPTY)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <input
          className="input-name"
          placeholder="Preset name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <select
          value={draft.providerId}
          onChange={(e) => setDraft({ ...draft, providerId: e.target.value, model: '' })}
        >
          <option value="">Select provider</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="input-grow">
          <ModelPicker
            providerId={draft.providerId}
            value={draft.model}
            onChange={(model) => setDraft({ ...draft, model })}
          />
        </div>
        <button className="primary" type="submit">Add</button>
      </div>

      {caps && (
        <p className="hint">Capabilities loaded for "{draft.model}". Unsupported params are disabled.</p>
      )}

      <div className="params-panel">
        <NumberParam
          label="Temperature"
          value={draft.params.temperature}
          onChange={(v) => updateParam('temperature', v)}
          range={caps?.ranges?.temperature ?? [0, 2]}
          step={0.1}
          disabled={!isSupported('temperature', caps)}
        />
        <NumberParam
          label="Max tokens"
          value={draft.params.max_completion_tokens}
          onChange={(v) => updateParam('max_completion_tokens', v)}
          range={[1, 128000]}
          disabled={!isSupported('max_completion_tokens', caps)}
        />
        <NumberParam
          label="Top P"
          value={draft.params.top_p}
          onChange={(v) => updateParam('top_p', v)}
          range={caps?.ranges?.top_p ?? [0, 1]}
          step={0.05}
          disabled={!isSupported('top_p', caps)}
        />
        <SelectParam
          label="Reasoning"
          value={draft.params.reasoning_effort}
          options={REASONING_EFFORT}
          onChange={(v) => updateParam('reasoning_effort', v)}
          disabled={!isSupported('reasoning_effort', caps)}
        />
        <SelectParam
          label="Verbosity"
          value={draft.params.verbosity}
          options={VERBOSITY}
          onChange={(v) => updateParam('verbosity', v)}
          disabled={!isSupported('verbosity', caps)}
        />
      </div>
    </form>
  )
}

interface NumberParamProps {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  range: [number, number]
  step?: number
  disabled?: boolean
}

function NumberParam({ label, value, onChange, range, step, disabled }: NumberParamProps) {
  return (
    <label className={`param ${disabled ? 'param-disabled' : ''}`}>
      {label}
      <input
        type="number"
        min={range[0]}
        max={range[1]}
        step={step}
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    </label>
  )
}

interface SelectParamProps {
  label: string
  value: string | undefined
  options: readonly string[]
  onChange: (value: string | undefined) => void
  disabled?: boolean
}

function SelectParam({ label, value, options, onChange, disabled }: SelectParamProps) {
  return (
    <label className={`param ${disabled ? 'param-disabled' : ''}`}>
      {label}
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
      >
        <option value="">—</option>
        {options.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    </label>
  )
}
