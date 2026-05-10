'use client'

import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { copyTextToClipboard } from '@/lib/copy-to-clipboard'

interface PostProgressButtonProps {
  programName: string
  currentDay: number
  totalDays: number
  streakDays: number
}

function hashtagFromProgramName(name: string) {
  return name.replace(/\s+/g, '')
}

function getSocialPost(args: {
  programName: string
  currentDay: number
  totalDays: number
  streakDays: number
  baseUrl: string
}): string {
  const { programName, currentDay, totalDays, streakDays, baseUrl } = args
  const tag = hashtagFromProgramName(programName)

  if (currentDay === 1) {
    return `Day 1 of ${totalDays} in ${programName}. No shortcuts. Let's go.\n\n${baseUrl}\n#${tag} #Discipline #DeepWork`
  }

  if (currentDay === totalDays) {
    return `${totalDays} days. Done. ${programName} complete. What's next?\n\n${baseUrl}\n#${tag}Complete #Transformation`
  }

  if (streakDays >= 10 && currentDay === streakDays) {
    return `New personal best: ${streakDays} days of deep work. Small daily actions > heroic one-offs.\n\n${baseUrl}\n#DeepWork #Productivity #Streak`
  }

  if (currentDay > totalDays / 2 && currentDay < totalDays - 3) {
    return `Day ${currentDay} of ${totalDays}. Streak: ${streakDays} days. The middle is where most quit. I'm not most.\n\n${baseUrl}\n#KeepGoing #${tag} #Accountability`
  }

  return `Day ${currentDay} of ${totalDays}. This is hard. That's the point. Showing up anyway.\n\n${baseUrl}\n#${tag} #NoShortcuts`
}

export function PostProgressButton({ programName, currentDay, totalDays, streakDays }: PostProgressButtonProps) {
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [baseUrl, setBaseUrl] = useState('monkcubed.com')

  useEffect(() => {
    try {
      setBaseUrl(window.location.origin)
    } catch {
      // ignore
    }
  }, [])

  const postText = useMemo(
    () => getSocialPost({ programName, currentDay, totalDays, streakDays, baseUrl }),
    [programName, currentDay, totalDays, streakDays, baseUrl],
  )

  async function handleCopy() {
    const ok = await copyTextToClipboard(postText)
    if (!ok) {
      showToast('Could not copy — focus this tab and try again.', 'error')
      return
    }
    setCopied(true)
    showToast('Post copied.', 'success')
    window.setTimeout(() => setCopied(false), 2000)
  }

  function handlePostToX() {
    const encodedText = encodeURIComponent(postText)
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank', 'noopener,noreferrer')
  }

  async function handlePostToLinkedIn() {
    // LinkedIn share endpoints are URL-first. Copy text and open the share dialog for the site.
    await handleCopy()
    const encodedUrl = encodeURIComponent(baseUrl)
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  async function handlePostToBluesky() {
    await handleCopy()
    showToast('Copied. Paste into Bluesky to share.', 'success')
  }

  return (
    <>
      <button className="post-progress-btn" onClick={() => setIsOpen(true)}>
        📢 Post your progress
      </button>

      {isOpen ? (
        <div className="post-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="post-modal" onClick={(e) => e.stopPropagation()}>
            <button className="post-modal-close" onClick={() => setIsOpen(false)} aria-label="Close">
              ×
            </button>

            <h4>Share your progress</h4>
            <p>Copy this text or post directly to social media:</p>

            <div className="post-textbox">
              {postText.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>

            <div className="post-actions">
              <button className="post-copy" onClick={() => void handleCopy()}>
                {copied ? '✓ Copied!' : '📋 Copy text'}
              </button>
              <button className="post-x" onClick={handlePostToX}>
                🐦 Post to X (Twitter)
              </button>
              <button className="post-linkedin" onClick={() => void handlePostToLinkedIn()}>
                🔗 Post to LinkedIn
              </button>
              <button className="post-bluesky" onClick={() => void handlePostToBluesky()}>
                🦋 Copy for Bluesky
              </button>
            </div>

            <div className="post-note">
              💡 <strong>Pro tip:</strong> Tag a friend or add a photo of your workspace for better
              engagement.
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

