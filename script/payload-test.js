require('dotenv').config({ override: true })

const BASE = 'http://localhost:3000'

const main = async () => {
  // Create a school
  const schoolRes = await fetch(`${BASE}/school`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Load Test School' }),
  })
  const schoolData = await schoolRes.json()
  console.log(`School created:`, schoolData)
  const schoolId = schoolData.created?.id ?? 1

  // Generate 10,000 student objects
  const students = Array.from({ length: 10000 }, (_, i) => ({
    name: `Student ${i}`,
    username: `user${i}`,
    password: 'secret123',
  }))

  const payloadBytes = Buffer.byteLength(JSON.stringify(students))
  console.log(`Payload size: ${(payloadBytes / 1024).toFixed(1)} KB`)
  console.log(`Sending ${students.length} students...`)

  const start = Date.now()
  try {
    const res = await fetch(`${BASE}/schools/${schoolId}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(students),
    })
    const elapsed = Date.now() - start
    console.log(`\nStatus: ${res.status}`)
    console.log(`Time: ${elapsed}ms`)

    const text = await res.text()
    console.log(`Body (first 500 chars):\n${text.slice(0, 500)}`)
  } catch (err) {
    const elapsed = Date.now() - start
    console.log(`\nRequest failed after ${elapsed}ms`)
    console.log(`Error: ${err.message}`)
  }
}

main().catch(console.error)
