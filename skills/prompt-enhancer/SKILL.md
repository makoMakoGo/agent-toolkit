---
name: prompt-enhancer
description: Enhance and refine prompts for AI coding agents using Chain-of-Thought reasoning. Use when user asks to improve, optimize, rewrite, or enhance a prompt. Transforms vague requests into structured, high-context instructions for Claude Code, Codex, or Gemini CLI.
allowed-tools: Bash(python3:*), Bash(pe:*), Read, Grep
---

# Prompt Enhancer Skill

Transforms vague or simple prompts into structured, high-context instructions optimized for AI coding agents.

## When to Use

- User asks to "improve my prompt" or "make this prompt better"
- User wants to "optimize this instruction for Claude/Codex"
- User needs help writing a better prompt for an AI agent
- User mentions "prompt engineering" or "rewrite this"

## Quick Start

Run the enhance script with the user's prompt:

```bash
python3 ~/.agents/skills/prompt-enhancer/scripts/enhance.py "user's raw prompt here"
```

## How It Works

The enhancer applies these principles:

1. **Add Context**: What project/tech stack is involved?
2. **Clarify Objective**: What exactly should be accomplished?
3. **Chain of Thought**: Add step-by-step reasoning instructions
4. **Define Constraints**: What are the boundaries and requirements?
5. **Specify Output**: What format should the result be in?

## Output Format

The enhanced prompt follows this structure:

```markdown
# Context
[Refined context description]

# Objective
[Precise task definition]

# Step-by-Step Instructions
1. [Step 1]
2. [Step 2]
...

# Constraints
- [Constraint 1]
- [Constraint 2]
```

## Additional Resources

- For advanced usage patterns, see [ADVANCED.md](ADVANCED.md)
- For the system prompt template, see [TEMPLATE.md](TEMPLATE.md)

## Alternative: Use `pe` CLI

If you have the `pe` CLI installed globally:

```bash
pe "user's raw prompt here"
```

Install via: `npm install -g prompt-enhancer` (or clone repo and `npm link`)

