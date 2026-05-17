create table if not exists signalements (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  latitude float not null,
  longitude float not null,
  niveau text not null check (niveau in ('infeste', 'beaucoup', 'peu', 'aucun')),
  created_at timestamp with time zone default now()
);

alter table signalements enable row level security;

create policy "Lecture publique" on signalements
  for select using (true);

create policy "Insertion publique" on signalements
  for insert with check (true);
