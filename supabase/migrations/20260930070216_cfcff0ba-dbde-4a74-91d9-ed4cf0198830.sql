-- Directory visibility on providers (existing active providers become visible; new applications start hidden)
ALTER TABLE public.providers ADD COLUMN directory_visible boolean NOT NULL DEFAULT false;
UPDATE public.providers SET directory_visible = true WHERE active = true;

-- Provider applications (tradesperson signup, reviewed by admins)
CREATE TABLE public.provider_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  business_name text,
  email text NOT NULL,
  phone text NOT NULL,
  primary_trade text NOT NULL,
  additional_services text,
  city text NOT NULL,
  state_code text NOT NULL DEFAULT 'MI',
  service_area text NOT NULL,
  license_info text,
  status text NOT NULL DEFAULT 'pending_review',
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.provider_applications TO authenticated;
GRANT SELECT ON public.provider_applications TO anon;
GRANT ALL ON public.provider_applications TO service_role;

ALTER TABLE public.provider_applications ENABLE ROW LEVEL SECURITY;

-- Applications are submitted through a validated public form endpoint
CREATE POLICY "Public can submit provider applications"
  ON public.provider_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Applicants can follow their own application's status
CREATE POLICY "Applicants can read own application"
  ON public.provider_applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins manage all applications
CREATE POLICY "Admins manage provider applications"
  ON public.provider_applications FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_provider_applications_updated_at
  BEFORE UPDATE ON public.provider_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();