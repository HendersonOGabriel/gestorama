// @ts-ignore: Deno types
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore: Deno types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
// @ts-ignore: Deno types
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// @ts-ignore: Deno runtime
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
// @ts-ignore: Deno runtime
const supabaseUrl = Deno.env.get('SUPABASE_URL');
// @ts-ignore: Deno runtime
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// @ts-ignore: Deno runtime
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  fileContent: z.string().min(1).max(100000), // Max 100kb
});

const transactionArgsSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.number().positive().max(100000), // Reasonable transaction limit
  is_income: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const openAIResponseSchema = z.object({
    transactions: z.array(transactionArgsSchema),
    errors: z.array(z.string()).optional(),
});


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const validationResult = requestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { fileContent } = validationResult.data;
    const authHeader = req.headers.get('Authorization');

    if (!openAIApiKey) throw new Error('OPENAI_API_KEY not configured');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // --- Sanitize input to prevent prompt injection ---
    const sanitizedContent = fileContent
      .slice(0, 50000)  // Hard limit beyond schema validation
      .replace(/ignore\s+(all\s+)?(previous\s+)?instructions?/gi, '[filtered]')
      .replace(/system\s+prompt/gi, '[filtered]')
      .replace(/you\s+are\s+(now|a)/gi, '[filtered]')
      .trim();

    // --- OpenAI Call ---
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
            content: `Você é um assistente de extração de dados para o app de finanças Gestorama. Sua tarefa é analisar o conteúdo de um arquivo (CSV, extrato, etc.) e extraí-lo para um formato JSON.

            Regras:
            - Identifique transações com data, descrição e valor.
            - Determine se é uma receita (is_income: true) ou despesa (is_income: false). Valores negativos são sempre despesas.
            - A data DEVE estar no formato YYYY-MM-DD.
            - O valor (amount) DEVE ser um número positivo.
            - Ignore cabeçalhos, linhas de resumo ou linhas que não pareçam ser uma transação.
            - Se não conseguir analisar uma linha, adicione uma breve descrição do problema no array 'errors'.

            Sua resposta DEVE ser um objeto JSON com a seguinte estrutura:
            {
              "transactions": [
                { "description": "...", "amount": 123.45, "date": "YYYY-MM-DD", "is_income": false },
                ...
              ],
              "errors": [ "Não foi possível analisar a linha: ...", ... ]
            }`
          },
          { role: 'user', content: sanitizedContent }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const parsedContent = JSON.parse(data.choices[0].message.content);

    const validation = openAIResponseSchema.safeParse(parsedContent);
    if (!validation.success) {
        console.error("OpenAI response validation failed");
        throw new Error("A IA retornou uma resposta em um formato inesperado.");
    }
    const { transactions, errors = [] } = validation.data;

    // --- Database Operations ---
    const { data: accounts } = await supabase.from('accounts').select('id').eq('user_id', user.id).order('is_default', { ascending: false }).limit(1);
    if (!accounts || accounts.length === 0) {
      throw new Error('Nenhuma conta padrão encontrada para o usuário.');
    }
    const defaultAccountId = accounts[0].id;

    let successCount = 0;

    for (const tx of transactions) {
        try {
            const { data: transaction, error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    description: tx.description,
                    amount: tx.amount,
                    date: tx.date,
                    is_income: tx.is_income,
                    type: 'cash', // Assume cash for simplicity on import
                    installments: 1,
                    account_id: defaultAccountId,
                    paid: true
                })
                .select()
                .single();

            if (txError) throw txError;

            const { error: instError } = await supabase
                .from('installments')
                .insert({
                    transaction_id: transaction.id,
                    installment_number: 1,
                    amount: tx.amount,
                    posting_date: tx.date,
                    paid: true,
                    payment_date: tx.date,
                    paid_amount: tx.amount
                });

            if (instError) {
                // Rollback transaction if installment fails
                await supabase.from('transactions').delete().eq('id', transaction.id);
                throw instError;
            }

            successCount++;
        } catch(dbError) {
            console.error('Error saving transaction:', dbError);
            errors.push('Erro ao salvar uma das transações');
        }
    }

    return new Response(
      JSON.stringify({ successCount, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in yara-import function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro ao processar arquivo' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
