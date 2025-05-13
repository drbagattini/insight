-- Script de verificación post-migración de roles

-- 1. Verificar los roles actuales y su cantidad
SELECT role, COUNT(*) as total_usuarios
FROM public.users
GROUP BY role
ORDER BY role;

-- 2. Verificar la política de inserción
SELECT schemaname,
       tablename,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies
WHERE tablename = 'users';

-- 3. Verificar la constraint de roles
SELECT con.conname as nombre_constraint,
       pg_get_constraintdef(con.oid) as definicion_constraint
FROM pg_constraint con
JOIN pg_namespace nsp ON nsp.oid = con.connamespace
WHERE nsp.nspname = 'public'
  AND con.conname = 'users_role_check';

-- 4. Verificar el valor por defecto de la columna role
SELECT column_name,
       column_default,
       is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'role';
