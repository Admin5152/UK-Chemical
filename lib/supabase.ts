import { createClient } from '@supabase/supabase-js';

// Values provided by the user
const supabaseUrl = 'https://yhzsobpxhszpbosmumhj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloenNvYnB4aHN6cGJvc211bWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NTE0MjMsImV4cCI6MjA3OTAyNzQyM30.Kl-VkBn8SRGR4KESsjhzV3qKtOhvxlvtdoozJ7OsTws';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);