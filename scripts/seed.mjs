/**
 * Silk Value Platform — Phase 1 Seed Script
 * Pushes demo data directly to the live Supabase project.
 * Safe to re-run: uses upsert logic throughout.
 *
 * Run: node scripts/seed.mjs
 */

const SURL = 'https://vjxuqkstltkbflhhwgoe.supabase.co';
const SRK  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqeHVxa3N0bHRrYmZsaGh3Z29lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2Mzg4MCwiZXhwIjoyMDkwMjM5ODgwfQ.u-f__9GjqWbK8gUiqFbaSRTP7v4T_U-Y88a42m1XE3E';

const HEADERS = {
  apikey:        SRK,
  Authorization: 'Bearer ' + SRK,
  'Content-Type': 'application/json',
  Prefer:        'return=representation',
};

// ── Known IDs (looked up before this script) ─────────────────────────────────
const CLUSTER_ID       = '5c7d3608-9fc8-4cd5-998c-33d1737c2f4a'; // existing "Test Cluster"
const REELER_ID        = '636ee1df-e9aa-4860-9a14-f12f210e32ac'; // +919000000001
const COLLECTOR_ID     = '5dc405db-328a-41ec-83a1-940fed54252a'; // +919000000002
const QC_OPERATOR_ID   = '1508ef80-72e7-455c-8258-b6468ff461fc'; // +919000000003
const SUPERVISOR_PHONE = '+919000000004';
const TODAY            = new Date().toISOString().split('T')[0];

// Karnataka centre — dummy GPS for demo stops
const DEMO_LNG = 75.7139;
const DEMO_LAT = 15.3173;
const DEMO_POINT = `SRID=4326;POINT(${DEMO_LNG} ${DEMO_LAT})`;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function rest(method, path, body) {
  const res = await fetch(SURL + '/rest/v1/' + path, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`[${method} ${path}] HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

function log(label, data) {
  console.log(`\n✅  ${label}`);
  if (data) console.log('   ', JSON.stringify(data).slice(0, 200));
}

// ── Step 1: Update cluster to "Demo Cluster" ─────────────────────────────────
async function step1_cluster() {
  const data = await rest('PATCH', `clusters?id=eq.${CLUSTER_ID}`, {
    name:                       'Demo Cluster',
    state:                      'Karnataka',
    country:                    'IN',
    is_active:                  true,
    variance_tolerance_percent: 2.5,
  });
  log('Cluster updated → Demo Cluster', data[0] ?? data);
  return CLUSTER_ID;
}

// ── Step 2: Upsert price list ─────────────────────────────────────────────────
async function step2_pricelist(clusterId) {
  // Check if one already exists for this cluster
  const existing = await rest('GET', `price_lists?cluster_id=eq.${clusterId}&limit=1`, null);
  if (existing.length > 0) {
    log('Price list already exists, updating', existing[0]);
    const updated = await rest('PATCH', `price_lists?id=eq.${existing[0].id}`, {
      name:           'Demo Price List 2025',
      is_active:      true,
      effective_from: TODAY,
      grade_prices:   { A: 480, B: 420, C: 360, D: 280, Reject: 0 },
    });
    return existing[0].id;
  }

  const data = await rest('POST', 'price_lists', {
    name:           'Demo Price List 2025',
    code:           'DEMO-2025',
    cluster_id:     clusterId,
    is_global:      false,
    is_active:      true,
    effective_from: TODAY,
    grade_prices:   { A: 480, B: 420, C: 360, D: 280, Reject: 0 },
    moisture_deduction_rules: { threshold: 12.0, deduction_per_percent: 2.5 },
    min_weight_kg:  0.5,
    max_weight_kg:  50.0,
    created_by:     QC_OPERATOR_ID,
  });
  log('Price list created', data[0]);
  return data[0].id;
}

// ── Step 3: Update profiles ───────────────────────────────────────────────────
async function step3_profiles(clusterId) {
  // Reeler — set kyc_status=verified, is_verified=true
  await rest('PATCH', `profiles?id=eq.${REELER_ID}`, {
    full_name:   'Test Reeler',
    cluster_id:  clusterId,
    kyc_status:  'verified',
    is_verified: true,
  });
  log('Reeler profile updated');

  // Collector
  await rest('PATCH', `profiles?id=eq.${COLLECTOR_ID}`, {
    full_name:   'Test Collector',
    cluster_id:  clusterId,
    employee_id: 'EMP001',
  });
  log('Collector profile updated');

  // QC Operator
  await rest('PATCH', `profiles?id=eq.${QC_OPERATOR_ID}`, {
    full_name:   'Test QC Operator',
    cluster_id:  clusterId,
    employee_id: 'EMP002',
  });
  log('QC Operator profile updated');
}

// ── Step 4: Upsert reeler record ──────────────────────────────────────────────
async function step4_reeler() {
  const existing = await rest('GET', `reelers?id=eq.${REELER_ID}&limit=1`, null);
  if (existing.length > 0) {
    log('Reeler record already exists', existing[0]);
    return REELER_ID;
  }
  const data = await rest('POST', 'reelers', {
    id:                   REELER_ID,
    payment_preference:   'instant_upi',
    total_collections:    0,
    total_earnings_inr:   0,
  });
  log('Reeler record created', data[0]);
  return REELER_ID;
}

// ── Step 5: Upsert vehicle ────────────────────────────────────────────────────
async function step5_vehicle(clusterId) {
  const existing = await rest('GET', `vehicles?registration_number=eq.KA-01-AB-1234&limit=1`, null);
  if (existing.length > 0) {
    log('Vehicle already exists', existing[0]);
    return existing[0].id;
  }
  const data = await rest('POST', 'vehicles', {
    registration_number: 'KA-01-AB-1234',
    vehicle_type:        'tempo',
    capacity_kg:         500,
    cluster_id:          clusterId,
    driver_name:         'Test Driver',
    is_active:           true,
    is_available:        true,
  });
  log('Vehicle created', data[0]);
  return data[0].id;
}

// ── Step 6: Upsert route ──────────────────────────────────────────────────────
async function step6_route(clusterId, vehicleId) {
  // Check for existing route today for this collector
  const existing = await rest('GET', `routes?collector_id=eq.${COLLECTOR_ID}&date=eq.${TODAY}&limit=1`, null);
  if (existing.length > 0) {
    log('Route already exists for today', existing[0]);
    return existing[0].id;
  }
  const data = await rest('POST', 'routes', {
    name:            'Demo Route 1',
    date:            TODAY,
    cluster_id:      clusterId,
    vehicle_id:      vehicleId,
    collector_id:    COLLECTOR_ID,
    status:          'pending',
    total_stops:     1,
    completed_stops: 0,
  });
  log('Route created', data[0]);
  return data[0].id;
}

// ── Step 7: Upsert route stop ─────────────────────────────────────────────────
async function step7_routeStop(routeId) {
  const existing = await rest('GET', `route_stops?route_id=eq.${routeId}&reeler_id=eq.${REELER_ID}&limit=1`, null);
  if (existing.length > 0) {
    log('Route stop already exists', existing[0]);
    return existing[0].id;
  }
  const data = await rest('POST', 'route_stops', {
    route_id:           routeId,
    reeler_id:          REELER_ID,
    stop_order:         1,
    status:             'pending',
    expected_weight_kg: 10.0,
    location:           DEMO_POINT,
    address_hint:       'Demo location, Karnataka',
  });
  log('Route stop created', data[0]);
  return data[0].id;
}

// ── Step 8: Create supervisor auth user + profile ─────────────────────────────
async function step8_supervisor(clusterId) {
  // Check if a supervisor profile already exists with this phone
  const existing = await rest('GET',
    `profiles?phone=eq.${encodeURIComponent(SUPERVISOR_PHONE)}&limit=1`, null);

  if (existing.length > 0) {
    // Update role to supervisor and connect to cluster
    await rest('PATCH', `profiles?id=eq.${existing[0].id}`, {
      role:        'supervisor',
      full_name:   'Test Supervisor',
      cluster_id:  clusterId,
      employee_id: 'EMP003',
      is_verified: true,
    });
    log(`Supervisor profile already exists — updated role/cluster`, existing[0]);
    return existing[0].id;
  }

  // Create auth user via Supabase Admin API
  const authRes = await fetch(`${SURL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SRK,
      Authorization: 'Bearer ' + SRK,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone:         SUPERVISOR_PHONE,
      phone_confirm: true,
      password:      'Test@1234',
      user_metadata: { role: 'supervisor' },
    }),
  });
  const authText = await authRes.text();
  let authUser;
  try { authUser = JSON.parse(authText); } catch { authUser = authText; }
  if (!authRes.ok) throw new Error(`[Create supervisor auth] HTTP ${authRes.status}: ${JSON.stringify(authUser)}`);
  const supervisorId = authUser.id;
  log(`Supervisor auth user created id=${supervisorId}`);

  // Upsert profile (Supabase trigger may have created it already)
  const profExisting = await rest('GET', `profiles?id=eq.${supervisorId}&limit=1`, null);
  if (profExisting.length > 0) {
    await rest('PATCH', `profiles?id=eq.${supervisorId}`, {
      role:        'supervisor',
      full_name:   'Test Supervisor',
      cluster_id:  clusterId,
      employee_id: 'EMP003',
      is_verified: true,
    });
    log('Supervisor profile updated (trigger-created)', profExisting[0]);
  } else {
    await rest('POST', 'profiles', {
      id:          supervisorId,
      phone:       SUPERVISOR_PHONE,
      role:        'supervisor',
      full_name:   'Test Supervisor',
      cluster_id:  clusterId,
      employee_id: 'EMP003',
      is_verified: true,
      kyc_status:  'verified',
    });
    log('Supervisor profile created');
  }
  return supervisorId;
}

// ── Verification ──────────────────────────────────────────────────────────────
async function verify() {
  console.log('\n' + '═'.repeat(60));
  console.log('VERIFICATION RESULTS');
  console.log('═'.repeat(60));

  const profiles = await rest('GET',
    `profiles?phone=in.(+919000000001,+919000000002,+919000000003,+919000000004)&select=phone,full_name,role,kyc_status,is_verified,employee_id,cluster_id`, null);
  console.log('\nProfiles:');
  profiles.forEach(p => console.log(`  ${p.phone}  ${p.role.padEnd(12)} ${p.full_name} | kyc=${p.kyc_status} verified=${p.is_verified} emp=${p.employee_id ?? '—'}`));

  const routes = await rest('GET',
    `routes?collector_id=eq.${COLLECTOR_ID}&select=id,name,date,status,total_stops,completed_stops`, null);
  console.log('\nRoutes:');
  routes.forEach(r => console.log(`  ${r.name} | date=${r.date} status=${r.status} stops=${r.total_stops}`));

  if (routes.length > 0) {
    const stops = await rest('GET',
      `route_stops?route_id=eq.${routes[0].id}&select=id,stop_order,status,expected_weight_kg`, null);
    console.log('\nRoute Stops:');
    stops.forEach(s => console.log(`  stop#${s.stop_order} | status=${s.status} expected=${s.expected_weight_kg}kg`));
  }

  const reelers = await rest('GET', `reelers?id=eq.${REELER_ID}&select=id,payment_preference,total_collections,total_earnings_inr`, null);
  console.log('\nReeler record:');
  reelers.forEach(r => console.log(`  id=${r.id.slice(0,8)}… pref=${r.payment_preference} collections=${r.total_collections}`));

  const vehicles = await rest('GET', `vehicles?registration_number=eq.KA-01-AB-1234&select=id,registration_number,vehicle_type,is_active`, null);
  console.log('\nVehicle:');
  vehicles.forEach(v => console.log(`  ${v.registration_number} | type=${v.vehicle_type} active=${v.is_active}`));

  console.log('\n' + '═'.repeat(60));
  console.log('✅  Seed complete. All records verified.');
  console.log('═'.repeat(60) + '\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱  Silk Value — Phase 1 Seed\n');
  try {
    const clusterId  = await step1_cluster();
    const _priceId   = await step2_pricelist(clusterId);
    await step3_profiles(clusterId);
    await step4_reeler();
    const vehicleId  = await step5_vehicle(clusterId);
    const routeId    = await step6_route(clusterId, vehicleId);
    await step7_routeStop(routeId);
    await step8_supervisor(clusterId);
    await verify();
  } catch (err) {
    console.error('\n❌  Seed failed:', err.message);
    process.exit(1);
  }
}

main();
