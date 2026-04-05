import { Alert, Linking, Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as ImageManipulator from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import type { AspectRatio, MediaAsset } from '@/types/media'

const MAX_KB = 200
const MAX_BYTES = MAX_KB * 1024

export function formatBytes(kb: number): string {
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function detectFormat(
  uri: string,
  mimeType?: string | null,
): MediaAsset['format'] {
  const lower = uri.toLowerCase()
  if (mimeType?.includes('svg') || lower.endsWith('.svg')) return 'svg'
  if (mimeType?.includes('webp') || lower.endsWith('.webp')) return 'webp'
  if (mimeType?.includes('png') || lower.endsWith('.png')) return 'png'
  return 'jpg'
}

function newMediaId() {
  return `media-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

async function getFileSizeBytes(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri, { size: true })
  if (!info.exists || info.size == null) return 0
  return info.size
}

async function compressPipeline(
  uri: string,
  format: MediaAsset['format'],
): Promise<{ uri: string; width: number; height: number }> {
  if (format === 'svg') {
    return { uri, width: 0, height: 0 }
  }

  let working = uri
  let result = await ImageManipulator.manipulateAsync(
    working,
    [],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  )
  working = result.uri
  let size = await getFileSizeBytes(working)

  if (size > MAX_BYTES) {
    result = await ImageManipulator.manipulateAsync(working, [], {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    working = result.uri
    size = await getFileSizeBytes(working)
  }

  if (size > MAX_BYTES) {
    const w = result.width || 1200
    const ratio = 1200 / w
    const newW = Math.min(1200, w)
    const newH = Math.round((result.height || 800) * ratio)
    result = await ImageManipulator.manipulateAsync(
      working,
      [{ resize: { width: newW, height: newH } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
    )
    working = result.uri
    size = await getFileSizeBytes(working)
  }

  if (size > MAX_BYTES) {
    result = await ImageManipulator.manipulateAsync(working, [], {
      compress: 0.4,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    working = result.uri
    size = await getFileSizeBytes(working)
  }

  if (size > MAX_BYTES) {
    console.warn(
      '[imageService] Could not compress image below 200KB after minimum quality step.',
    )
  }

  return {
    uri: working,
    width: result.width,
    height: result.height,
  }
}

function promptOpenSettings() {
  Alert.alert(
    'Photos access needed',
    'Allow photo library access in Settings to pick images.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Settings', onPress: () => Linking.openSettings() },
    ],
  )
}

export type PickCompressOptions = {
  aspectRatio?: AspectRatio
}

/**
 * Pick from library (mobile + web via Expo) and return a MediaAsset, or null if cancelled.
 */
export async function pickAndCompressImage(
  _options?: PickCompressOptions,
): Promise<MediaAsset | null> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      promptOpenSettings()
      return null
    }
  }

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
  })

  if (picked.canceled || !picked.assets?.[0]) return null

  const asset = picked.assets[0]
  return buildMediaAssetFromUri(
    asset.uri,
    asset.uri,
    detectFormat(asset.uri, asset.mimeType ?? null),
    asset.width ?? 0,
    asset.height ?? 0,
  )
}

/**
 * Web drag-and-drop or programmatic file URI (blob/data URL) — same compression path.
 */
export async function compressImageFromUri(
  uri: string,
  originalUri: string,
  format: MediaAsset['format'],
  widthHint: number,
  heightHint: number,
): Promise<MediaAsset | null> {
  return buildMediaAssetFromUri(uri, originalUri, format, widthHint, heightHint)
}

async function buildMediaAssetFromUri(
  sourceUri: string,
  originalUri: string,
  format: MediaAsset['format'],
  widthHint: number,
  heightHint: number,
): Promise<MediaAsset> {
  const originalBytes = await getFileSizeBytes(sourceUri)
  const fileSizeKB = originalBytes / 1024

  if (format === 'svg') {
    const now = new Date().toISOString()
    return {
      id: newMediaId(),
      uri: sourceUri,
      originalUri,
      format: 'svg',
      altText: '',
      width: widthHint,
      height: heightHint,
      fileSizeKB,
      compressedSizeKB: fileSizeKB,
      createdAt: now,
    }
  }

  const { uri: outUri, width, height } = await compressPipeline(sourceUri, format)
  const compressedBytes = await getFileSizeBytes(outUri)
  const compressedSizeKB = compressedBytes / 1024

  // ─── PHASE 3: CDN UPLOAD ───────────────────────────────────────────────
  // TODO: Replace local file storage with Cloudinary or Supabase Storage upload.
  // Steps:
  //   1. Set up Supabase project and create a 'media' storage bucket (public)
  //   2. Install: npm install @supabase/supabase-js
  //   3. Upload compressed file: supabase.storage.from('media').upload(path, file)
  //   4. Get public URL: supabase.storage.from('media').getPublicUrl(path)
  //   5. Store cdnUrl on the MediaAsset and update SQLite record
  //   6. Serve cdnUrl instead of local uri in MediaContentBlock
  //   7. For auto-format conversion to WebP: use Cloudinary's f_auto,q_auto params
  // ──────────────────────────────────────────────────────────────────────────

  const now = new Date().toISOString()
  return {
    id: newMediaId(),
    uri: outUri,
    originalUri,
    format: 'jpg',
    altText: '',
    width: width || widthHint,
    height: height || heightHint,
    fileSizeKB,
    compressedSizeKB,
    createdAt: now,
  }
}
