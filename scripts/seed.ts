#!/usr/bin/env node

/**
 * Seed script for My Baby database with comprehensive demo data
 * 
 * Usage:
 *   npm run seed
 *   (or) SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed.ts
 * 
 * Creates:
 *   - 1 doctor: Dr. Adaeze Okonkwo (obstetrician, Lagos Women's Health)
 *   - 4 mothers with varying scenarios:
 *     * Aisha Bello (32 weeks pregnant) — triggers RED preeclampsia flag
 *     * Chioma Eze (4 weeks postnatal) — triggers YELLOW low diaper flag
 *     * Fatima Ibrahim (18 weeks pregnant) — all green
 *     * Blessing Adewale (2 months postnatal) — no pregnancy, all green
 */

// Load environment variables from .env file
import { config } from "dotenv"
config({ path: ".env" })
config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")
  console.error("\nMake sure your .env file contains:")
  console.error("  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co")
  console.error("  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")
  console.error("\nUsage: npm run seed")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})


interface Mother {
  id: string
  email: string
  name: string
}

interface Pregnancy {
  id: string
  mother_id: string
}

interface Child {
  id: string
  mother_id: string
  name: string
}

interface DuplicateLikeError {
  message?: string
  code?: string
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

async function seed() {
  console.log("🌱 Starting database seed with demo data...\n")

  const today = new Date()

  // Helper to check if error is a duplicate/conflict error
  const isDuplicateError = (error: DuplicateLikeError | null | undefined) => {
    if (!error) return false
    return error.message?.includes("already exists") || 
           error.code === "23505" ||  // Database duplicate key
           error.code === "email_exists" ||  // Auth duplicate email
           error.message?.includes("duplicate key") ||
           error.message?.includes("already registered")
  }

  try {
    // 1. Create the demo doctor
    console.log("👨‍⚕️  Creating demo doctor...")
    const doctorEmail = "dr.adaeze@example.com"
    const doctorPassword = "DemoPassword@123"
    
    const { data: doctorAuthData, error: doctorAuthError } = await supabase.auth.admin.createUser({
      email: doctorEmail,
      password: doctorPassword,
      email_confirm: true,
    })

    if (doctorAuthError && !isDuplicateError(doctorAuthError)) {
      throw doctorAuthError
    }

    let doctorId = ""
    
    // If doctor user already exists (duplicate), query the DB for the existing doctor
    if (isDuplicateError(doctorAuthError)) {
      const { data: existingDoctor } = await supabase
        .from("doctors")
        .select("user_id")
        .limit(1)
        .single()
      
      if (existingDoctor?.user_id) {
        doctorId = existingDoctor.user_id
        console.log(`  ℹ️  Dr. Adaeze already exists (${doctorEmail})`)
        console.log(`    Invite Code: ADAEZE-2026`)
      }
    } else if (doctorAuthData?.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: doctorAuthData.user.id,
        role: "doctor",
        full_name: "Dr. Adaeze Okonkwo",
        phone: "+234 803 111 2222",
      })

      if (profileError && !isDuplicateError(profileError)) {
        throw profileError
      }

      const inviteCode = "ADAEZE-2026"
      const { error: doctorError } = await supabase.from("doctors").insert({
        user_id: doctorAuthData.user.id,
        invite_code: inviteCode,
        specialty: "Obstetrics & Gynecology",
        clinic_name: "Lagos Women's Health",
      })

      if (doctorError && !isDuplicateError(doctorError)) {
        throw doctorError
      }

      doctorId = doctorAuthData.user.id
      console.log(`  ✓ Dr. Adaeze Okonkwo (${doctorEmail})`)
      console.log(`    Invite Code: ADAEZE-2026`)
      console.log(`    Clinic: Lagos Women's Health`)
    }

    // 2. Create mothers
    console.log("\n👩 Creating demo mothers...")

    const mothersData = [
      {
        email: "aisha.bello@example.com",
        name: "Aisha Bello",
        phone: "+234 803 333 4444",
      },
      {
        email: "chioma.eze@example.com",
        name: "Chioma Eze",
        phone: "+234 803 555 6666",
      },
      {
        email: "fatima.ibrahim@example.com",
        name: "Fatima Ibrahim",
        phone: "+234 803 777 8888",
      },
      {
        email: "blessing.adewale@example.com",
        name: "Blessing Adewale",
        phone: "+234 803 999 0000",
      },
    ]

    const mothers: Mother[] = []

    for (const motherData of mothersData) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: motherData.email,
        password: "DemoPassword@123",
        email_confirm: true,
      })

      if (authError && !isDuplicateError(authError)) {
        throw authError
      }

      if (isDuplicateError(authError)) {
        // Fetch existing mother by email from profiles table
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("full_name", motherData.name)
          .limit(1)
          .single()
        
        if (existingProfile?.id) {
          mothers.push({
            id: existingProfile.id,
            email: motherData.email,
            name: motherData.name,
          })
          console.log(`  ℹ️  ${motherData.name} already exists (${motherData.email})`)
        }
      } else if (authData?.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          role: "mother",
          full_name: motherData.name,
          phone: motherData.phone,
        })

        if (profileError && !isDuplicateError(profileError)) {
          throw profileError
        }

        mothers.push({
          id: authData.user.id,
          email: motherData.email,
          name: motherData.name,
        })
        console.log(`  ✓ ${motherData.name} (${motherData.email})`)
      }
    }

    if (mothers.length < 4) {
      console.log("⚠️  Unable to create all demo mothers")
    }

    // 3. Create pregnancies
    console.log("\n🤰 Creating demo pregnancies...")

    const pregnancies: Pregnancy[] = []

    // Aisha: 32 weeks pregnant (due in 56 days)
    if (mothers[0]) {
      const dueDate = formatDate(addDays(today, 56))
      const { data: pregData, error: pregError } = await supabase
        .from("pregnancies")
        .insert({
          mother_id: mothers[0].id,
          due_date: dueDate,
          status: "active",
          linked_doctor_id: doctorId,
        })
        .select()

      if (pregError && !isDuplicateError(pregError)) {
        throw pregError
      }

      if (pregData?.[0]) {
        pregnancies.push({ id: pregData[0].id, mother_id: mothers[0].id })
        console.log(`  ✓ Aisha — 32 weeks pregnant (due ${dueDate})`)
      } else if (isDuplicateError(pregError)) {
        console.log(`  ℹ️  Aisha's pregnancy already exists (skipped)`)
      }
    }

    // Fatima: 18 weeks pregnant
    if (mothers[2]) {
      const dueDate = formatDate(addDays(today, 154)) // ~22 weeks from now
      const { data: pregData, error: pregError } = await supabase
        .from("pregnancies")
        .insert({
          mother_id: mothers[2].id,
          due_date: dueDate,
          status: "active",
          linked_doctor_id: doctorId,
        })
        .select()

      if (pregError && !isDuplicateError(pregError)) {
        throw pregError
      }

      if (pregData?.[0]) {
        pregnancies.push({ id: pregData[0].id, mother_id: mothers[2].id })
        console.log(`  ✓ Fatima — 18 weeks pregnant (due ${dueDate})`)
      } else if (isDuplicateError(pregError)) {
        console.log(`  ℹ️  Fatima's pregnancy already exists (skipped)`)
      }
    }

    // 4. Create children
    console.log("\n👶 Creating demo children...")

    const children: Child[] = []

    // Chioma: Zara, 28 days old (4 weeks postnatal)
    if (mothers[1]) {
      const birthDate = formatDate(addDays(today, -28))
      const { data: childData, error: childError } = await supabase
        .from("children")
        .insert({
          mother_id: mothers[1].id,
          name: "Zara",
          birth_date: birthDate,
          gender: "female",
          linked_doctor_id: doctorId,
        })
        .select()

      if (childError && !isDuplicateError(childError)) {
        throw childError
      }

      if (childData?.[0]) {
        children.push({ id: childData[0].id, mother_id: mothers[1].id, name: "Zara" })
        console.log(`  ✓ Zara (4 weeks old, Chioma's baby)`)
      } else if (isDuplicateError(childError)) {
        console.log(`  ℹ️  Zara already exists (skipped)`)
      }
    }

    // Blessing: Tomi, 60 days old (2 months postnatal)
    if (mothers[3]) {
      const birthDate = formatDate(addDays(today, -60))
      const { data: childData, error: childError } = await supabase
        .from("children")
        .insert({
          mother_id: mothers[3].id,
          name: "Tomi",
          birth_date: birthDate,
          gender: "male",
        })
        .select()

      if (childError && !isDuplicateError(childError)) {
        throw childError
      }

      if (childData?.[0]) {
        children.push({ id: childData[0].id, mother_id: mothers[3].id, name: "Tomi" })
        console.log(`  ✓ Tomi (2 months old, Blessing's baby)`)
      } else if (isDuplicateError(childError)) {
        console.log(`  ℹ️  Tomi already exists (skipped)`)
      }
    }

    // 5. Create check-ins
    console.log("\n📊 Creating check-in history...")

    // Helper to create check-ins
    const createCheckIns = async (
      motherId: string,
      subjectType: "pregnancy" | "child",
      subjectId: string,
      checkInConfigs: Array<{ daysAgo: number; payload: Record<string, unknown>; note: string }>
    ) => {
      for (const config of checkInConfigs) {
        const createdAt = addDays(today, -config.daysAgo)
        const { error: checkInError } = await supabase.from("checkins").insert({
          mother_id: motherId,
          subject_type: subjectType,
          subject_id: subjectId,
          payload: { ...config.payload, note: config.note },
          created_at: createdAt.toISOString(),
        })

        if (checkInError && !isDuplicateError(checkInError)) {
          throw checkInError
        }
      }
    }

    // Aisha's check-ins: 6 green days, then TODAY's RED flag day
    if (pregnancies[0]) {
      const aishaCheckins = [
        {
          daysAgo: 6,
          payload: {
            feeling: "good",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 118,
            bp_diastolic: 76,
          },
          note: "Feeling good this morning. Baby is active.",
        },
        {
          daysAgo: 5,
          payload: {
            feeling: "good",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 120,
            bp_diastolic: 78,
          },
          note: "Had my afternoon tea, all is well.",
        },
        {
          daysAgo: 4,
          payload: {
            feeling: "good",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 119,
            bp_diastolic: 77,
          },
          note: "Regular kick counts, no concerns.",
        },
        {
          daysAgo: 3,
          payload: {
            feeling: "good",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 121,
            bp_diastolic: 79,
          },
          note: "Attended clinic for routine check-up. Doctor said all is normal.",
        },
        {
          daysAgo: 2,
          payload: {
            feeling: "good",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 120,
            bp_diastolic: 78,
          },
          note: "Rested at home, feeling great.",
        },
        {
          daysAgo: 1,
          payload: {
            feeling: "okay",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 120,
            bp_diastolic: 78,
          },
          note: "Slight fatigue but nothing unusual.",
        },
        {
          daysAgo: 0,
          payload: {
            feeling: "not_great",
            bleeding: false,
            severe_headache: true,
            swelling: true,
            fetal_movement: true,
            bp_systolic: 138,
            bp_diastolic: 88,
          },
          note: "Woke up with a severe headache and noticed my hands and feet are swollen. Very concerned. This is different from usual.",
        },
      ]
      await createCheckIns(mothers[0].id, "pregnancy", pregnancies[0].id, aishaCheckins)
      console.log(`  ✓ Aisha — 7 check-ins (RED flag today: preeclampsia symptoms)`)
    }

    // Chioma's check-ins: 5 days, TODAY's YELLOW flag for low diapers
    if (children[0]) {
      const chiomaCheckins = [
        {
          daysAgo: 5,
          payload: {
            feeding: "breastmilk",
            wet_diapers_24h: 8,
            fever: false,
            breathing_normal: true,
            mother_mood: "good",
          },
          note: "Zara feeding well. 8 wet diapers today.",
        },
        {
          daysAgo: 4,
          payload: {
            feeding: "breastmilk",
            wet_diapers_24h: 7,
            fever: false,
            breathing_normal: true,
            mother_mood: "good",
          },
          note: "Good progress. Steady output.",
        },
        {
          daysAgo: 3,
          payload: {
            feeding: "breastmilk",
            wet_diapers_24h: 8,
            fever: false,
            breathing_normal: true,
            mother_mood: "good",
          },
          note: "All normal today.",
        },
        {
          daysAgo: 2,
          payload: {
            feeding: "breastmilk",
            wet_diapers_24h: 6,
            fever: false,
            breathing_normal: true,
            mother_mood: "good",
          },
          note: "Slightly less today but still within range.",
        },
        {
          daysAgo: 1,
          payload: {
            feeding: "breastmilk",
            wet_diapers_24h: 6,
            fever: false,
            breathing_normal: true,
            mother_mood: "okay",
          },
          note: "I'm feeling a bit tired. Zara seems okay.",
        },
        {
          daysAgo: 0,
          payload: {
            feeding: "breastmilk",
            wet_diapers_24h: 5,
            fever: false,
            breathing_normal: true,
            mother_mood: "okay",
          },
          note: "Only 5 wet diapers today. Zara seems less interested in feeding. Should I be worried?",
        },
      ]
      await createCheckIns(mothers[1].id, "child", children[0].id, chiomaCheckins)
      console.log(`  ✓ Chioma — 6 check-ins (YELLOW flag today: low wet diapers)`)
    }

    // Fatima's check-ins: 7 days all green
    if (pregnancies[1]) {
      const fatimaCheckins = [
        {
          daysAgo: 7,
          payload: {
            feeling: "good",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 117,
            bp_diastolic: 75,
          },
          note: "First week of check-ins. Excited about pregnancy journey.",
        },
        {
          daysAgo: 6,
          payload: {
            feeling: "good",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 119,
            bp_diastolic: 77,
          },
          note: "Feeling energetic today.",
        },
        {
          daysAgo: 5,
          payload: {
            feeling: "good",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 120,
            bp_diastolic: 76,
          },
          note: "All signs normal. Regular appointments scheduled.",
        },
        {
          daysAgo: 4,
          payload: {
            feeling: "good",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 118,
            bp_diastolic: 78,
          },
          note: "No morning sickness today. Baby is active.",
        },
        {
          daysAgo: 3,
          payload: {
            feeling: "okay",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 119,
            bp_diastolic: 77,
          },
          note: "Slight fatigue, resting this evening.",
        },
        {
          daysAgo: 2,
          payload: {
            feeling: "good",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 120,
            bp_diastolic: 75,
          },
          note: "Better today. Staying hydrated.",
        },
        {
          daysAgo: 1,
          payload: {
            feeling: "good",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 119,
            bp_diastolic: 76,
          },
          note: "Regular checkup upcoming. Looking forward to it.",
        },
        {
          daysAgo: 0,
          payload: {
            feeling: "good",
            bleeding: false,
            severe_headache: false,
            swelling: false,
            fetal_movement: true,
            bp_systolic: 118,
            bp_diastolic: 75,
          },
          note: "Consistent good health. Grateful for smooth pregnancy so far.",
        },
      ]
      await createCheckIns(mothers[2].id, "pregnancy", pregnancies[1].id, fatimaCheckins)
      console.log(`  ✓ Fatima — 8 check-ins (all GREEN)`)
    }

    // Blessing's check-ins: 5 days all green (postnatal, no pregnancy)
    if (children[1]) {
      const blessingCheckins = [
        {
          daysAgo: 5,
          payload: {
            feeding: "breastmilk",
            wet_diapers_24h: 8,
            fever: false,
            breathing_normal: true,
            mother_mood: "good",
          },
          note: "Tomi is 2 months old and thriving. Great feeding.",
        },
        {
          daysAgo: 4,
          payload: {
            feeding: "breastmilk",
            wet_diapers_24h: 7,
            fever: false,
            breathing_normal: true,
            mother_mood: "good",
          },
          note: "Even without pregnancy tracking from the start, I'm managing well.",
        },
        {
          daysAgo: 3,
          payload: {
            feeding: "breastmilk",
            wet_diapers_24h: 8,
            fever: false,
            breathing_normal: true,
            mother_mood: "good",
          },
          note: "Tomi is sleeping well. I'm recovering nicely.",
        },
        {
          daysAgo: 2,
          payload: {
            feeding: "breastmilk",
            wet_diapers_24h: 7,
            fever: false,
            breathing_normal: true,
            mother_mood: "good",
          },
          note: "This app is great for postnatal tracking too!",
        },
        {
          daysAgo: 0,
          payload: {
            feeding: "breastmilk",
            wet_diapers_24h: 8,
            fever: false,
            breathing_normal: true,
            mother_mood: "good",
          },
          note: "Tomi continues to grow strong. All is well.",
        },
      ]
      await createCheckIns(mothers[3].id, "child", children[1].id, blessingCheckins)
      console.log(`  ✓ Blessing — 5 check-ins (all GREEN, postnatal-only mother)`)
    }

    // 6. Insert flags for today's flagged check-ins
    console.log("\n🚩 Inserting demo flags...")

    // Aisha — RED preeclampsia flag on today's check-in
    if (pregnancies[0] && mothers[0]) {
      const { data: aishaToday } = await supabase
        .from("checkins")
        .select("id")
        .eq("subject_id", pregnancies[0].id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (aishaToday) {
        await supabase.from("flags").insert({
          mother_id: mothers[0].id,
          checkin_id: aishaToday.id,
          subject_type: "pregnancy",
          subject_id: pregnancies[0].id,
          rule_id: "preg_preeclampsia_symptoms",
          severity: "red",
          message: "Possible preeclampsia signs — contact your doctor now",
        })
        console.log("  ✓ RED flag — Aisha (preeclampsia symptoms)")
      }
    }

    // Chioma — YELLOW low diapers flag on today's check-in
    if (children[0] && mothers[1]) {
      const { data: chiomaToday } = await supabase
        .from("checkins")
        .select("id")
        .eq("subject_id", children[0].id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (chiomaToday) {
        await supabase.from("flags").insert({
          mother_id: mothers[1].id,
          checkin_id: chiomaToday.id,
          subject_type: "child",
          subject_id: children[0].id,
          rule_id: "child_low_diapers",
          severity: "yellow",
          message: "Low wet diaper count — watch for dehydration",
        })
        console.log("  ✓ YELLOW flag — Chioma/Zara (low wet diapers)")
      }
    }

    // 7. Print summary
    console.log("\n" + "=".repeat(60))
    console.log("✅ Demo seed completed!\n")

    console.log("🔑 Test Credentials:")
    console.log("\n👨‍⚕️  Doctor:")
    console.log(`  Email: ${doctorEmail}`)
    console.log(`  Password: DemoPassword@123`)
    console.log(`  Invite Code: ADAEZE-2026`)
    console.log(`  Clinic: Lagos Women's Health`)

    console.log("\n👩 Mothers:")
    for (const mother of mothers) {
      console.log(`  • ${mother.name} (${mother.email}) / DemoPassword@123`)
    }

    console.log("\n🎯 Demo Scenarios:")
    console.log("  1. Aisha Bello — RED FLAG DEMO")
    console.log("     • 32 weeks pregnant, all green until today")
    console.log("     • TODAY: severe_headache + swelling")
    console.log("     • Triggers: 🚨 RED preeclampsia alert")
    console.log("     • Use case: Doctor dashboard shows priority alert")

    console.log("\n  2. Chioma Eze — YELLOW FLAG DEMO")
    console.log("     • 4 weeks postnatal (baby Zara)")
    console.log("     • 5 days of normal check-ins")
    console.log("     • TODAY: 5 wet diapers (below threshold)")
    console.log("     • Triggers: ⚠️  YELLOW low diaper alert")
    console.log("     • Use case: Preventive health notice")

    console.log("\n  3. Fatima Ibrahim — ALL GREEN DEMO")
    console.log("     • 18 weeks pregnant")
    console.log("     • 8 days of consistent green check-ins")
    console.log("     • Use case: Smooth pregnancy monitoring")

    console.log("\n  4. Blessing Adewale — POSTNATAL-ONLY DEMO")
    console.log("     • No pregnancy record (started late)")
    console.log("     • Baby Tomi, 2 months old")
    console.log("     • 5 days of green check-ins")
    console.log("     • Use case: App works for mothers who didn't use it during pregnancy")

    console.log("\n💡 Getting Started:")
    console.log("  1. Login as doctor: " + doctorEmail)
    console.log("     • View doctor dashboard with all 3 linked mothers")
    console.log("     • See Aisha's RED alert highlighted")
    console.log("     • See Chioma's YELLOW alert")

    console.log("\n  2. Login as Aisha: " + mothers[0]?.email)
    console.log("     • Click on pregnancy card → see check-in history")
    console.log("     • View today's check-in with the RED flag")
    console.log("     • Click 'Brief' to see pre-visit summary")

    console.log("\n  3. Test AI Chat:")
    console.log("     • Login as any mother")
    console.log("     • Click 🤖 Health Assistant")
    console.log("     • Try: 'What should I do about preeclampsia symptoms?'")
    console.log("     • (Requires GROQ_API_KEY env var)")

    console.log("\n" + "=".repeat(60) + "\n")
  } catch (error) {
    console.error("❌ Seed failed:", error)
    process.exit(1)
  }
}

seed()
