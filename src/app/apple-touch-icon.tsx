import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleTouchIcon() {
  return new ImageResponse(
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" width="180" height="180">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1e40af', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="56" fill="url(#grad)" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        <path d="M30 72 L60 80 L90 72 L90 50 L60 58 L30 50 Z" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M30 50 L60 58 L60 80" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M90 50 L60 58 L60 80" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M55 32 L60 22 L65 32 L60 60 Z" fill="white" opacity="0.9" />
        <circle cx="60" cy="22" r="2.5" fill="white" />
        <line x1="60" y1="14" x2="60" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="48" y1="16" x2="44" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="72" y1="16" x2="76" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="42" y1="28" x2="37" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="78" y1="28" x2="83" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      </svg>
    ),
    { ...size }
  )
}
