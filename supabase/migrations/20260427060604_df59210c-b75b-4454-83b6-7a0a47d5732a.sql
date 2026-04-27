REVOKE ALL ON FUNCTION public.get_email_for_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_for_username(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_email_for_username(text) TO authenticated;