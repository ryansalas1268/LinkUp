CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  base_username text;
  final_username text;
  counter int := 0;
begin
  -- Lowercase FIRST, then strip invalid chars (otherwise uppercase letters get stripped before being lowered)
  base_username := regexp_replace(lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))), '[^a-z0-9_]', '', 'g');
  if base_username = '' then base_username := 'user'; end if;
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    counter := counter + 1;
    final_username := base_username || counter::text;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', final_username),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$function$;

-- Fix the existing affected profile
UPDATE public.profiles SET username = 'ryansalas25' WHERE id = '9296499d-04c8-49dc-989f-2b8a10607351' AND username = 'yanalas25';