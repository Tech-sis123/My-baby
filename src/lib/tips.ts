const PREGNANCY_TIPS: Record<number, string> = {
  4: "Your baby is the size of a poppy seed. Start taking folic acid daily if you haven't already.",
  8: "Morning sickness is common now. Try eating small, frequent meals and staying hydrated.",
  12: "Your first trimester is nearly done! Many women start to feel better after week 12.",
  16: "You may start to feel baby's first movements soon — gentle flutters called 'quickening'.",
  20: "Halfway there! Your anomaly scan is usually around this time.",
  24: "Baby can now hear your voice. Talk or sing to your bump!",
  28: "You've entered the third trimester. Start tracking daily fetal movements.",
  32: "Baby is gaining weight rapidly. Rest when you can and stay hydrated.",
  36: "Baby is nearly full-term. Pack your hospital bag and confirm your birth plan.",
  40: "You're at full term! Contact your midwife if you don't feel the baby moving normally.",
}

export function getPregnancyTip(week: number): string {
  const milestones = Object.keys(PREGNANCY_TIPS).map(Number).sort((a, b) => a - b)
  const nearest = milestones.reduce((prev, curr) =>
    Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
  )
  return PREGNANCY_TIPS[nearest] || "Stay hydrated, rest well, and attend your antenatal appointments."
}

const BABY_TIPS: Record<number, string> = {
  0: "Newborns need feeding every 2–3 hours. Skin-to-skin contact helps bonding and breastfeeding.",
  30: "Babies may start to smile socially around 6 weeks. Enjoy those first real smiles!",
  60: "Tummy time helps strengthen neck and shoulder muscles. Try a few minutes each day.",
  90: "Your baby may be cooing and gurgling. Talk back — it builds language skills.",
  120: "Most babies can hold their head steady by 4 months.",
  150: "Around 5 months, babies often start reaching for objects and rolling over.",
  180: "Watch for signs your baby is ready for solid foods around 6 months.",
  270: "Most babies take their first steps between 9 and 12 months.",
  365: "Happy 1st birthday! Transition to full-fat cow's milk is usually recommended now.",
  540: "18 months: encourage walking, talking, and lots of play.",
  730: "2 years: a full health check is recommended. Celebrate this milestone!",
}

export function getBabyTip(ageDays: number): string {
  const milestones = Object.keys(BABY_TIPS).map(Number).sort((a, b) => a - b)
  const nearest = milestones.reduce((prev, curr) =>
    Math.abs(curr - ageDays) < Math.abs(prev - ageDays) ? curr : prev
  )
  return BABY_TIPS[nearest] || "Keep up with routine check-ups and enjoy every little milestone."
}
