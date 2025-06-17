import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Helpers to build supabase chain objects
const patientRowEmail = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Juan',
  email: 'juan@test.com',
  whatsapp: '+5491111111111',
  metadata: { whatsappConsent: true }
};

const patientRowNoEmail = {
  ...patientRowEmail,
  id: '00000000-0000-0000-0000-000000000002',
  email: null
};

const cuestionarioRow = {
  id: '11111111-1111-1111-1111-111111111111',
  codigo: 'WHO-5',
  titulo: 'Índice de Bienestar WHO-5',
  activo: true
};

// Factory for chain objects
const buildSingleChain = (data: any) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnValue({ data, error: null }),
  order: vi.fn().mockReturnThis()
});

const buildInsertChain = (token: string) => ({
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnValue({ data: { token }, error: null })
});

// Mocks
vi.mock('@/app/lib/utils/cuestionarios', () => ({
  enviarCuestionarioPorCanal: vi.fn().mockResolvedValue(undefined),
  generarTokenYExpiracion: () => ({ token: 'token123', expiracion: '2099-01-01' })
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}));

vi.mock('@/app/lib/auth', () => ({
  authOptions: {}
}));

// Placeholder for supabaseAdmin – will be configured in each test
let fromMock: any;
vi.mock('@/app/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: (...args: any[]) => fromMock(...args) }
}));

const { getServerSession } = await import('next-auth/next');
(getServerSession as any).mockResolvedValue({ user: { id: 'psych1' } });

// Ensure env for link generation
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
// NODE_ENV is already 'test' in vitest; no reassignment to avoid TS error

describe('POST /api/cuestionarios/enviar', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 and link when patient has email', async () => {
    // Configure fromMock
    fromMock = (table: string) => {
      if (table === 'patients') return buildSingleChain(patientRowEmail);
      if (table === 'cuestionarios') return buildSingleChain(cuestionarioRow);
      if (table === 'links_cuestionario') return buildInsertChain('token123');
      throw new Error('Unexpected table ' + table);
    };

    const { POST } = await import('@/app/api/cuestionarios/enviar/route');

    const req = new Request('http://localhost/api/cuestionarios/enviar', {
      method: 'POST',
      body: JSON.stringify({ pacienteId: patientRowEmail.id, canal: 'email' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = (await POST(req as any)) as Response;
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.link).toBe('http://localhost/cuestionario/token123');
  });

  it('returns 400 when patient lacks email', async () => {
    fromMock = (table: string) => {
      if (table === 'patients') return buildSingleChain(patientRowNoEmail);
      if (table === 'cuestionarios') return buildSingleChain(cuestionarioRow);
      // links table should not be reached, but safeguard
      if (table === 'links_cuestionario') return buildInsertChain('token123');
      throw new Error('Unexpected table ' + table);
    };

    const { POST } = await import('@/app/api/cuestionarios/enviar/route');

    const req = new Request('http://localhost/api/cuestionarios/enviar', {
      method: 'POST',
      body: JSON.stringify({ pacienteId: patientRowNoEmail.id, canal: 'email' }),
      headers: { 'Content-Type': 'application/json' }
    });

    const res = (await POST(req as any)) as Response;
    expect(res.status).toBe(400);
    const body = await res.json();
    // error could be nested object or string; stringify for regex check
    const errorStr = typeof body.error === 'string' ? body.error : JSON.stringify(body.error);
    expect(errorStr).toMatch(/email/i);
  });
});
