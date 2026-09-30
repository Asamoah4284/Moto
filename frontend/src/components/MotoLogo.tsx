import { useId } from 'react'

export function MotoLogo({ className = '' }: { className?: string }) {
  const gradId = useId()

  return (
    <span className={`moto-logo ${className}`.trim()} aria-hidden>
      <svg
        viewBox="0 0 48 48"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="12" fill={`url(#${gradId})`} />
        <circle cx="14" cy="32" r="6.2" stroke="#f4fffa" strokeWidth="2.4" />
        <circle cx="34.5" cy="32" r="6.2" stroke="#f4fffa" strokeWidth="2.4" />
        <path
          d="M20 32h8.5c1.4 0 2.5-.7 3.4-1.8L35 25.5"
          stroke="#f4fffa"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 32l3.2-8.2c.4-1 1.3-1.7 2.4-1.7H26l3-5h5.5"
          stroke="#f4fffa"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24.5 22.1V17.5"
          stroke="#f4fffa"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M19.2 23.8H12.8"
          stroke="#f4fffa"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient
            id={gradId}
            x1="6"
            y1="4"
            x2="42"
            y2="44"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#0a8f63" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  )
}
