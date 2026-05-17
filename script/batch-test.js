require('dotenv').config({ override: true })

const BASE = 'http://localhost:3000'

const post = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, body: data }
}

const print = (title, result) => {
  console.log(`\n=== ${title} ===`)
  console.log(`Status: ${result.status}`)
  console.log('Body:', JSON.stringify(result.body, null, 2))
}

const main = async () => {
  // Setup: create a school
  const schoolRes = await post(`${BASE}/school`, { name: 'Ada Primary' })
  const schoolId = schoolRes.body?.created?.id || 1
  console.log(`Using schoolId: ${schoolId}\n`)

  // Test 1 — School not found → 404, no DB writes after the SELECT
  print(
    'Test 1: school does not exist',
    await post(`${BASE}/schools/9999/students`, [{ name: 'A', username: 'a', password: 'p' }]),
  )

  // Test 2 — Empty body (zero rows) → currently succeeds with empty array
  print('Test 2: empty batch', await post(`${BASE}/schools/${schoolId}/students`, []))

  // Test 3 — Batch too large → 400 ERR_TOO_MANY_STUDENTS, no DB writes
  const tooMany = Array.from({ length: 60 }, (_, i) => ({
    name: `Student${i}`,
    username: `u${i}`,
    password: 'p',
  }))
  print(
    'Test 3: batch too large (60 > MAX_STUDENTS)',
    await post(`${BASE}/schools/${schoolId}/students`, tooMany),
  )

  // Test 4 — In-batch duplicate username → 400, no DB writes
  print(
    'Test 4: duplicate usernames in same batch',
    await post(`${BASE}/schools/${schoolId}/students`, [
      { name: 'A', username: 'akif', password: 'p' },
      { name: 'B', username: 'akif', password: 'p' },
    ]),
  )

  // Test 5 — Field validation: empty name → 400, no DB writes (pre-validation)
  print(
    'Test 5: empty name field',
    await post(`${BASE}/schools/${schoolId}/students`, [
      { name: '', username: 'b1', password: 'p' },
      { name: 'C', username: 'c1', password: 'p' },
    ]),
  )

  // Test 6 — Missing password → 400, no DB writes (pre-validation)
  print(
    'Test 6: missing password',
    await post(`${BASE}/schools/${schoolId}/students`, [{ name: 'D', username: 'd1' }]),
  )

  // Test 7 — Multiple validation errors at once → all errors in one response
  print(
    'Test 7: multiple field errors',
    await post(`${BASE}/schools/${schoolId}/students`, [
      { name: '', username: '', password: '' },
      { name: '', username: 'e1', password: 'p' },
    ]),
  )

  // Test 8 — Preflight with valid batch → 200, transaction rolled back
  print(
    'Test 8: preflight (valid data) — should NOT persist',
    await post(`${BASE}/schools/${schoolId}/students?preflight=true`, [
      { name: 'F', username: 'f1', password: 'p' },
      { name: 'G', username: 'g1', password: 'p' },
    ]),
  )

  // Test 9 — Real save with same valid batch → 201, persists
  print(
    'Test 9: real save after preflight',
    await post(`${BASE}/schools/${schoolId}/students`, [
      { name: 'F', username: 'f1', password: 'p' },
      { name: 'G', username: 'g1', password: 'p' },
    ]),
  )

  // Test 10 — Re-send same batch → 400, unique constraint at DB level (catch in loop)
  print(
    'Test 10: duplicate against existing DB row (concurrency-style)',
    await post(`${BASE}/schools/${schoolId}/students`, [
      { name: 'F', username: 'f1', password: 'p' },
    ]),
  )

  console.log('\n=== Test run complete ===')
}

main().catch((err) => {
  console.error('Test runner error:', err)
})
