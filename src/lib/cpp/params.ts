/**
 * Year's Maximum Pensionable Earnings (YMPE) and the second ceiling (YAMPE).
 *
 * Published amounts from the Canada Revenue Agency. Add a row when a new year
 * is published; `project()` extends the table for claim years past it. YAMPE
 * starts in 2024, when the second additional contribution began.
 */
export interface Ceilings {
  readonly ympe: Readonly<Record<number, number>>
  readonly yampe: Readonly<Record<number, number>>
}

export const CEILINGS: Ceilings = {
  ympe: {
    1966: 5000,
    1967: 5000,
    1968: 5100,
    1969: 5200,
    1970: 5300,
    1971: 5400,
    1972: 5500,
    1973: 5600,
    1974: 6600,
    1975: 7400,
    1976: 8300,
    1977: 9300,
    1978: 10400,
    1979: 11700,
    1980: 13100,
    1981: 14700,
    1982: 16500,
    1983: 18500,
    1984: 20800,
    1985: 23400,
    1986: 25800,
    1987: 25900,
    1988: 26500,
    1989: 27700,
    1990: 28900,
    1991: 30500,
    1992: 32200,
    1993: 33400,
    1994: 34400,
    1995: 34900,
    1996: 35400,
    1997: 35800,
    1998: 36900,
    1999: 37400,
    2000: 37600,
    2001: 38300,
    2002: 39100,
    2003: 39900,
    2004: 40500,
    2005: 41100,
    2006: 42100,
    2007: 43700,
    2008: 44900,
    2009: 46300,
    2010: 47200,
    2011: 48300,
    2012: 50100,
    2013: 51100,
    2014: 52500,
    2015: 53600,
    2016: 54900,
    2017: 55300,
    2018: 55900,
    2019: 57400,
    2020: 58700,
    2021: 61600,
    2022: 64900,
    2023: 66600,
    2024: 68500,
    2025: 71300,
    2026: 74600,
  },
  yampe: {
    2024: 73200,
    2025: 81200,
    2026: 85000,
  },
}

/** The last year with a published ceiling. */
export const LAST_PUBLISHED_YEAR = Math.max(
  ...Object.keys(CEILINGS.ympe).map(Number),
)
