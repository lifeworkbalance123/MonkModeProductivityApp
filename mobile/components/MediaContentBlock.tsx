import { MediaLightbox } from '@/components/MediaLightbox'
import { useTheme } from '@/context/ThemeContext'
import type { ContentBlock } from '@/types/media'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { BookOpen, Maximize2 } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { Image, Platform, Pressable, Text, View } from 'react-native'
import { SvgUri } from 'react-native-svg'
import Toast from 'react-native-toast-message'
import YoutubePlayer from 'react-native-youtube-iframe'

type Props = {
  block: ContentBlock
  moduleTitle: string
}

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace('www.', '')
    if (host === 'youtu.be') {
      return u.pathname.replace('/', '').split('/')[0] || null
    }
    if (host.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const embed = u.pathname.match(/\/embed\/([^/]+)/)
      if (embed) return embed[1]
      const shorts = u.pathname.match(/\/shorts\/([^/]+)/)
      if (shorts) return shorts[1]
    }
  } catch {
    /* ignore */
  }
  return null
}

function isVimeo(url: string): boolean {
  try {
    return new URL(url).hostname.includes('vimeo.com')
  } catch {
    return false
  }
}

function runCta(ctaAction?: string, ctaLabel?: string) {
  if (ctaAction === 'start_pomodoro') router.push('/(tabs)/focus')
  else if (ctaAction === 'open_planner') router.push('/(tabs)/planner')
  else if (ctaAction === 'open_habits') router.push('/(tabs)/habits')
  else Toast.show({ type: 'info', text1: 'Coming soon', text2: ctaLabel })
}

function VideoSection({
  videoUrl,
  thumbUri,
  moduleTitle,
}: {
  videoUrl: string
  thumbUri?: string
  moduleTitle: string
}) {
  const { currentTheme: t } = useTheme()
  const [boxW, setBoxW] = useState(0)
  const yt = extractYoutubeId(videoUrl)
  const vimeo = isVimeo(videoUrl)
  const badge = yt ? 'YouTube' : vimeo ? 'Vimeo' : 'Video'
  const videoH = boxW > 0 ? Math.round(boxW * (9 / 16)) : 200

  const innerYoutube =
    yt && Platform.OS !== 'web' ? (
      <YoutubePlayer height={videoH} width={boxW || 320} videoId={yt} />
    ) : (
      <Pressable
        onPress={() => Linking.openURL(videoUrl)}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        accessibilityLabel={`Video: ${moduleTitle}`}
        accessibilityRole="button"
      >
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, width: '100%', backgroundColor: t.borderColor }} />
        )}
        <View
          style={{
            position: 'absolute',
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#00000088',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 22 }}>▶</Text>
        </View>
      </Pressable>
    )

  return (
    <View style={{ marginBottom: 16, width: '100%' }} onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}>
      <View style={{ width: '100%', paddingTop: '56.25%', position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: t.cardBg,
          }}
        >
          {innerYoutube}
        </View>
        <View
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: '#00000099',
            zIndex: 4,
          }}
          pointerEvents="none"
        >
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{badge}</Text>
        </View>
      </View>
    </View>
  )
}

function aspectPadding(ratio: ContentBlock['aspectRatio']): `${number}%` | undefined {
  switch (ratio) {
    case '16:9':
      return '56.25%'
    case '4:5':
      return '125%'
    case '1:1':
      return '100%'
    default:
      return undefined
  }
}

function ImageSection({
  image,
  aspectRatio,
  onOpen,
}: {
  image: NonNullable<ContentBlock['image']>
  aspectRatio: ContentBlock['aspectRatio']
  onOpen: () => void
}) {
  const { currentTheme: t } = useTheme()
  const pad = aspectPadding(aspectRatio)
  const isSvg = image.format === 'svg'

  const raster = (
    <Image
      source={{ uri: image.uri }}
      style={{ width: '100%', height: '100%' }}
      resizeMode="cover"
      accessibilityLabel={image.altText}
      accessibilityRole="image"
    />
  )

  const inner = isSvg ? (
    <SvgUri uri={image.uri} width="100%" height="100%" />
  ) : (
    raster
  )

  return (
    <View style={{ marginBottom: 12 }}>
        <Pressable
          onPress={onOpen}
          accessibilityLabel={image.altText}
          accessibilityRole="image"
          accessibilityHint="Opens full screen image viewer"
          style={{ width: '100%', position: 'relative' }}
        >
          {pad ? (
            <View style={{ width: '100%', paddingTop: pad, borderRadius: 12, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>{inner}</View>
            </View>
          ) : (
            <View style={{ width: '100%', minHeight: 160, borderRadius: 12, overflow: 'hidden' }}>{inner}</View>
          )}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              backgroundColor: '#00000066',
              borderRadius: 8,
              padding: 6,
            }}
          >
            <Maximize2 size={18} color="#fff" accessibilityLabel="Tap to view full screen" />
          </View>
        </Pressable>
      {image.caption ? (
        <Text style={{ marginTop: 8, fontSize: 13, color: t.text, opacity: 0.65 }} accessibilityRole="none">
          {image.caption}
        </Text>
      ) : null}
    </View>
  )
}

function NotesHeader() {
  const { currentTheme: t } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <BookOpen size={18} color={t.accent} />
      <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '700', color: t.accent }}>Monk&apos;s Notes</Text>
    </View>
  )
}

function CtaPressable({ label, action }: { label: string; action?: string }) {
  const { currentTheme: t } = useTheme()
  return (
    <Pressable
      onPress={() => runCta(action, label)}
      style={{
        marginTop: 14,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: t.accent,
        alignItems: 'center',
      }}
      accessibilityLabel={label}
      accessibilityHint="Double tap to activate"
      accessibilityRole="button"
    >
      <Text style={{ fontWeight: '800', color: t.isDark ? '#fff' : '#111' }}>{label}</Text>
    </Pressable>
  )
}

export function MediaContentBlock({ block, moduleTitle }: Props) {
  const [lightbox, setLightbox] = useState(false)
  const video = block.videoUrl
  const img = block.image
  const pos = block.imagePosition

  const videoEl = video ? (
    <VideoSection videoUrl={video} thumbUri={block.videoThumbnailUri} moduleTitle={moduleTitle} />
  ) : null

  const imageEl = (wrap?: { width?: `${number}%` }) =>
    img ? (
      <View style={wrap?.width ? { width: wrap.width } : undefined}>
        <ImageSection image={img} aspectRatio={block.aspectRatio} onOpen={() => setLightbox(true)} />
      </View>
    ) : null

  const { currentTheme: t } = useTheme()
  const notesFixed = block.bodyText ? (
    <View>
      <NotesHeader />
      <Text style={{ fontSize: 15, lineHeight: 22, color: t.text }}>{block.bodyText}</Text>
    </View>
  ) : null

  const ctaEl = block.ctaLabel ? (
    <CtaPressable label={block.ctaLabel} action={block.ctaAction} />
  ) : null

  let main: ReactNode = null

  if (pos === 'above') {
    main = (
      <>
        {videoEl}
        {imageEl()}
        {notesFixed}
        {ctaEl}
      </>
    )
  } else if (pos === 'below') {
    main = (
      <>
        {videoEl}
        {notesFixed}
        {imageEl()}
        {ctaEl}
      </>
    )
  } else {
    main = (
      <>
        {videoEl}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>{notesFixed}</View>
          {img ? imageEl({ width: '40%' }) : null}
        </View>
        {ctaEl}
      </>
    )
  }

  return (
    <View style={{ marginTop: 8 }}>
      {main}
      {img ? (
        <MediaLightbox
          images={[{ uri: img.uri }]}
          captions={img.caption ? [img.caption] : undefined}
          altLabels={[img.altText]}
          initialIndex={0}
          visible={lightbox}
          onClose={() => setLightbox(false)}
        />
      ) : null}
    </View>
  )
}
