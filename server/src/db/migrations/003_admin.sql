-- ============================================
-- Migration 003: Admin system
-- ============================================

create table if not exists admins (
   id            serial primary key,
   username      varchar(50) unique not null,
   password_hash text not null,
   created_at    timestamptz default now()
);

create index if not exists idx_admins_username on
   admins (
      username
   );