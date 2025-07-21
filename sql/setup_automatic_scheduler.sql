-- Setup automatic scheduler for questionnaire recurrence
-- This script configures pg_cron to call the automatic-scheduler Edge Function every hour

-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if it exists (for re-runs)
SELECT cron.unschedule('questionnaire-scheduler') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'questionnaire-scheduler'
);

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_automatic_scheduler()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    edge_function_url text;
    response text;
BEGIN
    -- Get the Edge Function URL from vault or use default
    -- This would be: https://[project-ref].supabase.co/functions/v1/automatic-scheduler
    edge_function_url := current_setting('app.settings.edge_function_url', true);
    
    IF edge_function_url IS NULL THEN
        RAISE LOG 'Edge function URL not configured in app.settings.edge_function_url';
        RETURN;
    END IF;

    -- Log the attempt
    RAISE LOG 'Triggering automatic scheduler at %', now();
    
    -- Call the Edge Function using http extension
    -- Note: This requires the http extension to be enabled in Supabase
    SELECT INTO response net.http_post(
        url := edge_function_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );
    
    RAISE LOG 'Automatic scheduler response: %', response;
    
EXCEPTION WHEN others THEN
    RAISE LOG 'Error in automatic scheduler: %', SQLERRM;
END;
$$;

-- Schedule the function to run every hour
-- Format: '0 * * * *' means "at minute 0 of every hour"
SELECT cron.schedule(
    'questionnaire-scheduler',
    '0 * * * *',  -- Every hour at minute 0
    'SELECT public.trigger_automatic_scheduler();'
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.trigger_automatic_scheduler() TO postgres;

-- Add comments for documentation
COMMENT ON FUNCTION public.trigger_automatic_scheduler() IS 'Triggers the automatic-scheduler Edge Function to process scheduled questionnaire sends';

-- Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'questionnaire-scheduler';

-- Manual execution for testing (uncomment to test):
-- SELECT public.trigger_automatic_scheduler();
