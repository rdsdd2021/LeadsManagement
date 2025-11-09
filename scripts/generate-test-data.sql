-- Script to generate test data for performance testing
-- This will create 10,000 dummy leads (adjust as needed)

-- WARNING: This will add data to your database!
-- Run this in Supabase SQL Editor

-- Function to generate random leads
CREATE OR REPLACE FUNCTION generate_test_leads(num_leads INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER;
  statuses TEXT[] := ARRAY['new', 'contacted', 'qualified', 'converted', 'lost', 'disqualified'];
  categories TEXT[] := ARRAY['IT Services', 'Healthcare', 'E-commerce', 'Manufacturing', 'Real Estate', 'Education'];
  regions TEXT[] := ARRAY['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Siliguri'];
  first_names TEXT[] := ARRAY['Rahul', 'Priya', 'Amit', 'Sneha', 'Arjun', 'Diya', 'Vivaan', 'Ananya', 'Aditya', 'Riya', 'Kiran', 'Neha'];
  last_names TEXT[] := ARRAY['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Mehta', 'Chopra', 'Das', 'Nair', 'Khan', 'Iyer', 'Ghosh'];
BEGIN
  FOR i IN 1..num_leads LOOP
    INSERT INTO public.leads (
      name,
      email,
      phone,
      status,
      category,
      region,
      value,
      priority,
      custom_fields,
      created_at,
      updated_at
    ) VALUES (
      first_names[1 + floor(random() * array_length(first_names, 1))] || ' ' || 
      last_names[1 + floor(random() * array_length(last_names, 1))],
      
      'test' || i || '@example.com',
      
      '+91' || lpad(floor(random() * 10000000000)::text, 10, '0'),
      
      statuses[1 + floor(random() * array_length(statuses, 1))],
      
      categories[1 + floor(random() * array_length(categories, 1))],
      
      regions[1 + floor(random() * array_length(regions, 1))],
      
      (random() * 500000)::numeric(10,2),
      
      floor(random() * 5) + 1,
      
      jsonb_build_object(
        'source', CASE floor(random() * 3)
          WHEN 0 THEN 'website'
          WHEN 1 THEN 'referral'
          ELSE 'cold_call'
        END,
        'notes', 'Test lead ' || i
      ),
      
      NOW() - (random() * interval '365 days'),
      
      NOW() - (random() * interval '30 days')
    );
    
    -- Log progress every 1000 rows
    IF i % 1000 = 0 THEN
      RAISE NOTICE 'Generated % leads...', i;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Successfully generated % test leads!', num_leads;
END;
$$;

-- Generate test data
-- Adjust the number based on your needs:
-- 1000 = quick test
-- 10000 = medium test
-- 100000 = large test (may take a few minutes)

-- Uncomment one of these lines to generate data:

-- SELECT generate_test_leads(1000);   -- 1K leads (fast)
-- SELECT generate_test_leads(10000);  -- 10K leads (medium)
-- SELECT generate_test_leads(50000);  -- 50K leads (large)
-- SELECT generate_test_leads(100000); -- 100K leads (very large, ~2-3 minutes)

-- After generating, check the count:
-- SELECT COUNT(*) FROM public.leads;

-- To delete test data later:
-- DELETE FROM public.leads WHERE email LIKE 'test%@example.com';

-- Performance test: Get unique values
-- SELECT get_unique_filter_values();

-- Check query performance
-- EXPLAIN ANALYZE
-- SELECT DISTINCT status FROM public.leads;
