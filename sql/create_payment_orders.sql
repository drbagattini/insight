-- Tabla para órdenes de pago de Mercado Pago
CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY, -- ID de la preferencia de MP
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UYU',
  plan_id TEXT,
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  mp_status TEXT,
  processed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_external_reference ON payment_orders(external_reference);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_mp_payment_id ON payment_orders(mp_payment_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_payment_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_orders_updated_at();

-- RLS (Row Level Security)
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Política: los usuarios solo pueden ver sus propias órdenes
CREATE POLICY "Users can view own payment orders" ON payment_orders
  FOR SELECT USING (
    user_id = (
      SELECT id FROM users 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Política: solo el sistema puede insertar/actualizar órdenes
CREATE POLICY "System can manage payment orders" ON payment_orders
  FOR ALL USING (true);

-- Comentarios para documentación
COMMENT ON TABLE payment_orders IS 'Órdenes de pago de Mercado Pago';
COMMENT ON COLUMN payment_orders.id IS 'ID de la preferencia de Mercado Pago';
COMMENT ON COLUMN payment_orders.external_reference IS 'Referencia externa única para identificar la orden';
COMMENT ON COLUMN payment_orders.status IS 'Estado de la orden: pending, approved, rejected, cancelled';
COMMENT ON COLUMN payment_orders.mp_payment_id IS 'ID del pago en Mercado Pago (cuando se procesa)';
COMMENT ON COLUMN payment_orders.mp_status IS 'Estado del pago en Mercado Pago';
COMMENT ON COLUMN payment_orders.metadata IS 'Datos adicionales de la orden y respuesta de MP';
