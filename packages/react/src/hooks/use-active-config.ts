import { useActiveSelection } from './use-active-selection'
import { usePresetConfig } from './use-preset-config'

export function useActiveConfig() {
  const { active } = useActiveSelection()
  const presetId = active?.presetId ?? ''
  const { config } = usePresetConfig(presetId)
  return { config: active ? config : null }
}
