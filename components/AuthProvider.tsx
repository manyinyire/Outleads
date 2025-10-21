'use client'

export default function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  // Auth verification is now handled by individual route layouts
  // This prevents duplicate verification calls
  return <>{children}</>;
}
