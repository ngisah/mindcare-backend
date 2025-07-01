-- Add ON DELETE CASCADE to the community_comments table's user_id foreign key
ALTER TABLE community_comments
DROP CONSTRAINT community_comments_user_id_fkey,
ADD CONSTRAINT community_comments_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE; 