## Prompt para IA: Refatorar o Sistema de Atualizações em Tempo Real

**Objetivo:** Melhorar a experiência do usuário no aplicativo Gestorama, refatorando a forma como as atualizações de dados em tempo real são processadas. O comportamento atual de recarregar toda a página ao receber uma atualização deve ser substituído por atualizações granulares e instantâneas que não interrompam o fluxo do usuário (ex: fechar modais).

---

### Contexto do Problema

Atualmente, quando o banco de dados do Supabase envia uma notificação de mudança (por exemplo, uma nova transação é adicionada ou um lembrete é atualizado), a aplicação inteira é renderizada novamente. Isso causa uma péssima experiência de usuário:
-   Qualquer modal que esteja aberto (como o de adicionar ou editar uma transação) é fechado abruptamente.
-   O usuário perde o contexto do que estava fazendo.
-   A atualização, em vez de parecer "em tempo real", parece um "refresh" forçado da página.

### Análise da Causa Raiz

A investigação do código-fonte revelou que o problema está no hook customizado `hooks/useSupabaseData.tsx`.

1.  **Escutando Mudanças:** Este hook utiliza o serviço de "realtime" do Supabase para se inscrever a mudanças em várias tabelas (`transactions`, `accounts`, `cards`, etc.), como pode ser visto no `useEffect` final do arquivo.
2.  **Abordagem de Refetch Total:** Quando uma mudança é detectada, o callback da inscrição executa uma função para **buscar novamente a lista completa de dados** daquela tabela. Por exemplo, uma mudança na tabela `transactions` aciona a função `fetchTransactions()`.
3.  **Substituição do Estado:** O resultado dessa nova busca (um array com todas as transações) substitui completamente o array antigo no estado do hook.
4.  **Re-renderização em Cascata:** Como o componente principal `App.tsx` utiliza este hook para gerenciar todo o seu estado de dados, a substituição completa do array de transações força uma re-renderização completa do `App.tsx` e de todos os seus componentes filhos.

**Trecho de código problemático em `useSupabaseData.tsx`:**

```javascript
// ...
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        // O problema está aqui: fetchTransactions() busca TUDO de novo.
        () => fetchTransactions().then(data => setState(prev => ({ ...prev, transactions: data })))
      )
// ...
```

---

### Solução Recomendada: Atualizações Granulares

A solução é modificar os callbacks das inscrições do Supabase para que eles processem as atualizações de forma "cirúrgica", alterando apenas o item que mudou no estado local, em vez de recarregar tudo.

O `payload` que o Supabase envia em cada evento de `postgres_changes` contém as informações necessárias para isso:
-   `eventType`: Informa se o evento foi um `INSERT`, `UPDATE` ou `DELETE`.
-   `new`: Contém o objeto do novo dado (para `INSERT` e `UPDATE`).
-   `old`: Contém os dados antigos, principalmente o `id` (para `DELETE`).

**Plano de Ação Detalhado:**

1.  **Modificar os Callbacks:** Para cada tabela monitorada (`transactions`, `accounts`, etc.) em `useSupabaseData.tsx`, o callback deve ser alterado para receber o `payload`.

2.  **Implementar Lógica por Evento:** Dentro do callback, implemente um `switch` ou `if/else` baseado no `payload.eventType`:

    *   **Caso `INSERT`:**
        *   Pegue o novo registro de `payload.new`.
        *   **Atenção:** Os campos do payload virão em `snake_case` (ex: `user_id`). É preciso convertê-los para `camelCase` (ex: `userId`) para serem compatíveis com os tipos da aplicação (ex: `Transaction`). Use as funções `fetch...` existentes como referência para a mapeamento correto.
        *   Atualize o estado adicionando o novo item ao início do array existente.
        *   **Exemplo para transações:**
            ```javascript
            (payload) => {
              if (payload.eventType === 'INSERT') {
                const newTx = mapSupabaseRecordToTransaction(payload.new); // Função de mapeamento a ser criada
                setState(prev => ({
                  ...prev,
                  transactions: [newTx, ...prev.transactions]
                }));
              }
              // ... outros eventos
            }
            ```

    *   **Caso `UPDATE`:**
        *   Pegue o registro atualizado de `payload.new`.
        *   Faça o mapeamento de `snake_case` para `camelCase`.
        *   Encontre o item correspondente no estado local pelo `id` e substitua-o.
        *   **Exemplo para transações:**
            ```javascript
            if (payload.eventType === 'UPDATE') {
              const updatedTx = mapSupabaseRecordToTransaction(payload.new);
              setState(prev => ({
                ...prev,
                transactions: prev.transactions.map(t => t.id === updatedTx.id ? updatedTx : t)
              }));
            }
            ```

    *   **Caso `DELETE`:**
        *   Pegue o `id` do registro de `payload.old`.
        *   Remova o item correspondente do estado local.
        *   **Exemplo para transações:**
            ```javascript
            if (payload.eventType === 'DELETE') {
              const oldTxId = payload.old.id;
              setState(prev => ({
                ...prev,
                transactions: prev.transactions.filter(t => t.id !== oldTxId)
              }));
            }
            ```

3.  **Consideração Especial para Transações:** A tabela `installments` (parcelas) tem uma relação com `transactions`. Uma mudança em `installments` deve atualizar a transação "pai" correspondente. A lógica atual que chama `fetchTransactions()` para isso é um fallback aceitável, mas uma solução ideal seria buscar apenas a transação afetada e suas novas parcelas, e então atualizá-la no estado. Se possível, implemente isso também.

4.  **Manter o `refetch()`:** A função `refetch()` exportada pelo hook e usada em vários lugares no `App.tsx` (após a submissão de um formulário, por exemplo) deve ser mantida. Ela serve como uma garantia de sincronização total após ações manuais do usuário. A refatoração deve focar apenas nos listeners de tempo real.

Ao final, as atualizações em tempo real devem parecer fluidas e instantâneas, sem causar a re-renderização de toda a aplicação e o fechamento de modais.
