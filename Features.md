# PRV AI features

To use these features, please visit [prvai.vercel.app](https://prvai.vercel.app).

PRV AI brings chat, research, image creation, and reusable assistants into one mobile-ready workspace. Its warm paper surfaces, considered typography, and low-glare dark theme are designed to keep long work sessions comfortable. Product capabilities and allowances are enforced by the server and may depend on the active plan, service availability, and daily usage.

## AI workspace

- **Streaming chat:** Send prompts and receive responses as they are generated. Fast and deeper response modes are available in the chat interface.
- **Conversation continuity:** Earlier user and assistant turns in the active chat are included as context for follow-up replies. Context length depends on the selected model and provider; a new chat starts a separate conversation.
- **Large-context workflows:** Supported experiences can work with long conversations and documents. Actual context availability depends on the selected model and service conditions.
- **Model experiences:** Select from the PRV AI experiences shown in the app, including fast, reasoning-oriented, beta, and legacy options. Access and daily allowances vary by tier. This guide does not identify the underlying third-party models.
- **Attachments:** Include supported images and files with a prompt for multimodal assistance.
- **Web search:** Add current web results to a request. Search has a daily allowance by tier.
- **Image creation:** Describe an image in the chat to create one. Completion time varies with prompt complexity, network, and service load.
- **Prompt enhancement:** Refine a rough prompt or assistant description into clearer instructions.

## Custom PRVs

- Start from specialist presets or write a custom description and instructions.
- Choose a supported PRV experience for a custom assistant.
- Browse community-published Custom PRVs.
- Lifetime creation counters apply to new creations after the quota system was introduced. Previously published Custom PRVs do not consume the new allowance. Creating and publishing a Custom PRV requires an account.

## Accounts and productivity

- Sign in with an email link or supported OAuth provider.
- Save text chat history to your account and access it across supported browsers.
- Search, rename, and delete saved conversations.
- Export the current conversation as Markdown or download all available chats as JSON.
- Use guest or incognito sessions when you want temporary conversations that are not saved to account chat history.
- Follow the browser’s light or dark appearance preference, with live updates when it changes. A manual switch lasts for the current browser session.
- Use the workspace on phones, tablets, and desktop screens.
- Review your current tier and usage in **Settings → Plans**.

## Plans and allowances

All daily limits reset at midnight UTC. PRV 3.2 Fire and the two listed legacy experiences—PRV V1 Pro and PRV V1 Base—have no daily request cap in the current plan policy. PRV 4.0 Lightning is unavailable on Free. Paid tiers are invite-code only while regional availability is limited.

| Daily or lifetime allowance | Free | Go | Plus | Pro |
|---|---:|---:|---:|---:|
| PRV 3.5 Earth | 30/day | 300/day | 1,000/day | 5,000/day |
| PRV 4.0 Lightning | No access | 20/day | 100/day | 500/day |
| PRV V1 Pro Max | 40/day | 200/day | 800/day | 3,000/day |
| Image creation | 10/day | 50/day | 150/day | 500/day |
| Prompt enhancement | 100/day | 500/day | 1,500/day | 5,000/day |
| Web search | 30/day | 100/day | 300/day | 1,000/day |
| New Custom PRV creations | 1/lifetime | 5/lifetime | 25/lifetime | Unlimited |

Daily limits are separate by feature: image creation, prompt enhancement, search, and each capped PRV experience have their own allowance. Current usage is available in the app; the Custom PRV counter also shows lifetime creations used.

## Security and privacy

- Invite codes are generated with cryptographically secure randomness, stored as hashes, and redeemed transactionally against the signed-in account.
- Server-side tier checks and persistent daily/lifetime counters prevent client-side changes from granting access or resetting usage.
- Turnstile verification and request limits help protect public endpoints from automated abuse.
- PRV AI does not sell personal information or use chats for targeted advertising. Requests can be processed by third-party AI, search, security, hosting, authentication, and database providers to deliver the features you request. See the in-app Privacy Policy for details.

## Coming soon

The sidebar currently labels **Poder** as coming soon; it is not included as an available feature yet.
