-- Reset SERIAL sequences to avoid duplicate primary key errors after seeding
SELECT setval(pg_get_serial_sequence('users','id'), COALESCE((SELECT MAX(id) FROM users), 0));
SELECT setval(pg_get_serial_sequence('accounts','id'), COALESCE((SELECT MAX(id) FROM accounts), 0));
SELECT setval(pg_get_serial_sequence('transactions','id'), COALESCE((SELECT MAX(id) FROM transactions), 0));
SELECT setval(pg_get_serial_sequence('audit_logs','id'), COALESCE((SELECT MAX(id) FROM audit_logs), 0));

-- Show sequence values for verification
SELECT pg_get_serial_sequence('users','id') AS seq, last_value FROM pg_sequences WHERE schemaname='public';
