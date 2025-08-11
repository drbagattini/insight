-- Función para debitar créditos de forma atómica
-- Ejecutar este script en Supabase SQL Editor después del script principal

CREATE OR REPLACE FUNCTION debit_user_credits(
  p_user_id UUID,
  p_credits_amount INTEGER,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Obtener billetera del usuario con bloqueo
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Verificar si existe la billetera
  IF v_wallet_id IS NULL THEN
    -- Crear billetera si no existe
    INSERT INTO wallets (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING id, balance INTO v_wallet_id, v_current_balance;
  END IF;

  -- Verificar si hay créditos suficientes
  IF v_current_balance < p_credits_amount THEN
    RAISE EXCEPTION 'insufficient_credits: Current balance % is less than required %', 
      v_current_balance, p_credits_amount;
  END IF;

  -- Calcular nuevo balance
  v_new_balance := v_current_balance - p_credits_amount;

  -- Actualizar balance en la billetera
  UPDATE wallets
  SET balance = v_new_balance,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = v_wallet_id;

  -- Registrar transacción
  INSERT INTO wallet_transactions (
    wallet_id,
    user_id,
    amount,
    type,
    description,
    metadata
  )
  VALUES (
    v_wallet_id,
    p_user_id,
    p_credits_amount,
    'debit',
    p_description,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'credits_debited', p_credits_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Re-lanzar la excepción para que sea manejada por la aplicación
    RAISE;
END;
$$;

-- Función para acreditar créditos (para pagos aprobados)
CREATE OR REPLACE FUNCTION credit_user_credits(
  p_user_id UUID,
  p_credits_amount INTEGER,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Obtener billetera del usuario con bloqueo
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Verificar si existe la billetera
  IF v_wallet_id IS NULL THEN
    -- Crear billetera si no existe
    INSERT INTO wallets (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING id, balance INTO v_wallet_id, v_current_balance;
  END IF;

  -- Calcular nuevo balance
  v_new_balance := v_current_balance + p_credits_amount;

  -- Actualizar balance en la billetera
  UPDATE wallets
  SET balance = v_new_balance,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = v_wallet_id;

  -- Registrar transacción
  INSERT INTO wallet_transactions (
    wallet_id,
    user_id,
    amount,
    type,
    description,
    metadata
  )
  VALUES (
    v_wallet_id,
    p_user_id,
    p_credits_amount,
    'credit',
    p_description,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'credits_credited', p_credits_amount
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Re-lanzar la excepción para que sea manejada por la aplicación
    RAISE;
END;
$$;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION debit_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION credit_user_credits TO authenticated;
