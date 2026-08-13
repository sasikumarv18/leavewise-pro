
CREATE OR REPLACE FUNCTION public.enforce_leave_review() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- trusted server-side (service role) operations
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('APPROVED','REJECTED') THEN
      IF NOT public.has_role(auth.uid(),'SUB_ADMIN') THEN
        RAISE EXCEPTION 'Only a Sub-Admin can approve or reject a leave application';
      END IF;
      IF OLD.status <> 'PENDING' THEN
        RAISE EXCEPTION 'Only pending applications can be reviewed';
      END IF;
      IF NEW.status = 'REJECTED' AND coalesce(btrim(NEW.review_remark),'') = '' THEN
        RAISE EXCEPTION 'A rejection reason is required';
      END IF;
      NEW.reviewed_at := now();
      NEW.reviewed_by := auth.uid();
    ELSIF NEW.status = 'CANCELLED' THEN
      IF OLD.status <> 'PENDING' THEN
        RAISE EXCEPTION 'Only pending applications can be cancelled';
      END IF;
    ELSE
      RAISE EXCEPTION 'Invalid status transition';
    END IF;
  END IF;
  NEW.student_id := OLD.student_id;
  NEW.application_number := OLD.application_number;
  IF NOT public.has_role(auth.uid(),'SUB_ADMIN') THEN
    NEW.leave_type := OLD.leave_type;
    NEW.start_date := OLD.start_date;
    NEW.end_date := OLD.end_date;
    NEW.number_of_days := OLD.number_of_days;
    NEW.reason := OLD.reason;
    NEW.attachment_path := OLD.attachment_path;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.prepare_leave_insert() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.application_number := 'LV-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.leave_app_seq')::text, 6, '0');
  NEW.number_of_days := (NEW.end_date - NEW.start_date) + 1;
  IF auth.uid() IS NOT NULL THEN
    NEW.status := 'PENDING';
    NEW.reviewed_at := NULL; NEW.reviewed_by := NULL; NEW.review_remark := NULL;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.enforce_leave_review() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prepare_leave_insert() FROM anon, authenticated;
