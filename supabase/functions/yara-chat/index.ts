import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    
    console.log('Received messages:', messages);

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

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
            Suas responsabilidades incluem:
            - Ajudar usuários a registrar transações financeiras de forma conversacional
            - Entender linguagem natural como "paguei R$50 no almoço" ou "recebi salário de R$3000"
            - Ser prestativa, clara e usar uma linguagem brasileira natural
            - Confirmar as transações antes de registrá-las
            
            Quando o usuário mencionar uma transação, extraia:
            - Valor (em reais)
            - Tipo (despesa ou receita)
            - Descrição/categoria
            - Data (se mencionada, senão assume hoje)
            
            Seja breve e objetiva nas respostas.` 
          },
          ...messages
        ],
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
    const assistantMessage = data.choices[0].message.content;
    
    console.log('Assistant response:', assistantMessage);

    return new Response(
      JSON.stringify({ message: assistantMessage }), 
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
