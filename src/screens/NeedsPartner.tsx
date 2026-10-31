import { useNavigation } from '@react-navigation/native';
import { EmptyState, Screen } from '../ui';

/** Shown in tabs that only make sense once both partners are linked. */
export function NeedsPartner({ body }: { body: string }) {
  const navigation = useNavigation();
  return (
    <Screen>
      <EmptyState
        icon="people-outline"
        title="This is better with two"
        body={body}
        action={{ title: 'Link your partner', onPress: () => navigation.navigate('Link') }}
      />
    </Screen>
  );
}
