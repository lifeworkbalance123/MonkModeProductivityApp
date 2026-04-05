import { Pressable, Text, View } from 'react-native'
import ImageViewing from 'react-native-image-viewing'

type Props = {
  images: Array<{ uri: string }>
  captions?: string[]
  altLabels?: string[]
  initialIndex: number
  visible: boolean
  onClose: () => void
}

export function MediaLightbox({
  images,
  captions,
  altLabels,
  initialIndex,
  visible,
  onClose,
}: Props) {
  return (
    <ImageViewing
      images={images}
      imageIndex={initialIndex}
      visible={visible}
      onRequestClose={onClose}
      backgroundColor="#000000"
      swipeToCloseEnabled
      doubleTapToZoomEnabled
      HeaderComponent={({ imageIndex }) => (
        <View
          style={{
            paddingTop: 48,
            paddingHorizontal: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close full screen image"
            accessibilityRole="button"
            hitSlop={12}
          >
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300' }}>×</Text>
          </Pressable>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
            {imageIndex + 1} / {images.length}
          </Text>
        </View>
      )}
      FooterComponent={({ imageIndex }) => {
        const cap = captions?.[imageIndex]
        if (!cap) return null
        return (
          <View style={{ padding: 20, paddingBottom: 40 }}>
            <Text
              style={{ color: '#fff', textAlign: 'center', fontSize: 14 }}
              accessibilityLabel={altLabels?.[imageIndex] ?? cap}
            >
              {cap}
            </Text>
          </View>
        )
      }}
    />
  )
}
