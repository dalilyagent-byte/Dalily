# Zadarma calling

Dalily can initiate Saudi mobile calls through Zadarma's `/v1/request/callback/` API.

Required server-side environment variables:

- `ZADARMA_API_KEY`
- `ZADARMA_API_SECRET`
- `ZADARMA_SIP`

Keep API credentials in the deployment platform's encrypted environment variables. Do not commit them to GitHub.

The current integration starts a Zadarma callback. It does not yet provide an AI voice conversation over RTP/SIP; that requires a separate voice engine connected to the SIP leg.
