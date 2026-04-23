// Re-export from the single shared auth context.
// The AuthProvider in app/layout.tsx holds the one Supabase subscription for the
// entire app — auth state is resolved once and shared across all pages without
// re-subscribing on every navigation.
export { useAuth } from '@/components/auth/AuthProvider'
