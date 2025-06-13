import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper to create mock chaining object for list endpoint
const createListChain = (data: any[]) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnValue({ data, error: null })
});

// Helper for detail endpoint
const createDetailChain = (data: any) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnValue({ data, error: null })
});

// Global mock that tests will override
let fromMock: any = () => {
  throw new Error('fromMock not initialized');
};

vi.mock('@/app/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: (...args: any[]) => fromMock(...args)
  }
}));

describe('Questionnaires API endpoints', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('GET /api/questionnaires returns list shape', async () => {
    const mockData = [
      { codigo: 'WHO-5', titulo: 'Índice de Bienestar WHO-5' }
    ];

    fromMock = vi.fn().mockReturnValue(createListChain(mockData));

    const { GET } = await import('@/app/api/questionnaires/route');

    const res = await GET();
    // NextResponse is a Web Response subclass
    const body = await (res as Response).json();

    expect(body).toEqual([
      {
        codigo: 'WHO-5',
        nombre: 'Índice de Bienestar WHO-5',
        dominio: 'Bienestar'
      }
    ]);
  });

  it('GET /api/questionnaires/[codigo] returns detail merged with meta', async () => {
    const mockData = {
      id: 1,
      codigo: 'WHO-5',
      titulo: 'Índice de Bienestar WHO-5',
      activo: true
    };

    fromMock = vi.fn().mockReturnValue(createDetailChain(mockData));

    const { GET } = await import('@/app/api/questionnaires/[codigo]/route');

    // NextRequest expects special props, for tests we can cast a plain Request
    const res = await GET({} as any, { params: { codigo: 'WHO-5' } });
    const body = await (res as Response).json();

    expect(body.codigo).toBe('WHO-5');
    expect(body.meta?.nombre).toBeDefined();
    expect(body.meta?.nombre).toBe('Índice de Bienestar WHO-5');
  });
});
