# Migração para Backend Supabase

## Resumo
Toda a aplicação foi migrada de localStorage para Supabase (backend), garantindo:
- ✅ Dados persistidos no servidor
- ✅ Sincronização em tempo real entre dispositivos
- ✅ Backup automático de dados
- ✅ Melhor segurança e controle de acesso

## O que mudou

### Antes (localStorage)
- Dados salvos apenas no navegador
- Sem sincronização entre dispositivos
- Dados perdidos ao limpar cache/cookies
- Limite de 5-10MB de armazenamento

### Depois (Supabase Backend)
- Dados salvos no servidor PostgreSQL
- Sincronização automática em tempo real
- Dados persistentes e seguros
- Sem limite prático de armazenamento
- Backup automático

## Arquitetura

### Novo Hook: `useSupabaseData`
Gerencia todo o carregamento e sincronização de dados:

```typescript
const supabaseData = useSupabaseData(userId);
// Retorna: {
//   transactions, accounts, cards, categories, 
//   recurring, budgets, goals, reminders, transfers,
//   subscription, gamification, yaraUsage,
//   loading, error, refetch
// }
```

### Realtime Sync Habilitado
As seguintes tabelas têm sincronização automática:
- `transactions` - Transações financeiras
- `accounts` - Contas bancárias
- `cards` - Cartões de crédito
- `goals` - Metas financeiras
- `reminders` - Lembretes

### localStorage (Apenas UI)
Agora usado APENAS para preferências de interface:
- `themePreference` - Tema claro/escuro/sistema
- `onboardingCompleted` - Status do tour inicial

## Funcionalidades Mantidas

Todas as funcionalidades continuam funcionando EXATAMENTE igual:
- ✅ CRUD de transações
- ✅ CRUD de contas e cartões
- ✅ CRUD de categorias e orçamentos
- ✅ CRUD de metas e lembretes
- ✅ CRUD de itens recorrentes
- ✅ Transferências entre contas
- ✅ Gamificação
- ✅ Chat Yara (agora com sync automático!)
- ✅ Relatórios e gráficos
- ✅ Calendário financeiro

## Benefícios para o Usuário

1. **Dados Seguros**: Backup automático no servidor
2. **Multi-dispositivo**: Acesse de qualquer lugar
3. **Sincronização Instantânea**: Mudanças aparecem em tempo real
4. **Performance**: Carregamento otimizado com cache local
5. **Escalabilidade**: Sem limites de armazenamento

## Estrutura de Dados

### Tabelas Supabase
- `profiles` - Perfil do usuário
- `accounts` - Contas bancárias
- `cards` - Cartões de crédito
- `transactions` - Transações
- `installments` - Parcelas
- `categories` - Categorias
- `budgets` - Orçamentos
- `goals` - Metas
- `reminders` - Lembretes
- `recurring_items` - Itens recorrentes
- `transfers` - Transferências
- `subscriptions` - Assinaturas
- `gamification` - Dados de gamificação
- `yara_usage` - Uso do chat Yara
- `user_roles` - Permissões de usuários

### Row Level Security (RLS)
Todas as tabelas têm políticas RLS garantindo que:
- Usuários só veem seus próprios dados
- Não é possível acessar dados de outros usuários
- Operações são validadas no servidor

## Como Funciona

### 1. Login
```typescript
const { user } = useSupabase();
```

### 2. Carregamento Automático
```typescript
const supabaseData = useSupabaseData(user?.id);
// Carrega TODOS os dados automaticamente
```

### 3. Sincronização Realtime
```typescript
// Mudanças no banco = atualização automática na UI
// Sem necessidade de refresh manual
```

### 4. Estado Local (Performance)
```typescript
// Dados são mantidos em estado React para performance
// Sincronizados com Supabase em background
```

## Desenvolvimento

### Testar Localmente
```bash
npm run dev
```

### Estrutura do Código
```
hooks/
  useSupabase.tsx          # Auth state
  useSupabaseData.tsx      # Data loading & realtime
services/
  storageService.ts        # UI preferences only
App.tsx                    # Main app (refatorado)
```

## Troubleshooting

### Dados não aparecem?
1. Verificar se está autenticado (`user` não é null)
2. Verificar se há dados no Supabase (via backend dashboard)
3. Verificar console do navegador para erros

### Sincronização não funciona?
1. Verificar conexão com internet
2. Verificar se realtime está habilitado na tabela
3. Verificar console para erros de websocket

### Performance lenta?
1. Dados são carregados uma vez no mount
2. Atualizações são incrementais via realtime
3. Se muito lento, verificar quantidade de dados

## Próximos Passos

Possíveis melhorias futuras:
- [ ] Pagination para grandes volumes de dados
- [ ] Cache mais agressivo
- [ ] Offline mode com sync quando voltar online
- [ ] Compressão de dados para otimizar tráfego
- [ ] Analytics de performance

## Suporte

Para dúvidas ou problemas:
1. Verificar console do navegador
2. Verificar logs do Supabase (backend dashboard)
3. Verificar documentação do Supabase

---

**Data da Migração**: 14 de Novembro de 2025
**Versão**: 2.0.0 - Backend First
