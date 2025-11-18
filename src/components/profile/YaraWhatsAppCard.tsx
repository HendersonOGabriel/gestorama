
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { MessageSquare } from 'lucide-react';

const YaraWhatsAppCard: React.FC<{ addToast: (msg: string) => void }> = ({ addToast }) => {
  const yaraPhoneNumber = '+5511912345678';
  const welcomeMessage = encodeURIComponent('Olá Yara, quero começar a registrar meus gastos!');

  const handleCopy = () => {
    navigator.clipboard.writeText(yaraPhoneNumber);
    addToast('Número copiado para a área de transferência!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yara no WhatsApp</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Adicione a Yara e comece a registrar transações por texto ou áudio.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 text-center bg-green-100 dark:bg-green-900/50 rounded-lg">
          <p className="font-mono font-bold text-lg text-green-800 dark:text-green-300">
            {yaraPhoneNumber}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleCopy} variant="outline" className="w-full">
            Copiar Número
          </Button>
          <a
            href={`https://wa.me/${yaraPhoneNumber.replace(/\+/g, '')}?text=${welcomeMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              Iniciar Conversa
            </Button>
          </a>
        </div>
        <p className="text-xs text-center text-slate-500">
          Exemplo de uso: "paguei 35.50 no almoço" ou envie um áudio com a mesma informação.
        </p>
      </CardContent>
    </Card>
  );
};

export default YaraWhatsAppCard;
