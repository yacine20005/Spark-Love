import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { addEntry } from '../api/journal';
import { useHousehold } from '../context/session';
import { errorMessage } from '../lib/feedback';
import type { StackProps } from '../navigation/types';
import { Button, makeStyles, radius, Screen, space, Text, TextField, useTheme } from '../ui';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

type Photo = { uri: string; base64: string; mimeType: string };

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

  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true, allowsEditing: true });
    const asset = result.assets?.[0];
    if (result.canceled || !asset?.base64) return;
    if (asset.base64.length * 0.75 > MAX_PHOTO_BYTES) {
      setError('That photo is over 5 MB. Pick a smaller one.');
      return;
    }
    setError(null);
    setPhoto({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType ?? 'image/jpeg' });
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
