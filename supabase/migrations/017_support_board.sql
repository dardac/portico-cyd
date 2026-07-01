-- Cartelera de apoyo: publicaciones de necesidad u oferta de ayuda

create table support_board_posts (
  id uuid primary key default gen_random_uuid(),
  post_type text not null,
  category text not null,
  apartment_code text not null,
  description text not null,
  contact_name text not null,
  contact_phone text not null,
  status text not null default 'open',
  created_by_apartment_id uuid references apartments (id) on delete set null,
  created_by_admin_id uuid references admin_users (id) on delete set null,
  attended_at timestamptz,
  attended_by_admin_id uuid references admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (post_type in ('need', 'offer')),
  check (
    category in (
      'potable_water',
      'food',
      'first_aid',
      'power',
      'shelter',
      'other'
    )
  ),
  check (status in ('open', 'attended'))
);

create index support_board_posts_status_created_idx
  on support_board_posts (status, created_at desc);

grant select, insert, update, delete on table public.support_board_posts to service_role;
