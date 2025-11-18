import { supabase } from '../src/integrations/supabase/client';
import { Tables } from '../src/integrations/supabase/types';

type Gamification = Tables<'gamification'>;

// Definição dos níveis e XP necessário para alcançá-los
export const LEVELS = [
  { level: 1, xpRequired: 0, name: 'Novato(a) Financeiro(a)' },
  { level: 2, xpRequired: 150, name: 'Aprendiz das Contas' },
  { level: 3, xpRequired: 400, name: 'Iniciado(a) em Orçamentos' },
  { level: 4, xpRequired: 800, name: 'Estrategista Financeiro(a)' },
  { level: 5, xpRequired: 1500, name: 'Mestre das Finanças' },
  { level: 6, xpRequired: 2500, name: 'Sábio(a) Monetário(a)' },
  { level: 7, xpRequired: 4000, name: 'Visionário(a) da Riqueza' },
  { level: 8, xpRequired: 6000, name: 'Lenda da Prosperidade' },
  { level: 9, xpRequired: 8500, name: 'Ícone da Independência Financeira' },
  { level: 10, xpRequired: 12000, name: 'Magnata das Finanças Pessoais' },
];

// Constantes para os valores de XP
export const XP_VALUES = {
  DAILY_LOGIN: 5,
  ADD_TRANSACTION: 10,
  ADD_ACCOUNT: 25,
  ADD_RECURRING: 75,
  ADD_CARD: 50,
  CREATE_BUDGET: 100,
  CREATE_GOAL: 100,
  WITHIN_BUDGET_MONTH: 250,
  INCREASED_SAVINGS: 300,
  ACHIEVE_GOAL: 500,
};

/**
 * Adiciona XP para um usuário e lida com o level up.
 * @param userId - O ID do usuário.
 * @param xpToAdd - A quantidade de XP a ser adicionada.
 * @returns - Um objeto indicando se o usuário subiu de nível e o novo estado de gamificação.
 */
export async function addXp(
  userId: string,
  xpToAdd: number,
  additionalUpdates: Partial<Omit<Gamification, 'user_id' | 'id'>> = {}
): Promise<{ leveledUp: boolean; newGamificationData: Gamification | null }> {
  if (!userId || xpToAdd < 0) { // Allow 0 xp for updates without xp change
    return { leveledUp: false, newGamificationData: null };
  }

  // 1. Fetch current gamification state
  const { data: currentGamification, error: fetchError } = await supabase
    .from('gamification')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError || !currentGamification) {
    console.error('Error fetching gamification data:', fetchError?.message);
    return { leveledUp: false, newGamificationData: null };
  }

  // 2. Calculate new XP and handle level ups
  const newXp = currentGamification.xp + xpToAdd;
  let newLevel = currentGamification.level;
  let leveledUp = false;

  let nextLevelIndex = LEVELS.findIndex(l => l.level === newLevel + 1);

  while (nextLevelIndex !== -1 && newXp >= LEVELS[nextLevelIndex].xpRequired) {
    newLevel = LEVELS[nextLevelIndex].level;
    leveledUp = true;
    nextLevelIndex = LEVELS.findIndex(l => l.level === newLevel + 1);
  }

  const xpForNextLevel = nextLevelIndex !== -1 ? LEVELS[nextLevelIndex].xpRequired : (LEVELS.find(l=> l.level === newLevel)?.xpRequired || newXp);

  // 3. Update the database if anything changed
  const hasXpChanged = newXp !== currentGamification.xp;
  const hasUpdates = Object.keys(additionalUpdates).length > 0;

  if (hasXpChanged || leveledUp || hasUpdates) {
    const updatePayload = {
      ...additionalUpdates,
      xp: newXp,
      level: newLevel,
      xp_to_next_level: xpForNextLevel,
    };

    const { data: updatedGamification, error: updateError } = await supabase
      .from('gamification')
      .update(updatePayload)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating gamification data:', updateError.message);
      return { leveledUp: false, newGamificationData: null };
    }

    return { leveledUp, newGamificationData: updatedGamification };
  }

  return { leveledUp: false, newGamificationData: currentGamification };
}

/**
 * Retorna o nome do nível com base no número do nível.
 * @param level - O número do nível.
 * @returns - O nome do nível ou uma string vazia.
 */
export function getLevelName(level: number): string {
  const levelInfo = LEVELS.find(l => l.level === level);
  return levelInfo ? levelInfo.name : 'Nível Desconhecido';
}

/**
 * Calcula o progresso de XP do usuário dentro do nível atual.
 * @param gamification - O estado de gamificação do usuário.
 * @returns - Um objeto com o progresso percentual, o XP do nível atual e o XP do próximo nível.
 */
export function calculateProgress(gamification: Gamification): { progress: number; currentLevelXp: number; nextLevelXp: number } {
  const currentLevel = LEVELS.find(l => l.level === gamification.level);
  const nextLevel = LEVELS.find(l => l.level === gamification.level + 1);

  if (!currentLevel) {
    return { progress: 0, currentLevelXp: 0, nextLevelXp: 100 };
  }

  const currentLevelXp = currentLevel.xpRequired;
  const nextLevelXp = nextLevel ? nextLevel.xpRequired : currentLevelXp; // Se for o último nível

  if (nextLevelXp === currentLevelXp) {
    return { progress: 100, currentLevelXp, nextLevelXp };
  }

  const xpInCurrentLevel = gamification.xp - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;

  const progress = Math.max(0, Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100));

  return { progress, currentLevelXp, nextLevelXp };
}

/**
 * Verifica se o usuário se manteve dentro do orçamento no mês anterior e concede XP se a meta foi atingida.
 * @param userId - O ID do usuário.
 * @param gamificationData - Os dados atuais de gamificação do usuário.
 * @returns - A promessa de uma possível atualização nos dados de gamificação.
 */
export async function checkAndAwardMonthlyBudgetXp(userId: string, gamificationData: Gamification): Promise<Gamification | null> {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}`;

  // Buscar orçamentos e transações do mês anterior
  const { data: budgets, error: budgetError } = await supabase
    .from('budgets')
    .select('category_id, amount')
    .eq('user_id', userId)
    .eq('month', lastMonthKey);

  if (budgetError || !budgets || budgets.length === 0) {
    // Sem orçamentos definidos para o mês, não há o que checar.
    return null;
  }

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('category_id, amount, is_income')
    .eq('user_id', userId)
    .gte('date', `${lastMonthKey}-01`)
    .lte('date', `${lastMonthKey}-31`);

  if (txError) {
    console.error("Erro ao buscar transações para verificação de orçamento:", txError);
    return null;
  }

  // 3. Calcular gastos por categoria
  const expensesByCategory = transactions
    .filter(t => !t.is_income && t.category_id)
    .reduce((acc, t) => {
      acc[t.category_id!] = (acc[t.category_id!] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // 4. Verificar se todos os orçamentos foram cumpridos
  const allBudgetsMet = budgets.every(budget => {
    const spent = expensesByCategory[budget.category_id] || 0;
    return spent <= budget.amount;
  });

  // 5. Conceder XP e atualizar o estado
  if (allBudgetsMet) {
    const { newGamificationData } = await addXp(userId, XP_VALUES.WITHIN_BUDGET_MONTH);
    if (newGamificationData) {
      return newGamificationData;
    }
  }

  return null;
}

/**
 * Verifica se o usuário aumentou a economia no mês anterior em comparação com o retrasado.
 * Concede XP se a meta foi atingida. A verificação é feita apenas uma vez por mês.
 * @param userId - O ID do usuário.
 * @param gamificationData - Os dados atuais de gamificação do usuário.
 * @returns - A promessa de uma possível atualização nos dados de gamificação.
 */
export async function checkAndAwardSavingsIncreaseXp(userId: string, gamificationData: Gamification): Promise<Gamification | null> {
  const now = new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthBeforeLastDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const lastMonthKey = `${lastMonthDate.getFullYear()}-${(lastMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const monthBeforeLastKey = `${monthBeforeLastDate.getFullYear()}-${(monthBeforeLastDate.getMonth() + 1).toString().padStart(2, '0')}`;

  // Buscar transações dos últimos dois meses completos
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('date, amount, is_income')
    .eq('user_id', userId)
    .gte('date', `${monthBeforeLastKey}-01`)
    .lte('date', `${lastMonthKey}-31`);

  if (error) {
    console.error("Erro ao buscar transações para verificação de economia:", error);
    return null;
  }

  // Função auxiliar para calcular a economia de um mês
  const calculateSavings = (monthKey: string) => {
    const monthTransactions = transactions.filter(t => t.date.startsWith(monthKey));
    return monthTransactions.reduce((acc, t) => {
      return acc + (t.is_income ? t.amount : -t.amount);
    }, 0);
  };

  const lastMonthSavings = calculateSavings(lastMonthKey);
  const monthBeforeLastSavings = calculateSavings(monthBeforeLastKey);

  // Comparar a economia e conceder XP se houver aumento
  if (lastMonthSavings > monthBeforeLastSavings) {
    const { newGamificationData } = await addXp(userId, XP_VALUES.INCREASED_SAVINGS);
    if (newGamificationData) {
      return newGamificationData;
    }
  }

  return null;
}

/**
 * Concede XP de login diário.
 * @param userId - O ID do usuário.
 * @param gamificationData - Os dados atuais de gamificação do usuário.
 * @returns - A promessa de dados de gamificação atualizados ou nulo se nenhum XP for concedido.
 */
export async function grantDailyLoginXp(userId: string): Promise<{ newGamificationData: Tables<'gamification'> } | null> {
  // Grant daily login XP (simplified - no date tracking)
  const result = await addXp(userId, XP_VALUES.DAILY_LOGIN);
  return result;
}
