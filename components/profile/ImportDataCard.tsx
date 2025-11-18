import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { UploadCloud, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../../src/integrations/supabase/client';

interface ImportDataCardProps {
  addToast: (message: string, type?: 'error' | 'success') => void;
  onImportComplete: () => void;
}

const ImportDataCard: React.FC<ImportDataCardProps> = ({ addToast, onImportComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errors: string[] } | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    setImportResult(null);

    try {
      const fileContent = await file.text();

      const { data, error } = await supabase.functions.invoke('yara-import', {
        body: { fileContent },
      });

      if (error) {
        throw new Error(`Erro da função: ${error.message}`);
      }

      const result = data as { successCount: number; errors: string[] };
      setImportResult(result);

      if (result.successCount > 0) {
        addToast(`${result.successCount} transação(ões) importada(s) com sucesso!`, 'success');
        onImportComplete(); // Notifica o componente pai para recarregar os dados
      }
      if (result.errors && result.errors.length > 0) {
        addToast(`Houveram ${result.errors.length} erro(s) durante a importação.`, 'error');
      }

    } catch (e: any) {
      setImportResult({ successCount: 0, errors: ['Ocorreu um erro inesperado ao processar o arquivo. Verifique o formato e tente novamente.'] });
      addToast('Falha ao importar o arquivo.', 'error');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'text/csv': ['.csv'], 
      'text/plain': ['.txt'] 
    },
    multiple: false,
    disabled: isLoading,
    onDragEnter: () => {},
    onDragLeave: () => {},
    onDragOver: () => {}
  } as any);

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-12 h-12 text-slate-500 mb-4 animate-spin" />
          <p className="text-slate-400">Analisando o arquivo... Isso pode levar um minuto.</p>
        </>
      );
    }

    if (importResult) {
      return (
        <div className="text-left w-full">
            <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500 mr-3" />
                <div>
                    <h3 className="font-semibold text-lg">Importação Concluída</h3>
                    <p className="text-slate-400">{importResult.successCount} transações importadas.</p>
                </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-900/20 rounded-md max-h-40 overflow-y-auto">
                    <div className="flex items-center mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        <h4 className="font-semibold">Detalhes dos Erros</h4>
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-400 space-y-1">
                        {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}
            <button
                onClick={() => setImportResult(null)}
                className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
                Importar Outro Arquivo
            </button>
        </div>
      );
    }

    return (
      <>
        <input {...getInputProps()} />
        <UploadCloud className="w-12 h-12 text-slate-500 mb-4" />
        <p className="mb-2 text-slate-400">Arraste e solte seu arquivo (CSV, TXT) aqui, ou clique para selecionar.</p>
        <p className="text-xs text-slate-500 mt-4">
          Aviso: A importação pode criar transações duplicadas. Você poderá corrigi-las depois.
        </p>
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Dados</CardTitle>
        <CardDescription>
          Importe seu extrato bancário ou planilha e deixe a Yara organizar tudo para você.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-center
            ${!isLoading && !importResult ? 'cursor-pointer' : ''}
            ${isDragActive ? 'border-indigo-600 bg-indigo-900/10' : 'border-slate-700'}
            ${isLoading ? 'cursor-wait' : ''}`}
        >
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportDataCard;
