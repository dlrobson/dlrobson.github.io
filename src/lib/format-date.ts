function parseYmdToUtcDate(date: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) {
    throw new Error(`Invalid date format: "${date}". Expected YYYY-MM-DD.`)
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  // Basic range checks for month and day.
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month value in date: "${date}".`)
  }
  if (day < 1 || day > 31) {
    throw new Error(`Invalid day value in date: "${date}".`)
  }

  // Construct a Date at midnight UTC for the given calendar day.
  const utcDate = new Date(Date.UTC(year, month - 1, day))

  // Verify that the resulting date components match the input to
  // catch impossible dates like 2024-02-30.
  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() + 1 !== month ||
    utcDate.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: "${date}".`)
  }

  return utcDate
}

export function formatDate(date: string): string {
  return parseYmdToUtcDate(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDateShort(date: string): string {
  return parseYmdToUtcDate(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
