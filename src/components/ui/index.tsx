import React from 'react'
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { X } from 'lucide-react-native'
import { Colors, Radii, Spacing, Typography, Shadows } from '@/theme/tokens'
import { triggerHaptic } from '@/lib/haptics'

export function AsphaltCard({
  children,
  style,
  highlighted,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  highlighted?: boolean
}) {
  return (
    <View
      style={[
        styles.card,
        highlighted && { borderColor: Colors.amberBorder, backgroundColor: Colors.cardElevated },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  tone = 'amber',
  style,
}: {
  label: string
  onPress: () => void
  icon?: React.ReactNode
  disabled?: boolean
  tone?: 'amber' | 'cyan' | 'red'
  style?: StyleProp<ViewStyle>
}) {
  const gradient: [string, string] =
    tone === 'cyan'
      ? ['#06B6D4', '#0891B2']
      : tone === 'red'
        ? ['#EF4444', '#B91C1C']
        : ['#FF6B1A', '#EA580C']

  return (
    <Pressable
      onPress={() => {
        if (disabled) return
        triggerHaptic('medium')
        onPress()
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtnWrap,
        tone === 'amber' ? Shadows.amberGlow : Shadows.cyanGlow,
        disabled && { opacity: 0.45 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryBtn}
      >
        {icon}
        <Text style={styles.primaryBtnText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  )
}

export function SecondaryButton({
  label,
  onPress,
  icon,
  active,
  style,
}: {
  label: string
  onPress: () => void
  icon?: React.ReactNode
  active?: boolean
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      onPress={() => {
        triggerHaptic('light')
        onPress()
      }}
      style={({ pressed }) => [
        styles.secondaryBtn,
        active && {
          borderColor: Colors.cyanBorder,
          backgroundColor: Colors.cyanSoft,
        },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.secondaryBtnText, active && { color: Colors.cyanLight }]}>{label}</Text>
    </Pressable>
  )
}

export function Pill({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string
  tone?: 'amber' | 'cyan' | 'green' | 'red' | 'neutral'
  icon?: React.ReactNode
}) {
  const palette = {
    amber: { bg: Colors.amberSoft, border: Colors.amberBorder, text: Colors.amberLight },
    cyan: { bg: Colors.cyanSoft, border: Colors.cyanBorder, text: Colors.cyanLight },
    green: { bg: Colors.greenSoft, border: Colors.greenBorder, text: Colors.green },
    red: { bg: Colors.redSoft, border: Colors.redBorder, text: Colors.red },
    neutral: { bg: 'rgba(255,255,255,0.06)', border: Colors.border, text: Colors.textSecondary },
  }[tone]

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      {icon}
      <Text style={[styles.pillText, { color: palette.text }]}>{label}</Text>
    </View>
  )
}

export function Avatar({
  name,
  accent = Colors.amber,
  size = 38,
  online,
}: {
  name: string
  accent?: string
  size?: number
  online?: boolean
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${accent}24`,
          borderColor: `${accent}88`,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.36, color: accent }]}>{initials}</Text>
      {online && <View style={styles.onlineDot} />}
    </View>
  )
}

export function AvatarStack({
  names,
  accents,
  size = 28,
}: {
  names: string[]
  accents?: string[]
  size?: number
}) {
  return (
    <View style={styles.avatarStack}>
      {names.slice(0, 4).map((n, idx) => (
        <View key={`${n}-${idx}`} style={{ marginLeft: idx === 0 ? 0 : -8 }}>
          <Avatar name={n} accent={accents?.[idx] || Colors.amber} size={size} />
        </View>
      ))}
      {names.length > 4 && (
        <View
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -8,
              backgroundColor: Colors.cardElevated,
              borderColor: Colors.borderLight,
            },
          ]}
        >
          <Text style={[styles.avatarText, { fontSize: 10, color: Colors.textSecondary }]}>
            +{names.length - 4}
          </Text>
        </View>
      )}
    </View>
  )
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={Typography.title}>{title}</Text>
        {subtitle ? <Text style={[Typography.bodySmall, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function ModalSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={Typography.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X size={20} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 28 }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  primaryBtnWrap: {
    borderRadius: Radii.button,
    overflow: 'hidden',
  },
  primaryBtn: {
    height: 50,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.button,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  avatarText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.green,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionAction: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.amber,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlayDark,
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.cardLarge,
    borderTopRightRadius: Radii.cardLarge,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
