-- SCRIPT DE PRUEBA: Agregar créditos y plan de prueba
-- Ejecutar en Supabase SQL Editor para hacer pruebas

-- 1. Agregar créditos a tu usuario (reemplaza el email por el tuyo)
UPDATE wallets 
SET balance = 1000 
WHERE user_id = (
  SELECT id FROM users WHERE email = 'tu-email@gmail.com'
);

-- 2. Crear una preferencia de pago aprobada para simular un plan activo
-- (reemplaza el email por el tuyo)
INSERT INTO payment_preferences (
  user_id,
  external_reference,
  preference_id,
  init_point,
  plan_type,
  amount_usd,
  amount_uyu,
  credits,
  status,
  mp_payment_id
)
SELECT 
  id,
  'test-' || generate_random_uuid()::text,
  'test-preference-123',
  'https://test.mercadopago.com',
  'intermediate',
  14.00,
  560.00,
  1400,
  'approved',
  'test-payment-123'
FROM users 
WHERE email = 'tu-email@gmail.com'
ON CONFLICT DO NOTHING;

-- 3. Verificar que se crearon correctamente
SELECT 
  u.email,
  w.balance as credits_balance,
  pp.plan_type,
  pp.status as payment_status,
  pp.created_at
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
LEFT JOIN payment_preferences pp ON u.id = pp.user_id AND pp.status = 'approved'
WHERE u.email = 'tu-email@gmail.com';
