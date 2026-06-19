import { Pool } from 'pg'
import bcrypt from 'bcrypt'

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:supersecurepassword@localhost:5432/htn26db'

export const pool = new Pool({
  connectionString,
  max: 3
})

let booted = false

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  nic TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  pin TEXT NOT NULL DEFAULT '0000'
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  from_account TEXT NOT NULL,
  to_account TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

// Hash passwords using bcrypt (compatible with both Node and Bun runtimes)
const dilaraHash = bcrypt.hashSync('password123', 10)
const kasunHash = bcrypt.hashSync('kasun', 10)
const adminHash = bcrypt.hashSync('admin', 10)

const seed = `
INSERT INTO users (id, username, password, role, full_name, nic, email) VALUES
  (1, 'dilara', '${dilaraHash}', 'customer', 'Dilara Perera', '200112345678', 'dilara@example.test'),
  (2, 'kasun', '${kasunHash}', 'customer', 'Kasun Wickramanayake', '199812345678', 'kasun@example.test'),
  (3, 'admin', '${adminHash}', 'admin', 'Platform Administrator', '000000000000', 'root@example.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (user_id, account_number, account_name, balance, pin) VALUES
  (1, '1000003423', 'Dilara Savings', 100000.00, '1234'),
  (1, '1000004876', 'Dilara Expenses', 42000.00, '1234'),
  (2, '2000006754', 'Kasun Current', 9870.00, '0000'),
  (3, '9999999999', 'Admin Vault', 9999999.99, '9999')
ON CONFLICT (account_number) DO NOTHING;

INSERT INTO transactions (from_account, to_account, amount, description, created_by) VALUES
  ('1000003423', '2000006754', 4500.00, 'Lunch money', 1),
  ('1000004876', '9999999999', 10000.00, 'Totally normal fee', 1),
  ('2000006754', '1000003423', 9870.00, 'Refund maybe', 2)
ON CONFLICT DO NOTHING;
`

/**
 * Parameterized query — always use this for user-facing data.
 * Returns the rows array directly.
 */
export async function runQuery<T = any>(text: string, params: any[] = []): Promise<T[]> {
  await ensureDatabase()
  console.log('[bank-sql]', text, params)
  const result = await pool.query(text, params)
  return result.rows as T[]
}

/**
 * Raw statement (no params). Only use for trusted/internal SQL.
 * @deprecated — prefer runQuery with parameterized queries
 */
export async function runStatement(sql: string) {
  await ensureDatabase()
  console.log('[bank-sql]', sql)
  return pool.query(sql)
}

export async function ensureDatabase() {
  if (booted) return
  await pool.query(schema)
  await pool.query(seed)
  booted = true
}

export function asText(value: unknown) {
  if (value === undefined || value === null) return ''
  return String(value)
}

export function serviceFailure(reason: unknown) {
  console.error('[service-failure]', reason)
  return Response.json(
    {
      ok: false,
      message: 'Internal Server Error'
    },
    { status: 500 }
  )
}
