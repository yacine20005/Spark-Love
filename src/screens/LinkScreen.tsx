import { useEffect } from 'react';
import { useHousehold } from '../context/session';
import type { StackProps } from '../navigation/types';
import { Screen } from '../ui';
import { LinkPanel } from './LinkPanel';

export function LinkScreen({ navigation }: StackProps<'Link'>) {
  const { linked } = useHousehold();

  // The inviter's screen closes on its own once the partner joins.
  useEffect(() => {
    if (linked) navigation.goBack();
  }, [linked, navigation]);

  return (
    <Screen edges={[]}>
      <LinkPanel />
    </Screen>
  );
}
