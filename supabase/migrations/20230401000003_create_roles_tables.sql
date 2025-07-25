create table roles (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null
);

create table role_permissions (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  role_id bigint references roles(id),
  permission text not null
);

alter table users add column role_id bigint references roles(id);
