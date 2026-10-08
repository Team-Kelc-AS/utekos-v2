import { ICON_COLORS, type IconProps } from './icon-types'

export function InformationIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 324 323.999988"
      preserveAspectRatio="xMidYMid meet"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d="M 162 54 C 102.464844 54 54 102.464844 54 162 C 54 221.535156 102.464844 270 162 270 C 221.535156 270 270 221.535156 270 162 C 270 102.464844 221.535156 54 162 54 M 175.5 229.5 L 148.5 229.5 L 148.5 148.5 L 175.5 148.5 Z M 175.5 121.5 L 148.5 121.5 L 148.5 94.5 L 175.5 94.5 Z M 175.5 121.5 " fillOpacity="0.3" fillRule="nonzero"/>
      <path fill="currentColor" d="M 148.5 94.5 L 175.5 94.5 L 175.5 121.5 L 148.5 121.5 Z M 148.5 148.5 L 175.5 148.5 L 175.5 229.5 L 148.5 229.5 Z M 162 27 C 87.480469 27 27 87.480469 27 162 C 27 236.519531 87.480469 297 162 297 C 236.519531 297 297 236.519531 297 162 C 297 87.480469 236.519531 27 162 27 M 162 270 C 102.464844 270 54 221.535156 54 162 C 54 102.464844 102.464844 54 162 54 C 221.535156 54 270 102.464844 270 162 C 270 221.535156 221.535156 270 162 270 " fillOpacity="1" fillRule="nonzero"/>
    </svg>
  )
}
