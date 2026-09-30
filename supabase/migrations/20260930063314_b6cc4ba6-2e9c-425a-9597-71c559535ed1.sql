-- Provider team members can see and progress only their own provider's work.
CREATE POLICY "provider members read their requests" ON public.service_requests FOR SELECT TO authenticated
  USING (provider_id IS NOT NULL AND public.is_provider_member(provider_id));
CREATE POLICY "provider members update their requests" ON public.service_requests FOR UPDATE TO authenticated
  USING (provider_id IS NOT NULL AND public.is_provider_member(provider_id))
  WITH CHECK (provider_id IS NOT NULL AND public.is_provider_member(provider_id));

CREATE OR REPLACE FUNCTION public.guard_provider_request_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NEW.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  -- Provider staff may only change status.
  IF (to_jsonb(NEW) - 'status' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'status' - 'updated_at') THEN
    RAISE EXCEPTION 'Providers can only change job status';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER guard_provider_request_update BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_provider_request_update();

CREATE POLICY "provider members read their care plans" ON public.care_plans FOR SELECT TO authenticated
  USING (provider_id IS NOT NULL AND public.is_provider_member(provider_id));
CREATE POLICY "provider members read their care items" ON public.care_plan_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.care_plans p WHERE p.id = care_plan_id AND p.provider_id IS NOT NULL AND public.is_provider_member(p.provider_id)));

CREATE POLICY "provider members read their customers' properties" ON public.properties FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.service_requests r WHERE r.property_id = properties.id AND r.provider_id IS NOT NULL AND public.is_provider_member(r.provider_id))
      OR EXISTS (SELECT 1 FROM public.care_plans c WHERE c.property_id = properties.id AND c.provider_id IS NOT NULL AND public.is_provider_member(c.provider_id)));
CREATE POLICY "provider members read their customers' profiles" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.service_requests r WHERE r.user_id = profiles.id AND r.provider_id IS NOT NULL AND public.is_provider_member(r.provider_id))
      OR EXISTS (SELECT 1 FROM public.care_plans c WHERE c.user_id = profiles.id AND c.provider_id IS NOT NULL AND public.is_provider_member(c.provider_id)));