import { ImageResponse } from 'next/og'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

export default function Icon() {
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
          fontSize: 144,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        monk
        <span
          style={{
            color: '#F4C84A',
            fontSize: '0.52em',
            marginLeft: 4,
            transform: 'translateY(-56px)',
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
