import { createClient } from '@supabase/supabase-js';

// In the browser (Vite) we must use import.meta.env for environment variables.
// Vite requires env variables exposed to client code to be prefixed with `VITE_`.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ceysosfhthesvuaaamub.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNleXNvc2ZodGhlc3Z1YWFhbXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTk1NjIsImV4cCI6MjA3MjgzNTU2Mn0.dY1u_Ls1BNmPSVoKPQS0AAf-f6Z8ebjHcAdMXobvf6w';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
	// Use a console warning in dev to encourage moving keys to Vite env vars
	// Do NOT expose real production keys to client builds; prefer server-side APIs.
	console.warn('Warning: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY not set. Falling back to embedded defaults. For local dev, create a .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
