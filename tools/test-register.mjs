;(async () => {
  try {
    const payload = { username: 'testuser_' + Date.now(), email: `test+${Date.now()}@example.test`, password: 's3cret!', fullName: 'Test User' }
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
    })
    console.log('register status', res.status)
    console.log(await res.text())
  } catch (err) {
    console.error(err)
  }
})()
