import { useLocalSearchParams } from 'expo-router';

import { ProfileSectionRouter } from '@/features/profile/screens/ProfileSectionRouter';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function ProfileSectionRoute() {
  const params = useLocalSearchParams<{ section: string }>();
  const section = firstParam(params.section);
  return <ProfileSectionRouter section={section} />;
}
