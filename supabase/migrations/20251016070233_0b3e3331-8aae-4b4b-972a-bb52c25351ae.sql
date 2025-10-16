-- Create enum for kos types
CREATE TYPE kos_type AS ENUM ('putra', 'putri', 'campur');

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('mahasiswa', 'pemilik', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'mahasiswa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kosts table
CREATE TABLE public.kosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nama_kos TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  alamat TEXT NOT NULL,
  kota TEXT NOT NULL,
  kecamatan TEXT,
  tipe_kos kos_type NOT NULL,
  harga_bulanan INTEGER NOT NULL,
  kamar_tersedia INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kost_images table
CREATE TABLE public.kost_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kost_id UUID NOT NULL REFERENCES public.kosts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create facilities table
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kost_id UUID NOT NULL REFERENCES public.kosts(id) ON DELETE CASCADE,
  nama_fasilitas TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kost_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for kosts
CREATE POLICY "Anyone can view active kosts"
  ON public.kosts FOR SELECT
  USING (is_active = true OR owner_id = auth.uid());

CREATE POLICY "Owners can insert their kosts"
  ON public.kosts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their kosts"
  ON public.kosts FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their kosts"
  ON public.kosts FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for kost_images
CREATE POLICY "Anyone can view kost images"
  ON public.kost_images FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage their kost images"
  ON public.kost_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kosts
      WHERE kosts.id = kost_images.kost_id
      AND kosts.owner_id = auth.uid()
    )
  );

-- RLS Policies for facilities
CREATE POLICY "Anyone can view facilities"
  ON public.facilities FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage their kost facilities"
  ON public.facilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.kosts
      WHERE kosts.id = facilities.kost_id
      AND kosts.owner_id = auth.uid()
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'mahasiswa')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_kosts_owner_id ON public.kosts(owner_id);
CREATE INDEX idx_kosts_kota ON public.kosts(kota);
CREATE INDEX idx_kosts_tipe_kos ON public.kosts(tipe_kos);
CREATE INDEX idx_kosts_harga ON public.kosts(harga_bulanan);
CREATE INDEX idx_kost_images_kost_id ON public.kost_images(kost_id);
CREATE INDEX idx_facilities_kost_id ON public.facilities(kost_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kosts_updated_at
  BEFORE UPDATE ON public.kosts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();