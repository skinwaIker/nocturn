-- Insert default ranks
INSERT INTO ranks (name, color, priority) VALUES
  ('User', '#888888', 0),
  ('Mod', '#00ccff', 50),
  ('Admin', '#ff3333', 100);

-- Allow service role to manage all tables for admin operations
-- We need a function that admins can call to perform admin actions
CREATE OR REPLACE FUNCTION public.admin_update_profile(target_uid UUID, updates JSONB)
RETURNS VOID AS $$
DECLARE
  caller_rank_name TEXT;
BEGIN
  SELECT r.name INTO caller_rank_name
  FROM profiles p JOIN ranks r ON p.rank_id = r.id
  WHERE p.id = auth.uid();
  
  IF caller_rank_name NOT IN ('Admin', 'Mod') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  UPDATE profiles SET 
    username = COALESCE(updates->>'username', username),
    rank_id = COALESCE((updates->>'rank_id')::UUID, rank_id)
  WHERE id = target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_delete_paste(paste_id UUID)
RETURNS VOID AS $$
DECLARE
  caller_rank_name TEXT;
BEGIN
  SELECT r.name INTO caller_rank_name
  FROM profiles p JOIN ranks r ON p.rank_id = r.id
  WHERE p.id = auth.uid();
  
  IF caller_rank_name NOT IN ('Admin', 'Mod') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  DELETE FROM pastes WHERE id = paste_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_pin_paste(paste_id UUID, pin BOOLEAN)
RETURNS VOID AS $$
DECLARE
  caller_rank_name TEXT;
BEGIN
  SELECT r.name INTO caller_rank_name
  FROM profiles p JOIN ranks r ON p.rank_id = r.id
  WHERE p.id = auth.uid();
  
  IF caller_rank_name NOT IN ('Admin', 'Mod') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  UPDATE pastes SET pinned = pin WHERE id = paste_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_insert_ban(target_uid UUID, ban_reason TEXT, is_shadowban BOOLEAN)
RETURNS VOID AS $$
DECLARE
  caller_rank_name TEXT;
BEGIN
  SELECT r.name INTO caller_rank_name
  FROM profiles p JOIN ranks r ON p.rank_id = r.id
  WHERE p.id = auth.uid();
  
  IF caller_rank_name NOT IN ('Admin', 'Mod') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  INSERT INTO bans (user_id, banned_by, reason, shadowban)
  VALUES (target_uid, auth.uid(), ban_reason, is_shadowban);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_delete_ban(target_uid UUID)
RETURNS VOID AS $$
DECLARE
  caller_rank_name TEXT;
BEGIN
  SELECT r.name INTO caller_rank_name
  FROM profiles p JOIN ranks r ON p.rank_id = r.id
  WHERE p.id = auth.uid();
  
  IF caller_rank_name NOT IN ('Admin', 'Mod') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  DELETE FROM bans WHERE user_id = target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_insert_warning(target_uid UUID, warn_reason TEXT)
RETURNS VOID AS $$
DECLARE
  caller_rank_name TEXT;
BEGIN
  SELECT r.name INTO caller_rank_name
  FROM profiles p JOIN ranks r ON p.rank_id = r.id
  WHERE p.id = auth.uid();
  
  IF caller_rank_name NOT IN ('Admin', 'Mod') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  INSERT INTO warnings (user_id, warned_by, reason)
  VALUES (target_uid, auth.uid(), warn_reason);
  
  INSERT INTO notifications (user_id, type, message)
  VALUES (target_uid, 'warning', 'You received a warning: ' || warn_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow admins to read all sessions
CREATE OR REPLACE FUNCTION public.admin_lookup_user_sessions(target_uid UUID)
RETURNS TABLE(id UUID, user_id UUID, ip_address TEXT, user_agent TEXT, device_info TEXT, last_active TIMESTAMPTZ) AS $$
DECLARE
  caller_rank_name TEXT;
BEGIN
  SELECT r.name INTO caller_rank_name
  FROM profiles p JOIN ranks r ON p.rank_id = r.id
  WHERE p.id = auth.uid();
  
  IF caller_rank_name NOT IN ('Admin', 'Mod') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  RETURN QUERY SELECT * FROM user_sessions WHERE user_id = target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow admins to read warnings for any user
CREATE OR REPLACE FUNCTION public.admin_lookup_warnings(target_uid UUID)
RETURNS TABLE(id UUID, user_id UUID, warned_by UUID, reason TEXT, created_at TIMESTAMPTZ) AS $$
DECLARE
  caller_rank_name TEXT;
BEGIN
  SELECT r.name INTO caller_rank_name
  FROM profiles p JOIN ranks r ON p.rank_id = r.id
  WHERE p.id = auth.uid();
  
  IF caller_rank_name NOT IN ('Admin', 'Mod') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  RETURN QUERY SELECT * FROM warnings WHERE user_id = target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
