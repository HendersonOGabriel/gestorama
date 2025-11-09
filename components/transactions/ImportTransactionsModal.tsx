import React, { useState, useCallback } from 'react';
import { Account, Transaction } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Upload, FileText, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { toCurrency, buildInstallments } from '../../utils/helpers';

interface ImportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onConfirmImport: (newTxs: Omit<Transaction, 'id'>[], accountId: string) => void;
  addToast: (message: string, type?: 'error' | 'success') => void;
  isLoading: boolean;
}

type Step = 'upload' | 'mapping' | 'review' | 'error';
type Mapping = {
  date: number;
  description: number;
  inflow: number | null;
  outflow: number | null;
};

const ImportTransactionsModal: React.FC<ImportTransactionsModalProps> = ({ isOpen, onClose, accounts, onConfirmImport, addToast, isLoading }) => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({ date: -1, description: -1, inflow: null, outflow: null });
  const [dateFormat, setDateFormat] = useState<string>('yyyy-mm-dd');
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts.find(a => a.isDefault)?.id || accounts[0]?.id || '');
  const [parsedTransactions, setParsedTransactions] = useState<Omit<Transaction, 'id'>[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const resetState = useCallback(() => {
    setStep('upload');
    setFile(null);
    setFileContent('');
    setHeaders([]);
    setPreviewRows([]);
    setMapping({ date: -1, description: -1, inflow: null, outflow: null });
    setDateFormat('yyyy-mm-dd');
    setSelectedAccount(accounts.find(a => a.isDefault)?.id || accounts[0]?.id || '');
    setParsedTransactions([]);
    setErrorMessage('');
  }, [accounts]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv') {
      addToast('Por favor, selecione um arquivo CSV.', 'error');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      processFileContent(content);
    };
    reader.readAsText(selectedFile);
  };
  
  const processFileContent = (content: string) => {
    try {
      const lines = content.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) throw new Error("O arquivo CSV precisa ter pelo menos um cabeçalho e uma linha de dados.");
      
      const fileHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      setHeaders(fileHeaders);
      
      const rows = lines.slice(1, 6).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
      setPreviewRows(rows);
      setStep('mapping');
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao processar o arquivo CSV.");
      setStep('error');
    }
  };

  const parseDate = (dateStr: string, format: string): Date => {
    const parts = dateStr.match(/(\d+)/g);
    if (!parts || parts.length < 3) throw new Error(`Formato de data inválido para: ${dateStr}`);
    
    let day = 0, month = 0, year = 0;
    const formatParts = format.toLowerCase().split(/[^a-z]+/);
    
    const yearIndex = formatParts.findIndex(p => p.startsWith('y'));
    const monthIndex = formatParts.findIndex(p => p.startsWith('m'));
    const dayIndex = formatParts.findIndex(p => p.startsWith('d'));

    if (yearIndex === -1 || monthIndex === -1 || dayIndex === -1) throw new Error("Formato de data inválido. Use 'yyyy', 'mm', 'dd'.");

    year = parseInt(parts[yearIndex]);
    month = parseInt(parts[monthIndex]) - 1; // Month is 0-indexed in JS Date
    day = parseInt(parts[dayIndex]);
    
    if (year < 100) year += 2000; // Handle yy format

    const date = new Date(Date.UTC(year, month, day));
    if (isNaN(date.getTime())) throw new Error(`Não foi possível parsear a data: ${dateStr}`);
    return date;
  };

  const goToReviewStep = () => {
    if (mapping.date === -1 || mapping.description === -1 || (mapping.inflow === null && mapping.outflow === null)) {
      addToast('Mapeie pelo menos Data, Descrição e um campo de Valor.', 'error');
      return;
    }
    if (!selectedAccount) {
      addToast('Selecione uma conta para importar as transações.', 'error');
      return;
    }

    try {
      const lines = fileContent.split('\n').slice(1).filter(line => line.trim() !== '');
      const newTransactions: Omit<Transaction, 'id'>[] = [];

      for (const line of lines) {
        const cells = line.split(',');
        
        const dateStr = cells[mapping.date].trim().replace(/"/g, '');
        const dateObj = parseDate(dateStr, dateFormat);
        const finalDate = dateObj.toISOString().slice(0, 10);
        
        const desc = cells[mapping.description].trim().replace(/"/g, '');

        let amount = 0;
        let isIncome = false;

        const inflowStr = mapping.inflow !== null ? cells[mapping.inflow]?.trim().replace(/"/g, '') : '0';
        const outflowStr = mapping.outflow !== null ? cells[mapping.outflow]?.trim().replace(/"/g, '') : '0';
        
        const inflow = parseFloat(inflowStr.replace(/[^0-9.,-]+/g, '').replace('.', '').replace(',', '.'));
        const outflow = parseFloat(outflowStr.replace(/[^0-9.,-]+/g, '').replace('.', '').replace(',', '.'));
        
        if (!isNaN(inflow) && inflow > 0) {
            amount = inflow;
            isIncome = true;
        } else if (!isNaN(outflow) && outflow > 0) {
            amount = outflow;
            isIncome = false;
        } else if (inflow) { // Handle single column with negative/positive values
            amount = Math.abs(inflow);
            isIncome = inflow > 0;
        } else {
            continue; // Skip rows without a valid amount
        }

        const schedule = buildInstallments(finalDate, amount, 1);
        schedule[0].paid = true;
        schedule[0].paymentDate = finalDate;
        schedule[0].paidAmount = amount;

        newTransactions.push({
          desc,
          amount,
          date: finalDate,
          installments: 1,
          type: 'cash',
          isIncome,
          person: 'Importado',
          account: selectedAccount,
          card: null,
          categoryId: null,
          installmentsSchedule: schedule,
          paid: true
        });
      }

      setParsedTransactions(newTransactions);
      setStep('review');
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao processar os dados. Verifique o mapeamento e o formato da data.");
      setStep('error');
    }
  };

  const handleConfirm = async () => {
    await onConfirmImport(parsedTransactions, selectedAccount);
    handleClose();
  };


  const renderStep = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Upload className="w-12 h-12" />
                <span className="font-semibold">Clique para selecionar um arquivo</span>
                <span className="text-sm">ou arraste e solte aqui (CSV)</span>
              </div>
            </label>
            <Input id="csv-upload" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Mapeamento de Colunas</h3>
            <p className="text-sm text-slate-500">Associe as colunas do seu arquivo aos campos da transação.</p>
            
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Conta para Importação</Label>
                    <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                   <div>
                    <Label>Formato da Data (ex: dd/mm/yyyy)</Label>
                    <Input value={dateFormat} onChange={e => setDateFormat(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <MappingSelect label="Data *" value={mapping.date} onChange={v => setMapping(m => ({...m, date: v}))} headers={headers} />
                    <MappingSelect label="Descrição *" value={mapping.description} onChange={v => setMapping(m => ({...m, description: v}))} headers={headers} />
                    <MappingSelect label="Valor (Entrada)" value={mapping.inflow} onChange={v => setMapping(m => ({...m, inflow: v}))} headers={headers} optional />
                    <MappingSelect label="Valor (Saída)" value={mapping.outflow} onChange={v => setMapping(m => ({...m, outflow: v}))} headers={headers} optional />
                </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Pré-visualização do Arquivo</h4>
              <div className="overflow-x-auto max-h-40 border rounded-md">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50 dark:bg-slate-800">{headers.map((h, i) => <th key={i} className="p-2 text-left font-medium">{h}</th>)}</tr></thead>
                  <tbody>{previewRows.map((row, i) => <tr key={i} className="border-t">{row.map((cell, j) => <td key={j} className="p-2">{cell}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4">
                <Button variant="ghost" onClick={resetState}>Voltar</Button>
                <Button onClick={goToReviewStep} loading={isLoading}>Revisar Dados <ArrowRight className="w-4 h-4 ml-2"/></Button>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Revisar e Confirmar</h3>
            <p className="text-sm text-slate-500">Confira as transações que serão importadas para a conta: <strong>{accounts.find(a=>a.id===selectedAccount)?.name}</strong></p>
            <div className="overflow-y-auto max-h-60 border rounded-md">
                <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 dark:bg-slate-800 text-left sticky top-0"><th className="p-2 font-medium">Data</th><th className="p-2 font-medium">Descrição</th><th className="p-2 font-medium text-right">Valor</th></tr></thead>
                    <tbody>
                        {parsedTransactions.map((tx, i) => (
                            <tr key={i} className="border-t"><td className="p-2">{tx.date}</td><td className="p-2">{tx.desc}</td><td className={`p-2 text-right font-semibold ${tx.isIncome ? 'text-green-500' : 'text-red-500'}`}>{toCurrency(tx.amount)}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-md text-center font-semibold">
                Total a importar: {parsedTransactions.length} transações
            </div>
             <div className="flex justify-between items-center pt-4">
                <Button variant="ghost" onClick={() => setStep('mapping')}>Voltar</Button>
                <Button onClick={handleConfirm} loading={isLoading}><CheckCircle className="w-4 h-4 mr-2"/> Confirmar Importação</Button>
            </div>
          </div>
        );
        
      case 'error':
        return (
           <div className="text-center p-8 flex flex-col items-center gap-4">
             <AlertTriangle className="w-12 h-12 text-red-500" />
             <h3 className="font-semibold text-lg">Ocorreu um Erro</h3>
             <p className="text-sm text-slate-500">{errorMessage}</p>
             <Button onClick={resetState}>Tentar Novamente</Button>
           </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Importar Transações de CSV</DialogTitle></DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};


const MappingSelect: React.FC<{label: string, value: number | null, onChange: (v: number) => void, headers: string[], optional?: boolean}> = ({label, value, onChange, headers, optional}) => (
    <div>
        <Label>{label}</Label>
        <select value={value === null ? -2 : value} onChange={e => onChange(parseInt(e.target.value))} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
            {optional && <option value={-2}>Ignorar</option>}
            <option value={-1}>Selecione...</option>
            {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
        </select>
    </div>
);

export default ImportTransactionsModal;