import { Redirect } from 'expo-router'
import { useRevCrewStore } from '@/store/useRevCrewStore'

export default function Index() {
  const isAuthenticated = useRevCrewStore((s) => s.isAuthenticated)
  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/auth/login'} />
}
