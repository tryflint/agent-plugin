# Flint Agent Plugin

Build and manage websites with [Flint](https://www.flint.com)'s AI website builder from your AI agent: Claude Code, Codex, ChatGPT, Cursor, Grok, and Muse.

## Features

- **Chat with the Flint agent** to modify your Flint sites — add pages, update content, redesign sections — and answer its questions in the same chat
- **List your sites** across all connected organizations
- **Publish sites** to production when you're ready to go live

Every agent connects to the same hosted MCP server, `https://mcp.tryflint.com/mcp`, and signs you in with your Flint account the first time it calls a tool. Your Flint organization must be on the Starter plan or above.

## Installation

### Claude Code

```
/plugin install flint
```

Or from this repository's marketplace:

```
/plugin install flint --marketplace tryflint/agent-plugin
```

Then run `/mcp`, select Flint, and choose "Authenticate".

### Codex

```
codex plugin marketplace add tryflint/agent-plugin
codex plugin add flint@flint
codex mcp login flint
```

### Cursor

Install Flint from the [Cursor Marketplace](https://cursor.com/marketplace), or import this repository under Dashboard → Plugins & MCPs → Team Marketplaces.

### Grok Build

Grok Build reads Claude Code marketplaces, so the Claude Code marketplace command above works there too.

### Other MCP clients

Add a custom connector pointing at `https://mcp.tryflint.com/mcp` and sign in with Flint. This works in ChatGPT, Claude.ai, grok.com, Grok Bot, and Muse.

## Usage

Once authenticated, just ask your agent to work on your Flint site:

> "Add a pricing page with three tiers to my site"

> "Update the hero section to say 'Welcome to the Future'"

> "Publish my site"

In Claude Code you can also use the `/flint:edit-site` skill directly:

```
/flint:edit-site Add a contact form with name, email, and message fields
```

## Tips

- **Describe goals, not implementation** — Flint is an expert designer and produces better results when given creative freedom over layout, styling, and component structure
- **Pass through reference material** — if you have code snippets, embed scripts, or examples, include them and Flint will incorporate them
- **Be specific when you want to be** — requests like "make the header black" or "use a three-column grid" are honored directly

## Repository layout

One plugin, one skill, and one MCP server, described once per agent:

| File | Read by |
| --- | --- |
| `plugin.json`, `mcp.json` | Agent Plugins format: Codex and the OpenAI plugin directory |
| `.agents/plugins/marketplace.json` | Codex marketplace |
| `.claude-plugin/`, `.mcp.json` | Claude Code, Grok Build, Muse Code |
| `.cursor-plugin/plugin.json` | Cursor and Grok Bot |
| `.grok-plugin/plugin.json` | Grok Build plugin catalog |
| `skills/` | Every agent |

release-please stamps one version into every manifest, and CI checks they match.

## Support

- Documentation: https://www.flint.com/docs/claude-code-plugin
- Email: support@tryflint.com

## Privacy Policy

https://www.flint.com/privacy-policy
