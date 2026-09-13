# VitaScan / VCC Troubleshooting Log

Date: 2026-07-18

## Checks and findings

- Exercised the deployed VCC Transactions view in Microsoft Edge using Windows Computer Use. Navigation, search, table controls, and transaction data rendered without a visible crash.
- Ran the full unit suite before changes: 24/24 tests passed.
- Ran the production build before changes: passed.
- Confirmed the Git working tree started clean at commit `74ddbf1`.
- Found no untracked or post-commit files safe to classify as useless. Nothing was deleted. Historical documents and archives were retained because they are committed evidence.
- Found the production Supabase project in `INACTIVE` state. Requested restoration successfully; Supabase reported `COMING_UP` while the database restarted.
- Identified the primary product gap: finance data was browser-local, preventing a mobile receipt capture from appearing on another device.

## Fixes implemented

- Added the mobile-first `/vitascan` workspace to VCC navigation.
- Added camera capture and screenshot upload inputs.
- Added on-device OCR with editable review before any financial record is saved.
- Added heuristic extraction for Chime, Cash App, Apple Cash, Venmo, PayPal, Zelle, and generic receipts.
- Added transaction direction, date, account, category, reference, amount, and merchant review fields.
- Added automatic insertion into VCC Transactions after confirmation.
- Added an optional Supabase sync adapter using publishable keys only; no service-role secret is exposed to the browser.
- Added a secure `vita_receipts` schema with ownership-based RLS and constraints.
- Added parser tests and an environment template.

## Known follow-up

- Mobile-to-desktop identity requires the same authenticated VCC account on both devices. The current adapter can create an anonymous secure session, but anonymous sessions are device-specific. Add shared email/passkey authentication before calling cross-device sync production-ready.
- OCR quality depends on screenshot clarity. The review step is intentionally mandatory because financial records must not be silently accepted from imperfect OCR.
- Current implementation check (2026-09-12): receipt images remain on-device in the inspected adapter. Cloud sync sends confirmed structured fields and formatted OCR archive text in raw_text. Shared email OTP authentication is implemented; live account/RLS and cross-device behavior still require separate verification.
