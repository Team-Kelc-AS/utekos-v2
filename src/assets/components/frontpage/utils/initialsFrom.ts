export function initialsFrom(name: string) {
  const first = name.split(',')[0]?.trim() ?? name
  return first
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}
