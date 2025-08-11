-- Crear sistema completo de créditos y pagos
-- Ejecutar este script en Supabase SQL Editor

-- 1. Tabla de billeteras (wallets)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- 2. Tabla de transacciones de billetera
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de preferencias de pago (Mercado Pago)
CREATE TABLE IF NOT EXISTS payment_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_reference TEXT NOT NULL UNIQUE,
  preference_id TEXT NOT NULL,
  init_point TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  amount_usd DECIMAL(10,2) NOT NULL,
  amount_uyu DECIMAL(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  mp_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON wallets (user_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_wallet_id_idx ON wallet_transactions (wallet_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_user_id_idx ON wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_created_at_idx ON wallet_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS payment_preferences_user_id_idx ON payment_preferences (user_id);
CREATE INDEX IF NOT EXISTS payment_preferences_external_reference_idx ON payment_preferences (external_reference);
CREATE INDEX IF NOT EXISTS payment_preferences_status_idx ON payment_preferences (status);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_preferences ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para wallets
CREATE POLICY wallets_select_policy ON wallets
  FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt()->>'role' = 'admin');

CREATE POLICY wallets_insert_policy ON wallets
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR auth.jwt()->>'role' = 'admin');

CREATE POLICY wallets_update_policy ON wallets
  FOR UPDATE
  USING (user_id = auth.uid() OR auth.jwt()->>'role' = 'admin')
  WITH CHECK (user_id = auth.uid() OR auth.jwt()->>'role' = 'admin');

-- 7. Políticas RLS para wallet_transactions
CREATE POLICY wallet_transactions_select_policy ON wallet_transactions
  FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt()->>'role' = 'admin');

CREATE POLICY wallet_transactions_insert_policy ON wallet_transactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR auth.jwt()->>'role' = 'admin');

-- 8. Políticas RLS para payment_preferences
CREATE POLICY payment_preferences_select_policy ON payment_preferences
  FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt()->>'role' = 'admin');

CREATE POLICY payment_preferences_insert_policy ON payment_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR auth.jwt()->>'role' = 'admin');

CREATE POLICY payment_preferences_update_policy ON payment_preferences
  FOR UPDATE
  USING (user_id = auth.uid() OR auth.jwt()->>'role' = 'admin')
  WITH CHECK (user_id = auth.uid() OR auth.jwt()->>'role' = 'admin');

-- 9. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Triggers para actualizar updated_at
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_preferences_updated_at
  BEFORE UPDATE ON payment_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Función para crear billetera automáticamente cuando se crea un usuario
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Trigger para crear billetera automáticamente
CREATE TRIGGER create_wallet_on_user_creation
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_new_user();

-- 13. Crear billeteras para usuarios existentes (si no las tienen)
INSERT INTO wallets (user_id, balance)
SELECT id, 0
FROM users
WHERE id NOT IN (SELECT user_id FROM wallets)
ON CONFLICT (user_id) DO NOTHING;

-- 14. Comentarios para documentación
COMMENT ON TABLE wallets IS 'Billeteras de créditos de los usuarios';
COMMENT ON TABLE wallet_transactions IS 'Historial de transacciones de créditos';
COMMENT ON TABLE payment_preferences IS 'Preferencias de pago de Mercado Pago';
COMMENT ON COLUMN wallets.balance IS 'Saldo de créditos del usuario';
COMMENT ON COLUMN wallet_transactions.type IS 'Tipo de transacción: credit (recarga) o debit (consumo)';
COMMENT ON COLUMN wallet_transactions.metadata IS 'Metadatos adicionales (ej: tokens usados, tipo de operación)';
COMMENT ON COLUMN payment_preferences.external_reference IS 'Referencia externa única para identificar el pago';
COMMENT ON COLUMN payment_preferences.status IS 'Estado del pago: pending, approved, rejected, cancelled';
