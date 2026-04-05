import { useTheme } from '@/context/ThemeContext'
import { createContentBlock, getTrainingModules, type TrainingModuleRow } from '@/services/db'
import {
  compressImageFromUri,
  formatBytes,
  pickAndCompressImage,
} from '@/services/imageService'
import type { AspectRatio, ContentBlock, ImagePosition, MediaAsset } from '@/types/media'
import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'

const POSITIONS: ImagePosition[] = ['above', 'below', 'inline']
const RATIOS: AspectRatio[] = ['16:9', '4:5', '1:1', 'free']

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace('www.', '')
    if (host === 'youtu.be') return u.pathname.replace('/', '').split('/')[0] || null
    if (host.includes('youtube.com')) return u.searchParams.get('v')
  } catch {
    return null
  }
  return null
}

function isValidVideoUrl(url: string): boolean {
  if (!url.trim()) return true
  const yt = extractYoutubeId(url)
  if (yt) return true
  try {
    const h = new URL(url).hostname
    return h.includes('vimeo.com')
  } catch {
    return false
  }
}

type Props = {
  onSaved: () => void
  onClose: () => void
}

export function MediaUploadForm({ onSaved, onClose }: Props) {
  const { currentTheme: t } = useTheme()
  const [modules, setModules] = useState<TrainingModuleRow[]>([])
  const [moduleId, setModuleId] = useState<string | undefined>(undefined)
  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [image, setImage] = useState<MediaAsset | null>(null)
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const [imagePosition, setImagePosition] = useState<ImagePosition>('above')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [bodyText, setBodyText] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaAction, setCtaAction] = useState<string>('none')
  const [videoError, setVideoError] = useState('')
  const [altError, setAltError] = useState('')
  const [generalError, setGeneralError] = useState('')

  useEffect(() => {
    getTrainingModules().then(setModules)
  }, [])

  const onPickImage = async () => {
    const asset = await pickAndCompressImage({})
    if (asset) {
      setImage({ ...asset, altText: asset.altText || altText })
    }
  }

  const handleWebDrop = useCallback(
    async (e: { dataTransfer?: { files?: FileList }; preventDefault?: () => void }) => {
      if (Platform.OS !== 'web') return
      e.preventDefault?.()
      const files = e.dataTransfer?.files
      const file = files?.[0]
      if (!file) return
      const name = file.name.toLowerCase()
      const ok = ['.svg', '.webp', '.png', '.jpg', '.jpeg'].some((x) => name.endsWith(x))
      if (!ok) {
        Alert.alert('Invalid file', 'Use SVG, WebP, PNG, or JPG.')
        return
      }
      const uri = URL.createObjectURL(file)
      let format: MediaAsset['format'] = 'jpg'
      if (name.endsWith('.svg')) format = 'svg'
      else if (name.endsWith('.webp')) format = 'webp'
      else if (name.endsWith('.png')) format = 'png'
      // TODO Phase 3: Add explicit WebP conversion on upload via Cloudinary transform
      // WebP reduces file size 25-35% over JPG at equivalent quality — ideal for CDN delivery
      const asset = await compressImageFromUri(uri, uri, format, 0, 0)
      if (asset) setImage({ ...asset, altText })
    },
    [altText],
  )

  useEffect(() => {
    if (videoUrl.trim() && !isValidVideoUrl(videoUrl)) setVideoError('Enter a valid YouTube or Vimeo URL')
    else setVideoError('')
  }, [videoUrl])

  const save = async () => {
    setGeneralError('')
    setAltError('')
    if (image && !altText.trim()) {
      setAltError('Alt text is required for accessibility')
      return
    }
    if (videoUrl.trim() && !isValidVideoUrl(videoUrl)) {
      setVideoError('Enter a valid YouTube or Vimeo URL')
      return
    }
    if (!videoUrl.trim() && !image && !bodyText.trim()) {
      setGeneralError('Add at least one content element')
      return
    }
    const now = new Date().toISOString()
    const yt = extractYoutubeId(videoUrl)
    const thumb = yt ? `https://img.youtube.com/vi/${yt}/mqdefault.jpg` : undefined
    const block: ContentBlock = {
      id: `cb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim() || 'Content block',
      videoUrl: videoUrl.trim() || undefined,
      videoThumbnailUri: thumb,
      image: image
        ? {
            ...image,
            altText: altText.trim(),
            caption: caption.trim() || undefined,
          }
        : undefined,
      imagePosition,
      aspectRatio,
      bodyText: bodyText.trim() || undefined,
      ctaLabel: ctaLabel.trim() || undefined,
      ctaAction: !ctaAction || ctaAction === 'none' ? undefined : ctaAction,
      moduleId,
      createdAt: now,
      updatedAt: now,
    }
    await createContentBlock(block)
    onSaved()
    onClose()
  }

  const savingPct =
    image && image.fileSizeKB > 0
      ? Math.round((1 - image.compressedSizeKB / image.fileSizeKB) * 100)
      : 0

  const webDropProps =
    Platform.OS === 'web'
      ? {
          onDragOver: (ev: { preventDefault: () => void }) => ev.preventDefault(),
          onDrop: (ev: { preventDefault: () => void; dataTransfer: DataTransfer }) => {
            ev.preventDefault()
            void handleWebDrop(ev)
          },
        }
      : {}

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 18, fontWeight: '800', color: t.text, marginBottom: 12 }}>
          New content block
        </Text>

        <Text style={{ fontSize: 12, fontWeight: '700', color: t.accent, marginBottom: 6 }}>Assign module (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <Pressable
            onPress={() => setModuleId(undefined)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              marginRight: 8,
              borderWidth: 2,
              borderColor: moduleId === undefined ? t.accent : t.borderColor,
              backgroundColor: t.cardBg,
            }}
          >
            <Text style={{ color: t.text, fontSize: 12 }}>None</Text>
          </Pressable>
          {modules.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setModuleId(m.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                marginRight: 8,
                borderWidth: moduleId === m.id ? 2 : 1,
                borderColor: moduleId === m.id ? t.accent : t.borderColor,
              }}
            >
              <Text style={{ color: t.text, fontSize: 12 }} numberOfLines={1}>
                {m.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={{ fontSize: 12, fontWeight: '700', color: t.accent, marginBottom: 6 }}>Block title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title for this block"
          placeholderTextColor="#888"
          style={{
            borderWidth: 1,
            borderColor: t.borderColor,
            borderRadius: 10,
            padding: 12,
            color: t.text,
            marginBottom: 16,
          }}
        />

        <Text style={{ fontSize: 14, fontWeight: '700', color: t.text, marginBottom: 6 }}>Video URL (YouTube or Vimeo)</Text>
        <TextInput
          value={videoUrl}
          onChangeText={setVideoUrl}
          placeholder="https://..."
          placeholderTextColor="#888"
          style={{
            borderWidth: 1,
            borderColor: videoError ? '#ef4444' : t.borderColor,
            borderRadius: 10,
            padding: 12,
            color: t.text,
            marginBottom: 6,
          }}
        />
        <Text style={{ fontSize: 12, color: t.text, opacity: 0.6, marginBottom: 8 }}>
          Paste a full YouTube or Vimeo URL
        </Text>
        {videoError ? (
          <Text style={{ color: '#ef4444', marginBottom: 8 }} accessibilityLiveRegion="polite">
            {videoError}
          </Text>
        ) : null}
        {extractYoutubeId(videoUrl) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={{ uri: `https://img.youtube.com/vi/${extractYoutubeId(videoUrl)}/mqdefault.jpg` }}
              style={{ width: 96, height: 54, borderRadius: 6 }}
            />
            <View style={{ marginLeft: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: t.cardBg, borderWidth: 1, borderColor: t.borderColor }}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 12 }}>YouTube</Text>
            </View>
          </View>
        ) : null}

        <Text style={{ fontSize: 14, fontWeight: '700', color: t.text, marginBottom: 8 }}>Image</Text>
        <Pressable
          {...webDropProps}
          onPress={onPickImage}
          accessibilityLabel="Image upload area. Tap to select an image."
          accessibilityRole="button"
          style={{
            height: 120,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: t.borderColor,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            backgroundColor: t.cardBg,
          }}
        >
          {image ? (
            <Image source={{ uri: image.uri }} style={{ width: '100%', height: '100%', borderRadius: 10 }} resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={32} color={t.accent} />
              <Text style={{ color: t.text, marginTop: 8 }}>Tap to choose image</Text>
              {Platform.OS === 'web' ? (
                <Text style={{ color: t.text, opacity: 0.5, fontSize: 11, marginTop: 4 }}>Or drag and drop here</Text>
              ) : null}
            </>
          )}
        </Pressable>
        {image ? (
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 12,
                color: savingPct > 20 ? '#16a34a' : t.text,
                opacity: savingPct > 20 ? 1 : 0.7,
              }}
            >
              Original: {formatBytes(image.fileSizeKB)} → Compressed: {formatBytes(image.compressedSizeKB)}
            </Text>
            <Text style={{ fontSize: 12, color: t.text, opacity: 0.7, marginTop: 4 }}>
              Format: {image.format.toUpperCase()}
            </Text>
          </View>
        ) : null}

        <Text style={{ fontSize: 12, fontWeight: '700', color: t.text, marginBottom: 6 }}>Alt text (required if image)</Text>
        <TextInput
          value={altText}
          onChangeText={setAltText}
          placeholder="Describe the image for screen readers (required)"
          placeholderTextColor="#888"
          style={{
            borderWidth: 1,
            borderColor: altError ? '#ef4444' : t.borderColor,
            borderRadius: 10,
            padding: 12,
            color: t.text,
            marginBottom: 6,
          }}
        />
        {altError ? (
          <Text style={{ color: '#ef4444', marginBottom: 8 }} accessibilityLiveRegion="polite">
            {altError}
          </Text>
        ) : null}

        <Text style={{ fontSize: 12, fontWeight: '700', color: t.text, marginBottom: 6 }}>Caption</Text>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Optional: Monk's Notes caption shown below image"
          placeholderTextColor="#888"
          style={{
            borderWidth: 1,
            borderColor: t.borderColor,
            borderRadius: 10,
            padding: 12,
            color: t.text,
            marginBottom: 12,
          }}
        />

        <Text style={{ fontSize: 12, fontWeight: '700', color: t.text, marginBottom: 8 }}>Image position</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {POSITIONS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setImagePosition(p)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: imagePosition === p ? t.accent : t.borderColor,
                backgroundColor: imagePosition === p ? t.accent + '22' : 'transparent',
              }}
            >
              <Text style={{ color: t.text, fontWeight: '600', textTransform: 'capitalize' }}>{p}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: t.text, marginBottom: 8 }}>Aspect ratio</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {RATIOS.map((r) => (
            <Pressable
              key={r}
              onPress={() => setAspectRatio(r)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: aspectRatio === r ? t.accent : t.borderColor,
              }}
            >
              <Text style={{ color: t.text, fontWeight: '600' }}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ fontSize: 14, fontWeight: '700', color: t.text, marginBottom: 6 }}>Monk&apos;s Notes</Text>
        <TextInput
          value={bodyText}
          onChangeText={setBodyText}
          placeholder="Supporting copy..."
          placeholderTextColor="#888"
          multiline
          numberOfLines={6}
          style={{
            minHeight: 100,
            borderWidth: 1,
            borderColor: t.borderColor,
            borderRadius: 10,
            padding: 12,
            color: t.text,
            textAlignVertical: 'top',
            marginBottom: 12,
          }}
        />

        <Text style={{ fontSize: 12, fontWeight: '700', color: t.text, marginBottom: 6 }}>Button label (optional)</Text>
        <TextInput
          value={ctaLabel}
          onChangeText={setCtaLabel}
          placeholder="e.g. Start Session"
          placeholderTextColor="#888"
          style={{
            borderWidth: 1,
            borderColor: t.borderColor,
            borderRadius: 10,
            padding: 12,
            color: t.text,
            marginBottom: 16,
          }}
        />

        <Text style={{ fontSize: 12, fontWeight: '700', color: t.text, marginBottom: 8 }}>CTA action</Text>
        {(
          [
            { key: 'none', label: 'None' },
            { key: 'start_pomodoro', label: 'Start Pomodoro' },
            { key: 'open_planner', label: 'Open Planner' },
            { key: 'open_habits', label: 'Open Habits' },
          ] as const
        ).map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => setCtaAction(opt.key === 'none' ? 'none' : opt.key)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              marginBottom: 8,
              borderWidth: 2,
              borderColor: ctaAction === opt.key ? t.accent : t.borderColor,
              backgroundColor: t.cardBg,
            }}
          >
            <Text style={{ color: t.text }}>{opt.label}</Text>
          </Pressable>
        ))}

        {generalError ? (
          <Text style={{ color: '#ef4444', marginBottom: 12 }} accessibilityLiveRegion="polite">
            {generalError}
          </Text>
        ) : null}

        <Pressable
          onPress={save}
          style={{
            marginTop: 8,
            paddingVertical: 16,
            borderRadius: 12,
            backgroundColor: t.accent,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontWeight: '800', color: t.isDark ? '#fff' : '#111' }}>Save Content Block</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
