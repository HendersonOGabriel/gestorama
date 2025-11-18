import { z } from 'zod';

// Account validation schema
export const accountSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  balance: z.number()
    .min(-1000000000, 'Valor muito baixo')
    .max(1000000000, 'Valor muito alto')
});

// Card validation schema
export const cardSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  limitAmount: z.number()
    .min(0, 'Limite não pode ser negativo')
    .max(1000000000, 'Limite muito alto'),
  closingDay: z.number()
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31'),
  dueDay: z.number()
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31')
});

// Transaction validation schema
export const transactionSchema = z.object({
  description: z.string()
    .trim()
    .min(1, 'Descrição é obrigatória')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  amount: z.number()
    .positive('Valor deve ser positivo')
    .max(1000000000, 'Valor muito alto'),
  date: z.string()
    .min(1, 'Data é obrigatória'),
  person: z.string()
    .trim()
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional()
});

// Category validation schema
export const categorySchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  group: z.string()
    .trim()
    .max(100, 'Grupo deve ter no máximo 100 caracteres')
    .optional()
});

// Transfer validation schema
export const transferSchema = z.object({
  amount: z.number()
    .positive('Valor deve ser positivo')
    .max(1000000000, 'Valor muito alto'),
  date: z.string()
    .min(1, 'Data é obrigatória'),
  fromAccount: z.string()
    .min(1, 'Conta de origem é obrigatória'),
  toAccount: z.string()
    .min(1, 'Conta de destino é obrigatória')
}).refine((data) => data.fromAccount !== data.toAccount, {
  message: 'Contas de origem e destino devem ser diferentes',
  path: ['toAccount']
});

// Recurring item validation schema
export const recurringSchema = z.object({
  desc: z.string()
    .trim()
    .min(1, 'Descrição é obrigatória')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  amount: z.number()
    .positive('Valor deve ser positivo')
    .max(1000000000, 'Valor muito alto'),
  day: z.number()
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31')
});

// Password validation schema
export const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número')
    .regex(/[^a-zA-Z0-9]/, 'Senha deve conter ao menos um caractere especial'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});
