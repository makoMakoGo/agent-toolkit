#!/usr/bin/env python3
"""
Prompt Enhancer Script - Standalone Python script for enhancing prompts.
Can be used with or without an API key.
"""

import sys
import os
import subprocess

SYSTEM_PROMPT = """
You are an expert Prompt Engineer for Coding Agents (Claude Code, Codex, Gemini CLI).
Your goal is to rewrite the user's raw input into a structured, high-context prompt that maximizes the agent's effectiveness.

Guidelines:
1. Structure: Use a clear Markdown structure with headers.
2. Chain of Thought: Explicitly ask the agent to "Think step-by-step" or "Analyze the file structure first".
3. Context: If the user's prompt is vague, add placeholders like "[Insert relevant file(s)]" or "[Specify tech stack]" in the rewritten prompt, or simply infer them if obvious.
4. Format:
   - Context: What is the current state? What files are involved?
   - Objective: What exactly should be done?
   - Constraints: specific libraries, coding styles, or "no placeholders".
   - Response Format: e.g., "Return only the code block" or "Explain step-by-step".

Output Template:

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
"""


def enhance_with_anthropic(prompt: str, api_key: str) -> str:
    """Enhance prompt using Anthropic API."""
    try:
        import anthropic
    except ImportError:
        print("Installing anthropic package...", file=sys.stderr)
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "anthropic", "-q"],
            check=True
        )
        import anthropic
    
    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model=os.environ.get("PE_MODEL", "claude-sonnet-4-20250514"),
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text


def enhance_with_openai(prompt: str, api_key: str) -> str:
    """Enhance prompt using OpenAI API."""
    try:
        import openai
    except ImportError:
        print("Installing openai package...", file=sys.stderr)
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "openai", "-q"],
            check=True
        )
        import openai
    
    client = openai.OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=os.environ.get("PE_MODEL", "gpt-4o"),
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content


def enhance_locally(prompt: str) -> str:
    """Enhance prompt using local template (no API)."""
    return f"""# Context
[Analyze the context for: {prompt}]

# Objective
{prompt}

# Step-by-Step Instructions
1. First, understand the current state and requirements
2. Identify the key components involved
3. Plan the implementation approach
4. Execute the changes step by step
5. Verify the results

# Constraints
- Follow existing code style and conventions
- Ensure backward compatibility
- Add appropriate error handling
"""


def main():
    if len(sys.argv) < 2:
        print("Usage: enhance.py <prompt>", file=sys.stderr)
        print("Example: enhance.py 'Write a login component'", file=sys.stderr)
        sys.exit(1)
    
    prompt = " ".join(sys.argv[1:])
    
    # Try Anthropic first, then OpenAI, then local
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    
    try:
        if anthropic_key:
            result = enhance_with_anthropic(prompt, anthropic_key)
        elif openai_key:
            result = enhance_with_openai(prompt, openai_key)
        else:
            # No API key - use local template
            print("Note: No API key found, using local template.", file=sys.stderr)
            result = enhance_locally(prompt)
        
        print(result)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        print("\nFalling back to local template...", file=sys.stderr)
        print(enhance_locally(prompt))


if __name__ == "__main__":
    main()

