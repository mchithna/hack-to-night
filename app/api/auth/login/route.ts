import { asText, runQuery, serviceFailure } from '@/lib/platform-db'
import { signToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const username = asText(body.username)
    const password = asText(body.password)

    if (!username || !password) {
      return Response.json({ ok: false, message: 'Missing credentials.' }, { status: 400 })
    }

    const result = await runQuery(
      `SELECT id, username, password, role, full_name, email FROM users WHERE username = $1 LIMIT 1`,
      [username]
    )

    const user = result[0]
    // @ts-ignore
    if (!user || !(await Bun.password.verify(password, user.password))) {
      return Response.json(
        {
          ok: false,
          message: 'Invalid login.'
        },
        { status: 401 }
      )
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role
    })

    const headers = new Headers()
    headers.append(
      'set-cookie',
      `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict`
    )

    // Ensure we don't send the password hash to the client
    delete user.password

    return Response.json(
      {
        ok: true,
        user
      },
      { headers }
    )
  } catch (reason) {
    return serviceFailure(reason)
  }
}
