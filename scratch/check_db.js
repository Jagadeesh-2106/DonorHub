import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables in .env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Querying profiles...");
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*');

  if (pError) {
    console.error("Error fetching profiles:", pError);
  } else {
    console.log(`Found ${profiles?.length || 0} profiles:`);
    profiles?.forEach(p => console.log(`  - ID: ${p.id}, Email: ${p.email}, Role: ${p.role}, Name: ${p.name}`));
  }

  console.log("\nQuerying hospitals...");
  const { data: hospitals, error: hError } = await supabase
    .from('hospitals')
    .select('*');

  if (hError) {
    console.error("Error fetching hospitals:", hError);
  } else {
    console.log(`Found ${hospitals?.length || 0} hospitals:`);
    hospitals?.forEach(h => console.log(`  - ID: ${h.id}, Name: ${h.hospital_name}, City: ${h.city}, District: ${h.district}`));
  }

  console.log("\nQuerying hospital_blood_inventory...");
  const { data: inventory, error: iError } = await supabase
    .from('hospital_blood_inventory')
    .select('*');

  if (iError) {
    console.error("Error fetching inventory:", iError);
  } else {
    console.log(`Found ${inventory?.length || 0} inventory items:`);
    inventory?.forEach(i => console.log(`  - HospitalID: ${i.hospital_id}, BloodGroup: ${i.blood_group}, Quantity: ${i.quantity}`));
  }
}

run();
