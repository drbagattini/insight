import { scoreOYS, buildFlags, outcomes, type OYSCode, type Resp } from '@/lib/oys-scoring';

export interface OYSConsolidatedScore {
  problem_severity: {
    total: number | null;
    valido: boolean;
    informante: string;
  };
  functioning: {
    total: number | null;
    valido: boolean;
    informante: string;
  };
  flags: {
    consumo?: boolean;
    autolesion?: boolean;
    muerte?: boolean;
    tdah?: boolean;
  };
  total: number | null;
  valido: boolean;
}

/**
 * Score OYS-PADRES-40 (consolidated parent questionnaire)
 * First 20 items = Problem Severity, Last 20 items = Functioning
 */
export function scoreOYSPadres40(answers: number[]): OYSConsolidatedScore {
  if (answers.length !== 40) {
    console.warn(`OYS-PADRES-40 expects 40 answers, got ${answers.length}`);
    return {
      problem_severity: { total: null, valido: false, informante: 'padres' },
      functioning: { total: null, valido: false, informante: 'padres' },
      flags: {},
      total: null,
      valido: false
    };
  }

  // Split into PS (0-19) and F (20-39) components
  const psAnswers: Resp[] = answers.slice(0, 20).map(n => n as Resp);
  const fAnswers: Resp[] = answers.slice(20, 40).map(n => n as Resp);

  // Score each component
  const psResult = scoreOYS('OYS-PS-P-SF20', psAnswers);
  const fResult = scoreOYS('OYS-F-P-SF20', fAnswers);

  // Build clinical flags
  const flags = buildFlags('OYS-PS-P-SF20', psAnswers, fAnswers);

  // Calculate combined total (PS + F)
  const combinedTotal = (psResult.total !== null && fResult.total !== null) 
    ? psResult.total + fResult.total 
    : null;

  const combinedValid = psResult.valido && fResult.valido;

  return {
    problem_severity: {
      total: psResult.total,
      valido: psResult.valido,
      informante: 'padres'
    },
    functioning: {
      total: fResult.total,
      valido: fResult.valido,
      informante: 'padres'
    },
    flags,
    total: combinedTotal,
    valido: combinedValid
  };
}

/**
 * Score OYS-JOVENES-40 (consolidated youth questionnaire)
 * First 20 items = Problem Severity, Last 20 items = Functioning
 */
export function scoreOYSJovenes40(answers: number[]): OYSConsolidatedScore {
  if (answers.length !== 40) {
    console.warn(`OYS-JOVENES-40 expects 40 answers, got ${answers.length}`);
    return {
      problem_severity: { total: null, valido: false, informante: 'joven' },
      functioning: { total: null, valido: false, informante: 'joven' },
      flags: {},
      total: null,
      valido: false
    };
  }

  // Split into PS (0-19) and F (20-39) components
  const psAnswers: Resp[] = answers.slice(0, 20).map(n => n as Resp);
  const fAnswers: Resp[] = answers.slice(20, 40).map(n => n as Resp);

  // Score each component
  const psResult = scoreOYS('OYS-PS-Y-SF20', psAnswers);
  const fResult = scoreOYS('OYS-F-Y-SF20', fAnswers);

  // Build clinical flags
  const flags = buildFlags('OYS-PS-Y-SF20', psAnswers, fAnswers);

  // Calculate combined total (PS + F)
  const combinedTotal = (psResult.total !== null && fResult.total !== null) 
    ? psResult.total + fResult.total 
    : null;

  const combinedValid = psResult.valido && fResult.valido;

  return {
    problem_severity: {
      total: psResult.total,
      valido: psResult.valido,
      informante: 'joven'
    },
    functioning: {
      total: fResult.total,
      valido: fResult.valido,
      informante: 'joven'
    },
    flags,
    total: combinedTotal,
    valido: combinedValid
  };
}
