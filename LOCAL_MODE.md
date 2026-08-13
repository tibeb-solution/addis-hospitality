# Local development mode

This project currently runs without Supabase or any cloud service.

- Recruitment records (jobs, applications, interviews, notifications, and ratings) are stored in the browser's local storage. They stay on the PC and browser profile that created them.
- Uploaded PDFs and images are written to `local-data/uploads/` by the local Next.js server. That directory is intentionally ignored by Git because it can contain personal documents.
- Document metadata is stored locally alongside the prototype data. Removing browser site data also removes that metadata, but it does **not** delete the files in `local-data/uploads/`.

Start the app with `pnpm dev` and keep it running on your PC for local document upload and viewing to work. The file endpoint accepts PDF, JPEG, PNG, and WebP files up to 10 MB.

Before publishing this system online, replace the local adapter with a real authenticated database and object storage service. Do not expose `local-data/uploads/` over a public deployment.
