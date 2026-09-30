CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  contact_email text,
  contact_phone text,
  service_area text NOT NULL DEFAULT '',
  zip_codes text[] NOT NULL DEFAULT '{}',
  available_days text[] NOT NULL DEFAULT '{mon,tue,wed,thu,fri}',
  time_windows text[] NOT NULL DEFAULT '{}',
  lead_days integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active providers public read" ON public.providers FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "admins manage providers" ON public.providers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER t8 BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.provider_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price numeric,
  price_note text,
  enabled boolean NOT NULL DEFAULT true,
  recurring_enabled boolean NOT NULL DEFAULT false,
  allowed_frequencies care_frequency[] NOT NULL DEFAULT '{monthly}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, service_id)
);
GRANT SELECT ON public.provider_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_services TO authenticated;
GRANT ALL ON public.provider_services TO service_role;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enabled provider services public read" ON public.provider_services FOR SELECT TO anon, authenticated
  USING (enabled = true AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.active = true));
CREATE POLICY "admins manage provider services" ON public.provider_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER t9 BEFORE UPDATE ON public.provider_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.service_requests
  ADD COLUMN booking_source text NOT NULL DEFAULT 'airground',
  ADD COLUMN provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  ADD COLUMN provider_slug text,
  ADD COLUMN quoted_price numeric;
ALTER TABLE public.care_plans
  ADD COLUMN booking_source text NOT NULL DEFAULT 'airground',
  ADD COLUMN provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  ADD COLUMN provider_slug text;
ALTER TABLE public.profiles
  ADD COLUMN acquisition_source text NOT NULL DEFAULT 'airground',
  ADD COLUMN acquired_provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL;