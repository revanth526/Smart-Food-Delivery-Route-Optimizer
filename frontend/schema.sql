CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    role TEXT DEFAULT 'customer',
    address TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_valid_role CHECK (role IN ('customer', 'admin'))
);

CREATE TABLE IF NOT EXISTS public.admin_details (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id TEXT UNIQUE NOT NULL,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    purpose TEXT DEFAULT 'login',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    verified_at TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    is_verified BOOLEAN DEFAULT false,
    CONSTRAINT check_attempts CHECK (attempts >= 0),
    CONSTRAINT check_max_attempts CHECK (max_attempts > 0)
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    order_status TEXT DEFAULT 'Order Confirmed',
    payment_status TEXT DEFAULT 'Pending',
    tracking_status TEXT DEFAULT 'Pending',
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_total_amount CHECK (total_amount >= 0)
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    CONSTRAINT check_quantity CHECK (quantity > 0),
    CONSTRAINT check_unit_price CHECK (unit_price >= 0),
    CONSTRAINT check_subtotal CHECK (subtotal >= 0)
);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER update_admin_details_updated_at
    BEFORE UPDATE ON public.admin_details
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.create_profile_after_signup()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        NEW.phone,
        'customer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_auth_user_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_profile_after_signup();

CREATE OR REPLACE FUNCTION public.generate_admin_id()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
    seq_val INT;
    new_admin_id TEXT;
BEGIN
    SELECT COALESCE(count(*), 0) + 1 INTO seq_val FROM public.admin_details;
    new_admin_id := 'ADM-' || lpad(seq_val::text, 6, '0');
    WHILE EXISTS (SELECT 1 FROM public.admin_details WHERE admin_id = new_admin_id) LOOP
        seq_val := seq_val + 1;
        new_admin_id := 'ADM-' || lpad(seq_val::text, 6, '0');
    END LOOP;
    NEW.admin_id := new_admin_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_insert_admin_details
    BEFORE INSERT ON public.admin_details
    FOR EACH ROW
    WHEN (NEW.admin_id IS NULL)
    EXECUTE FUNCTION public.generate_admin_id();

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
    seq_val INT;
    year_prefix TEXT;
    new_order_num TEXT;
BEGIN
    year_prefix := to_char(now(), 'YYYY');
    SELECT COALESCE(count(*), 0) + 1 INTO seq_val FROM public.orders WHERE order_number LIKE 'ORD-' || year_prefix || '%';
    new_order_num := 'ORD-' || year_prefix || lpad(seq_val::text, 6, '0');
    WHILE EXISTS (SELECT 1 FROM public.orders WHERE order_number = new_order_num) LOOP
        seq_val := seq_val + 1;
        new_order_num := 'ORD-' || year_prefix || lpad(seq_val::text, 6, '0');
    END LOOP;
    NEW.order_number := new_order_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER before_insert_orders
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION public.generate_order_number();

CREATE OR REPLACE FUNCTION public.promote_to_admin(user_uuid UUID, dept TEXT)
RETURNS VOID SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_uuid) THEN
        RAISE EXCEPTION 'User profile does not exist.';
    END IF;
    UPDATE public.profiles SET role = 'admin' WHERE id = user_uuid;
    INSERT INTO public.admin_details (id, department)
    VALUES (user_uuid, dept)
    ON CONFLICT (id) DO UPDATE SET department = dept;
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION public.promote_to_admin(UUID, TEXT) FROM public, authenticated, anon;

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS VOID SECURITY DEFINER AS $$
BEGIN
    DELETE FROM public.otp_verifications WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_otp_attempts(otp_id UUID)
RETURNS INTEGER SECURITY DEFINER AS $$
DECLARE
    current_attempts INTEGER;
    max_limit INTEGER;
BEGIN
    SELECT attempts, max_attempts INTO current_attempts, max_limit 
    FROM public.otp_verifications 
    WHERE id = otp_id;
    IF current_attempts >= max_limit THEN
        RETURN current_attempts;
    END IF;
    UPDATE public.otp_verifications 
    SET attempts = attempts + 1,
        is_verified = CASE WHEN attempts + 1 >= max_attempts THEN false ELSE is_verified END
    WHERE id = otp_id
    RETURNING attempts INTO current_attempts;
    RETURN current_attempts;
END;
$$ LANGUAGE plpgsql;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_admin_details_admin_id ON public.admin_details(admin_id);
CREATE INDEX IF NOT EXISTS idx_otp_identifier ON public.otp_verifications(identifier);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON public.otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_status ON public.orders(tracking_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_profile ON public.profiles
    FOR SELECT USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY update_own_profile ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY select_admin_details ON public.admin_details
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY select_own_orders ON public.orders
    FOR SELECT USING (auth.uid() = customer_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY insert_own_orders ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY update_admin_orders ON public.orders
    FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY delete_admin_orders ON public.orders
    FOR DELETE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY select_own_order_items ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.customer_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
        )
    );

CREATE POLICY insert_own_order_items ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.customer_id = auth.uid()
        )
    );

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE NOT NULL,
    qr_image_url TEXT DEFAULT '/upi_qr.png',
    payment_screenshot_url TEXT,
    payment_status TEXT DEFAULT 'Pending Verification',
    admin_remark TEXT DEFAULT '',
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_payment_status CHECK (payment_status IN ('Pending Verification', 'Paid', 'Rejected'))
);

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_payments ON public.payments
    FOR SELECT USING (auth.uid() = customer_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY insert_own_payments ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY manage_all_payments ON public.payments
    FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
