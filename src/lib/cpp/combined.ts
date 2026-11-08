/**
 * The two pensions added together: the monthly and annual total, the split
 * between them, and the heading that says what is being counted.
 *
 * A pension only counts when its own half of the form is usable, so a problem
 * in one half cannot be papered over by the other half's figure.
 */

export interface CombinedInput {
  readonly cppMonthly: number
  readonly oasMonthly: number
  readonly cppAge: number
  readonly oasAge: number
  readonly cppAvailable: boolean
  readonly oasAvailable: boolean
}

export interface Combined {
  readonly cpp: number
  readonly oas: number
  readonly monthly: number
  readonly annual: number
  readonly label: string
  readonly cppShare: number
  readonly oasShare: number
  /** Whether both halves contributed, so a total can be shown at all. */
  readonly available: boolean
  /** Which half to fix when it cannot. */
  readonly missing: string
}

/**
 * The heading, naming the age the pension that pays actually starts at. Two
 * pensions paying at different ages only both arrive at the later one.
 */
function combinedLabel(
  cpp: number,
  oas: number,
  cppAge: number,
  oasAge: number,
): string {
  if (cpp > 0 && oas > 0) {
    return `From age ${Math.max(cppAge, oasAge)}, once both are paying`
  }
  if (cpp > 0) return `CPP only, from age ${cppAge}`
  if (oas > 0) return `OAS only, from age ${oasAge}`
  return 'Neither pension pays with these inputs'
}

export function combine(input: CombinedInput): Combined {
  const cpp = input.cppAvailable ? input.cppMonthly : 0
  const oas = input.oasAvailable ? input.oasMonthly : 0
  const monthly = cpp + oas
  const missing = !input.cppAvailable
    ? input.oasAvailable
      ? 'CPP'
      : 'CPP and OAS'
    : 'OAS'
  return {
    cpp,
    oas,
    monthly,
    annual: monthly * 12,
    label: combinedLabel(cpp, oas, input.cppAge, input.oasAge),
    cppShare: monthly > 0 ? (cpp / monthly) * 100 : 0,
    oasShare: monthly > 0 ? (oas / monthly) * 100 : 0,
    available: input.cppAvailable && input.oasAvailable,
    missing,
  }
}
