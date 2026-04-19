import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatStage(type: "pregnancy" | "child", subject: {
  due_date?: string
  birth_date?: string
  name?: string
}): string {
  if (type === "pregnancy" && subject.due_date) {
    const today = new Date()
    const due = new Date(subject.due_date)
    const daysLeft = Math.floor((due.getTime() - today.getTime()) / 86400000)
    const weeksPregnant = Math.max(0, Math.floor((280 - daysLeft) / 7))
    return `Week ${weeksPregnant}`
  }
  if (type === "child" && subject.birth_date && subject.name) {
    const today = new Date()
    const birth = new Date(subject.birth_date)
    const days = Math.floor((today.getTime() - birth.getTime()) / 86400000)
    const months = Math.floor(days / 30)
    if (months < 1) return `${subject.name}, ${days} days old`
    if (months === 1) return `${subject.name}, 1 month`
    return `${subject.name}, ${months} months`
  }
  return ""
}

export function getGestationalWeek(dueDate: string): number {
  const today = new Date()
  const due = new Date(dueDate)
  const daysLeft = Math.floor((due.getTime() - today.getTime()) / 86400000)
  return Math.max(0, Math.floor((280 - daysLeft) / 7))
}

export function getBabyAgeDays(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  return Math.floor((today.getTime() - birth.getTime()) / 86400000)
}

export function isOver24Months(birthDate: string): boolean {
  return getBabyAgeDays(birthDate) > 730
}

export const SEVERITY_COLORS: Record<string, string> = {
  red: "text-red-600 bg-red-50 border-red-200",
  yellow: "text-yellow-600 bg-yellow-50 border-yellow-200",
  green: "text-emerald-600 bg-emerald-50 border-emerald-200",
}

export const SEVERITY_DOT: Record<string, string> = {
  red: "bg-[#DC2626]",
  yellow: "bg-[#F59E0B]",
  green: "bg-[#10B981]",
}
