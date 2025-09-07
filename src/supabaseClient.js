import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ceysosfhthesvuaaamub.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNleXNvc2ZodGhlc3Z1YWFhbXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTk1NjIsImV4cCI6MjA3MjgzNTU2Mn0.dY1u_Ls1BNmPSVoKPQS0AAf-f6Z8ebjHcAdMXobvf6w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
