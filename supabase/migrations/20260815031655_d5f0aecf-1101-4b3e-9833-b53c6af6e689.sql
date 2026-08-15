CREATE TYPE public.staff_request_status AS ENUM ('PENDING','APPROVED','REJECTED');

CREATE TABLE public.staff_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  requested_role public.app_role NOT NULL,
  message text,
  status public.staff_request_status NOT NULL DEFAULT 'PENDING',
  review_remark text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX staff_requests_pending_user ON public.staff_requests(user_id) WHERE status = 'PENDING';

GRANT SELECT, UPDATE ON public.staff_requests TO authenticated;
GRANT ALL ON public.staff_requests TO service_role;

ALTER TABLE public.staff_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own staff request, admins read all"
ON public.staff_requests FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins review staff requests"
ON public.staff_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE TRIGGER trg_staff_requests_updated
BEFORE UPDATE ON public.staff_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();