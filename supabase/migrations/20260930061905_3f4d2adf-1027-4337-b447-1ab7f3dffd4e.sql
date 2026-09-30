CREATE TABLE public.provider_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_members TO authenticated;
GRANT ALL ON public.provider_members TO service_role;
ALTER TABLE public.provider_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage provider members" ON public.provider_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "members read own membership" ON public.provider_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_provider_member(_provider_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.provider_members WHERE provider_id = _provider_id AND user_id = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.is_provider_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_provider_member(uuid) TO authenticated;

CREATE POLICY "members read own provider" ON public.providers FOR SELECT TO authenticated
  USING (public.is_provider_member(id));
CREATE POLICY "members read own provider services" ON public.provider_services FOR SELECT TO authenticated
  USING (public.is_provider_member(provider_id));