<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Provider pages (/p/$slug) reuse /book via ?provider=slug; bookings store booking_source/provider_id — one shared booking system, no per-provider code.
- Provider Dashboard lives under /_authenticated/provider/* and reads via RLS (is_provider_member); providers may only change service_requests.status (enforced by guard_provider_request_update trigger).
