// Run once: node scripts/create-auth-users.js
// Creates Supabase Auth accounts for all 12 employees and seeds user_profiles table
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pynaxojadmyflnyyixse.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bmF4b2phZG15ZmxueXlpeHNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY3MzA0MiwiZXhwIjoyMDkwMjQ5MDQyfQ.d3y0qw6wDDQltLMSp4L39wftfTPdwcH6C0aH8YG5PvA";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // Fetch all employees
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, name, email, role')
    .order('id');

  if (error) { console.error('Failed to fetch employees:', error); process.exit(1); }

  console.log(`Creating auth accounts for ${employees.length} employees...`);

  for (const emp of employees) {
    const password = `WR${emp.id}@2026`;
    console.log(`\n[${emp.id}] ${emp.name} — ${emp.email}`);

    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const alreadyExists = existing?.users?.find(u => u.email === emp.email);

    let userId;
    if (alreadyExists) {
      console.log(`  → Already exists, updating password`);
      await supabase.auth.admin.updateUserById(alreadyExists.id, { password });
      userId = alreadyExists.id;
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: emp.email,
        password,
        email_confirm: true,
        user_metadata: { employee_id: emp.id, role: emp.role ?? 'employee', full_name: emp.name }
      });
      if (createErr) { console.error(`  ✗ Error:`, createErr.message); continue; }
      userId = created.user.id;
      console.log(`  ✓ Created: ${userId}`);
    }

    // Upsert user_profiles
    const { error: profileErr } = await supabase
      .from('user_profiles')
      .upsert({ id: userId, employee_id: emp.id, role: emp.role ?? 'employee' }, { onConflict: 'id' });

    if (profileErr) console.error(`  ✗ Profile error:`, profileErr.message);
    else console.log(`  ✓ Profile seeded`);
  }

  console.log('\nDone!');
}

main().catch(console.error);
