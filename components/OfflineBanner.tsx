'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export default function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus()

  if (isOnline && !wasOffline) return null

  return (
    <>
      {!isOnline ? (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#1E293B',
            borderBottom: '1px solid #EF4444',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
            fontSize: '13px',
          }}
        >
          <span style={{ fontSize: '14px' }}>📡</span>
          <span style={{ color: '#FCA5A5' }}>
            You are offline. Changes will sync when you reconnect.
          </span>
        </div>
      ) : null}

      {isOnline && wasOffline ? (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#065F46',
            border: '1px solid #10B981',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            color: '#6EE7B7',
            zIndex: 9999,
            whiteSpace: 'nowrap',
            animation: 'fadeInUp 0.3s ease',
          }}
        >
          ✓ Back online - syncing your data
        </div>
      ) : null}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  )
}
