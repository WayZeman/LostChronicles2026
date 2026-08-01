-- Quantity for multi-buy support orders

ALTER TABLE support_orders
  ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;
