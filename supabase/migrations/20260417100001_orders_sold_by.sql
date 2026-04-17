-- Add sold_by column to orders table to track which staff member created manual sales
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sold_by uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.orders.sold_by IS
  'Staff member who created this order via manual sales. NULL for online purchases.';
