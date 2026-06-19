import fetch from 'node-fetch'

(async () => {
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'dilara', password: 'password123' })
    })

    console.log('login status', loginRes.status)
    const setCookie = loginRes.headers.get('set-cookie')
    console.log('set-cookie', setCookie)

    const cookieHeader = setCookie ? setCookie.split(';')[0] : ''

    const sessionRes = await fetch('http://localhost:3000/api/auth/session', {
      headers: { cookie: cookieHeader }
    })
    console.log('session status', sessionRes.status)
    console.log('session body', await sessionRes.text())
  } catch (err) {
    console.error(err)
  }
})()
