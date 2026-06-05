-- Phase 9A inspection: row counts and tenancy backfill status
SELECT 'projects' AS t, COUNT(*) AS total, COUNT("organizationId") AS with_org FROM projects
UNION ALL SELECT 'soil_samples', COUNT(*), COUNT("organizationId") FROM soil_samples
UNION ALL SELECT 'users', COUNT(*), COUNT("activeOrganizationId") FROM users
UNION ALL SELECT 'organizations', COUNT(*), 0 FROM organizations
UNION ALL SELECT 'organization_memberships', COUNT(*), 0 FROM organization_memberships
UNION ALL SELECT 'refresh_tokens', COUNT(*), 0 FROM refresh_tokens
UNION ALL SELECT 'audit_logs', COUNT(*), 0 FROM audit_logs;

-- Show the demo org + its memberships
SELECT id, name, slug, type, status FROM organizations;
SELECT id, "organizationId", "userId", role, status FROM organization_memberships;
SELECT id, email, role, "activeOrganizationId" FROM users;
