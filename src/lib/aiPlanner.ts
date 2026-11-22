import type { AiRideItinerary, Difficulty } from '@/types'

export interface PlannerInput {
  origin: string
  destination: string
  days: number
  style: Difficulty
  ridersCount: number
  budgetTier: 'Budget' | 'Balanced' | 'Premium'
}

/**
 * Generates a full motorcycle ride itinerary.
 * Uses EXPO_PUBLIC_AI_API_KEY if configured; otherwise runs RevCrew's smart offline engine
 * so the APK works immediately with zero API setup.
 */
export async function generateAiRideItinerary(input: PlannerInput): Promise<AiRideItinerary> {
  const apiKey = process.env.EXPO_PUBLIC_AI_API_KEY
  const apiUrl =
    process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.openai.com/v1/chat/completions'
  const model = process.env.EXPO_PUBLIC_AI_MODEL || 'gpt-4o-mini'

  if (apiKey && apiKey.trim().length > 8) {
    try {
      const prompt = `Create a motorcycle ride itinerary in strict JSON for ${input.ridersCount} riders from ${input.origin} to ${input.destination} over ${input.days} day(s), riding style "${input.style}", budget "${input.budgetTier}".
Return JSON with keys: title, totalDistanceKm (number), durationLabel, bestDeparture, estimatedCostPerRider, routeHighlights (string[]), checklist (string[]), days ([{ day, headline, distanceKm, ridingHours, stops: [{ time, title, type ("start"|"fuel"|"food"|"viewpoint"|"stay"|"finish"), kmMark, notes }] }]).`

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are an expert motorcycle road captain and touring planner. Return valid JSON only.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const content = json?.choices?.[0]?.message?.content
        if (content) {
          const parsed = JSON.parse(content)
          return {
            id: `ai_${Date.now()}`,
            title: parsed.title || `${input.origin} to ${input.destination} Pack Run`,
            origin: input.origin,
            destination: input.destination,
            totalDistanceKm: Number(parsed.totalDistanceKm) || input.days * 185,
            durationLabel: parsed.durationLabel || `${input.days} Day${input.days > 1 ? 's' : ''}`,
            ridingStyle: input.style,
            bestDeparture: parsed.bestDeparture || '05:30 AM (Beat city traffic)',
            estimatedCostPerRider: parsed.estimatedCostPerRider || '₹2,400 / rider',
            routeHighlights: Array.isArray(parsed.routeHighlights) ? parsed.routeHighlights : [],
            days: Array.isArray(parsed.days) ? parsed.days : [],
            checklist: Array.isArray(parsed.checklist) ? parsed.checklist : [],
            generatedBy: 'ai-api',
          }
        }
      }
    } catch {
      // Fall back gracefully to smart offline engine
    }
  }

  await new Promise((r) => setTimeout(r, 600))
  return buildSmartOfflineItinerary(input)
}

function buildSmartOfflineItinerary(input: PlannerInput): AiRideItinerary {
  const origin = input.origin.trim() || 'Chandigarh'
  const destination = input.destination.trim() || 'Spiti Valley'
  const days = Math.max(1, Math.min(input.days, 5))

  const baseDailyKm =
    input.style === 'Hardcore' ? 245 : input.style === 'Spirited' ? 195 : 145
  const totalDistanceKm = baseDailyKm * days

  const costPerDay =
    input.budgetTier === 'Premium' ? 3800 : input.budgetTier === 'Balanced' ? 2100 : 1250
  const totalCost = costPerDay * days

  const itineraryDays = Array.from({ length: days }, (_, idx) => {
    const dayNum = idx + 1
    const isFirst = dayNum === 1
    const isLast = dayNum === days

    const startName = isFirst ? origin : `${destination} Base Camp ${dayNum - 1}`
    const endName = isLast ? destination : `${destination} Scenic Ridge ${dayNum}`
    const fuelKm = Math.round(baseDailyKm * 0.35)
    const foodKm = Math.round(baseDailyKm * 0.58)
    const viewKm = Math.round(baseDailyKm * 0.8)

    return {
      day: dayNum,
      headline: isFirst
        ? `${origin} Dawn Rollout -> ${endName}`
        : isLast
          ? `Summit Push & Arrival at ${destination}`
          : `Sweeping Twisties & Mountain Pass Stage ${dayNum}`,
      distanceKm: baseDailyKm,
      ridingHours: input.style === 'Chill' ? '4.5 hrs' : '5.5 hrs',
      stops: [
        {
          time: isFirst ? '05:30 AM' : '07:00 AM',
          title: `${startName} Pack Briefing`,
          type: 'start' as const,
          kmMark: 0,
          notes: `Staggered formation check for ${input.ridersCount} riders, intercom sync & live GPS on.`,
        },
        {
          time: isFirst ? '07:15 AM' : '08:45 AM',
          title: 'High-Octane Fuel & Tyre Pressure Pit',
          type: 'fuel' as const,
          kmMark: fuelKm,
          notes: 'Top up tanks together so the pack stays synced. Quick hydration break.',
        },
        {
          time: isFirst ? '09:00 AM' : '10:30 AM',
          title: 'Highway Dhaba / Rider Cafe Stop',
          type: 'food' as const,
          kmMark: foodKm,
          notes: 'Hot breakfast & masala chai. Log the bill directly in RevCrew Splits.',
        },
        {
          time: isFirst ? '11:15 AM' : '01:00 PM',
          title: `${endName} Panoramic Viewpoint`,
          type: 'viewpoint' as const,
          kmMark: viewKm,
          notes: 'Group bike lineup photo & 30-sec exhaust reel shoot.',
        },
        {
          time: isFirst ? '01:30 PM' : '03:30 PM',
          title: isLast ? `${destination} Finish & Celebration` : `${endName} Rider Lodge`,
          type: isLast ? ('finish' as const) : ('stay' as const),
          kmMark: baseDailyKm,
          notes: isLast
            ? 'Settle group splits, upload trip photos/videos to the RevCrew feed.'
            : 'Secure bike parking, chain lube check, and evening bonfire debrief.',
        },
      ],
    }
  })

  return {
    id: `ai_${Date.now()}`,
    title: `${origin} to ${destination} ${input.style} Run`,
    origin,
    destination,
    totalDistanceKm,
    durationLabel: days === 1 ? '1 Day Run' : `${days} Days / ${days - 1} Nights`,
    ridingStyle: input.style,
    bestDeparture: '05:30 AM (Clear highways & golden-hour twisties)',
    estimatedCostPerRider: `₹${totalCost.toLocaleString('en-IN')} / rider (${input.budgetTier})`,
    routeHighlights: [
      `Curated ${input.style.toLowerCase()} pace suited for ${input.ridersCount} riders`,
      `Synced fuel stops every ~${Math.round(baseDailyKm * 0.35)} km`,
      'Scenic viewpoints tagged for crew reels & banner photos',
      'Built-in split-expense checkpoints for fuel, food & tolls',
    ],
    days: itineraryDays,
    checklist: [
      'ECE/DOT full-face helmet, riding jacket, gloves & boots',
      'Tyre pressure check (cold PSI) + puncture repair kit',
      'Chain cleaned & lubed + spare clutch/brake lever',
      'Power bank, phone mount & offline map downloaded',
      'RevCrew Live Location enabled before rollout',
    ],
    generatedBy: 'smart-engine',
  }
}
