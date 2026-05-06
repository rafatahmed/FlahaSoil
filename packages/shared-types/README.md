<!-- @format -->

# `@flaha/shared-types`

Shared TypeScript types consumed by the v2 backend, the v2 frontend, and
any downstream consumer (FlahaCalc, reporting). Pure types and
zero-runtime helpers — no validation, no network code, no Prisma client.

## Status

Phase 4 (API contracts). DTOs mirror `prisma/v2-schema.prisma`; request /
response shapes cover every `/api/v2` route. See
`docs/v2-api-contracts.md` for the contract reference.

## Layout

| File                   | Contents                                                                                                                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/soil-domain.ts`   | DTOs and enums (`SoilSampleDTO`, `SoilTestDTO`, `SoilTextureInputDTO`, `SoilChemistryInputDTO`, `SoilPhysicsResultDTO`, `SoilChemistryResultDTO`, `SoilInterpretationDTO`, `SoilReportDTO`, `SoilLabValueDTO`, plus `SoilTestLevel`, `SoilValueSource`, `SoilReportStatus`, `SoilInterpretationRating`). |
| `src/api-contracts.ts` | Request / response interfaces for all eight `/api/v2` routes, plus the `ApiV2RouteResponseMap` lookup type.                                                                                                                                                                                              |
| `src/errors.ts`        | `ApiErrorResponse`, `ApiErrorCode` union, `ValidationFailureDetail`, and the `isApiErrorResponse` type-guard.                                                                                                                                                                                            |

## Conventions

- DateTime fields cross the wire as ISO-8601 strings (`IsoDateString`).
- Prisma `Decimal` fields cross the wire as decimal strings
  (`DecimalString`) for lossless round-trip.
- Request payloads omit server-generated fields (`id`, `createdAt`,
  `updatedAt`, foreign keys taken from the URL).
- All v2 routes are prefixed with `/api/v2`. The legacy `/api/v1`
  surface is not referenced anywhere in this package.

## What this package does NOT provide

- Runtime validation (no Zod / Joi). See `docs/v2-api-contracts.md` §4
  for the rules; runtime enforcement is a later phase.
- A `fetch` client. `ApiV2RouteResponseMap` is provided so a future
  client can be typed correctly, but no client exists.
- Auth or session types. These will be added when the auth flow is
  designed.
