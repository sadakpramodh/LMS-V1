# Python Backend Endpoint Reference

This document enumerates every REST endpoint implemented in `python-backend/` so the React app can switch from Supabase to the FastAPI service without code changes.

## Auth
| Method | Path | Request | Response |
| --- | --- | --- | --- |
| POST | `/auth/sign-up` | `{ email, password, full_name }` | `TokenPair` with access & refresh tokens. Auto-grants all permissions to `DEFAULT_ADMIN_EMAIL`. |
| POST | `/auth/sign-in` | `{ email, password }` | `TokenPair` |
| POST | `/auth/refresh` | `{ refresh_token }` | `TokenPair` |
| POST | `/auth/sign-out` | header `Authorization: Bearer <token>` | `204 No Content` |

## Profile & alerts
| Method | Path | Request | Response |
| GET | `/me/profile` | Bearer token | `Profile` |
| PUT | `/me/profile` | Partial profile fields | Updated `Profile` |
| GET | `/me/alerts` | Bearer token | `AlertSettings` |
| PUT | `/me/alerts` | `{ email_alerts?, sms_alerts? }` | Updated settings |

## Disputes & documents
| Method | Path | Details |
| GET | `/disputes` | Lists authenticated user’s disputes. |
| POST | `/disputes` | Requires `disputes.create`. Body `{ title, amount }`. |
| PUT | `/disputes/{id}` | Requires `disputes.update`. Partial payload updates title/status/amount. |
| DELETE | `/disputes/{id}` | Requires `disputes.delete`. |
| POST | `/disputes/{id}/documents` | Multipart upload (≤50 files, 500 MB each). Returns document metadata for storage references. |

## Litigation cases
| Method | Path | Details |
| GET | `/litigation-cases` | Lists current user’s cases. |
| POST | `/litigation-cases/bulk` | Requires `litigation.create`. Body `{ cases: LitigationCaseInsert[] }`. |
| DELETE | `/litigation-cases/{id}` | Requires `litigation.delete`. |

## Admin & permissions
| Method | Path | Details |
| GET | `/admin/users` | Requires admin. Returns profiles + permissions. |
| POST | `/admin/permissions` | Body `{ user_id, permissions[] }`. Requires admin. |
| POST | `/admin/access` | Body `{ user_id, is_enabled }`. Requires admin. |

## Health
`GET /health` returns `{ "status": "ok" }` for uptime probes.
