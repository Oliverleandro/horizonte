# Horizonte - Finanças Futuras

O **Horizonte** é um aplicativo web *mobile-first* focado em planejamento financeiro **futuro**. Diferente de gerenciadores tradicionais que apenas registram despesas do passado, o Horizonte projeta seu saldo bancário para os próximos **3, 6 ou 12 meses**, permitindo antecipar meses no vermelho e planejar compras parceladas sem aperto.

---

## 🎯 Diferenciais e Funcionalidades

1. **Dashboard com Projeção Futura**
   - Saldo atual ajustável a qualquer momento com cálculo preciso em centavos.
   - Resumo em uma frase no topo ("Você termina o mês com sobra de R$ X" ou alerta em vermelho).
   - Gráfico de linha interativo (Recharts) com projeção do saldo para 3, 6 ou 12 meses.
   - Detecção antecipada do primeiro dia em que a conta pode ficar negativa.
   - Lista dos próximos 5 vencimentos.

2. **Lançamentos Simples e Transparentes**
   - Botão flutuante (+) visível em todas as telas.
   - Cadastro passo a passo com teclado numérico e categorias visuais.
   - Frequências: **Só uma vez**, **Todo mês (fixo)** e **Parcelado no cartão**.
   - Tratamento de valores com `parseBRL` (suporta `1.500,50`, `1500,50`, `1500.50` e formatos com moeda).

3. **Simulador "E se?"**
   - Simulação instantânea de compras à vista, compras parceladas ou economia mensal.
   - Gráfico comparativo: linha do saldo atual versus linha do saldo simulado.
   - Opção de salvar a simulação diretamente na lista de lançamentos com 1 clique.

4. **Metas & Sonhos (Cofrinhos)**
   - Definição de valor alvo e prazo limite.
   - Cálculo automático de quanto guardar por mês.
   - Checagem automática contra a sobra média mensal.
   - Movimentações de **Depósito** e **Resgate** com validação de saldo e transação atômica via RPC.

5. **Autenticação e Nuvem com Supabase**
   - Login por e-mail/senha e Google OAuth via Supabase Auth.
   - Recuperação de senha com detecção de evento `PASSWORD_RECOVERY` e tela dedicada para nova senha (mínimo 8 caracteres).
   - Exclusão real e definitiva da conta e dados via RPC `delete_my_account` com limpeza em cascata.
   - Row Level Security (RLS) habilitado em 100% das tabelas.

---

## 🛠️ Tecnologias

- **Frontend**: React 19 (TypeScript), Tailwind CSS v4, Lucide React, Recharts
- **Build Tool**: Vite (com `envPrefix: ['VITE_']`)
- **Backend / Nuvem**: Supabase (PostgreSQL, Auth, Row Level Security, RPC Functions)
- **Cálculos Financeiros**: `src/utils/money.ts` (operações sem perda de precisão flutuante)

---

## 🔐 Configuração do Banco de Dados (Supabase)

Para conectar seu próprio projeto Supabase:

1. Acesse o [Supabase](https://supabase.com/) e crie um novo projeto.
2. No menu lateral, acesse **SQL Editor** e execute o script localizado em `supabase/schema.sql`.
3. O script cria:
   - Tabela `public.perfis`
   - Tabela `public.lancamentos`
   - Tabela `public.cofrinhos`
   - Tabela `public.movimentacoes_cofrinhos`
   - Políticas de **Row Level Security (RLS)** para isolamento dos dados de cada usuário (`auth.uid() = user_id`)
   - Função RPC `movimentar_cofrinho` (atualização atômica de saldo e histórico)
   - Função RPC `delete_my_account` (exclusão de conta em `auth.users` com `security definer`)
4. Em **Project Settings > API**, copie:
   - **Project URL**
   - **anon / public key**
5. Configure as variáveis de ambiente no arquivo `.env` (ou no painel de Secrets):
   ```env
   VITE_SUPABASE_URL="https://sua-url-aqui.supabase.co"
   VITE_SUPABASE_ANON_KEY="sua-anon-key-aqui"
   ```

---

## 💻 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Validar TypeScript
npx tsc --noEmit

# Compilar para produção
npm run build
```
