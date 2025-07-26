'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DocumentTextIcon, 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface InformeEditorProps {
  titulo: string;
  contenido: string;
  onTituloChange: (titulo: string) => void;
  onContenidoChange: (contenido: string) => void;
  onSave: () => void;
  onFinalize: () => void;
  onCancel: () => void;
  onDownloadPDF?: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
  className?: string;
}

export default function InformeEditor({
  titulo,
  contenido,
  onTituloChange,
  onContenidoChange,
  onSave,
  onFinalize,
  onCancel,
  onDownloadPDF,
  isLoading = false,
  isSaving = false,
  className = ''
}: InformeEditorProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: 'Comience a escribir el informe clínico aquí...',
      }),
      Typography,
    ],
    content: contenido,
    immediatelyRender: false, // Soluciona el error de SSR
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] p-8 bg-white leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      onContenidoChange(newContent);
      setHasUnsavedChanges(true);
    },
  });

  // Actualizar contenido del editor cuando cambie la prop
  useEffect(() => {
    if (editor && contenido !== editor.getHTML()) {
      editor.commands.setContent(contenido);
      setHasUnsavedChanges(false);
    }
  }, [contenido, editor]);

  const handleSave = () => {
    onSave();
    setHasUnsavedChanges(false);
  };

  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTituloChange(e.target.value);
    setHasUnsavedChanges(true);
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header con título y acciones */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
            Editor de Informe
          </h3>
          
          {/* Botones de acción en el header */}
          <div className="flex gap-2">
            {/* 1. Guardar Borrador */}
            <Button
              onClick={handleSave}
              disabled={isSaving || !titulo.trim() || !contenido.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  Guardar Borrador
                </>
              )}
            </Button>
            
            {/* 2. Finalizar */}
            <Button
              onClick={onFinalize}
              disabled={isSaving || !titulo.trim() || !contenido.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          </div>
        </div>
        
        {/* Campo de título */}
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
            Título del Informe
          </label>
          <Input
            id="titulo"
            type="text"
            value={titulo}
            onChange={handleTituloChange}
            placeholder="Ingrese el título del informe..."
            className="w-full"
          />
        </div>
      </div>

      {/* Toolbar del editor */}
      {editor && (
        <div className="border-b border-gray-200 p-3 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-1 text-sm rounded border ${
                editor.isActive('bold')
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-1 text-sm rounded border ${
                editor.isActive('italic')
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <em>I</em>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-3 py-1 text-sm rounded border ${
                editor.isActive('heading', { level: 1 })
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-3 py-1 text-sm rounded border ${
                editor.isActive('heading', { level: 2 })
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-3 py-1 text-sm rounded border ${
                editor.isActive('bulletList')
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              • Lista
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-3 py-1 text-sm rounded border ${
                editor.isActive('orderedList')
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              1. Lista
            </button>
          </div>
        </div>
      )}

      {/* Área del editor */}
      <div className="p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <EditorContent 
            editor={editor} 
            className="min-h-[600px] border border-gray-300 rounded-lg bg-white shadow-sm document-style"
          />
        </div>
      </div>
      
      {/* Estilos CSS personalizados para el documento */}
      <style jsx global>{`
        .document-style .ProseMirror {
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
        
        .document-style .ProseMirror h1 {
          font-size: 20pt;
          font-weight: bold;
          margin: 0 0 2em 0;
          text-align: center;
          color: #000;
        }
        
        .document-style .ProseMirror h2 {
          font-size: 16pt;
          font-weight: bold;
          margin: 2.5em 0 1em 0;
          color: #000;
          border-bottom: 1px solid #ddd;
          padding-bottom: 0.5em;
        }
        
        .document-style .ProseMirror h3 {
          font-size: 14pt;
          font-weight: bold;
          margin: 2em 0 0.8em 0;
          color: #000;
        }
        
        .document-style .ProseMirror h4 {
          font-size: 12pt;
          font-weight: bold;
          margin: 1.5em 0 0.5em 0;
          color: #000;
        }
        
        .document-style .ProseMirror p {
          margin: 0 0 1.2em 0;
          text-align: justify;
          text-indent: 0;
        }
        
        .document-style .ProseMirror ul, 
        .document-style .ProseMirror ol {
          margin: 1em 0 1.5em 0;
          padding-left: 2em;
        }
        
        .document-style .ProseMirror li {
          margin: 0.5em 0;
          text-align: justify;
        }
        
        .document-style .ProseMirror strong {
          font-weight: bold;
        }
        
        .document-style .ProseMirror em {
          font-style: italic;
        }
        
        .document-style .ProseMirror table,
        .document-style .ProseMirror .clinical-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          font-size: 11pt;
          border: 2px solid #333;
        }
        
        .document-style .ProseMirror th,
        .document-style .ProseMirror td {
          border: 1px solid #333;
          padding: 10px 12px;
          text-align: left;
          vertical-align: top;
          word-wrap: break-word;
        }
        
        .document-style .ProseMirror th {
          background-color: #e9ecef;
          font-weight: bold;
          border-bottom: 2px solid #333;
        }
        
        .document-style .ProseMirror tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        /* Estilos específicos para tablas clínicas en el editor */
        .document-style .ProseMirror .clinical-table th {
          background-color: #d1ecf1;
          color: #0c5460;
          text-align: center;
          font-weight: bold;
        }
        
        .document-style .ProseMirror .clinical-table td {
          text-align: center;
        }
        
        .document-style .ProseMirror .clinical-table td:first-child {
          text-align: left;
          font-weight: 500;
        }
        
        .document-style .ProseMirror .is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        
        @media print {
          .document-style .ProseMirror {
            box-shadow: none;
            padding: 1cm;
          }
        }
      `}</style>



      {/* Footer con indicador de cambios */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-center">
          <div className="flex items-center text-sm text-gray-500">
            {hasUnsavedChanges && (
              <span className="text-amber-600 font-medium">
                • Cambios sin guardar
              </span>
            )}
            {!hasUnsavedChanges && (
              <span className="text-green-600 font-medium">
                • Todos los cambios guardados
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
