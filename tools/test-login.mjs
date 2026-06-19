;(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'dilara', password: 'password123' })
    })

    console.log('status', res.status)
    const text = await res.text()
    console.log('body', text)
  } catch (err) {
    console.error('error', err)
  }
})()
