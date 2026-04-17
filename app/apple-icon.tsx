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
          color: '#F2D34C',
          fontSize: 58,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        monk
        <span
          style={{
            color: '#F6DD66',
            fontSize: '0.48em',
            marginLeft: 2,
            transform: 'translateY(-23px)',
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          ³
        </span>
      </div>
    ),
    size,
  )
}
