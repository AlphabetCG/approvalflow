-- Runs once when the dev PostgreSQL volume is first created (compose.dev.yml).
-- Automated tests use this separate database so they never touch dev data.
CREATE DATABASE approvalflow_test OWNER approvalflow;
