import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Wallet, 
  BarChart3, 
  Shield,
  Smartphone,
  Clock
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Wallet,
      title: 'Controle Total',
      description: 'Gerencie todas suas contas e cartões em um só lugar',
    },
    {
      icon: BarChart3,
      title: 'Relatórios Detalhados',
      description: 'Análises completas para entender seus gastos',
    },
    {
      icon: TrendingUp,
      title: 'Metas Financeiras',
      description: 'Defina objetivos e acompanhe seu progresso',
    },
    {
      icon: Shield,
      title: 'Segurança',
      description: 'Seus dados protegidos com criptografia',
    },
    {
      icon: Smartphone,
      title: 'Acesso Mobile',
      description: 'Gerencie suas finanças de qualquer lugar',
    },
    {
      icon: Clock,
      title: 'Automação',
      description: 'Transações recorrentes e lembretes automáticos',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Gestorama
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Seu gerenciador financeiro pessoal completo
          </p>
          <p className="text-lg text-muted-foreground">
            Controle suas finanças, alcance seus objetivos e tenha tranquilidade financeira
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="text-lg px-8"
              onClick={() => navigate('/dashboard')}
            >
              Começar Agora
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8"
            >
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Recursos Poderosos
          </h2>
          <p className="text-lg text-muted-foreground">
            Tudo que você precisa para gerenciar suas finanças
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Card key={feature.title} className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Comece a organizar suas finanças hoje
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já estão no controle do seu dinheiro
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8"
              onClick={() => navigate('/dashboard')}
            >
              Acessar Dashboard
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>© 2025 Gestorama. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
