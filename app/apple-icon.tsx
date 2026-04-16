import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#121212',
          color: '#FFFFFF',
          fontSize: 58,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        monk
        <span
          style={{
            color: '#F4C84A',
            fontSize: '0.5em',
            marginLeft: 2,
            transform: 'translateY(-20px)',
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          3
        </span>
      </div>
    ),
    size,
  )
}
