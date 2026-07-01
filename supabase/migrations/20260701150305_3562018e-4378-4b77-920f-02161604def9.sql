
CREATE POLICY "Users upload to own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'report-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'report-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authorities read all report media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'report-media' AND (public.has_role(auth.uid(), 'authority') OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Users delete own media" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'report-media' AND (storage.foldername(name))[1] = auth.uid()::text);
