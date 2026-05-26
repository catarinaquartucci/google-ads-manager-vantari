-- Enable UUID
create extension if not exists "uuid-ossp";

-- OAuth tokens
create table if not exists oauth_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null unique,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  customer_id text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User settings
create table if not exists user_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null unique,
  customer_id text,
  manager_customer_id text,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto rules
create table if not exists auto_rules (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  name text not null,
  condition_metric text not null,
  condition_operator text not null,
  condition_value numeric not null,
  action text not null,
  action_value numeric,
  campaign_ids text[],
  is_active boolean default true,
  last_triggered_at timestamptz,
  created_at timestamptz default now()
);

-- Rule logs
create table if not exists rule_logs (
  id uuid default uuid_generate_v4() primary key,
  rule_id uuid references auto_rules(id) on delete cascade,
  triggered_at timestamptz default now(),
  campaigns_affected text[] default '{}',
  action_taken text not null,
  details jsonb default '{}'
);

-- Indexes
create index if not exists idx_oauth_tokens_user_id on oauth_tokens(user_id);
create index if not exists idx_user_settings_user_id on user_settings(user_id);
create index if not exists idx_auto_rules_user_id on auto_rules(user_id);
create index if not exists idx_auto_rules_is_active on auto_rules(is_active);
create index if not exists idx_rule_logs_rule_id on rule_logs(rule_id);
create index if not exists idx_rule_logs_triggered_at on rule_logs(triggered_at desc);

-- RLS
alter table oauth_tokens enable row level security;
alter table user_settings enable row level security;
alter table auto_rules enable row level security;
alter table rule_logs enable row level security;

-- Service role can do anything (for Edge Functions)
create policy "service_role_all_oauth" on oauth_tokens for all to service_role using (true);
create policy "service_role_all_settings" on user_settings for all to service_role using (true);
create policy "service_role_all_rules" on auto_rules for all to service_role using (true);
create policy "service_role_all_logs" on rule_logs for all to service_role using (true);

-- Anon can read/write own data (client-side for rules)
create policy "anon_select_rules" on auto_rules for select to anon using (true);
create policy "anon_insert_rules" on auto_rules for insert to anon with check (true);
create policy "anon_update_rules" on auto_rules for update to anon using (true);
create policy "anon_delete_rules" on auto_rules for delete to anon using (true);
create policy "anon_select_logs" on rule_logs for select to anon using (true);
create policy "anon_select_settings" on user_settings for select to anon using (true);
create policy "anon_insert_settings" on user_settings for insert to anon with check (true);
create policy "anon_update_settings" on user_settings for update to anon using (true);
