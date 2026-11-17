-- Onboarding v2: add credit card payment flag to booking offers
ALTER TABLE company_booking_offers
  ADD COLUMN IF NOT EXISTS pay_credit_card boolean NOT NULL DEFAULT false;
