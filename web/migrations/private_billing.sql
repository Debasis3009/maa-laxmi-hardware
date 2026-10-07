-- Additive upgrade for the existing Supabase PostgreSQL schema.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_address text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_state text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_whatsapp text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_customer_type text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS request_key text;
UPDATE invoices SET billing_name=COALESCE(billing_name,c.name), billing_phone=COALESCE(billing_phone,c.phone), billing_address=COALESCE(billing_address,c.address),billing_state=COALESCE(billing_state,c.state),billing_gstin=COALESCE(billing_gstin,c.gstin) FROM customers c WHERE c.id=invoices.customer_id;
UPDATE invoices SET billing_customer_type=CASE WHEN customer_id IS NULL THEN 'walk_in' ELSE 'registered' END WHERE billing_customer_type IS NULL;
ALTER TABLE invoices ALTER COLUMN billing_customer_type SET DEFAULT 'walk_in';
CREATE UNIQUE INDEX IF NOT EXISTS invoices_request_key ON invoices(request_key) WHERE request_key IS NOT NULL;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit_label text;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='unallocated_amount') THEN
  ALTER TABLE payments ADD COLUMN unallocated_amount numeric(12,2) NOT NULL DEFAULT 0;
  UPDATE payments SET unallocated_amount=amount WHERE invoice_id IS NULL;
 END IF;
END $$;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS opening_applied numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS request_key text;
-- Existing unlinked receipts represent available customer credit.

CREATE UNIQUE INDEX IF NOT EXISTS payments_request_key ON payments(request_key) WHERE request_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS advance_allocations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),payment_id uuid NOT NULL REFERENCES payments(id),invoice_id uuid NOT NULL REFERENCES invoices(id),amount numeric(12,2) NOT NULL CHECK(amount>0),created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'login';
ALTER TABLE auth_otp_challenges ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE auth_otp_challenges ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'login';
-- Server-only billing. No client Data API grants or policies are needed.
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t.tablename);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated',t.tablename);
 END LOOP;
END $$;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
