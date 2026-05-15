export const REASONING_EFFORT = ['none', 'minimal', 'low', 'medium', 'high'] as const
export type ReasoningEffort = (typeof REASONING_EFFORT)[number]

export const VERBOSITY = ['low', 'medium', 'high'] as const
export type Verbosity = (typeof VERBOSITY)[number]
