# Waza User Guide

This guide explains how to use waza from the Chat Customizations Evaluations extension.

## What Is Waza?

Waza is a CLI for evaluating AI customizations (skills, agents, prompts, and instructions) using structured eval suites.

With this extension, you can:
- Create a starter eval scaffold for a customization.
- Run the eval and save the results to a JSON file.
- Open and review the saved results.
- Download and configure a local waza binary.

## Prerequisites

- VS Code with the Chat Customizations Evaluations extension installed.
- A customization file in your workspace (for example, SKILL.md).
- A working waza command.

The extension tries these options in order:
1. The configured command from setting `chatCustomizationsEvaluations.waza.command`.
2. A binary downloaded by the extension.
3. A local fallback using `go run ./cmd/waza` if a local waza repo is detected.

## Main Commands (Command Palette)

Open the Command Palette and run these commands:

- Chat Customizations Evaluations: Open Waza User Guide
- Chat Customizations Evaluations: Download Waza Binary
- Chat Customizations Evaluations: Create Waza Eval Scaffold
- Chat Customizations Evaluations: Run Waza Evaluation

## Typical End-User Flow

1. Open a customization file (for example, `skills/my-skill/SKILL.md`).
2. Run Create Waza Eval Scaffold.
3. Review generated eval files and tasks.
4. Run Waza Evaluation.
5. Open results from the notification action or from the output panel link.

## How Evaluation Works

When you run "Run Waza Evaluation", the extension does the following:

1. Resolves context from the active customization:
   - Finds the nearest SKILL.md.
   - Determines skill name and workspace root.
2. Searches for an eval file (`eval.yaml`) in common locations.
3. Creates a timestamped results output file path in extension storage.
4. Runs waza:

```bash
waza run <eval.yaml> --context-dir <skill-dir> --output <results-file.json>
```

5. Streams stdout and stderr to the output channel.
6. If successful, shows:
   - A clickable file URI in output.
   - A notification with a "View Results" action.

## Validator Types (8) With Examples

Below are the 8 validator types supported by waza and a minimal example for each.

### 1. `code`

Runs assertion logic against task output.

```yaml
- type: code
   name: has_meaningful_output
   config:
      assertions:
         - "len(output) > 20"
```

### 2. `text`

Checks text patterns using simple contains/regex match rules.

```yaml
- type: text
   name: no_runtime_errors
   config:
      regex_not_match:
         - "(?i)error|exception|traceback"
```

### 3. `model`

Uses an LLM-as-judge rubric to score response quality.

```yaml
- type: model
   name: judge_explanation_quality
   config:
      rubric: "Score 1-5 for clarity, correctness, and completeness."
      pass_threshold: 4
```

### 4. `regex`

Validates output against one or more regular expressions.

```yaml
- type: regex
   name: mentions_base_case
   config:
      must_match:
         - "(?i)base case"
```

### 5. `file`

Checks file artifacts created during execution.

```yaml
- type: file
   name: report_file_created
   config:
      path: "artifacts/report.json"
      must_exist: true
```

### 6. `keyword`

Requires specific keywords in output.

```yaml
- type: keyword
   name: contains_required_terms
   config:
      include:
         - recursion
         - factorial
```

### 7. `json`

Validates JSON shape and required fields.

```yaml
- type: json
   name: valid_structured_output
   config:
      required_keys:
         - summary
         - confidence
```

### 8. `script`

Runs a custom script for advanced validation logic.

```yaml
- type: script
   name: custom_policy_checks
   config:
      command: "bash ./validators/check-output.sh"
```

You can mix global validators in `eval.yaml` with task-specific validators in each task file.

## Results File Location

Results are saved under the extension global storage path in a `results` folder.

Example filename:

- `my-skill-2026-05-05T13-39-38-888Z.json`

## Configuration

Use this setting to control which executable is used:

- `chatCustomizationsEvaluations.waza.command`

Examples:
- `waza`
- `/usr/local/bin/waza`
- `C:\\tools\\waza.exe`

## Troubleshooting

### "No eval.yaml found"

Create an eval scaffold first with:
- Chat Customizations Evaluations: Create Waza Eval Scaffold

### "command not found" or spawn ENOENT

Use:
- Chat Customizations Evaluations: Download Waza Binary

Or set `chatCustomizationsEvaluations.waza.command` to a valid path.

### Evaluation failed

Open the output panel:
- View > Output
- Channel: Chat Customizations Evaluations

Read the exact waza command, stderr, and fallback behavior logs.

## Notes

- The extension writes one results file per run (timestamped).
- Results files are JSON and can be diffed or archived.
- If the file exists, the output panel shows a clickable file URI you can open directly.
