import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uoxmndeswjuuamyzfyfo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVveG1uZGVzd2p1dWFteXpmeWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2OTc2NzIsImV4cCI6MjA5MDI3MzY3Mn0.FfdmtMEwgzdxBPI9BaTfFoPA4nX53seytsgOSd3ej9I'

export const supabase = createClient(supabaseUrl, supabaseKey)