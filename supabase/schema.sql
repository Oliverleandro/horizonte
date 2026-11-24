-- ==============================================================================
-- HORIZONTE - FINANÇAS FUTURAS: SCHEMA DO BANCO DE DADOS & POLÍTICAS RLS (SUPABASE)
-- ==============================================================================
-- Execute este script no SQL Editor do seu projeto Supabase (Dashboard > SQL Editor)

-- 1. TABELA DE PERFIS (Extensão dos dados de auth.users)
create table if not exists public.perfis (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  nome text,
  saldo_atual numeric(12, 2) default 0.00 not null,
  onboarding_concluido boolean default false not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABELA DE LANÇAMENTOS (Entradas, Saídas, Recorrentes e Parcelados)
create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  descricao text not null,
  valor numeric(12, 2) not null check (valor > 0),
  tipo text not null check (tipo in ('income', 'expense')),
  categoria text not null,
  recorrencia text not null check (recorrencia in ('once', 'monthly', 'installment')),
  data_inicio date not null,
  dia_do_mes integer check (dia_do_mes between 1 and 31),
  total_parcelas integer check (total_parcelas is null or total_parcelas > 0),
  valor_parcela numeric(12, 2) check (valor_parcela is null or valor_parcela > 0),
  parcela_atual integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABELA DE COFRINHOS (Metas de economia)
create table if not exists public.cofrinhos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  titulo text not null,
  valor_alvo numeric(12, 2) not null check (valor_alvo > 0),
  valor_atual numeric(12, 2) default 0.00 not null check (valor_atual >= 0),
  data_alvo date not null,
  categoria text default 'Reserva',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABELA DE MOVIMENTAÇÕES DE COFRINHOS (Depósitos e Resgates nos Cofrinhos)
create table if not exists public.movimentacoes_cofrinhos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  cofrinho_id uuid references public.cofrinhos(id) on delete cascade not null,
  valor numeric(12, 2) not null check (valor > 0),
  tipo text not null check (tipo in ('deposito', 'resgate')),
  data timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para alta performance nas consultas por usuário
create index if not exists idx_lancamentos_user_id on public.lancamentos(user_id);
create index if not exists idx_cofrinhos_user_id on public.cofrinhos(user_id);
create index if not exists idx_movimentacoes_cofrinhos_user_id on public.movimentacoes_cofrinhos(user_id);
create index if not exists idx_movimentacoes_cofrinho_id on public.movimentacoes_cofrinhos(cofrinho_id);

-- ==============================================================================
-- HABILITAÇÃO DO ROW LEVEL SECURITY (RLS) - SEGURANÇA TOTAL
-- Cada usuário só enxerga, insere, altera e deleta seus próprios dados
-- ==============================================================================

alter table public.perfis enable row level security;
alter table public.lancamentos enable row level security;
alter table public.cofrinhos enable row level security;
alter table public.movimentacoes_cofrinhos enable row level security;

-- Políticas para public.perfis
drop policy if exists "Usuários podem visualizar o próprio perfil" on public.perfis;
create policy "Usuários podem visualizar o próprio perfil"
  on public.perfis for select
  using (auth.uid() = id);

drop policy if exists "Usuários podem atualizar o próprio perfil" on public.perfis;
create policy "Usuários podem atualizar o próprio perfil"
  on public.perfis for update
  using (auth.uid() = id);

drop policy if exists "Usuários podem inserir o próprio perfil" on public.perfis;
create policy "Usuários podem inserir o próprio perfil"
  on public.perfis for insert
  with check (auth.uid() = id);

-- Políticas para public.lancamentos
drop policy if exists "Usuários podem gerenciar seus próprios lançamentos" on public.lancamentos;
create policy "Usuários podem gerenciar seus próprios lançamentos"
  on public.lancamentos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Políticas para public.cofrinhos
drop policy if exists "Usuários podem gerenciar seus próprios cofrinhos" on public.cofrinhos;
create policy "Usuários podem gerenciar seus próprios cofrinhos"
  on public.cofrinhos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Políticas para public.movimentacoes_cofrinhos
drop policy if exists "Usuários podem gerenciar movimentações de seus cofrinhos" on public.movimentacoes_cofrinhos;
create policy "Usuários podem gerenciar movimentações de seus cofrinhos"
  on public.movimentacoes_cofrinhos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==============================================================================
-- TRIGGER AUTOMÁTICO: CRIAÇÃO DO PERFIL AO CADASTRAR NOVO USUÁRIO
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis (id, email, nome, saldo_atual, onboarding_concluido)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    0.00,
    false
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- RPC 1: MOVIMENTAR COFRINHO EM TRANSAÇÃO ÚNICA (DEPÓSITO OU RESGATE)
-- ==============================================================================
create or replace function public.movimentar_cofrinho(
  p_cofrinho_id uuid,
  p_valor numeric,
  p_tipo text
)
returns public.cofrinhos as $$
declare
  v_cofrinho public.cofrinhos;
  v_novo_valor numeric;
begin
  if p_valor <= 0 then
    raise exception 'O valor da movimentação deve ser maior que zero.';
  end if;

  if p_tipo not in ('deposito', 'resgate') then
    raise exception 'Tipo inválido. Use deposito ou resgate.';
  end if;

  -- Seleciona e bloqueia a linha para evitar concorrência
  select * into v_cofrinho
  from public.cofrinhos
  where id = p_cofrinho_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Cofrinho não encontrado ou não pertence ao usuário.';
  end if;

  if p_tipo = 'deposito' then
    v_novo_valor := v_cofrinho.valor_atual + p_valor;
  else
    if v_cofrinho.valor_atual < p_valor then
      raise exception 'Saldo insuficiente no cofrinho para resgate.';
    end if;
    v_novo_valor := v_cofrinho.valor_atual - p_valor;
  end if;

  -- Atualiza o cofrinho
  update public.cofrinhos
  set valor_atual = v_novo_valor
  where id = p_cofrinho_id and user_id = auth.uid()
  returning * into v_cofrinho;

  -- Registra a movimentação
  insert into public.movimentacoes_cofrinhos (user_id, cofrinho_id, valor, tipo, data)
  values (auth.uid(), p_cofrinho_id, p_valor, p_tipo, timezone('utc'::text, now()));

  return v_cofrinho;
end;
$$ language plpgsql security definer set search_path = '';

-- ==============================================================================
-- RPC 2: EXCLUSÃO REAL E DEFINITIVA DA CONTA DO USUÁRIO
-- ==============================================================================
create or replace function public.delete_my_account()
returns boolean as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  -- Deleta o usuário da tabela auth.users. 
  -- Como todas as tabelas referenciam auth.users(id) ON DELETE CASCADE,
  -- perfis, lançamentos, cofrinhos e movimentações são limpos atomicamente.
  delete from auth.users where id = v_user_id;

  return true;
end;
$$ language plpgsql security definer set search_path = '';
