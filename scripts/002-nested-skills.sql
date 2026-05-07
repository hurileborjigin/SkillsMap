-- 002-nested-skills.sql
--
-- Adds support for nested skill hierarchies. A skill can now have a parent
-- skill (also in the `skills` table) so users can build trees like:
--
--   Python
--   ├── Async I/O
--   ├── Typing
--   └── Packaging
--       └── uv
--
-- Top-level skills (the ones that hang directly off a category) keep
-- parent_skill_id = NULL.

alter table public.skills
  add column if not exists parent_skill_id uuid
    references public.skills(id) on delete cascade;

create index if not exists skills_parent_skill_id_idx
  on public.skills(parent_skill_id);

-- We already have an index on (category_id, position) for top-level ordering.
-- Add one on (parent_skill_id, position) so we can fetch ordered children of
-- a given skill efficiently.
create index if not exists skills_parent_position_idx
  on public.skills(parent_skill_id, position);
