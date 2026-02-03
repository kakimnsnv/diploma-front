export const useDate = () => {
  const format = (value: string | Date) =>
    new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value))

  const ago = (value: string | Date) => {
    const diff = Date.now() - new Date(value).getTime()
    const minutes = Math.round(diff / 60000)
    if (Math.abs(minutes) < 60)
      return `${Math.abs(minutes)} min ago`
    return format(value)
  }

  return { format, ago }
}
