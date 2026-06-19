;(async () => {
  try {
    for (const path of ['/dashboard', '/bank-accounts']) {
      const res = await fetch('http://localhost:3000' + path)
      console.log(path, '=>', res.status)
      const text = await res.text()
      console.log(text.slice(0, 200))
    }
  } catch (err) {
    console.error(err)
  }
})()
