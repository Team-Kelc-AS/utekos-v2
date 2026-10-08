import { ICON_COLORS, type IconProps } from './icon-types'

export function ContactIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path strokeLinecap="butt" transform="matrix(13.499999, 0, 0, 13.499999, 0.0000062, 0)" fill="none" strokeLinejoin="round" d="M 4 10.000001 C 4 8.895255 4.895544 8.000001 6 8.000001 L 8 8.000001 L 8 18.000001 L 6 18.000001 C 4.895544 18.000001 4 17.104457 4 16.000001 Z M 20.000001 10.000001 C 20.000001 8.895255 19.104457 8.000001 18.000001 8.000001 L 16.000001 8.000001 L 16.000001 18.000001 L 18.000001 18.000001 C 19.104457 18.000001 20.000001 17.104457 20.000001 16.000001 Z M 4 10.000001 C 4 5.581598 7.581597 2 12.000001 2 C 16.418404 2 20.000001 5.581598 20.000001 10.000001 M 18.000001 18.000001 L 18.000001 22.000002 L 11 22.000002 " stroke="currentColor" strokeWidth="2" strokeOpacity="1" strokeMiterlimit="4"/>
    </svg>
  )
}
