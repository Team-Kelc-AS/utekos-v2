import { ICON_COLORS, type IconProps } from './icon-types'

export function ArrowsDownIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path strokeLinecap="round" transform="matrix(13.499999, 0, 0, 13.499999, 0.0000062, 0)" fill="none" strokeLinejoin="round" d="M 4 4 L 12.000001 12.000001 L 20.000001 4 " stroke="currentColor" strokeWidth="4.5" strokeOpacity="0.2" strokeMiterlimit="4"/>
      <path strokeLinecap="round" transform="matrix(13.499999, 0, 0, 13.499999, 0.0000062, 0)" fill="none" strokeLinejoin="round" d="M 4 8.500001 L 12.000001 16.500001 L 20.000001 8.500001 " stroke="currentColor" strokeWidth="4.5" strokeOpacity="0.2" strokeMiterlimit="4"/>
      <path strokeLinecap="round" transform="matrix(13.499999, 0, 0, 13.499999, 0.0000062, 0)" fill="none" strokeLinejoin="round" d="M 4 13.000001 L 12.000001 21.000002 L 20.000001 13.000001 " stroke="currentColor" strokeWidth="4.5" strokeOpacity="0.2" strokeMiterlimit="4"/>
      <path strokeLinecap="round" transform="matrix(13.499999, 0, 0, 13.499999, 0.0000062, 0)" fill="none" strokeLinejoin="round" d="M 4 4 L 12.000001 12.000001 L 20.000001 4 " stroke="currentColor" strokeWidth="1.5" strokeOpacity="1" strokeMiterlimit="4"/>
      <path strokeLinecap="round" transform="matrix(13.499999, 0, 0, 13.499999, 0.0000062, 0)" fill="none" strokeLinejoin="round" d="M 4 8.500001 L 12.000001 16.500001 L 20.000001 8.500001 " stroke="currentColor" strokeWidth="1.5" strokeOpacity="1" strokeMiterlimit="4"/>
      <path strokeLinecap="round" transform="matrix(13.499999, 0, 0, 13.499999, 0.0000062, 0)" fill="none" strokeLinejoin="round" d="M 4 13.000001 L 12.000001 21.000002 L 20.000001 13.000001 " stroke="currentColor" strokeWidth="1.5" strokeOpacity="1" strokeMiterlimit="4"/>
    </svg>
  )
}
