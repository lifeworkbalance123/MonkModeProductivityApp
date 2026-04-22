export type ProgramType = 'sprint_standard' | 'sprint_monk' | 'transform'

export type ProgramCatalogItem = {
  program_type: ProgramType
  label: string
  duration: string
  price: string
  intensity: 'Medium' | 'High'
  benefit: string
  icon: string
  color: 'blue' | 'purple' | 'green'
  totalDays: number
}

export const PROGRAM_CATALOG: ProgramCatalogItem[] = [
  {
    program_type: 'sprint_standard',
    label: 'Sprint',
    duration: '30 days',
    price: '$29.99',
    intensity: 'Medium',
    benefit: 'Build focus stamina with a daily execution rhythm.',
    icon: '⚡',
    color: 'blue',
    totalDays: 30,
  },
  {
    program_type: 'sprint_monk',
    label: 'Monk Mode',
    duration: '21 days',
    price: '$19.99',
    intensity: 'High',
    benefit: 'Crush a deadline with 2-4 hours of daily deep work.',
    icon: '🧘',
    color: 'purple',
    totalDays: 21,
  },
  {
    program_type: 'transform',
    label: 'Transform',
    duration: '60 days',
    price: '$49.99',
    intensity: 'Medium',
    benefit: 'Lasting discipline and identity change.',
    icon: '🎯',
    color: 'green',
    totalDays: 60,
  },
]

export function getProgramButtonText(programType: ProgramType | null | undefined): string {
  switch (programType) {
    case 'sprint_standard':
      return 'Sprint'
    case 'sprint_monk':
      return 'Monk Mode'
    case 'transform':
      return 'Transform'
    default:
      return 'Begin'
  }
}

