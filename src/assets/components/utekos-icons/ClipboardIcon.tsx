import { ICON_COLORS, type IconProps } from './icon-types'

export function ClipboardIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" fillRule="evenodd" d="M16.83 3h.67A3.5 3.5 0 0 1 21 6.5v13a3.5 3.5 0 0 1-3.5 3.5h-11A3.5 3.5 0 0 1 3 19.5v-13A3.5 3.5 0 0 1 6.5 3h.67A3 3 0 0 1 10 1h4c1.306 0 2.418.835 2.83 2M9 4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1" clipRule="evenodd"/>
    </svg>
  )
}
