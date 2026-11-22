/**
 * RevCrew Design System Tokens
 * Dark Asphalt (#08090C) + Fiery Amber (#FF6B1A) + Electric Cyan (#06B6D4)
 */

export const Colors = {
  // Base Asphalt Surfaces
  background: '#08090C',
  surface: '#0F1218',
  card: '#151A23',
  cardElevated: '#1C2330',
  inputBg: '#0D1016',

  // Primary Brand Accent — Fiery Amber
  amber: '#FF6B1A',
  amberLight: '#FF8A4C',
  amberGlow: 'rgba(255, 107, 26, 0.36)',
  amberSoft: 'rgba(255, 107, 26, 0.14)',
  amberBorder: 'rgba(255, 107, 26, 0.40)',

  // Secondary Brand Accent — Electric Cyan
  cyan: '#06B6D4',
  cyanLight: '#22D3EE',
  cyanGlow: 'rgba(6, 182, 212, 0.34)',
  cyanSoft: 'rgba(6, 182, 212, 0.14)',
  cyanBorder: 'rgba(6, 182, 212, 0.38)',

  // Semantic Status
  green: '#10B981',
  greenSoft: 'rgba(16, 185, 129, 0.14)',
  greenBorder: 'rgba(16, 185, 129, 0.38)',

  red: '#EF4444',
  redSoft: 'rgba(239, 68, 68, 0.16)',
  redBorder: 'rgba(239, 68, 68, 0.42)',

  gold: '#F59E0B',
  goldSoft: 'rgba(245, 158, 11, 0.14)',
  goldBorder: 'rgba(245, 158, 11, 0.38)',

  // Typography
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: 'rgba(248, 250, 252, 0.28)',

  // Borders & Glass
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  glassCard: 'rgba(21, 26, 35, 0.90)',
  overlayDark: 'rgba(8, 9, 12, 0.84)',
} as const

export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const

export const Radii = {
  badge: 8,
  sm: 12,
  md: 16,
  button: 16,
  card: 22,
  cardLarge: 28,
  pill: 999,
} as const

export const Typography = {
  hero: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  titleLarge: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    color: Colors.textMuted,
  },
  caption: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  monoLarge: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  mono: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as const,
    color: Colors.amber,
  },
  monoSmall: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    color: Colors.cyan,
  },
} as const

export const Shadows = {
  amberGlow: {
    shadowColor: Colors.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.36,
    shadowRadius: 16,
    elevation: 8,
  },
  cyanGlow: {
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
} as const
