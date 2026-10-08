import { ICON_COLORS, type IconProps } from './icon-types'

export function ContactUsIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" d="M 40.5 135 C 40.5 112.632812 58.632812 94.5 81 94.5 C 103.367188 94.5 121.5 112.632812 121.5 135 L 121.5 216 C 121.5 238.367188 103.367188 256.5 81 256.5 C 58.632812 256.5 40.5 238.367188 40.5 216 Z M 202.5 135 C 202.5 112.632812 220.632812 94.5 243 94.5 C 265.367188 94.5 283.5 112.632812 283.5 135 L 283.5 216 C 283.5 238.367188 265.367188 256.5 243 256.5 C 220.632812 256.5 202.5 238.367188 202.5 216 Z M 202.5 135 " fillOpacity="1" fillRule="nonzero"/>
      <path strokeLinecap="round" transform="matrix(13.499999, 0, 0, 13.499999, 0.0000062, 0)" fill="none" strokeLinejoin="round" d="M 4 10.000001 C 4 5.581598 7.581597 2 12.000001 2 C 16.418404 2 20.000001 5.581598 20.000001 10.000001 M 18.000001 18.000001 C 18.000001 20.209203 16.209202 22.000002 14.000001 22.000002 L 12.000001 22.000002 " stroke="currentColor" strokeWidth="2" strokeOpacity="0.4" strokeMiterlimit="4"/>
    </svg>
  )
}
