-- Create reviews table for kost ratings and testimonials
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kost_id UUID NOT NULL REFERENCES public.kosts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(kost_id, student_id)
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Students can create their own reviews
CREATE POLICY "Students can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can update their own reviews
CREATE POLICY "Students can update own reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = student_id);

-- Students can delete their own reviews
CREATE POLICY "Students can delete own reviews"
ON public.reviews
FOR DELETE
USING (auth.uid() = student_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_reviews_kost_id ON public.reviews(kost_id);
CREATE INDEX idx_reviews_student_id ON public.reviews(student_id);