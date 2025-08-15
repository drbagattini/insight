'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Skull, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface AlertEvidence {
  item: number;
  value: number;
  text: string;
}

interface ClinicalAlert {
  id: string;
  paciente_id: string;
  tipo: 'tdah' | 'sustancias' | 'autolesion';
  severidad: 'warning' | 'danger';
  mensaje: string;
  evidencia: AlertEvidence[];
  recomendaciones: string[];
  activa: boolean;
  revisada: boolean;
  fecha_creacion: string;
  patients: {
    nombre: string;
  };
}

interface ClinicalAlertsPanelProps {
  pacienteId?: string;
  className?: string;
}

export default function ClinicalAlertsPanel({ pacienteId, className = '' }: ClinicalAlertsPanelProps) {
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [pacienteId, showInactive]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (pacienteId) {
        params.append('paciente_id', pacienteId);
      }
      
      if (!showInactive) {
        params.append('activas', 'true');
      }

      const response = await fetch(`/api/alertas-clinicas?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAlerts(data.alertas || []);
      } else {
        console.error('Error fetching alerts:', data.error);
        setAlerts([]); // Fallback a array vacío
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]); // Fallback a array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const updateAlert = async (alertId: string, updates: { activa?: boolean; revisada?: boolean; notas_revision?: string }) => {
    try {
      const response = await fetch('/api/alertas-clinicas', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: alertId,
          ...updates,
        }),
      });

      if (response.ok) {
        fetchAlerts(); // Refresh alerts
      } else {
        console.error('Error updating alert');
      }
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const getAlertIcon = (tipo: string, severidad: string) => {
    const iconClass = severidad === 'danger' ? 'text-red-500' : 'text-yellow-500';
    
    switch (tipo) {
      case 'tdah':
        return <AlertTriangle className={`w-5 h-5 ${iconClass}`} />;
      case 'sustancias':
        return <Shield className={`w-5 h-5 ${iconClass}`} />;
      case 'autolesion':
        return <Skull className={`w-5 h-5 ${iconClass}`} />;
      default:
        return <AlertTriangle className={`w-5 h-5 ${iconClass}`} />;
    }
  };

  const getAlertBadgeColor = (tipo: string, severidad: string) => {
    if (severidad === 'danger') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(alert => alert.activa);
  const inactiveAlerts = alerts.filter(alert => !alert.activa);

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Alertas Clínicas
            {activeAlerts.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {activeAlerts.length}
              </span>
            )}
          </h3>
          
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            {showInactive ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showInactive ? 'Ocultar inactivas' : 'Ver todas'}
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500">Sin alertas clínicas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Alertas Activas */}
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 ${getAlertBadgeColor(alert.tipo, alert.severidad)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.tipo, alert.severidad)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{alert.mensaje}</h4>
                        {!pacienteId && (
                          <span className="text-sm text-gray-600">
                            - {alert.patients.nombre}
                          </span>
                        )}
                      </div>
                      
                      {/* Evidencia */}
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Evidencia:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {alert.evidencia.map((evidence, idx) => (
                            <li key={idx}>
                              • Ítem {evidence.item}: {evidence.text} (Valor: {evidence.value})
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recomendaciones */}
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Recomendaciones:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {alert.recomendaciones.map((rec, idx) => (
                            <li key={idx}>• {rec}</li>
                          ))}
                        </ul>
                      </div>

                      <p className="text-xs text-gray-500">
                        Creada: {formatDate(alert.fecha_creacion)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => updateAlert(alert.id, { revisada: !alert.revisada })}
                      className={`px-3 py-1 text-xs rounded ${
                        alert.revisada
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {alert.revisada ? 'Revisada' : 'Marcar revisada'}
                    </button>
                    
                    <button
                      onClick={() => updateAlert(alert.id, { activa: false })}
                      className="px-3 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      Desactivar
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Alertas Inactivas (si se muestran) */}
            {showInactive && inactiveAlerts.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Alertas Inactivas</h4>
                {inactiveAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border rounded-lg p-4 bg-gray-50 opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getAlertIcon(alert.tipo, alert.severidad)}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-700">{alert.mensaje}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Creada: {formatDate(alert.fecha_creacion)}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => updateAlert(alert.id, { activa: true })}
                        className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Reactivar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
