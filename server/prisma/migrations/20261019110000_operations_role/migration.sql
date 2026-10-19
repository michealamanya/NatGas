-- Least-privilege role for staff who manage customer orders and fulfilment.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OPERATIONS';
