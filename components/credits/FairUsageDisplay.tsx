'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, FileText, Mic, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FairUsageData {
  plan_type: string | null;
  limits: {
    reports: number;
    transcription_minutes: number;
    chat_tokens: number;
  } | null;
  usage: {
    reports: number;
    transcription_minutes: number;
    chat_tokens: number;
  };
  warn_threshold: number;
}

async function fetchFairUsage(): Promise<FairUsageData> {
  const response = await fetch('/api/credits/usage-summary');
  if (!response.ok) {
    throw new Error('Error al obtener datos de uso');
  }
  return response.json();
}

function getUsageStatus(used: number, limit: number | null, warnThreshold: number) {
  if (!limit) return 'no_limit';
  const percentage = used / limit;
  if (percentage >= 1) return 'exceeded';
  if (percentage >= warnThreshold) return 'warning';
  return 'ok';
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'exceeded':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'ok':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <CheckCircle className="h-4 w-4 text-gray-400" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'exceeded':
      return 'destructive';
    case 'warning':
      return 'secondary';
    case 'ok':
      return 'default';
    default:
      return 'outline';
  }
}

export default function FairUsageDisplay() {
  const { data: usage, isLoading, error } = useQuery({
    queryKey: ['fair-usage'],
    queryFn: fetchFairUsage,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uso Mensual</CardTitle>
          <CardDescription>Cargando datos de uso...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uso Mensual</CardTitle>
          <CardDescription>Error al cargar datos de uso</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!usage?.plan_type || !usage.limits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uso Mensual</CardTitle>
          <CardDescription>Sin plan activo - uso ilimitado</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No tienes un plan activo para este mes. Tu uso no está limitado por fair-use.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const categories = [
    {
      key: 'reports' as const,
      label: 'Informes',
      icon: FileText,
      used: usage.usage.reports,
      limit: usage.limits.reports,
      unit: 'informes'
    },
    {
      key: 'transcription_minutes' as const,
      label: 'Transcripciones',
      icon: Mic,
      used: usage.usage.transcription_minutes,
      limit: usage.limits.transcription_minutes,
      unit: 'minutos'
    },
    {
      key: 'chat_tokens' as const,
      label: 'Supervisión IA',
      icon: MessageSquare,
      used: usage.usage.chat_tokens,
      limit: usage.limits.chat_tokens,
      unit: 'tokens'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Uso Mensual
          <Badge variant="outline" className="text-xs">
            Plan {usage.plan_type?.charAt(0).toUpperCase() + usage.plan_type?.slice(1)}
          </Badge>
        </CardTitle>
        <CardDescription>
          Límites de fair-use para tu plan actual
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => {
          const status = getUsageStatus(category.used, category.limit, usage.warn_threshold);
          const percentage = category.limit ? Math.min((category.used / category.limit) * 100, 100) : 0;
          const Icon = category.icon;

          return (
            <div key={category.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{category.label}</span>
                  {getStatusIcon(status)}
                </div>
                <Badge variant={getStatusColor(status) as any} className="text-xs">
                  {category.used} / {category.limit} {category.unit}
                </Badge>
              </div>
              <Progress 
                value={percentage} 
                className="h-2"
                // @ts-ignore - Progress component accepts custom props
                indicatorClassName={
                  status === 'exceeded' ? 'bg-red-500' :
                  status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{percentage.toFixed(1)}% usado</span>
                <span>
                  {category.limit && category.limit > category.used 
                    ? `${category.limit - category.used} restantes`
                    : status === 'exceeded' 
                      ? `${category.used - category.limit!} excedidos`
                      : 'Límite alcanzado'
                  }
                </span>
              </div>
            </div>
          );
        })}

        {/* Mostrar alertas si hay límites superados o cerca */}
        {categories.some(cat => {
          const status = getUsageStatus(cat.used, cat.limit, usage.warn_threshold);
          return status === 'exceeded' || status === 'warning';
        }) && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {categories.some(cat => getUsageStatus(cat.used, cat.limit, usage.warn_threshold) === 'exceeded') 
                ? 'Has superado algunos límites mensuales. Algunas funciones pueden estar bloqueadas.'
                : 'Te estás acercando a los límites mensuales de tu plan.'
              }
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
