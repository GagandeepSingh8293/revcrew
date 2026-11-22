import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Share,
  Alert,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Plus,
  Share2,
  CheckCircle2,
  Clock,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react-native'
import { Colors, Radii, Spacing, Typography } from '@/theme/tokens'
import {
  AsphaltCard,
  PrimaryButton,
  Pill,
  Avatar,
  ModalSheet,
} from '@/components/ui'
import { useRevCrewStore } from '@/store/useRevCrewStore'
import { triggerHaptic } from '@/lib/haptics'
import type { ExpenseCategory } from '@/types'

const CATEGORIES: ExpenseCategory[] = [
  'Fuel',
  'Food & Chai',
  'Tolls',
  'Stay',
  'Gear / Repair',
]

export default function SplitsScreen() {
  const {
    expenses,
    riders,
    rides,
    currentUserId,
    addExpense,
    toggleSettlement,
  } = useRevCrewStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Fuel')
  const [selectedRiderIds, setSelectedRiderIds] = useState<string[]>([
    'u_me',
    'u_kabir',
    'u_aanya',
    'u_rohan',
  ])

  const riderById = (id: string) => riders.find((r) => r.id === id) || riders[0]

  const summary = useMemo(() => {
    let owedToMe = 0
    let iOwe = 0
    for (const ex of expenses) {
      for (const s of ex.settlements) {
        if (s.settled) continue
        if (ex.paidByUserId === currentUserId && s.userId !== currentUserId) {
          owedToMe += s.amount
        } else if (ex.paidByUserId !== currentUserId && s.userId === currentUserId) {
          iOwe += s.amount
        }
      }
    }
    return { owedToMe, iOwe }
  }, [expenses, currentUserId])

  function toggleRiderSelection(uid: string) {
    setSelectedRiderIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    )
  }

  function handleAddExpense() {
    const num = Number(amount)
    if (!title.trim() || !num || num <= 0) {
      Alert.alert('Invalid expense', 'Enter an expense title and a valid amount.')
      return
    }
    if (selectedRiderIds.length === 0) {
      Alert.alert('Select riders', 'Choose at least one rider to split with.')
      return
    }
    const activeRide = rides[0]
    addExpense({
      rideId: activeRide?.id || 'r_kasauli',
      rideTitle: activeRide?.title || 'Pack Ride',
      title,
      category,
      paidByUserId: currentUserId,
      amount: num,
      participantIds: selectedRiderIds,
    })
    triggerHaptic('success')
    setTitle('')
    setAmount('')
    setModalOpen(false)
  }

  async function handleShareSplit(ex: (typeof expenses)[number]) {
    const payer = riderById(ex.paidByUserId)
    const lines = ex.settlements.map((s) => {
      const r = riderById(s.userId)
      return `• ${r.fullName}: ₹${s.amount} (${s.settled ? 'Settled' : 'Pending'})`
    })
    try {
      await Share.share({
        message: `🧾 RevCrew Split — ${ex.title}\nRide: ${ex.rideTitle}\nTotal: ₹${ex.amount} (Paid by ${payer.fullName})\n\n${lines.join('\n')}\n\nSettle via UPI and mark paid in RevCrew!`,
      })
    } catch {
      // Cancelled
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={Typography.titleLarge}>Split Payments</Text>
            <Text style={Typography.bodySmall}>
              Fuel, dhaba bills & tolls split fairly across the pack
            </Text>
          </View>
          <Pressable
            onPress={() => {
              triggerHaptic('light')
              setModalOpen(true)
            }}
            style={styles.addBtn}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Split</Text>
          </Pressable>
        </View>

        {/* Balance Summary Strip */}
        <View style={styles.summaryRow}>
          <AsphaltCard style={styles.summaryCard}>
            <View style={styles.summaryIconRow}>
              <ArrowDownLeft size={16} color={Colors.green} />
              <Text style={Typography.caption}>OWED TO YOU</Text>
            </View>
            <Text style={[Typography.monoLarge, { color: Colors.green }]}>
              ₹{summary.owedToMe.toLocaleString('en-IN')}
            </Text>
          </AsphaltCard>

          <AsphaltCard style={styles.summaryCard}>
            <View style={styles.summaryIconRow}>
              <ArrowUpRight size={16} color={Colors.amber} />
              <Text style={Typography.caption}>YOU OWE</Text>
            </View>
            <Text style={[Typography.monoLarge, { color: Colors.amber }]}>
              ₹{summary.iOwe.toLocaleString('en-IN')}
            </Text>
          </AsphaltCard>
        </View>

        {/* Expense Ledger */}
        {expenses.map((ex) => {
          const payer = riderById(ex.paidByUserId)
          const settledCount = ex.settlements.filter((s) => s.settled).length
          return (
            <AsphaltCard key={ex.id} style={styles.expenseCard}>
              <View style={styles.expenseTop}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                    <Pill label={ex.category.toUpperCase()} tone="amber" />
                    <Pill
                      label={`${settledCount}/${ex.settlements.length} SETTLED`}
                      tone={settledCount === ex.settlements.length ? 'green' : 'cyan'}
                    />
                  </View>
                  <Text style={Typography.headline}>{ex.title}</Text>
                  <Text style={Typography.caption}>
                    Paid by {payer.fullName} • {ex.createdAt}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={Typography.monoLarge}>₹{ex.amount}</Text>
                  <Pressable
                    onPress={() => void handleShareSplit(ex)}
                    style={styles.shareMiniBtn}
                  >
                    <Share2 size={14} color={Colors.cyanLight} />
                    <Text style={styles.shareMiniText}>Remind</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.settlementList}>
                {ex.settlements.map((s) => {
                  const member = riderById(s.userId)
                  return (
                    <Pressable
                      key={s.userId}
                      onPress={() => {
                        triggerHaptic('selection')
                        toggleSettlement(ex.id, s.userId)
                      }}
                      style={styles.settlementRow}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Avatar name={member.fullName} accent={member.accent} size={28} />
                        <Text style={styles.memberName}>{member.fullName}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={Typography.mono}>₹{s.amount}</Text>
                        {s.settled ? (
                          <View style={styles.settledBadge}>
                            <CheckCircle2 size={13} color={Colors.green} />
                            <Text style={styles.settledText}>Paid</Text>
                          </View>
                        ) : (
                          <View style={styles.pendingBadge}>
                            <Clock size={13} color={Colors.amberLight} />
                            <Text style={styles.pendingText}>Mark Paid</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </AsphaltCard>
          )
        })}
      </ScrollView>

      {/* Add Split Expense Modal */}
      <ModalSheet
        visible={modalOpen}
        title="Add Ride Split Expense"
        onClose={() => setModalOpen(false)}
      >
        <Text style={styles.fieldLabel}>Expense Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Murthal Breakfast / XP95 Fuel"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Total Amount (₹)</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="2400"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.catWrap}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.catChip, category === c && styles.catChipActive]}
            >
              <Text
                style={[styles.catText, category === c && { color: Colors.amberLight }]}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>
          Split Equally Between ({selectedRiderIds.length} riders)
        </Text>
        <View style={{ gap: 8 }}>
          {riders.slice(0, 4).map((r) => {
            const active = selectedRiderIds.includes(r.id)
            return (
              <Pressable
                key={r.id}
                onPress={() => toggleRiderSelection(r.id)}
                style={[styles.riderPickRow, active && styles.riderPickActive]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar name={r.fullName} accent={r.accent} size={30} />
                  <Text style={Typography.headline}>{r.fullName}</Text>
                </View>
                <Text style={Typography.monoSmall}>
                  {active && Number(amount) > 0
                    ? `₹${Math.round(Number(amount) / Math.max(1, selectedRiderIds.length))}`
                    : active
                      ? 'Included'
                      : 'Tap to add'}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <PrimaryButton
          label="Save & Split Expense"
          icon={<Receipt size={17} color="#FFFFFF" />}
          onPress={handleAddExpense}
          style={{ marginTop: Spacing.lg }}
        />
      </ModalSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: 112, gap: Spacing.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.amber,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  addBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    gap: 6,
  },
  summaryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  expenseCard: {
    gap: 12,
  },
  expenseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  shareMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.cyanSoft,
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
  },
  shareMiniText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.cyanLight,
  },
  settlementList: {
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  memberName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.greenSoft,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  settledText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.green,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.amberSoft,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  pendingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.amberLight,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: Colors.text,
    fontSize: 14,
  },
  catWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.amberSoft,
    borderColor: Colors.amberBorder,
  },
  catText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  riderPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: Radii.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  riderPickActive: {
    borderColor: Colors.cyanBorder,
    backgroundColor: Colors.cyanSoft,
  },
})
