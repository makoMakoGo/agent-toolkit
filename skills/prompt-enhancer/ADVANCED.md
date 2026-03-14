# Advanced Usage

## Using the Python Script Directly

The `scripts/enhance.py` script can be used standalone:

```bash
# Basic usage
python3 scripts/enhance.py "your prompt here"

# With custom model (if API key is set)
ANTHROPIC_API_KEY=sk-ant-... python3 scripts/enhance.py "your prompt"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | - |
| `OPENAI_API_KEY` | OpenAI API key (fallback) | - |
| `PE_MODEL` | Model to use | `claude-sonnet-4-20250514` |

## Integration with Other Tools

### Piping Output

```bash
# Pipe to clipboard (macOS)
python3 scripts/enhance.py "my prompt" | pbcopy

# Pipe to file
python3 scripts/enhance.py "my prompt" > enhanced.md

# Chain with other commands
python3 scripts/enhance.py "my prompt" | claude -p
```

### In Shell Scripts

```bash
#!/bin/bash
ENHANCED=$(python3 ~/.agents/skills/prompt-enhancer/scripts/enhance.py "$1")
echo "$ENHANCED"
```

## Manual Enhancement (No API)

If no API key is available, you can manually apply the enhancement principles:

1. Read the user's prompt
2. Apply the template from [TEMPLATE.md](TEMPLATE.md)
3. Structure the output with:
   - Context section
   - Objective section
   - Step-by-step instructions
   - Constraints

## Troubleshooting

### Script Not Found
Ensure the skill is installed in the correct location:
```bash
ls ~/.agents/skills/prompt-enhancer/scripts/enhance.py
```

### Permission Denied
Make the script executable:
```bash
chmod +x ~/.agents/skills/prompt-enhancer/scripts/enhance.py
```

### No API Key
The script will fall back to a local template-based enhancement if no API key is found.

