# Security Policy

## Public Repository Rules

- Never commit real `.env` files, database credentials, OAuth client secrets, JWT secrets, mail app passwords, private keys, or uploaded user media.
- Use `Lisharebackend/.env.example` and `Lisharefrontend/.env` examples only as templates. Production secrets must live in the hosting provider's secret store.
- Rotate any secret that was ever committed, even if a later commit removed it.
- Before publishing, run:

```powershell
git status --ignored --short
git grep -n -i -E "(password|secret|token|api_key|access_key|private key)" -- . ':!*.pdf' ':!Lisharefrontend/package-lock.json'
```

## Production Security Settings

- Set `COOKIE_SECURE=true` behind HTTPS.
- Set `APP_CORS_ALLOWED_ORIGINS` to the exact frontend origin, for example `https://app.example.com`.
- Set a strong Base64 `JWT_SECRET` with at least 256 bits of entropy.
- Keep upload limits as low as the product allows.
- Store uploaded media outside the git repository and back it up separately.

## Reporting

If this repository is made public, report security issues privately to the repository owner instead of opening a public issue with exploit details.
