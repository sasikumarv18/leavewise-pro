
CREATE TYPE public.app_role AS ENUM ('ADMIN','SUB_ADMIN','STUDENT');
CREATE TYPE public.student_type AS ENUM ('HOSTELLER','DAY_SCHOLAR');
CREATE TYPE public.leave_type AS ENUM ('MEDICAL','PERSONAL','EMERGENCY','OTHER');
CREATE TYPE public.leave_status AS ENUM ('PENDING','APPROVED','REJECTED','CANCELLED');
CREATE TYPE public.account_status AS ENUM ('ACTIVE','INACTIVE');

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  status public.account_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

CREATE OR REPLACE FUNCTION public.is_active(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND status = 'ACTIVE');
$$;

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department_id, class_name)
);
CREATE INDEX idx_classes_department ON public.classes(department_id);
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT SELECT ON public.classes TO anon, authenticated;
GRANT ALL ON public.departments TO service_role;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Departments are public" ON public.departments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Classes are public" ON public.classes FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  register_number text NOT NULL UNIQUE,
  student_type public.student_type NOT NULL,
  department_id uuid NOT NULL REFERENCES public.departments(id),
  class_id uuid NOT NULL REFERENCES public.classes(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_students_department ON public.students(department_id);
CREATE INDEX idx_students_class ON public.students(class_id);
GRANT SELECT, UPDATE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE SEQUENCE public.leave_app_seq START 1;
CREATE TABLE public.leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number text NOT NULL UNIQUE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  leave_type public.leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  number_of_days integer NOT NULL,
  reason text NOT NULL,
  attachment_path text,
  status public.leave_status NOT NULL DEFAULT 'PENDING',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  review_remark text,
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_days CHECK (number_of_days >= 1),
  CONSTRAINT valid_reason CHECK (char_length(reason) BETWEEN 5 AND 1000)
);
CREATE INDEX idx_leaves_student ON public.leave_applications(student_id);
CREATE INDEX idx_leaves_status ON public.leave_applications(status);
GRANT SELECT, INSERT, UPDATE ON public.leave_applications TO authenticated;
GRANT ALL ON public.leave_applications TO service_role;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  leave_application_id uuid REFERENCES public.leave_applications(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_user_id, is_read);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ADMIN'));

CREATE OR REPLACE FUNCTION public.log_audit(_actor uuid, _action text, _entity text, _entity_id uuid, _details jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs(actor_user_id, action, entity, entity_id, details)
  VALUES (_actor, _action, _entity, _entity_id, _details);
END; $$;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'ADMIN') OR public.has_role(auth.uid(),'SUB_ADMIN'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.protect_profile_fields() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'ADMIN') THEN
    NEW.status := OLD.status;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_protect_profile BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'ADMIN'));

CREATE POLICY "Students read own record, staff read all" ON public.students FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'ADMIN') OR public.has_role(auth.uid(),'SUB_ADMIN'));
CREATE POLICY "Students update own record" ON public.students FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.protect_student_fields() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'ADMIN') THEN
    NEW.register_number := OLD.register_number;
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_protect_student BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.protect_student_fields();

CREATE POLICY "Students read own leaves, staff read all" ON public.leave_applications FOR SELECT TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(),'ADMIN') OR public.has_role(auth.uid(),'SUB_ADMIN')
  );
CREATE POLICY "Active students create own leaves" ON public.leave_applications FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'STUDENT')
    AND public.is_active(auth.uid())
    AND student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );
CREATE POLICY "Sub-admins review, students cancel own pending" ON public.leave_applications FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'SUB_ADMIN')
    OR (status = 'PENDING' AND student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(),'SUB_ADMIN')
    OR (status = 'CANCELLED' AND student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.enforce_leave_review() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
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
CREATE TRIGGER trg_enforce_leave_review BEFORE UPDATE ON public.leave_applications FOR EACH ROW EXECUTE FUNCTION public.enforce_leave_review();

CREATE OR REPLACE FUNCTION public.prepare_leave_insert() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.application_number := 'LV-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.leave_app_seq')::text, 6, '0');
  NEW.number_of_days := (NEW.end_date - NEW.start_date) + 1;
  NEW.status := 'PENDING';
  NEW.reviewed_at := NULL; NEW.reviewed_by := NULL; NEW.review_remark := NULL;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_prepare_leave BEFORE INSERT ON public.leave_applications FOR EACH ROW EXECUTE FUNCTION public.prepare_leave_insert();

CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid()) WITH CHECK (recipient_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_new_leave() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record;
BEGIN
  SELECT st.register_number AS register_number, p.full_name AS full_name INTO s
  FROM public.students st JOIN public.profiles p ON p.id = st.user_id WHERE st.id = NEW.student_id;
  INSERT INTO public.notifications(recipient_user_id, title, message, leave_application_id)
  SELECT ur.user_id, 'New Leave Application',
    'New leave application submitted by ' || s.full_name || ' (' || s.register_number || ').', NEW.id
  FROM public.user_roles ur WHERE ur.role = 'SUB_ADMIN';
  PERFORM public.log_audit(auth.uid(), 'LEAVE_SUBMITTED', 'leave_applications', NEW.id,
    jsonb_build_object('application_number', NEW.application_number));
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_new_leave AFTER INSERT ON public.leave_applications FOR EACH ROW EXECUTE FUNCTION public.notify_new_leave();

CREATE OR REPLACE FUNCTION public.notify_leave_reviewed() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('APPROVED','REJECTED') THEN
    SELECT user_id INTO target FROM public.students WHERE id = NEW.student_id;
    INSERT INTO public.notifications(recipient_user_id, title, message, leave_application_id)
    VALUES (target,
      CASE WHEN NEW.status = 'APPROVED' THEN 'Leave Approved' ELSE 'Leave Rejected' END,
      'Your leave application ' || NEW.application_number || ' has been ' ||
      lower(NEW.status::text) || '.' || coalesce(' Remark: ' || NEW.review_remark, ''),
      NEW.id);
    PERFORM public.log_audit(auth.uid(), 'LEAVE_' || NEW.status::text, 'leave_applications', NEW.id,
      jsonb_build_object('application_number', NEW.application_number, 'remark', NEW.review_remark));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_leave_reviewed AFTER UPDATE ON public.leave_applications FOR EACH ROW EXECUTE FUNCTION public.notify_leave_reviewed();

CREATE POLICY "Students upload own leave docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'leave-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner and staff read leave docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'leave-documents' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'ADMIN') OR public.has_role(auth.uid(),'SUB_ADMIN')));

INSERT INTO public.departments (department_name, code) VALUES
  ('Information Technology','IT'),
  ('Computer Science and Engineering','CSE'),
  ('Electronics and Communication Engineering','ECE'),
  ('Electrical and Electronics Engineering','EEE'),
  ('Mechanical Engineering','MECH'),
  ('Civil Engineering','CIVIL');

INSERT INTO public.classes (department_id, class_name)
SELECT d.id, d.code || '-' || s.sec FROM public.departments d CROSS JOIN (VALUES ('A'),('B')) AS s(sec);
