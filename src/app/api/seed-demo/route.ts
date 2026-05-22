import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export async function POST(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Missing Supabase admin keys" }, { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const { doctorId } = await req.json()
    if (!doctorId) {
      return NextResponse.json({ error: "doctorId required" }, { status: 400 })
    }

    // Check if this doctor already has patients
    const { count } = await supabase
      .from("pregnancies")
      .select("*", { count: 'exact', head: true })
      .eq("linked_doctor_id", doctorId)
      
    if (count && count > 0) {
      return NextResponse.json({ success: true, message: "Already seeded" })
    }

    const today = new Date()
    function addDays(date: Date, days: number): Date {
      const result = new Date(date)
      result.setDate(result.getDate() + days)
      return result
    }
    function formatDate(date: Date): string {
      return date.toISOString().split("T")[0]
    }

    const safeDoctorId = doctorId.slice(0, 8) // short id for uniqueness

    const mothersData = [
      { email: `aisha.bello+${safeDoctorId}@example.com`, name: "Aisha Bello", phone: "+234 803 333 4444" },
      { email: `chioma.eze+${safeDoctorId}@example.com`, name: "Chioma Eze", phone: "+234 803 555 6666" },
      { email: `fatima.ibrahim+${safeDoctorId}@example.com`, name: "Fatima Ibrahim", phone: "+234 803 777 8888" },
      { email: `blessing.adewale+${safeDoctorId}@example.com`, name: "Blessing Adewale", phone: "+234 803 999 0000" },
      { email: `ngozi.okafor+${safeDoctorId}@example.com`, name: "Ngozi Okafor", phone: "+234 803 111 1111" },
      { email: `yewande.coker+${safeDoctorId}@example.com`, name: "Yewande Coker", phone: "+234 803 222 2222" },
      { email: `amina.yusuf+${safeDoctorId}@example.com`, name: "Amina Yusuf", phone: "+234 803 333 3333" },
      { email: `grace.ojo+${safeDoctorId}@example.com`, name: "Grace Ojo", phone: "+234 803 444 4444" },
      { email: `zainab.aliyu+${safeDoctorId}@example.com`, name: "Zainab Aliyu", phone: "+234 803 555 5555" },
    ]

    const mothers = []
    
    for (const data of mothersData) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: "DemoPassword@123",
        email_confirm: true,
      })

      if (authError) continue

      if (authData?.user) {
        await supabase.from("profiles").insert({
          id: authData.user.id,
          role: "mother",
          full_name: data.name,
          phone: data.phone,
        })
        mothers.push({ id: authData.user.id, ...data })
      }
    }

    if (mothers.length === 0) {
      return NextResponse.json({ error: "Failed to create mothers" }, { status: 500 })
    }

    const pregnancies = []
    const children = []

    // 1. Aisha (Pregnancy) - RED
    if (mothers[0]) {
      const { data: preg } = await supabase.from("pregnancies").insert({
        mother_id: mothers[0].id, due_date: formatDate(addDays(today, 56)), status: "active", linked_doctor_id: doctorId
      }).select().single()
      if (preg) pregnancies.push({ id: preg.id, mother: mothers[0] })
    }

    // 2. Chioma (Child) - YELLOW
    if (mothers[1]) {
      const { data: child } = await supabase.from("children").insert({
        mother_id: mothers[1].id, name: "Zara", birth_date: formatDate(addDays(today, -28)), gender: "female", linked_doctor_id: doctorId
      }).select().single()
      if (child) children.push({ id: child.id, mother: mothers[1] })
    }

    // 3. Fatima (Pregnancy) - GREEN
    if (mothers[2]) {
      const { data: preg } = await supabase.from("pregnancies").insert({
        mother_id: mothers[2].id, due_date: formatDate(addDays(today, 154)), status: "active", linked_doctor_id: doctorId
      }).select().single()
      if (preg) pregnancies.push({ id: preg.id, mother: mothers[2] })
    }

    // 4. Blessing (Child) - GREEN
    if (mothers[3]) {
      const { data: child } = await supabase.from("children").insert({
        mother_id: mothers[3].id, name: "Tomi", birth_date: formatDate(addDays(today, -60)), gender: "male", linked_doctor_id: doctorId
      }).select().single()
      if (child) children.push({ id: child.id, mother: mothers[3] })
    }

    // 5. Ngozi (Pregnancy) - RED
    if (mothers[4]) {
      const { data: preg } = await supabase.from("pregnancies").insert({
        mother_id: mothers[4].id, due_date: formatDate(addDays(today, 21)), status: "active", linked_doctor_id: doctorId
      }).select().single()
      if (preg) pregnancies.push({ id: preg.id, mother: mothers[4] })
    }

    // 6. Yewande (Pregnancy) - YELLOW
    if (mothers[5]) {
      const { data: preg } = await supabase.from("pregnancies").insert({
        mother_id: mothers[5].id, due_date: formatDate(addDays(today, 100)), status: "active", linked_doctor_id: doctorId
      }).select().single()
      if (preg) pregnancies.push({ id: preg.id, mother: mothers[5] })
    }

    // 7. Amina (Pregnancy) - GREEN
    if (mothers[6]) {
      const { data: preg } = await supabase.from("pregnancies").insert({
        mother_id: mothers[6].id, due_date: formatDate(addDays(today, 180)), status: "active", linked_doctor_id: doctorId
      }).select().single()
      if (preg) pregnancies.push({ id: preg.id, mother: mothers[6] })
    }

    // 8. Grace (Child) - GREEN
    if (mothers[7]) {
      const { data: child } = await supabase.from("children").insert({
        mother_id: mothers[7].id, name: "David", birth_date: formatDate(addDays(today, -100)), gender: "male", linked_doctor_id: doctorId
      }).select().single()
      if (child) children.push({ id: child.id, mother: mothers[7] })
    }

    // 9. Zainab (Pregnancy) - GREEN
    if (mothers[8]) {
      const { data: preg } = await supabase.from("pregnancies").insert({
        mother_id: mothers[8].id, due_date: formatDate(addDays(today, 40)), status: "active", linked_doctor_id: doctorId
      }).select().single()
      if (preg) pregnancies.push({ id: preg.id, mother: mothers[8] })
    }

    // --- CHECKINS AND FLAGS ---
    const insertCheckin = async (mId: string, type: "pregnancy"|"child", sId: string, payload: any, daysAgo: number, ruleId?: string, sev?: string, msg?: string) => {
      const { data: c } = await supabase.from("checkins").insert({
        mother_id: mId, subject_type: type, subject_id: sId, payload, created_at: addDays(today, -daysAgo).toISOString()
      }).select().single()

      if (c && ruleId && sev && msg) {
        await supabase.from("flags").insert({
          mother_id: mId, checkin_id: c.id, subject_type: type, subject_id: sId,
          rule_id: ruleId, severity: sev, message: msg
        })
      }
    }

    // Aisha (Red - Preeclampsia)
    if (pregnancies[0]) {
      await insertCheckin(pregnancies[0].mother.id, "pregnancy", pregnancies[0].id, { feeling: "good" }, 1)
      await insertCheckin(pregnancies[0].mother.id, "pregnancy", pregnancies[0].id, {
        feeling: "not_great", severe_headache: true, swelling: true, bp_systolic: 145, bp_diastolic: 95
      }, 0, "preg_preeclampsia_symptoms", "red", "Possible preeclampsia signs — contact your doctor now")
    }

    // Chioma (Yellow - Low diapers)
    if (children[0]) {
      await insertCheckin(children[0].mother.id, "child", children[0].id, { feeding: "breastmilk", wet_diapers_24h: 8 }, 1)
      await insertCheckin(children[0].mother.id, "child", children[0].id, {
        feeding: "breastmilk", wet_diapers_24h: 4, mother_mood: "okay"
      }, 0, "child_low_diapers", "yellow", "Low wet diaper count — watch for dehydration")
    }

    // Fatima (Green)
    if (pregnancies[1]) {
      await insertCheckin(pregnancies[1].mother.id, "pregnancy", pregnancies[1].id, { feeling: "good" }, 0)
    }

    // Blessing (Green)
    if (children[1]) {
      await insertCheckin(children[1].mother.id, "child", children[1].id, { feeding: "formula", wet_diapers_24h: 7 }, 0)
    }

    // Ngozi (Red - Reduced movement)
    if (pregnancies[2]) {
      await insertCheckin(pregnancies[2].mother.id, "pregnancy", pregnancies[2].id, {
        feeling: "not_great", fetal_movement: false
      }, 0, "preg_reduced_movement", "red", "Reduced fetal movement — contact your doctor today")
    }

    // Yewande (Yellow - sustained low mood)
    if (pregnancies[3]) {
      await insertCheckin(pregnancies[3].mother.id, "pregnancy", pregnancies[3].id, { feeling: "not_great" }, 2)
      await insertCheckin(pregnancies[3].mother.id, "pregnancy", pregnancies[3].id, { feeling: "not_great" }, 1)
      await insertCheckin(pregnancies[3].mother.id, "pregnancy", pregnancies[3].id, { feeling: "not_great" }, 0, 
        "preg_sustained_low_mood", "yellow", "Feeling low for 3 days — consider speaking with your doctor")
    }

    // Amina, Grace, Zainab (Green)
    if (pregnancies[4]) await insertCheckin(pregnancies[4].mother.id, "pregnancy", pregnancies[4].id, { feeling: "good" }, 0)
    if (children[2]) await insertCheckin(children[2].mother.id, "child", children[2].id, { feeding: "breastmilk" }, 0)
    if (pregnancies[5]) await insertCheckin(pregnancies[5].mother.id, "pregnancy", pregnancies[5].id, { feeling: "good" }, 0)

    // --- MESSAGES ---
    // Seed the messages table!
    const sendMsg = async (senderId: string, receiverId: string, content: string, daysAgo: number) => {
      await supabase.from("messages").insert({
        sender_id: senderId, receiver_id: receiverId, content, created_at: addDays(today, -daysAgo).toISOString()
      })
    }

    // Aisha talks to doctor
    if (pregnancies[0]) {
      await sendMsg(pregnancies[0].mother.id, doctorId, "Good morning Doctor, I woke up with a very bad headache and my feet are swelling a lot.", 0)
    }

    // Chioma talks to doctor
    if (children[0]) {
      await sendMsg(children[0].mother.id, doctorId, "Hi Doctor, Zara hasn't been taking much milk today and her diapers are quite dry.", 0)
      await sendMsg(doctorId, children[0].mother.id, "Hi Chioma, please try to offer the breast more frequently. If she doesn't pee in the next 4 hours, bring her into the clinic.", 0)
    }

    // Fatima talks to doctor
    if (pregnancies[1]) {
      await sendMsg(pregnancies[1].mother.id, doctorId, "Doctor, can I take paracetamol for a mild headache?", 1)
      await sendMsg(doctorId, pregnancies[1].mother.id, "Yes Fatima, a standard dose of paracetamol is safe. Stay hydrated as well.", 1)
      await sendMsg(pregnancies[1].mother.id, doctorId, "Thank you doctor!", 1)
    }

    // Blessing talks to doctor
    if (children[1]) {
      await sendMsg(children[1].mother.id, doctorId, "Just checking in, Tomi is doing great!", 2)
    }

    // Ngozi talks to doctor
    if (pregnancies[2]) {
      await sendMsg(pregnancies[2].mother.id, doctorId, "Doctor, I haven't felt the baby move since last night. I am very worried.", 0)
    }

    return NextResponse.json({ success: true, count: mothers.length })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
