-- Función RPC para debitar créditos de forma atómica
-- Ejecutar este script en Supabase SQL Editor después de crear las tablas

CREATE OR REPLACE FUNCTION debit_user_credits(
  p_user_id UUID,
  p_credits_amount INTEGER,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
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
  -- Obtener la billetera del usuario
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM wallets
  WHERE user_id = p_user_id;

  -- Si no existe billetera, crearla
  IF v_wallet_id IS NULL THEN
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

  -- Crear transacción de débito
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
    'wallet_id', v_wallet_id,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'credits_debited', p_credits_amount,
    'transaction_id', v_transaction_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Re-lanzar la excepción para que el cliente pueda manejarla
    RAISE;
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION debit_user_credits IS 'Debita créditos de la billetera del usuario de forma atómica';
