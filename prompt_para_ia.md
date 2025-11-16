# Prompt Detalhado para Finalizar a Conexão Backend (Supabase) em Aplicação React

## 1. Objetivo Principal

O objetivo desta tarefa é **finalizar a conexão** entre a interface de usuário (frontend) React e o backend Supabase. O foco é habilitar o **controle manual do usuário** sobre seus dados através dos formulários e botões da aplicação.

Atualmente, a aplicação lê dados do Supabase e algumas funcionalidades de backend (via IA) já existem, mas a interface principal não salva as alterações do usuário.

**Restrição Crítica:** Nenhuma alteração de layout ou estilo deve ser feita. O frontend é considerado visualmente completo. O foco é exclusivamente na lógica de dados da interface do usuário.

---

## 2. Diagnóstico Atual

-   **O que JÁ funciona:**
    -   **Chat IA (Yara):** O assistente de IA (`supabase/functions/yara-chat`) já consegue **criar e excluir transações** diretamente no banco de dados.
    -   **Setup de Novos Usuários:** O sistema já insere categorias padrão para novos usuários (`hooks/useSupabaseData.tsx`).

-   **O que FALTA (Foco desta Tarefa):**
    -   **Conexão dos Formulários Manuais:** Os formulários para `Adicionar Conta`, `Adicionar Cartão`, etc., não salvam os dados no Supabase. Eles apenas atualizam o estado local.
    -   **Funcionalidade de Edição (Update):** Nenhuma parte da aplicação permite ao usuário **editar** um registro existente (seja uma conta, transação, etc.).
    -   **Funcionalidade de Exclusão (Delete) para o Usuário:** O usuário não tem como **excluir** nenhum dado manualmente através da interface.

---

## 3. Contexto da Arquitetura

-   **Frontend:** React com Vite e TypeScript.
-   **Backend:** Supabase.
-   **Gerenciamento de Estado:** O estado global é gerenciado no `App.tsx` via `useState`.
-   **Busca de Dados:** O hook `hooks/useSupabaseData.tsx` busca os dados e usa Supabase Realtime para manter a UI sincronizada.
-   **Cliente Supabase:** Disponível em `src/integrations/supabase/client.ts`.

---

## 4. Requisitos Gerais de Implementação

1.  **Associação com o Usuário:** Toda nova entrada **criada pelo usuário** deve incluir o `user_id` do usuário autenticado.
2.  **Feedback de Sucesso (Toast):** Use a função `addToast` (disponível em `App.tsx`) para notificar o sucesso de cada operação.
3.  **Feedback de Erro (Toast):** Capture erros das chamadas ao Supabase e use `addToast(mensagem, 'error')` para notificar o usuário.
4.  **Não Atualizar Estado Manualmente:** Confie no Supabase Realtime para atualizar a interface após uma operação de escrita bem-sucedida. Apenas as chamadas `insert`, `update`, `delete` são necessárias.

---

## 5. Instruções de Implementação por Módulo

### Módulo 1: Contas (`components/accounts/`) - **MAIOR PRIORIDADE**

-   **Criação (`AccountForm.tsx`):**
    1.  Modifique o `handleSubmit` para executar um `supabase.from('accounts').insert({...})` com os dados da nova conta, incluindo `user_id`.
-   **Exclusão (`AccountList.tsx`):**
    1.  Ao excluir, verifique se a conta possui transações.
    2.  **Se sim:** Apresente um modal para o usuário re-associar essas transações a outra conta. Execute o `update` nas transações e depois o `delete` na conta.
    3.  **Se não:** Execute o `delete` diretamente.
-   **Atualização (`AccountList.tsx`):**
    1.  Adicione a funcionalidade de edição para o nome/saldo da conta, chamando `supabase.from('accounts').update({...})`.

### Módulo 2: Cartões de Crédito (`components/cards/`)

-   **Criação (`CardForm.tsx`):**
    1.  Modifique o `handleSubmit` para chamar `supabase.from('cards').insert({...})`.
-   **Exclusão (`CardList.tsx`):**
    1.  Implemente a mesma lógica de re-associação de transações das Contas antes de excluir o cartão. A melhor prática aqui pode ser `update({ deleted: true })`.
-   **Atualização (`CardList.tsx`):**
    1.  Adicione a funcionalidade para editar os detalhes de um cartão, chamando `supabase.from('cards').update({...})`.

### Módulo 3: Transações (`components/transactions/TransactionForm.tsx` e `App.tsx`)

-   **Criação e Atualização (na função `handleTransactionSubmit` em `App.tsx`):**
    1.  Para novas transações, chame `supabase.from('transactions').insert({...})`.
    2.  Para transações existentes, chame `supabase.from('transactions').update({...})`.

### Módulo 4: Categorias (`CategoryManager` em `App.tsx`)

-   **CRUD:** Conecte as funções `handleAdd`, `handleUpdate`, e `handleDelete` para chamarem `insert`, `update`, e `delete` na tabela `categories` do Supabase.

### Módulo 5: Gráficos e Relatórios (Validação)

-   Após a implementação do CRUD de transações, **valide** que os gráficos nas páginas `DashboardPage` e `ReportsPage` refletem corretamente as novas informações salvas no banco de dados.

---

## 6. Resumo da Tarefa e Critérios de Aceitação

-   **Feito:** O usuário pode adicionar, editar e excluir contas, cartões, transações e categorias através da interface.
-   **Feito:** Todas as alterações são salvas permanentemente no Supabase.
-   **Feito:** O usuário recebe feedback visual (toasts) para sucesso e erro.
-   **Feito:** A lógica de exclusão com re-associação de transações está implementada.
-   **Feito:** Os gráficos e relatórios refletem os dados corretos do banco de dados.
-   **Feito:** O layout do site permanece inalterado.
