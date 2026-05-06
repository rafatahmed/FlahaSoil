# `@flahasoil/validation`

Shared validation logic for FlahaSOIL v2 — used by both the API and the web
client so that input rules live in exactly one place.

## Status

Phase 1 (skeleton). Single sentinel export.

## Future scope

* Soil texture input ranges (sand, silt, clay, OM, density factor, gravel,
  EC) — ported from the legacy `soilAnalysisValidation` chain documented in
  `docs/legacy-api-map.md`.
* Soil chemistry input ranges (CEC, cations, pH, ESP, SAR).
* Auth and account validation rules.
* Implementation will use a single schema library (e.g. zod) to generate both
  runtime validators and TypeScript types.
