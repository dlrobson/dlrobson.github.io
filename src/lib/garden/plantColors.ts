export const FALLBACK_COLOR = '#d1d5db'

export const plantColors: Record<string, string> = {
  // Flowers / border
  Calendula: '#f59e0b',
  Chamomile: '#fde68a',

  // Peas
  'Trellis Peas': '#4ade80',
  'Bush Peas': '#86efac',

  // Leafy greens
  'Kale + Dill': '#16a34a',
  'Bok Choy': '#34d399',

  // Squash / root
  'Zucchini + Radish': '#fb923c',
  Carrots: '#f97316',

  // Alliums
  Garlic: '#c084fc',
  Chives: '#e9d5ff',
  'Green Onion': '#d8b4fe',

  // Herbs
  Dill: '#a3e635',
  Basil: '#84cc16',
  Cilantro: '#bef264',
  Rosemary: '#94a3b8',
  Thyme: '#cbd5e1',

  // Companion
  Nasturtiums: '#f87171',

  // Peppers
  Jalapeno: '#15803d',
}

export function getPlantColor(plant: string): string {
  return plantColors[plant] ?? FALLBACK_COLOR
}
