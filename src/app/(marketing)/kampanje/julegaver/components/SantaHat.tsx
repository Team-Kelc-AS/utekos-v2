export function SantaHat({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="430" cy="80" r="40" className="fill-mist" />
      <path
        d="M100 400 C 100 400, 80 150, 256 100 C 350 70, 430 80, 430 80 C 430 80, 350 150, 380 400 Z"
        className="fill-christmas-red"
      />
      <rect x="80" y="380" width="320" height="70" rx="20" className="fill-mist" />
    </svg>
  );
}
