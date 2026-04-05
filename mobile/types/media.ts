export type ImagePosition = 'above' | 'below' | 'inline'

export type AspectRatio = '16:9' | '4:5' | '1:1' | 'free'

export type MediaAsset = {
  id: string
  uri: string
  originalUri?: string
  format: 'svg' | 'webp' | 'png' | 'jpg'
  altText: string
  caption?: string
  width: number
  height: number
  fileSizeKB: number
  compressedSizeKB: number
  createdAt: string
  cdnUrl?: string
  cdnProvider?: 'cloudinary' | 'supabase'
}

export type ContentBlock = {
  id: string
  title: string
  videoUrl?: string
  videoThumbnailUri?: string
  image?: MediaAsset
  imagePosition: ImagePosition
  aspectRatio: AspectRatio
  bodyText?: string
  ctaLabel?: string
  ctaAction?: string
  moduleId?: string
  createdAt: string
  updatedAt: string
}
