CREATE INDEX IF NOT EXISTS idx_reports_created_at_desc ON public.reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_created ON public.reports (reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_department_created ON public.reports (department, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_updates_report_created ON public.report_updates (report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);