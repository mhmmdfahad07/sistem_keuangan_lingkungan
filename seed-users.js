const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  global: { fetch: fetch },
  realtime: { transport: ws }
});

async function seed() {
  console.log('Seeding users...');

  const usersToCreate = [
    { email: 'bendahara@example.com', role: 'BENDAHARA' },
    { email: 'sekretaris@example.com', role: 'SEKRETARIS' },
    { email: 'paroki@example.com', role: 'PAROKI' }
  ];

  // 1. Get Lingkungan ID for assignment
  const { data: lingkunganData } = await supabase.from('lingkungan').select('id').limit(1).single();
  const lingkunganId = lingkunganData?.id || null;

  for (const u of usersToCreate) {
    console.log(`Processing ${u.email}...`);
    
    // Check if user exists and delete
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users.find(x => x.email === u.email);
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id);
      await supabase.from('users').delete().eq('email', u.email);
    }

    // Create user properly via GoTrue Auth Admin
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: 'password123',
      email_confirm: true
    });

    if (error) {
      console.error('Error creating user:', u.email, error.message);
      continue;
    }

    // Insert into public.users
    await supabase.from('users').insert({
      id: data.user.id,
      email: u.email,
      role: u.role,
      lingkungan_id: u.role === 'PAROKI' ? null : lingkunganId
    });

    console.log(`Successfully created ${u.email} with password123`);
  }
}

seed();
