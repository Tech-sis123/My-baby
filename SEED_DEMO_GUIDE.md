# Demo Seed Script Guide

## Quick Start

Run the seed script with your Supabase service role key:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key npx tsx scripts/seed.ts
```

## What Gets Created

### 👨‍⚕️ Doctor
- **Name:** Dr. Adaeze Okonkwo
- **Specialty:** Obstetrics & Gynecology
- **Clinic:** Lagos Women's Health
- **Email:** `dr.adaeze@example.com`
- **Password:** `DemoPassword@123`
- **Invite Code:** `ADAEZE-2026` (memorable!)

### 👩 4 Mothers (All Linked to Dr. Adaeze)

#### 1. **Aisha Bello** — 🚨 RED FLAG DEMO
- **Email:** `aisha.bello@example.com` / `DemoPassword@123`
- **Current State:** 32 weeks pregnant (due in 56 days)
- **Check-in History:**
  - 6 days of perfect check-ins (all green)
  - TODAY: severe_headache + swelling
- **Expected Alert:** 🚨 **RED** preeclampsia warning
- **Demo Use:** Shows doctor dashboard with priority alert
- **How to see:** Login as doctor, check dashboard; or login as Aisha to see the alert

#### 2. **Chioma Eze** — ⚠️ YELLOW FLAG DEMO
- **Email:** `chioma.eze@example.com` / `DemoPassword@123`
- **Current State:** 4 weeks post-delivery
- **Baby:** Zara (28 days old, linked to Dr. Adaeze)
- **Check-in History:**
  - 5 days of normal check-ins
  - TODAY: Only 5 wet diapers (below 6-diaper threshold)
- **Expected Alert:** ⚠️ **YELLOW** low diaper warning
- **Demo Use:** Shows preventive health monitoring

#### 3. **Fatima Ibrahim** — ✅ ALL GREEN DEMO
- **Email:** `fatima.ibrahim@example.com` / `DemoPassword@123`
- **Current State:** 18 weeks pregnant (due in 154 days)
- **Check-in History:** 8 days of consistently green check-ins
- **Expected Alert:** None (all healthy)
- **Demo Use:** Shows smooth pregnancy monitoring

#### 4. **Blessing Adewale** — 📱 POSTNATAL-ONLY DEMO
- **Email:** `blessing.adewale@example.com` / `DemoPassword@123`
- **Current State:** No pregnancy record (started app after delivery)
- **Baby:** Tomi (60 days / 2 months old)
- **Check-in History:** 5 days of green check-ins
- **Expected Alert:** None (all healthy)
- **Demo Use:** Proves app works for mothers who didn't use it during pregnancy

---

## Demo Walkthrough

### For Demos/Presentations

**1. Doctor Dashboard Experience (3 minutes)**
```
Login as: dr.adaeze@example.com / DemoPassword@123
→ See all 3 linked mothers
→ Aisha's card shows RED alert badge
→ Chioma's card shows YELLOW alert badge
→ Click on Aisha → See full flag with message
→ Click on Chioma → See full flag with message
```

**2. Mother's Perspective – Alert Day (2 minutes)**
```
Login as: aisha.bello@example.com / DemoPassword@123
→ Home page shows pregnancy card with RED dot
→ Click "Check in" → See today's check-in details
→ Click "Brief" → View pre-visit summary (useful for doctor appointment)
→ Note realistic narrative in the notes field
```

**3. Healthy Pregnancy (1 minute)**
```
Login as: fatima.ibrahim@example.com / DemoPassword@123
→ All check-ins are green
→ Shows normal pregnancy monitoring flow
```

**4. Postnatal Mother (1 minute)**
```
Login as: blessing.adewale@example.com / DemoPassword@123
→ No pregnancy in system
→ Baby checks work independently
→ Demonstrates flexible onboarding
```

**5. AI Health Assistant (if GROQ_API_KEY set)**
```
Login as any mother
→ Click 💬 Health Assistant (top right)
→ Ask: "What should I do about preeclampsia symptoms?"
→ See streaming AI response
```

---

## Environment Variables Needed

```bash
# Required
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional (for AI chat demos)
export GROQ_API_KEY=gsk_...
```

### How to Get Service Role Key

1. Go to Supabase project dashboard
2. Settings → API
3. Copy the **Service Role Secret** (NOT the Anon Key)
4. Keep it safe! It has full database access

---

## Checking the Seed Output

After running, you should see something like:

```
🌱 Starting database seed with demo data...

👨‍⚕️  Creating demo doctor...
  ✓ Dr. Adaeze Okonkwo (dr.adaeze@example.com)
    Invite Code: ADAEZE-2026
    Clinic: Lagos Women's Health

👩 Creating demo mothers...
  ✓ Aisha Bello (aisha.bello@example.com)
  ✓ Chioma Eze (chioma.eze@example.com)
  ✓ Fatima Ibrahim (fatima.ibrahim@example.com)
  ✓ Blessing Adewale (blessing.adewale@example.com)

🤰 Creating demo pregnancies...
  ✓ Aisha — 32 weeks pregnant (due 2026-06-13)
  ✓ Fatima — 18 weeks pregnant (due 2026-10-21)

👶 Creating demo children...
  ✓ Zara (4 weeks old, Chioma's baby)
  ✓ Tomi (2 months old, Blessing's baby)

📊 Creating check-in history...
  ✓ Aisha — 7 check-ins (RED flag today: preeclampsia symptoms)
  ✓ Chioma — 6 check-ins (YELLOW flag today: low wet diapers)
  ✓ Fatima — 8 check-ins (all GREEN)
  ✓ Blessing — 5 check-ins (all GREEN, postnatal-only mother)

============================================================
✅ Demo seed completed!

[... followed by credentials and getting started tips ...]
```

---

## Realistic Check-in Data Included

Each check-in has:
- ✅ Realistic health metrics (blood pressure, diaper counts, etc.)
- 📝 Authentic narrative notes (not generic)
- 📅 Proper timestamps (working backwards from today)
- 🎯 Designed to trigger expected flags

Examples of notes:
- "Woke up with a severe headache and noticed my hands and feet are swollen. Very concerned."
- "Only 5 wet diapers today. Zara seems less interested in feeding."
- "First week of check-ins. Excited about pregnancy journey."

---

## Troubleshooting

**"SUPABASE_SERVICE_ROLE_KEY is missing"**
- Ensure you set the env var before running
- Don't use the regular Anon Key, use Service Role Key

**"already exists" errors**
- Safe to ignore — script handles duplicate data gracefully
- Users are only created if they don't already exist

**No check-ins appearing**
- Check that pregnancies/children were created first
- Look at the script output for "✓" marks

**Red flags not showing**
- Verify today's check-in was created (check database directly)
- Clear browser cache
- Refresh page

---

## Running Again

The script is idempotent for accounts (won't duplicate), but will create new check-ins each run.

To reset and start fresh:
1. Delete the Supabase project
2. Create a new one
3. Run seed script on the new project

Or manually delete users/check-ins from Supabase dashboard.
