import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { ChevronDown, ShieldCheck, DatabaseZap, Users, Rocket, Target, BrainCircuit, MessageCircle, Mail, HelpCircle } from "lucide-react";
import { cn } from "../utils/helpers";

const Section: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-8 mt-1 text-indigo-500 dark:text-indigo-400">{icon}</div>
    <div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <div className="text-sm text-slate-600 dark:text-slate-400 prose prose-sm dark:prose-invert max-w-none">
        {children}
      </div>
    </div>
  </div>
);


export function TermosDeUsoPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>📄 Termos de Uso</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">Última atualização: 23 de Julho de 2024</p>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-slate-600 dark:text-slate-300 px-4 sm:px-6">
          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
             <h3 className="font-semibold text-base mb-2">Resumo dos Termos</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400">
               Ao usar o Gestorama, você concorda em utilizar nossos serviços de forma responsável. Seus dados são processados para fornecer as funcionalidades do app, e você é responsável pela segurança da sua conta.
             </p>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
            <p>Bem-vindo ao Gestorama! Ao utilizar nosso aplicativo, você concorda com os seguintes termos:</p>
            <ol className="list-decimal list-inside space-y-3">
              <li><strong>Aceitação e Serviço:</strong> O Gestorama é um aplicativo de gestão financeira com inteligência artificial que auxilia no controle de finanças pessoais. Ao utilizá-lo, você concorda integralmente com estes Termos de Uso e com nossa Política de Privacidade.</li>
              <li><strong>Uso da Conta:</strong> Você é o único responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades que ocorrem em sua conta. O uso inadequado ou fraudulento pode levar à suspensão ou encerramento da sua conta.</li>
              <li><strong>Inteligência Artificial (Yara):</strong> O usuário informa seus gastos e a IA Yara os registra e classifica automaticamente. Para que a análise seja precisa, as informações fornecidas devem ser verdadeiras e completas.</li>
              <li><strong>Limitação de Responsabilidade:</strong> O Gestorama não se responsabiliza por perdas financeiras, danos indiretos, ou por decisões tomadas com base nas informações do aplicativo. A ferramenta é um auxílio, mas a responsabilidade final sobre suas finanças é sua.</li>
              <li><strong>Propriedade Intelectual:</strong> Todo o conteúdo, design e tecnologia do Gestorama são de nossa propriedade. Você não tem permissão para copiar, modificar ou distribuir nosso material sem autorização prévia.</li>
              <li><strong>Modificações nos Termos:</strong> Podemos atualizar estes termos periodicamente. Notificaremos sobre mudanças significativas através do aplicativo ou por e-mail.</li>
              <li><strong>Encerramento da Conta:</strong> Reservamo-nos o direito de suspender ou encerrar sua conta a nosso critério, especialmente em casos de comportamento suspeito, fraudulento ou que viole estes termos. Ações que comprometam a segurança ou a integridade da plataforma resultarão em encerramento imediato.</li>
              <li><strong>Alterações de Preço:</strong> Podemos ajustar os preços de nossos planos de assinatura quando necessário para refletir melhorias no serviço ou mudanças no mercado. Qualquer alteração de preço será comunicada a todos os usuários com antecedência, por e-mail, explicando os motivos e a data de vigência do novo valor.</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PoliticaPrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>🔒 Política de Privacidade</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">Última atualização: 23 de Julho de 2024</p>
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:px-6">
            <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
               <h3 className="font-semibold text-base mb-2">Nosso Compromisso</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sua privacidade é nossa prioridade. Coletamos apenas os dados necessários para o funcionamento do app, os protegemos com as melhores práticas de segurança e nunca os vendemos para terceiros.
               </p>
            </div>
             <div className="space-y-6">
                <Section icon={<DatabaseZap size={24} />} title="Dados Coletados e Uso">
                    <p>Coletamos informações que você nos fornece, como transações, metas e orçamentos, para:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Registrar e categorizar suas finanças.</li>
                            <li>Gerar relatórios e insights personalizados.</li>
                            <li>Melhorar a precisão da nossa IA, Yara.</li>
                            <li>Comunicar sobre atualizações importantes do serviço.</li>
                        </ul>
                    </p>
                </Section>
                <Section icon={<ShieldCheck size={24} />} title="Segurança e Armazenamento">
                    <p>Todos os seus dados são criptografados em trânsito e em repouso. Utilizamos servidores seguros e seguimos rigorosos protocolos de segurança para prevenir acessos não autorizados. Você pode solicitar a exclusão total de seus dados a qualquer momento através do painel de configurações.</p>
                </Section>
                 <Section icon={<Users size={24} />} title="Compartilhamento de Dados">
                    <p><strong>Nós não vendemos seus dados.</strong> O compartilhamento com terceiros ocorre apenas com provedores de serviços essenciais (como infraestrutura de nuvem), e eles são contratualmente obrigados a proteger suas informações. Também podemos compartilhar dados se exigido por lei.</p>
                </Section>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ContatoSuportePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="text-center px-4 sm:px-6">
          <CardTitle>📞 Fale Conosco</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tem alguma dúvida ou sugestão? Nossa equipe está pronta para ajudar.</p>
        </CardHeader>
        <CardContent className="flex flex-col md:grid md:grid-cols-2 gap-8 px-4 sm:px-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Envie sua mensagem</h3>
              <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                <Input placeholder="Seu nome" aria-label="Seu nome" />
                <Input placeholder="Seu e-mail" type="email" aria-label="Seu e-mail" />
                <Textarea placeholder="Descreva sua dúvida ou problema..." rows={5} aria-label="Sua mensagem" />
                <Button type="submit" className="w-full">Enviar Mensagem</Button>
              </form>
            </div>
            <div className="space-y-6 bg-slate-100 dark:bg-slate-800/50 p-6 rounded-lg">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><Mail className="w-5 h-5 text-indigo-500"/> Outros canais</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        <strong>E-mail:</strong> <a href="mailto:suporte@gestorama.com" className="text-indigo-500 hover:underline" style={{overflowWrap: 'anywhere'}}>suporte@gestorama.com</a><br/>
                        Nosso suporte responde em até 24 horas úteis.
                    </p>
                </div>
                 <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><HelpCircle className="w-5 h-5 text-indigo-500"/> Dúvidas Frequentes</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Muitas respostas podem ser encontradas em nossa página de <button onClick={() => {}} className="text-indigo-500 hover:underline font-semibold">Perguntas Frequentes (FAQ)</button>.
                    </p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SobrePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="text-center px-4 sm:px-6">
          <CardTitle>Simplificando a Relação com o seu Dinheiro</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mt-1">O Gestorama nasceu da crença de que o controle financeiro não precisa ser complicado. Nossa missão é oferecer uma ferramenta poderosa, intuitiva e segura para todos.</p>
        </CardHeader>
        <CardContent className="space-y-8 px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-8 text-center">
                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                    <Target className="w-10 h-10 mx-auto text-indigo-500 mb-3" />
                    <h3 className="font-semibold text-lg">Nossa Missão</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Empoderar pessoas a tomarem melhores decisões financeiras através de tecnologia inteligente e acessível.</p>
                </div>
                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                    <Rocket className="w-10 h-10 mx-auto text-indigo-500 mb-3" />
                    <h3 className="font-semibold text-lg">Nossa Visão</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ser a plataforma de finanças pessoais mais amada do Brasil, transformando a complexidade em simplicidade.</p>
                </div>
            </div>
            <div className="text-center pt-6 border-t border-slate-200 dark:border-slate-700">
                 <BrainCircuit className="w-12 h-12 mx-auto text-indigo-500 mb-4" />
                 <h3 className="font-semibold text-2xl">Conheça a Yara, sua assistente financeira</h3>
                 <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mt-2">
                    Yara é o cérebro por trás do Gestorama. Ela é uma Inteligência Artificial treinada para entender a linguagem natural, categorizar seus gastos com precisão e fornecer insights valiosos. Seja por texto no app ou por áudio no WhatsApp, ela transforma suas informações em relatórios claros e organizados, poupando seu tempo e esforço.
                 </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

const FAQCategory: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-400">{title}</h3>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const FAQItem: React.FC<{question: string, answer: string}> = ({question, answer}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <button
        className="w-full text-left flex justify-between items-center py-4 font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        <ChevronDown className={cn("w-5 h-5 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="pb-4 text-slate-500 dark:text-slate-400">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};


export function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="text-center px-4 sm:px-6">
          <CardTitle>💡 Perguntas Frequentes (FAQ)</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Encontre respostas para as dúvidas mais comuns sobre o Gestorama.</p>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 dark:text-slate-200 px-4 sm:px-6">
            <FAQCategory title="Geral">
                <FAQItem question="Como a IA Yara funciona?" answer="Você informa seus gastos por texto ou voz (via WhatsApp) e a Yara, nossa IA, interpreta, categoriza e registra a transação automaticamente para você. Ela aprende com seus hábitos para se tornar cada vez mais precisa." />
                <FAQItem question="Posso usar o Gestorama offline?" answer="As funcionalidades principais do dashboard, como visualização de dados já sincronizados, funcionam offline. No entanto, para registrar novas transações via IA e sincronizar seus dados, é necessária uma conexão com a internet." />
                <FAQItem question="O Gestorama possui integração com contas bancárias?" answer="A integração bancária automática está em nosso roadmap de desenvolvimento e será um recurso futuro. No momento, você pode importar extratos em formato CSV para adicionar transações em lote." />
                <FAQItem question="Tenho outras dúvidas. O que eu faço?" answer="A Yara, nossa assistente de IA, está pronta para ajudar! Abra o chat flutuante e pergunte o que quiser. Ela pode te guiar pelas funcionalidades, dar dicas financeiras e responder a maioria das suas perguntas sobre o app." />
            </FAQCategory>
            <FAQCategory title="Segurança e Privacidade">
                 <FAQItem question="Meus dados financeiros estão seguros?" answer="Sim. A segurança é nossa maior prioridade. Todos os seus dados são criptografados e armazenados em servidores seguros, seguindo as melhores práticas do setor para proteger suas informações." />
                <FAQItem question="Meus dados são compartilhados com terceiros?" answer="Não. Seus dados financeiros são privados e não são vendidos ou compartilhados com terceiros para fins de marketing. Consulte nossa Política de Privacidade para mais detalhes." />
                <FAQItem question="Como posso excluir minha conta e meus dados?" answer="Você pode solicitar a exclusão completa da sua conta e de todos os dados associados diretamente no seu painel de 'Perfil', na seção de gerenciamento de dados." />
            </FAQCategory>
             <FAQCategory title="Planos e Assinatura">
                <FAQItem question="Qual a diferença entre os planos?" answer="Os planos variam principalmente pelo número de usuários. O 'Individual' é para uma pessoa, o 'Duo' para duas, e o 'Família' permite adicionar mais membros com gerenciamento compartilhado." />
                <FAQItem question="Como posso cancelar minha assinatura?" answer="Você pode cancelar sua assinatura a qualquer momento acessando a página 'Assinatura' no menu principal do aplicativo." />
            </FAQCategory>
        </CardContent>
      </Card>
    </div>
  );
}