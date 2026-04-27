-- Delete Ryan Salas's account so the email can be re-used for a fresh signup demo.
-- Events, tasks, expenses, etc. they created remain in the database (no FK to auth.users).
DELETE FROM public.profiles WHERE id = '7fc8b61a-eae2-4516-b9c7-0e11ea78147a';
DELETE FROM auth.users WHERE id = '7fc8b61a-eae2-4516-b9c7-0e11ea78147a';