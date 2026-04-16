-- Restaurant booking demo schema (public access for demo)

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  cuisine text not null,
  price_level int not null default 2,
  rating numeric(2, 1) not null default 4.3,
  created_at timestamptz not null default now()
);

create index if not exists idx_restaurants_city on restaurants (city);
create index if not exists idx_restaurants_cuisine on restaurants (cuisine);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  contact_name text not null,
  contact_phone text,
  date date not null,
  time time not null,
  guests int not null,
  note text,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);

create index if not exists idx_reservations_restaurant_id on reservations (restaurant_id);
create index if not exists idx_reservations_created_at on reservations (created_at desc);

alter table restaurants enable row level security;
alter table reservations enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'restaurants' and policyname = 'Public read restaurants'
  ) then
    create policy "Public read restaurants" on restaurants for select using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'reservations' and policyname = 'Public insert reservations'
  ) then
    create policy "Public insert reservations" on reservations for insert with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'reservations' and policyname = 'Public read reservations'
  ) then
    create policy "Public read reservations" on reservations for select using (true);
  end if;
end $$;

insert into restaurants (name, city, cuisine, price_level, rating)
select * from (
  values
    ('Bistro Lumiere', 'Shanghai', 'French', 3, 4.6),
    ('Sichuan House', 'Shanghai', 'Sichuan', 2, 4.5),
    ('Sakura Sushi', 'Shanghai', 'Japanese', 3, 4.4),
    ('Trattoria Verde', 'Beijing', 'Italian', 3, 4.6),
    ('Noodle Atelier', 'Beijing', 'Chinese', 2, 4.3),
    ('Harbor Grill', 'Shenzhen', 'Seafood', 3, 4.5),
    ('Dim Sum Corner', 'Shenzhen', 'Cantonese', 2, 4.4),
    ('Green Garden', 'Hangzhou', 'Vegetarian', 2, 4.2)
) as seed (name, city, cuisine, price_level, rating)
where not exists (select 1 from restaurants);

