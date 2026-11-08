/**
 * Total CPP received between a claim age and a later age.
 *
 * Amounts are in today's dollars, so a claim age's monthly pension is constant
 * in real terms and the running total is a straight line from that claim age.
 * The money is assumed to be spent rather than invested, so no return is
 * added: the only thing that separates the claim ages is how many years of
 * pension each one collects.
 */

/** Total received by `age`, counting twelve payments a year after claiming. */
export function totalReceived(
  monthlyReal: number,
  claimAge: number,
  age: number,
): number {
  return 12 * monthlyReal * Math.max(0, age - claimAge)
}

/**
 * Age at which two claim ages have received the same total, solving
 *
 *   12 * monthlyA * (A - a) = 12 * monthlyB * (A - b)
 *
 * Returns Infinity when either pension is zero, or when the two are equal and
 * the lines are parallel.
 */
export function breakEvenAge(
  a: number,
  b: number,
  monthlyA: number,
  monthlyB: number,
): number {
  if (!(monthlyA > 0) || !(monthlyB > 0) || monthlyA === monthlyB) {
    return Infinity
  }
  return (monthlyA * a - monthlyB * b) / (monthlyA - monthlyB)
}
