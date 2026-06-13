import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Rank {
  id: string;
  name: string;
  color: string;
  priority: number;
  price: string | null;
}

export interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  banner_url: string | null;
  rank_id: string;
  bio: string;
  created_at: string;
  rank?: Rank;
}

export interface Paste {
  id: string;
  title: string;
  slug: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface Comment {
  id: string;
  paste_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  related_id: string | null;
  read: boolean;
  created_at: string;
}

export interface Ban {
  id: string;
  user_id: string;
  banned_by: string;
  reason: string;
  shadowban: boolean;
  created_at: string;
}
