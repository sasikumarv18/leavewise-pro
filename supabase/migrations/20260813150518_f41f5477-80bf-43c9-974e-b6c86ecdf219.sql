
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_active(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit(uuid, text, text, uuid, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_fields() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_student_fields() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_leave_review() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prepare_leave_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_leave() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_leave_reviewed() FROM anon, authenticated;
