import { SupabaseClient } from "@supabase/supabase-js"
import { Database, Message } from "./types"

/**
 * Fetches the message history between two users, ordered by creation time ascending.
 */
export async function getMessageHistory(
  supabase: SupabaseClient<Database>,
  userId1: string,
  userId2: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching message history:", error)
    return []
  }

  return data || []
}

/**
 * Sends a message from one user to another.
 */
export async function sendMessage(
  supabase: SupabaseClient<Database>,
  senderId: string,
  receiverId: string,
  content: string
): Promise<Message | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
    })
    .select()
    .single()

  if (error) {
    console.error("Error sending message:", error)
    return null
  }

  return data
}
