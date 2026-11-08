export function localDateTimeValue (date) {
  const value = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(value.getTime())) return ''
  const pad = number => String(number).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
}

export function sqlDateTime (value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}
