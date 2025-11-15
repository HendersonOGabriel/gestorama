# Prompt Detalhado para Implementação de Backend (Supabase) em Aplicação React

## 1. Objetivo Principal

O objetivo desta tarefa é conectar a interface de usuário (frontend) React existente a um backend Supabase. Atualmente, a aplicação carrega os dados do Supabase corretamente, mas todas as operações de criação, atualização e exclusão (CRUD) são feitas apenas no estado local do React e não são persistidas no banco de dados.

**Restrição Crítica:** Nenhuma alteração de layout ou estilo deve ser feita. O frontend é considerado visualmente completo e responsivo. O foco é exclusivamente na lógica de dados.

---

## 2. Contexto da Arquitetura

-   **Frontend:** React com Vite e TypeScript.
-   **Backend:** Supabase.
-   **Gerenciamento de Estado:** O estado global (contas, transações, etc.) é gerenciado no componente principal `App.tsx` através de `useState`.
-   **Busca de Dados:** O hook `hooks/useSupabaseData.tsx` é responsável por buscar os dados iniciais e manter a sincronização em tempo real (realtime) do Supabase para a aplicação.
-   **Cliente Supabase:** O cliente Supabase já está inicializado em `src/integrations/supabase/client.ts` e pode ser importado e utilizado em qualquer parte da aplicação.
-   **Estrutura de Tipos:** Todos os tipos de dados (Transaction, Account, etc.) estão definidos em `types.ts`.

---

## 3. Requisitos Gerais de Implementação

Para cada funcionalidade de CRUD implementada, os seguintes requisitos devem ser atendidos:

1.  **Associação com o Usuário:** Toda nova entrada em qualquer tabela do Supabase (`accounts`, `cards`, `transactions`, etc.) **deve** incluir o `user_id` do usuário atualmente autenticado. O ID do usuário está disponível no `App.tsx` através do hook `useSupabase`.
2.  **Feedback de Sucesso:** Após cada operação bem-sucedida (criar, atualizar, excluir), uma notificação de sucesso ("toast") deve ser exibida ao usuário. A função `addToast` já está disponível como prop no `App.tsx` e deve ser usada para isso.
3.  **Feedback de Erro:** Se uma operação com o Supabase falhar, o erro deve ser capturado (`try...catch`) e uma notificação de erro deve ser exibida ao usuário usando `addToast(mensagem, 'error')`. O erro também deve ser logado no console para depuração.
4.  **Atualização do Estado Local:** Após uma operação de escrita bem-sucedida no Supabase, **não** é necessário atualizar manualmente o estado local do React (ex: `setAccounts(...)`). O hook `useSupabaseData` já utiliza o Supabase Realtime para atualizar a interface automaticamente. Apenas as chamadas para o Supabase (`insert`, `update`, `delete`) são necessárias.

---

## 4. Instruções de Implementação por Módulo

### Módulo 1: Contas (`components/accounts/`)

-   **Criação (`AccountForm.tsx`):**
    1.  Na função `handleSubmit`, em vez de apenas chamar `setAccounts`, crie uma nova função assíncrona.
    2.  Nessa função, execute um `supabase.from('accounts').insert({...})` com os dados da nova conta (`name`, `balance`, `user_id`).
    3.  Lide com o sucesso e o erro conforme os Requisitos Gerais.
-   **Exclusão (`AccountList.tsx`):**
    1.  Ao clicar no ícone de lixeira, implemente a seguinte lógica:
    2.  Verifique se existem transações no estado local associadas a esta conta (`transactions.some(t => t.account === accountId)`).
    3.  **Se existirem transações:**
        -   Exiba um modal para o usuário.
        -   O modal deve alertar que existem transações associadas.
        -   Ofereça uma lista (dropdown/select) com as outras contas disponíveis para o usuário transferir as transações.
        -   Ao confirmar, execute um `supabase.from('transactions').update({ account_id: newAccountId }).eq('account_id', oldAccountId)`.
        -   Após a atualização das transações, execute um `supabase.from('accounts').delete().eq('id', oldAccountId)`.
    4.  **Se não existirem transações:**
        -   Execute diretamente `supabase.from('accounts').delete().eq('id', accountId)`.
-   **Atualização:**
    1.  Implemente a lógica de edição para o nome e o saldo da conta, que atualmente parece faltar na interface. Se um botão "Editar" for adicionado, a lógica deve chamar `supabase.from('accounts').update({...}).eq('id', accountId)`.

### Módulo 2: Cartões de Crédito (`components/cards/`)

-   **Criação (`CardForm.tsx`):**
    1.  Similar ao `AccountForm`, modifique o `handleSubmit` para chamar `supabase.from('cards').insert({...})` com os dados do novo cartão. Não esqueça de incluir `user_id`.
-   **Exclusão (`CardList.tsx`):**
    1.  A lógica de exclusão de cartões deve seguir um fluxo similar à exclusão de contas.
    2.  Verifique se existem transações de cartão (`transactions.some(t => t.card === cardId)`).
    3.  Se sim, exiba um modal para re-associar as transações a outro cartão ou marcá-las como transações "sem cartão" (`card_id: null`). A escolha deve ser do usuário.
    4.  Após a re-associação, execute `supabase.from('cards').delete().eq('id', cardId)`. (Nota: a tabela `cards` parece ter um campo `deleted`. A melhor prática pode ser `update({ deleted: true })` em vez de `delete()`). Verifique a estrutura da tabela).
-   **Atualização (`CardList.tsx`):**
    1.  Implemente a lógica para editar os detalhes de um cartão, chamando `supabase.from('cards').update({...}).eq('id', cardId)`.

### Módulo 3: Transações (`components/transactions/TransactionForm.tsx`)

-   **Criação e Atualização (`handleTransactionSubmit` em `App.tsx`):**
    1.  A função `handleTransactionSubmit` já distingue entre criação (novo) e edição (`existing`).
    2.  **Se for uma nova transação:**
        -   Chame `supabase.from('transactions').insert({...})` com os dados da transação, incluindo `user_id`.
    3.  **Se for uma edição:**
        -   Chame `supabase.from('transactions').update({...}).eq('id', tx.id)`.
    4.  A lógica de `adjustAccountBalance` que ajusta o saldo da conta deve ser mantida, mas idealmente, o saldo da conta deveria ser recalculado no backend ou o ajuste deve ser feito após a confirmação do Supabase. Por simplicidade, pode-se manter o ajuste local por enquanto.

### Módulo 4: Categorias (`components/categories/` dentro de `App.tsx`)

-   **CRUD no `CategoryManager` (`App.tsx`):**
    1.  **Adicionar:** Na função `handleAdd`, adicione a chamada `supabase.from('categories').insert({ name, group, user_id })`.
    2.  **Atualizar:** Na `handleUpdate`, chame `supabase.from('categories').update({ ... }).eq('id', editingCategory.id)`.
    3.  **Excluir:** Na `handleDelete`, antes de modificar o estado, chame `supabase.from('categories').delete().eq('id', id)`. A verificação `canDelete` deve ser mantida.
    4.  **Grupos:** A lógica de edição de grupos (`handleUpdateGroup`, `handleDeleteGroup`) também precisa ser conectada, atualizando todas as categorias associadas no Supabase.

### Módulo 5: Gráficos e Relatórios (`pages/DashboardPage.tsx`, `pages/ReportsPage.tsx`)

-   **Validação:**
    1.  Uma vez que as operações de CRUD para transações estejam funcionando e salvando no Supabase, os dados exibidos nos gráficos e relatórios deverão ser automaticamente atualizados.
    2.  A tarefa aqui é validar que, após adicionar/editar/excluir uma transação, os gráficos (ex: gráfico de pizza de despesas por categoria no dashboard) reflitam essa mudança corretamente.
    3.  Não é necessário alterar a lógica dos gráficos, apenas confirmar que eles consomem os dados do estado que o Supabase Realtime já está atualizando.

---

## 5. Resumo da Tarefa e Critérios de Aceitação

-   **Feito:** O usuário pode adicionar, editar e excluir contas, cartões, transações e categorias.
-   **Feito:** Todas as alterações são salvas permanentemente no Supabase e refletem em outras sessões ou após a atualização da página.
-   **Feito:** Cada dado criado é associado ao `user_id` correto.
-   **Feito:** O usuário recebe feedback visual (notificações "toast") para todas as operações de sucesso e erro.
-   **Feito:** A lógica de exclusão de contas e cartões segue as regras de negócio especificadas (verificar transações e permitir re-associação).
-   **Feito:** Os gráficos e relatórios são atualizados dinamicamente com base nos dados do Supabase.
-   **Feito:** O layout e a aparência do site permanecem inalterados.