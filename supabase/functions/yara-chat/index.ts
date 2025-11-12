// @ts-ignore: Deno types
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore: Deno types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

// @ts-ignore: Deno runtime
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
// @ts-ignore: Deno runtime
const supabaseUrl = Deno.env.get('SUPABASE_URL');
// @ts-ignore: Deno runtime
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    console.log('Received messages:', messages);

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Define tools for OpenAI function calling
    const tools = [
      {
        type: 'function',
        function: {
          name: 'add_transaction',
          description: 'Adiciona uma transação financeira (despesa ou receita) ao sistema do usuário',
          parameters: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Descrição da transação (ex: "Almoço no iFood", "Salário")'
              },
              amount: {
                type: 'number',
                description: 'Valor da transação em reais'
              },
              is_income: {
                type: 'boolean',
                description: 'true para receita, false para despesa'
              },
              type: {
                type: 'string',
                enum: ['card', 'cash', 'prazo'],
                description: 'Tipo de pagamento: "card" (cartão de crédito), "cash" (à vista/débito), "prazo" (boleto/carnê)'
              },
              installments: {
                type: 'number',
                description: 'Número de parcelas (padrão 1 para à vista)',
                default: 1
              },
              date: {
                type: 'string',
                description: 'Data da transação no formato YYYY-MM-DD (padrão: hoje)'
              },
              person: {
                type: 'string',
                description: 'Nome da pessoa/empresa (apenas para tipo "prazo")'
              }
            },
            required: ['description', 'amount', 'is_income', 'type']
          }
        }
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `Você é a Yara, uma assistente financeira inteligente e amigável do app Gestorama. 
            
            Suas responsabilidades:
            - Ajudar usuários a registrar transações financeiras de forma conversacional
            - Entender linguagem natural como "paguei R$50 no almoço" ou "recebi salário de R$3000"
            - Ser prestativa, clara e usar uma linguagem brasileira natural
            - SEMPRE confirmar com o usuário antes de adicionar uma transação
            
            Quando o usuário mencionar uma transação:
            1. Extraia as informações (valor, tipo, descrição, data)
            2. Confirme os detalhes com o usuário
            3. SOMENTE depois da confirmação, use a função add_transaction
            
            Tipos de pagamento:
            - "card": Cartão de crédito (pode ter parcelas)
            - "cash": À vista ou débito (sempre 1 parcela)
            - "prazo": Boleto ou carnê (requer nome da pessoa/empresa)
            
            Seja breve e objetiva. Use a função apenas após confirmação explícita do usuário.` 
          },
          ...messages
        ],
        tools,
        tool_choice: 'auto',
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;
    
    console.log('Assistant response:', assistantMessage);

    // Check if the assistant wants to call a function
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log('Function call:', functionName, functionArgs);

      if (functionName === 'add_transaction') {
        // Get user's default account and card
        const { data: accounts } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .limit(1);

        const { data: cards } = await supabase
          .from('cards')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .limit(1);

        if (!accounts || accounts.length === 0) {
          return new Response(
            JSON.stringify({ 
              message: 'Você ainda não tem nenhuma conta cadastrada. Por favor, cadastre uma conta primeiro nas configurações.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const defaultAccount = accounts[0];
        const defaultCard = cards && cards.length > 0 ? cards[0] : null;

        // Create transaction
        const transactionDate = functionArgs.date || new Date().toISOString().split('T')[0];
        const installments = functionArgs.installments || 1;
        const amount = functionArgs.amount;
        const isCardExpense = functionArgs.type === 'card' && !functionArgs.is_income;

        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            description: functionArgs.description,
            amount: amount,
            date: transactionDate,
            is_income: functionArgs.is_income,
            type: functionArgs.type,
            installments: installments,
            account_id: defaultAccount.id,
            card_id: isCardExpense && defaultCard ? defaultCard.id : null,
            person: functionArgs.type === 'prazo' ? functionArgs.person : null,
            paid: functionArgs.is_income || functionArgs.type === 'cash'
          })
          .select()
          .single();

        if (txError) {
          console.error('Error creating transaction:', txError);
          return new Response(
            JSON.stringify({ 
              message: 'Desculpe, houve um erro ao adicionar a transação. Tente novamente.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create installments
        const installmentAmount = amount / installments;
        const installmentsData = [];
        
        for (let i = 0; i < installments; i++) {
          const postingDate = new Date(transactionDate);
          postingDate.setMonth(postingDate.getMonth() + i);
          
          installmentsData.push({
            transaction_id: transaction.id,
            installment_number: i + 1,
            amount: installmentAmount,
            posting_date: postingDate.toISOString().split('T')[0],
            paid: functionArgs.is_income || functionArgs.type === 'cash',
            payment_date: functionArgs.is_income || functionArgs.type === 'cash' ? transactionDate : null,
            paid_amount: functionArgs.is_income || functionArgs.type === 'cash' ? installmentAmount : null
          });
        }

        const { error: instError } = await supabase
          .from('installments')
          .insert(installmentsData);

        if (instError) {
          console.error('Error creating installments:', instError);
          // Delete the transaction if installments failed
          await supabase.from('transactions').delete().eq('id', transaction.id);
          return new Response(
            JSON.stringify({ 
              message: 'Desculpe, houve um erro ao adicionar a transação. Tente novamente.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            message: `✅ Transação adicionada com sucesso!\n\n💰 ${functionArgs.description}\n${functionArgs.is_income ? '📈 Receita' : '📉 Despesa'}: R$ ${amount.toFixed(2)}${installments > 1 ? ` em ${installments}x` : ''}\n📅 Data: ${new Date(transactionDate).toLocaleDateString('pt-BR')}\n💳 ${functionArgs.type === 'card' ? 'Cartão de Crédito' : functionArgs.type === 'cash' ? 'À Vista/Débito' : 'A Prazo'}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Return regular message if no function call
    return new Response(
      JSON.stringify({ message: assistantMessage.content || "Desculpe, não consegui processar sua mensagem." }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in yara-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao processar mensagem',
        message: 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
