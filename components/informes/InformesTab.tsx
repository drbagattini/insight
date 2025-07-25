'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  SparklesIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useInformes, useInforme } from '@/app/hooks/useInformes';
import InformesList from './InformesList';
import InformeEditor from './InformeEditor';

interface InformesTabProps {
  patientId: string;
  patientName: string;
}

type ViewMode = 'list' | 'edit' | 'view';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function InformesTab({ patientId, patientName }: InformesTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInformeId, setSelectedInformeId] = useState<string | null>(null);
  const [editingTitulo, setEditingTitulo] = useState('');
  const [editingContenido, setEditingContenido] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const {
    informes,
    isLoading,
    error,
    generateReport,
    createReport,
    updateReport,
    deleteReport,
    isGenerating,
    isCreating,
    isUpdating,
    isDeleting,
    generateError,
    createError,
    updateError,
    deleteError,
  } = useInformes(patientId);

  const {
    informe: selectedInforme,
    isLoading: isLoadingInforme,
  } = useInforme(selectedInformeId);

  // Manejar toasts
  const addToast = (type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    
    // Duración diferente según el tipo
    const duration = type === 'info' ? 8000 : type === 'error' ? 10000 : 5000;
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Efectos para manejar errores
  useEffect(() => {
    if (generateError) {
      addToast('error', `Error generando informe: ${generateError.message}`);
    }
  }, [generateError]);

  useEffect(() => {
    if (createError) {
      addToast('error', `Error creando informe: ${createError.message}`);
    }
  }, [createError]);

  useEffect(() => {
    if (updateError) {
      addToast('error', `Error actualizando informe: ${updateError.message}`);
    }
  }, [updateError]);

  useEffect(() => {
    if (deleteError) {
      addToast('error', `Error eliminando informe: ${deleteError.message}`);
    }
  }, [deleteError]);

  // Cargar datos del informe seleccionado en el editor
  useEffect(() => {
    if (selectedInforme && viewMode === 'edit') {
      setEditingTitulo(selectedInforme.titulo);
      setEditingContenido(selectedInforme.contenido);
    }
  }, [selectedInforme, viewMode]);

  const handleGenerateNewReport = async () => {
    try {
      addToast('info', 'Iniciando generación de informe con IA...');
      
      // Agregar toast de progreso
      const progressToastId = Date.now().toString();
      setToasts(prev => [...prev, { 
        id: progressToastId, 
        type: 'info', 
        message: 'Analizando datos del paciente y generando informe... Esto puede tomar 30-60 segundos.' 
      }]);
      
      const generatedData = await generateReport({ pacienteId: patientId });
      
      // Remover toast de progreso
      setToasts(prev => prev.filter(toast => toast.id !== progressToastId));
      
      // Crear el informe en la base de datos
      const newInforme = await createReport({
        titulo: generatedData.titulo,
        contenido: generatedData.contenido,
        estado: 'borrador',
        metadatos: generatedData.metadatos
      });

      addToast('success', 'Informe generado exitosamente');
      
      // Abrir el informe recién creado en el editor
      setSelectedInformeId(newInforme.id);
      setEditingTitulo(newInforme.titulo);
      setEditingContenido(newInforme.contenido);
      setViewMode('edit');
      
    } catch (error) {
      console.error('Error generating report:', error);
      addToast('error', 'Error generando el informe. Por favor, verifique su conexión e intente nuevamente.');
    }
  };

  const handleEditInforme = (informeId: string) => {
    setSelectedInformeId(informeId);
    setViewMode('edit');
  };

  const handleViewInforme = (informeId: string) => {
    setSelectedInformeId(informeId);
    setViewMode('view');
  };

  const handleDeleteInforme = async (informeId: string) => {
    try {
      await deleteReport(informeId);
      addToast('success', 'Informe eliminado exitosamente');
      
      // Si estábamos editando/viendo este informe, volver a la lista
      if (selectedInformeId === informeId) {
        setViewMode('list');
        setSelectedInformeId(null);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleSaveInforme = async () => {
    if (!selectedInformeId || !editingTitulo.trim() || !editingContenido.trim()) {
      addToast('warning', 'Título y contenido son requeridos');
      return;
    }

    try {
      await updateReport({
        informeId: selectedInformeId,
        data: {
          titulo: editingTitulo,
          contenido: editingContenido,
          estado: 'borrador' // Siempre cambiar a borrador cuando se edita
        }
      });
      
      addToast('success', 'Borrador guardado exitosamente');
      
      // Regresar a la lista después de guardar
      setViewMode('list');
      setSelectedInformeId(null);
      setEditingTitulo('');
      setEditingContenido('');
    } catch (error) {
      console.error('Error saving report:', error);
      addToast('error', 'Error al guardar el borrador');
    }
  };

  const handleFinalizeInforme = async () => {
    if (!selectedInformeId || !editingTitulo.trim() || !editingContenido.trim()) {
      addToast('warning', 'Título y contenido son requeridos para finalizar');
      return;
    }

    try {
      await updateReport({
        informeId: selectedInformeId,
        data: {
          titulo: editingTitulo,
          contenido: editingContenido,
          estado: 'finalizado'
        }
      });
      
      addToast('success', 'Informe finalizado exitosamente');
      setViewMode('list');
      setSelectedInformeId(null);
      setEditingTitulo('');
      setEditingContenido('');
    } catch (error) {
      console.error('Error finalizing report:', error);
    }
  };

  const handleCancelEdit = () => {
    setViewMode('list');
    setSelectedInformeId(null);
    setEditingTitulo('');
    setEditingContenido('');
  };

  // Función para limpiar contenido HTML de markdown residual
  const cleanHTMLContent = (content: string): string => {
    if (!content) return '';
    
    let cleaned = content;
    
    // Limpiar al inicio del contenido
    cleaned = cleaned.replace(/^\s*```html\s*\n?/i, '');
    cleaned = cleaned.replace(/^\s*```\s*\n?/i, '');
    cleaned = cleaned.replace(/^\s*html\s*\n?/i, '');
    cleaned = cleaned.replace(/^\s*`html`\s*\n?/i, '');
    
    // Limpiar al final del contenido
    cleaned = cleaned.replace(/\n?\s*```\s*$/i, '');
    cleaned = cleaned.replace(/\n?\s*html\s*$/i, '');
    
    // Limpiar líneas que solo contienen markdown
    cleaned = cleaned.replace(/^\s*```\s*$/gm, '');
    cleaned = cleaned.replace(/^\s*html\s*$/gm, '');
    cleaned = cleaned.replace(/^\s*`html`\s*$/gm, '');
    
    return cleaned.trim();
  };

  const handleDownloadPDF = () => {
    if (!selectedInforme) return;
    
    const cleanedContent = cleanHTMLContent(selectedInforme.contenido);

    // Crear iframe oculto para impresión
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    document.body.appendChild(iframe);

    // HTML optimizado para PDF
    const pdfHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${selectedInforme.titulo}</title>
          <style>
            @page {
              size: A4;
              margin: 2cm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.8;
              color: #000;
              margin: 0;
              padding: 0;
            }
            h1 { font-size: 20pt; font-weight: bold; margin: 0 0 2em 0; text-align: center; }
            h2 { font-size: 16pt; font-weight: bold; margin: 2.5em 0 1em 0; border-bottom: 1px solid #ddd; padding-bottom: 0.5em; }
            h3 { font-size: 14pt; font-weight: bold; margin: 2em 0 0.8em 0; }
            h4 { font-size: 12pt; font-weight: bold; margin: 1.5em 0 0.5em 0; }
            p { margin: 0 0 1.2em 0; text-align: justify; }
            ul, ol { margin: 1em 0 1.5em 0; padding-left: 2em; }
            li { margin: 0.5em 0; text-align: justify; }
            table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 11pt; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
          </style>
        </head>
        <body>
          ${cleanedContent}
        </body>
      </html>
    `;

    // Escribir contenido al iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(pdfHTML);
      iframeDoc.close();

      // Esperar a que se cargue y luego imprimir
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          // Limpiar después de un tiempo
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 100);
      };
    }
  };

  // Función wrapper para descargar PDF desde la lista
  const handleDownloadPDFFromList = async (informeId: string) => {
    try {
      // Obtener el informe completo
      const response = await fetch(`/api/informes/${informeId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        addToast('error', 'Error al obtener el informe');
        return;
      }
      
      const informe = await response.json();
      const cleanedContent = cleanHTMLContent(informe.contenido);

      // Crear iframe oculto para impresión
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      document.body.appendChild(iframe);

      // HTML optimizado para PDF
      const pdfHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${informe.titulo}</title>
            <style>
              @page {
                size: A4;
                margin: 2cm;
              }
              body {
                font-family: 'Times New Roman', Times, serif;
                font-size: 12pt;
                line-height: 1.8;
                color: #000;
                margin: 0;
                padding: 0;
              }
              h1 { font-size: 20pt; font-weight: bold; margin: 0 0 2em 0; text-align: center; }
              h2 { font-size: 16pt; font-weight: bold; margin: 2.5em 0 1em 0; border-bottom: 1px solid #ddd; padding-bottom: 0.5em; }
              h3 { font-size: 14pt; font-weight: bold; margin: 2em 0 0.8em 0; }
              h4 { font-size: 12pt; font-weight: bold; margin: 1.5em 0 0.5em 0; }
              p { margin: 0 0 1.2em 0; text-align: justify; }
              ul, ol { margin: 1em 0 1.5em 0; padding-left: 2em; }
              li { margin: 0.5em 0; text-align: justify; }
              table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 11pt; }
              th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
              th { background-color: #f8f9fa; font-weight: bold; }
            </style>
          </head>
          <body>
            ${cleanedContent}
          </body>
        </html>
      `;

      // Escribir contenido al iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(pdfHTML);
        iframeDoc.close();

        // Esperar a que se cargue y luego imprimir
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.print();
            // Limpiar después de un tiempo
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1000);
          }, 100);
        };
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast('error', 'Error al generar PDF');
    }
  };

  const handlePrint = () => {
    // Crear una nueva ventana para imprimir solo el contenido del documento
    const printWindow = window.open('', '_blank');
    if (!printWindow || !selectedInforme) return;

    // Limpiar el contenido HTML
    const cleanedContent = cleanHTMLContent(selectedInforme.contenido);

    // HTML completo para la ventana de impresión
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${selectedInforme.titulo}</title>
          <style>
            @page {
              size: A4;
              margin: 2cm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.8;
              color: #000;
              margin: 0;
              padding: 0;
            }
            h1 {
              font-size: 20pt;
              font-weight: bold;
              margin: 0 0 2em 0;
              text-align: center;
              color: #000;
              page-break-after: avoid;
            }
            h2 {
              font-size: 16pt;
              font-weight: bold;
              margin: 2.5em 0 1em 0;
              color: #000;
              border-bottom: 1px solid #ddd;
              padding-bottom: 0.5em;
              page-break-after: avoid;
            }
            h3 {
              font-size: 14pt;
              font-weight: bold;
              margin: 2em 0 0.8em 0;
              color: #000;
              page-break-after: avoid;
            }
            h4 {
              font-size: 12pt;
              font-weight: bold;
              margin: 1.5em 0 0.5em 0;
              color: #000;
              page-break-after: avoid;
            }
            p {
              margin: 0 0 1.2em 0;
              text-align: justify;
              text-indent: 0;
              orphans: 2;
              widows: 2;
            }
            ul, ol {
              margin: 1em 0 1.5em 0;
              padding-left: 2em;
            }
            li {
              margin: 0.5em 0;
              text-align: justify;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1.5em 0;
              font-size: 11pt;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            strong {
              font-weight: bold;
            }
            em {
              font-style: italic;
            }
          </style>
        </head>
        <body>
          ${cleanedContent}
        </body>
      </html>
    `;

    // Escribir el HTML en la nueva ventana
    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Esperar a que se cargue y luego imprimir
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-blue-400" />;
    }
  };

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error cargando informes
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-96 max-w-md shadow-lg rounded-lg pointer-events-auto border ${getToastStyles(toast.type)} transform transition-all duration-300 ease-in-out`}
          >
            <div className="px-4 py-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getToastIcon(toast.type)}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium leading-5">
                    {toast.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    onClick={() => removeToast(toast.id)}
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vista de lista */}
      {viewMode === 'list' && (
        <>
          {/* Header con botón de generar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Informes Clínicos - {patientName}
              </h2>
              <p className="text-gray-600 mt-1">
                Gestione los informes clínicos generados para este paciente
              </p>
            </div>
            
            <Button
              onClick={handleGenerateNewReport}
              disabled={isGenerating || isCreating}
              className={`transition-all duration-200 ${
                isGenerating || isCreating 
                  ? 'bg-blue-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isGenerating || isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {isGenerating ? 'Generando con IA...' : 'Guardando...'}
                    </span>
                    <span className="text-xs opacity-80">
                      {isGenerating ? 'Esto puede tomar 30-60 segundos' : 'Casi listo'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Generar Nuevo Informe
                </>
              )}
            </Button>
          </div>

          {/* Lista de informes */}
          <InformesList
            informes={informes}
            onView={handleViewInforme}
            onEdit={handleEditInforme}
            onDownload={handleDownloadPDFFromList}
            onDelete={handleDeleteInforme}
            isLoading={isLoading}
            isDeleting={isDeleting}
          />
        </>
      )}

      {/* Vista de edición */}
      {viewMode === 'edit' && (
        <InformeEditor
          titulo={editingTitulo}
          contenido={editingContenido}
          onTituloChange={setEditingTitulo}
          onContenidoChange={setEditingContenido}
          onSave={handleSaveInforme}
          onFinalize={handleFinalizeInforme}
          onCancel={handleCancelEdit}
          onDownloadPDF={handleDownloadPDF}
          isLoading={isLoadingInforme}
          isSaving={isUpdating}
        />
      )}

      {/* Vista de solo lectura */}
      {viewMode === 'view' && selectedInforme && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200 p-4 no-print">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedInforme.titulo}
              </h3>
              <div className="flex gap-2">
                {/* 1. Descargar PDF */}
                <Button
                  variant="outline"
                  onClick={handleDownloadPDF}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
                
                {/* 2. Cerrar */}
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 no-print">
            <div className="max-w-4xl mx-auto">
              <div className="mb-4 text-center text-sm text-gray-600">
                📝 Vista previa del documento - Use el botón "Descargar PDF" para obtener una versión lista para impresión
              </div>
              <div 
                className="bg-white border border-gray-300 rounded-lg shadow-lg document-view print-document"
                dangerouslySetInnerHTML={{ 
                  __html: cleanHTMLContent(selectedInforme.contenido)
                }}
              />
            </div>
            
            {/* Botones duplicados al final del documento */}
            <div className="mt-6 flex justify-center gap-2 no-print">
              {/* 1. Descargar PDF */}
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                className="text-blue-600 hover:text-blue-800"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
              
              {/* 2. Cerrar */}
              <Button
                variant="outline"
                onClick={handleCancelEdit}
              >
                Cerrar
              </Button>
            </div>
          </div>
          
          {/* Versión para impresión (oculta en pantalla) */}
          <div className="print-only" style={{ display: 'none' }}>
            <div 
              className="document-view"
              dangerouslySetInnerHTML={{ 
                __html: cleanHTMLContent(selectedInforme.contenido)
              }}
            />
          </div>
          
          {/* Estilos CSS para la vista de solo lectura */}
          <style jsx global>{`
            .document-view {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.8;
              color: #000;
              padding: 3cm 2.5cm;
              min-height: 29.7cm;
              background: white;
              box-shadow: 0 0 15px rgba(0,0,0,0.1);
              max-width: 21cm;
              margin: 0 auto;
            }
            
            .document-view h1 {
              font-size: 20pt;
              font-weight: bold;
              margin: 0 0 2em 0;
              text-align: center;
              color: #000;
              page-break-after: avoid;
            }
            
            .document-view h2 {
              font-size: 16pt;
              font-weight: bold;
              margin: 2.5em 0 1em 0;
              color: #000;
              border-bottom: 1px solid #ddd;
              padding-bottom: 0.5em;
              page-break-after: avoid;
            }
            
            .document-view h3 {
              font-size: 14pt;
              font-weight: bold;
              margin: 2em 0 0.8em 0;
              color: #000;
              page-break-after: avoid;
            }
            
            .document-view h4 {
              font-size: 12pt;
              font-weight: bold;
              margin: 1.5em 0 0.5em 0;
              color: #000;
              page-break-after: avoid;
            }
            
            .document-view p {
              margin: 0 0 1.2em 0;
              text-align: justify;
              text-indent: 0;
              orphans: 2;
              widows: 2;
            }
            
            .document-view ul, 
            .document-view ol {
              margin: 1em 0 1.5em 0;
              padding-left: 2em;
            }
            
            .document-view li {
              margin: 0.5em 0;
              text-align: justify;
            }
            
            .document-view strong {
              font-weight: bold;
            }
            
            .document-view em {
              font-style: italic;
            }
            
            .document-view table {
              width: 100%;
              border-collapse: collapse;
              margin: 1.5em 0;
              font-size: 11pt;
            }
            
            .document-view th,
            .document-view td {
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: left;
              vertical-align: top;
            }
            
            .document-view th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            
            .document-view tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .document-view .page-break {
              page-break-before: always;
            }
            
            @media print {
              /* Ocultar TODOS los elementos de la interfaz al imprimir */
              .no-print,
              nav,
              aside,
              header,
              .sidebar,
              .navigation,
              .menu,
              button,
              .btn,
              .toolbar,
              .tab-list,
              .tabs,
              .breadcrumb {
                display: none !important;
              }
              
              /* Ocultar elementos específicos de la aplicación */
              body > div:first-child > div:first-child,
              [data-headlessui-state],
              .fixed,
              .absolute {
                display: none !important;
              }
              
              /* Solo mostrar el contenido del documento */
              .document-view {
                display: block !important;
                position: static !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                min-height: auto !important;
                max-width: none !important;
                width: 100% !important;
              }
              
              /* Configuración de página */
              @page {
                margin: 2cm;
                size: A4;
              }
              
              /* Asegurar que solo se imprima el documento */
              body {
                margin: 0 !important;
                padding: 0 !important;
              }
              
              /* Mostrar solo el contenido del informe */
              body * {
                visibility: hidden;
              }
              
              .document-view,
              .document-view * {
                visibility: visible;
              }
              
              .document-view {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
