import type {
  GenerationParams,
  ModelCapabilities,
  ModelCapabilitiesRegistry,
  ParamKey,
} from '../types'

export type ValidationIssueKind = 'unsupported' | 'excluded' | 'out_of_range'

export interface ValidationIssue {
  kind: ValidationIssueKind
  param: ParamKey
  message: string
  value?: unknown
}

export function getModelCapabilities(
  model: string,
  registry: ModelCapabilitiesRegistry | undefined,
): ModelCapabilities | null {
  if (!registry) return null
  return registry[model] ?? null
}

export function validateParams(
  params: GenerationParams | undefined,
  capabilities: ModelCapabilities | null | undefined,
): ValidationIssue[] {
  if (!params || !capabilities) return []

  const issues: ValidationIssue[] = []
  const entries = Object.entries(params) as Array<[ParamKey, unknown]>

  for (const [param, value] of entries) {
    if (value === undefined) continue

    if (capabilities.excludes?.includes(param)) {
      issues.push({
        kind: 'excluded',
        param,
        value,
        message: `Param "${param}" is not allowed for this model`,
      })
      continue
    }

    if (capabilities.supports && !capabilities.supports.includes(param)) {
      issues.push({
        kind: 'unsupported',
        param,
        value,
        message: `Param "${param}" is not supported by this model`,
      })
      continue
    }

    const range = capabilities.ranges?.[param]
    if (range && typeof value === 'number') {
      const [min, max] = range
      if (value < min || value > max) {
        issues.push({
          kind: 'out_of_range',
          param,
          value,
          message: `Param "${param}" must be between ${min} and ${max} (got ${value})`,
        })
      }
    }
  }

  return issues
}
