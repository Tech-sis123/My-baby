// Clinical rule engine — pure TypeScript, no AI.
// Every flag carries rule_id for auditability.

export interface CheckinPayload {
  // Pregnancy fields
  feeling?: "good" | "okay" | "not_great"
  bleeding?: boolean
  severe_headache?: boolean
  swelling?: boolean
  fetal_movement?: boolean | "na"
  bp_systolic?: number
  bp_diastolic?: number
  // Child fields
  feeding?: "breastmilk" | "formula" | "both" | "solids"
  wet_diapers_24h?: number
  fever?: boolean
  temp?: number
  breathing_normal?: boolean
  mother_mood?: "good" | "okay" | "low" | "very_low"
  // Shared
  note?: string
}

export interface FlagResult {
  rule_id: string
  severity: "red" | "yellow" | "green"
  message: string
  subject_type: "pregnancy" | "child"
  subject_id: string
}

export interface EvaluateParams {
  payload: CheckinPayload
  subject_type: "pregnancy" | "child"
  subject_id: string
  gestational_week?: number   // for pregnancy rules
  baby_age_days?: number       // for child rules
  recent_payloads?: CheckinPayload[] // last N check-ins, newest first
}

export function evaluateCheckin(params: EvaluateParams): FlagResult[] {
  const { payload, subject_type, subject_id, gestational_week = 0, baby_age_days = 0, recent_payloads = [] } = params
  const flags: FlagResult[] = []

  const flag = (rule_id: string, severity: "red" | "yellow" | "green", message: string) => {
    flags.push({ rule_id, severity, message, subject_type, subject_id })
  }

  if (subject_type === "pregnancy") {
    if (payload.bleeding === true) {
      flag("preg_bleeding", "red", "Bleeding reported — contact your doctor immediately")
    }

    if (payload.severe_headache === true && payload.swelling === true) {
      flag("preg_preeclampsia_symptoms", "red", "Possible preeclampsia signs — contact your doctor now")
    }

    if ((payload.bp_systolic !== undefined && payload.bp_systolic >= 140) ||
        (payload.bp_diastolic !== undefined && payload.bp_diastolic >= 90)) {
      flag("preg_high_bp", "red", "High blood pressure — contact your doctor")
    }

    if (gestational_week >= 28 && payload.fetal_movement === false) {
      flag("preg_reduced_movement", "red", "Reduced fetal movement — contact your doctor today")
    }

    // Sustained low mood: current + previous 2 all 'not_great'
    if (
      payload.feeling === "not_great" &&
      recent_payloads.length >= 2 &&
      recent_payloads[0]?.feeling === "not_great" &&
      recent_payloads[1]?.feeling === "not_great"
    ) {
      flag("preg_sustained_low_mood", "yellow", "Feeling low for 3 days — consider speaking with your doctor")
    }
  }

  if (subject_type === "child") {
    if (baby_age_days < 90 && payload.fever === true && (payload.temp ?? 0) >= 38) {
      flag("child_young_fever", "red", "Fever in a young baby — go to clinic now")
    }

    if (payload.breathing_normal === false) {
      flag("child_breathing", "red", "Breathing concern — go to clinic now")
    }

    if (payload.wet_diapers_24h !== undefined && payload.wet_diapers_24h < 6) {
      flag("child_low_diapers", "yellow", "Low wet diaper count — watch for dehydration")
    }

    // PPD screen: current very_low + 4 of last 5 also very_low
    if (payload.mother_mood === "very_low") {
      const last5 = recent_payloads.slice(0, 5)
      const veryLowCount = last5.filter(p => p.mother_mood === "very_low").length
      if (veryLowCount >= 4) {
        flag("child_ppd_screen", "yellow", "Your mood has been low — please talk to someone you trust or your doctor")
      }
    }
  }

  return flags
}
