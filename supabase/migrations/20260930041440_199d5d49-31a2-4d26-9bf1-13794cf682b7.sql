
CREATE TYPE public.app_role AS ENUM ('admin','staff','customer');
CREATE TYPE public.request_status AS ENUM ('requested','confirmed','scheduled','in_progress','completed','cancelled');
CREATE TYPE public.care_frequency AS ENUM ('weekly','biweekly','monthly','seasonally','twice_yearly','yearly','custom');

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- SERVICE AREAS
CREATE TABLE public.service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL,
  name text NOT NULL,
  zip_codes text[] NOT NULL DEFAULT '{}',
  cities text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_areas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_areas TO authenticated;
GRANT ALL ON public.service_areas TO service_role;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

-- CATEGORIES
CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  blurb text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'leaf',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT ALL ON public.service_categories TO service_role;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category_slug text NOT NULL REFERENCES public.service_categories(slug) ON DELETE CASCADE,
  summary text NOT NULL DEFAULT '',
  included text[] NOT NULL DEFAULT '{}',
  recurring_allowed boolean NOT NULL DEFAULT false,
  default_frequency public.care_frequency,
  price_from numeric(10,2),
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- public catalog policies
CREATE POLICY "areas public read" ON public.service_areas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "areas admin write" ON public.service_areas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "categories public read" ON public.service_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories admin write" ON public.service_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "services public read" ON public.services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "services admin write" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROPERTIES
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  address_line1 text NOT NULL,
  city text,
  state_code text NOT NULL DEFAULT 'MI',
  zip text NOT NULL,
  lot_size text,
  access_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own properties" ON public.properties FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins manage properties" ON public.properties FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- REQUESTS
CREATE SEQUENCE public.request_number_seq START 1042;
CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text NOT NULL UNIQUE DEFAULT ('AG-' || nextval('public.request_number_seq')::text),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  category_slug text,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  description text,
  requested_date date,
  time_window text,
  status public.request_status NOT NULL DEFAULT 'requested',
  estimate_note text,
  care_plan_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;
GRANT USAGE ON SEQUENCE public.request_number_seq TO authenticated, service_role;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own requests" ON public.service_requests FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins manage requests" ON public.service_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- CARE PLANS
CREATE TABLE public.care_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_plans TO authenticated;
GRANT ALL ON public.care_plans TO service_role;
ALTER TABLE public.care_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own care plans" ON public.care_plans FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins manage care plans" ON public.care_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.care_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id uuid NOT NULL REFERENCES public.care_plans(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  frequency public.care_frequency NOT NULL DEFAULT 'monthly',
  frequency_note text,
  paused boolean NOT NULL DEFAULT false,
  next_service_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_plan_items TO authenticated;
GRANT ALL ON public.care_plan_items TO service_role;
ALTER TABLE public.care_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plan items" ON public.care_plan_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.care_plans p WHERE p.id = care_plan_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.care_plans p WHERE p.id = care_plan_id AND p.user_id = auth.uid()));
CREATE POLICY "admins manage plan items" ON public.care_plan_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- AVAILABILITY LIST (unsupported areas)
CREATE TABLE public.area_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  zip text NOT NULL,
  state_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.area_waitlist TO anon, authenticated;
GRANT SELECT, DELETE ON public.area_waitlist TO authenticated;
GRANT ALL ON public.area_waitlist TO service_role;
ALTER TABLE public.area_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can join waitlist" ON public.area_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read waitlist" ON public.area_waitlist FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER t1 BEFORE UPDATE ON public.service_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t2 BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t3 BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t4 BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t5 BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t6 BEFORE UPDATE ON public.care_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t7 BEFORE UPDATE ON public.care_plan_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEED
INSERT INTO public.service_areas (state_code, name, zip_codes, cities, active) VALUES
  ('MI','Michigan', ARRAY['48009','48070','48073','48098','48103','48104','48105','48108','48111','48170','48201','48226','48301','48302','48304','48307','48309','48331','48375','48377','48430','48446','48503','48602','48823','49001','49417','49503','49506','49546'], ARRAY['Detroit','Ann Arbor','Royal Oak','Birmingham','Troy','Novi','Grand Rapids','Lansing','Flint','Kalamazoo'], true);

INSERT INTO public.service_categories (slug,name,blurb,icon,sort_order) VALUES
  ('lawn-landscaping','Lawn & Landscaping','Mowing, trimming and seasonal care that keeps your property sharp.','leaf',1),
  ('property-maintenance','Property Maintenance','Cleanups, mulch, shrubs and the upkeep that adds up.','sprout',2),
  ('heating-cooling','Heating & Cooling','Installation, repair and maintenance for comfort year-round.','fan',3),
  ('indoor-air-quality','Indoor Air Quality','Cleaner, healthier air inside your home.','waves',4),
  ('seasonal-services','Seasonal Services','Spring and fall prep, handled before you think about it.','calendar',5),
  ('full-home-care','Full Home Care','Landscaping and HVAC together on one schedule.','home',6);

INSERT INTO public.services (slug,name,category_slug,summary,included,recurring_allowed,default_frequency,price_from,sort_order) VALUES
  ('lawn-mowing','Lawn Mowing','lawn-landscaping','Regular mowing at a consistent height, with clean edges every visit.',ARRAY['Mow all turf areas','Trim around beds and structures','Blow off hard surfaces'],true,'biweekly',49,1),
  ('edging','Edging','lawn-landscaping','Crisp, defined edges along walks, drives and beds.',ARRAY['Mechanical edging of hard surfaces','Bed edge definition','Debris cleanup'],true,'monthly',39,2),
  ('trimming','Trimming','lawn-landscaping','String trimming for the areas a mower cannot reach.',ARRAY['Fence lines and foundations','Tree rings and posts','Cleanup of clippings'],true,'biweekly',35,3),
  ('mulching','Mulching','property-maintenance','Fresh mulch for healthier beds and a finished look.',ARRAY['Bed prep and light weeding','Mulch delivery and spreading','Edge cleanup'],false,NULL,180,1),
  ('leaf-cleanup','Leaf Cleanup','property-maintenance','Full leaf removal so the lawn goes into winter clean.',ARRAY['Leaf collection from turf and beds','Hard surface blow down','Haul away'],true,'seasonally',149,2),
  ('shrub-hedge-care','Shrub & Hedge Care','property-maintenance','Shaping and pruning that keeps plantings healthy.',ARRAY['Selective pruning','Shaping to natural form','Debris removal'],true,'twice_yearly',120,3),
  ('general-property-maintenance','General Property Maintenance','property-maintenance','Ongoing upkeep of the things that slip through the cracks.',ARRAY['Walkthrough of the property','Agreed task list each visit','Photo summary after work'],true,'monthly',95,4),
  ('ac-service','AC Service','heating-cooling','A full cooling tune-up before the season turns.',ARRAY['Coil and filter check','Refrigerant and airflow test','Performance report'],true,'yearly',129,1),
  ('ac-repair','AC Repair','heating-cooling','Diagnosis and repair when cooling stops working right.',ARRAY['Full diagnostic','Repair quote before work','Post-repair testing'],false,NULL,99,2),
  ('heating-service','Heating Service','heating-cooling','Furnace tune-up so heat is reliable all winter.',ARRAY['Burner and heat exchanger inspection','Safety and airflow checks','Performance report'],true,'yearly',129,3),
  ('heating-repair','Heating Repair','heating-cooling','Repair for a furnace that is short cycling, noisy or cold.',ARRAY['Full diagnostic','Repair quote before work','Post-repair testing'],false,NULL,99,4),
  ('hvac-maintenance','HVAC Maintenance','heating-cooling','Spring and fall visits that keep the whole system healthy.',ARRAY['Cooling visit in spring','Heating visit in fall','Filter replacement'],true,'twice_yearly',219,5),
  ('system-inspection','System Inspection','heating-cooling','An honest assessment of the system you have.',ARRAY['Equipment age and condition','Airflow and distribution check','Written findings'],false,NULL,89,6),
  ('air-quality-assessment','Indoor Air Quality Assessment','indoor-air-quality','Find out what is actually in the air you breathe.',ARRAY['Humidity and particulate reading','Ventilation review','Recommendations'],false,NULL,109,1),
  ('air-filtration','Air Filtration & Purification','indoor-air-quality','Filtration matched to your system and your home.',ARRAY['Filtration options review','Install and setup','Replacement schedule'],true,'twice_yearly',249,2),
  ('duct-cleaning','Duct Cleaning','indoor-air-quality','Clear the dust that recirculates through every room.',ARRAY['Supply and return cleaning','Register cleaning','Before and after photos'],true,'yearly',329,3),
  ('spring-prep','Spring Property Prep','seasonal-services','Reset the property after winter in one visit.',ARRAY['Bed cleanup and cutback','First mow and edge','Debris haul away'],true,'yearly',199,1),
  ('fall-cleanup','Fall Cleanup','seasonal-services','Full fall reset before the first freeze.',ARRAY['Leaf removal','Bed cutback','Gutter line clearing'],true,'yearly',219,2),
  ('winter-hvac-prep','Winter HVAC Prep','seasonal-services','Get heating ready before you need it.',ARRAY['Furnace tune-up','Thermostat programming','Filter replacement'],true,'yearly',129,3),
  ('full-home-care-plan','Full Home Care','full-home-care','Landscaping and HVAC on one plan, one schedule, one team.',ARRAY['Recurring lawn and property care','Spring and fall HVAC visits','Seasonal cleanups','Priority scheduling'],true,'monthly',249,1),
  ('not-sure','I am not sure','full-home-care','Describe what is going on and we will figure out the right service.',ARRAY['Short description or photos','We match the right service','No diagnosis needed from you'],false,NULL,NULL,2);
