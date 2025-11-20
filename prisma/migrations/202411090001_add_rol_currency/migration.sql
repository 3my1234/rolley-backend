DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'Currency'
          AND e.enumlabel = 'ROL'
    ) THEN
        ALTER TYPE "Currency" ADD VALUE 'ROL';
    END IF;
END $$;


