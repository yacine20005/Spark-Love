import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { addEntry } from '../api/journal';
import { useHousehold } from '../context/session';
import { errorMessage } from '../lib/feedback';
import type { StackProps } from '../navigation/types';
import { Button, makeStyles, radius, Screen, space, Text, TextField, useTheme } from '../ui';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const WEB_MAX_DIMENSION = 1600;
const WEB_JPEG_QUALITY = 0.82;

type Photo = { uri: string; base64: string; mimeType: string };

/** expo-image-picker ignores `quality` on web; resize/compress via canvas so large iPhone photos stay under 5 MB. */
async function compressWebPhoto(uri: string, fallbackBase64?: string | null, fallbackMime?: string | null): Promise<Photo | null> {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return fallbackBase64 ? { uri, base64: fallbackBase64, mimeType: fallbackMime ?? 'image/jpeg' } : null;
  }
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode selected photo.'));
      el.src = uri;
    });
    const maxSide = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const scale = maxSide > WEB_MAX_DIMENSION ? WEB_MAX_DIMENSION / maxSide : 1;
    const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return fallbackBase64 ? { uri, base64: fallbackBase64, mimeType: fallbackMime ?? 'image/jpeg' } : null;
    }
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', WEB_JPEG_QUALITY);
    const base64 = dataUrl.split(',')[1];
    if (!base64) {
      return fallbackBase64 ? { uri, base64: fallbackBase64, mimeType: fallbackMime ?? 'image/jpeg' } : null;
    }
    return { uri, base64, mimeType: 'image/jpeg' };
  } catch {
    return fallbackBase64 ? { uri, base64: fallbackBase64, mimeType: fallbackMime ?? 'image/jpeg' } : null;
  }
}

export function ComposeScreen({ route, navigation }: StackProps<'Compose'>) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { kind, prompt } = route.params;
  const spark = kind === 'spark';
  const { me, couple } = useHousehold();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !photo?.uri.startsWith('blob:')) return;
    const blobUri = photo.uri;
    return () => URL.revokeObjectURL(blobUri);
  }, [photo?.uri]);

  async function pick() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true, allowsEditing: true });
      const asset = result.assets?.[0];
      if (result.canceled || !asset) return;

      let next: Photo | null;
      if (Platform.OS === 'web') {
        const rawBytes = (asset.base64?.length ?? 0) * 0.75;
        const needsCompress =
          !asset.base64 || rawBytes > MAX_PHOTO_BYTES || (asset.width ?? 0) > WEB_MAX_DIMENSION || (asset.height ?? 0) > WEB_MAX_DIMENSION;
        next = needsCompress
          ? await compressWebPhoto(asset.uri, asset.base64, asset.mimeType)
          : { uri: asset.uri, base64: asset.base64!, mimeType: asset.mimeType ?? 'image/jpeg' };
      } else {
        next = asset.base64 ? { uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType ?? 'image/jpeg' } : null;
      }

      if (!next?.base64) {
        setError('Could not read that photo. Try a JPEG or PNG image.');
        return;
      }
      if (next.base64.length * 0.75 > MAX_PHOTO_BYTES) {
        setError('That photo is over 5 MB. Pick a smaller one.');
        return;
      }
      setError(null);
      setPhoto(next);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await addEntry(couple!.id, me.id, {
        kind: spark ? 'spark' : photo ? 'memory' : 'note',
        title: spark ? prompt : title,
        body,
        photo,
      });
      navigation.goBack();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Screen
      edges={['bottom']}
      footer={
        <>
          {error && (
            <Text variant="caption" color={colors.danger} center>
              {error}
            </Text>
          )}
          <Button title={spark ? 'Share answer' : 'Save to journal'} onPress={save} loading={busy} disabled={!body.trim()} />
        </>
      }
    >
      {spark ? (
        <Text variant="title">{prompt}</Text>
      ) : (
        <>
          {photo ? (
            <View>
              <Image source={{ uri: photo.uri }} style={styles.preview} contentFit="cover" />
              <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" onPress={() => setPhoto(null)} style={styles.remove}>
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={pick} style={({ pressed }) => [styles.picker, pressed && { opacity: 0.7 }]}>
              <Ionicons name="image-outline" size={28} color={colors.primary} />
              <Text variant="label" color={colors.primary}>
                Add a photo
              </Text>
              <Text variant="caption">Optional</Text>
            </Pressable>
          )}
          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Optional" maxLength={200} />
        </>
      )}
      <TextField
        label={spark ? 'Your answer' : 'What happened?'}
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={5000}
        autoFocus={spark}
        placeholder={spark ? 'Be honest, they will see it.' : 'Write it down while you remember it.'}
      />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  picker: {
    height: 140,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  remove: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
