-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interests table (when students show interest in a kos)
CREATE TABLE public.interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kost_id UUID NOT NULL REFERENCES kosts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(kost_id, student_id)
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kost_id UUID NOT NULL REFERENCES kosts(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(kost_id, owner_id, student_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- RLS Policies for interests
CREATE POLICY "Students can create interests"
ON public.interests FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own interests"
ON public.interests FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Owners can view interests in their kosts"
ON public.interests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM kosts 
  WHERE kosts.id = interests.kost_id 
  AND kosts.owner_id = auth.uid()
));

-- RLS Policies for conversations
CREATE POLICY "Participants can view conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = owner_id OR auth.uid() = student_id);

CREATE POLICY "System can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = owner_id OR auth.uid() = student_id);

-- RLS Policies for messages
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM conversations 
  WHERE conversations.id = messages.conversation_id 
  AND (conversations.owner_id = auth.uid() OR conversations.student_id = auth.uid())
));

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.owner_id = auth.uid() OR conversations.student_id = auth.uid())
  )
);

-- Create function to notify owner when student shows interest
CREATE OR REPLACE FUNCTION notify_owner_on_interest()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_kos_name TEXT;
  v_student_name TEXT;
BEGIN
  -- Get owner_id and kos name
  SELECT owner_id, nama_kos INTO v_owner_id, v_kos_name
  FROM kosts WHERE id = NEW.kost_id;
  
  -- Get student name
  SELECT full_name INTO v_student_name
  FROM profiles WHERE id = NEW.student_id;
  
  -- Create notification for owner
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    v_owner_id,
    'Mahasiswa Tertarik dengan Kos Anda',
    v_student_name || ' tertarik dengan ' || v_kos_name,
    'interest',
    '/dashboard?tab=interests'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_interest_created
AFTER INSERT ON interests
FOR EACH ROW
EXECUTE FUNCTION notify_owner_on_interest();

-- Create trigger for updating conversations updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for notifications and messages
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;