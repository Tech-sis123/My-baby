-- WARNING: This will delete ALL data in your database.
-- Run this only if you want to completely wipe your application data.

-- Truncate all public tables and cascade to remove dependent records
TRUNCATE TABLE 
  public.messages,
  public.flags,
  public.checkins,
  public.appointments,
  public.children,
  public.pregnancies,
  public.doctors,
  public.profiles 
CASCADE;

-- Optional: If you also want to delete all registered users (authentication), 
-- uncomment the line below. Note that this requires appropriate permissions 
-- and will wipe out all user accounts.
-- TRUNCATE TABLE auth.users CASCADE;
