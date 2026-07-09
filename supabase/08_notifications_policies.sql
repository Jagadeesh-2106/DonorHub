create policy "Users access own notifications" on notifications for all using (
  user_id = auth.uid()
);
