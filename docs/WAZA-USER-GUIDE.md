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

## References

### eval.yaml pseudo structure

```yaml
name: my-skill-eval
description: Behavior-focused evaluation for my skill.
skill: my-skill
version: "1.0"

config:
   trials_per_task: 1
   timeout_seconds: 300
   parallel: false
   executor: copilot-sdk
   model: claude-sonnet-4.6

metrics:
   - name: task_completion
      weight: 0.7
      threshold: 0.8
      description: Overall completion quality target.
   - name: efficiency
      weight: 0.3
      threshold: 0.7
      description: Token/runtime quality target.

graders:
   - type: behavior
      name: token-budget
      config:
         max_tokens: 20000
         max_duration_ms: 120000

tasks:
   - "tasks/*.yaml"
```

### eval.yaml possible fields

| Field | Required | Description |
|---|---|---|
| `name` | Yes | Eval suite name shown in results. |
| `description` | No | Human-readable purpose of this eval. |
| `skill` | Yes | Target skill/customization name. |
| `version` | No | Spec/version label for your suite. |
| `config` | Yes | Runtime settings block for execution. |
| `config.trials_per_task` | Yes | Number of runs per task (higher = more stability data). |
| `config.timeout_seconds` | Yes | Per-task hard timeout. |
| `config.parallel` | No | Run tasks concurrently when true. |
| `config.executor` | Yes | Engine type (for example `copilot-sdk` or `mock`). |
| `config.model` | Yes | Default model used for execution. |
| `config.workers` | No | Max parallel workers when parallel mode is enabled. |
| `config.fail_fast` | No | Stop the run immediately after first hard failure. |
| `config.max_attempts` | No | Retry attempts for failed executions. |
| `config.judge_model` | No | Separate model for prompt/model-based judging. |
| `config.skill_directories` | No | Extra skill search paths used by executor/runtime. |
| `config.required_skills` | No | Skills that must be available before run starts. |
| `config.disabled_skills` | No | Skills disabled for this run (`["*"]` disables all). |
| `config.mcp_servers` | No | MCP server config map passed to runtime. |
| `metrics` | Yes | List of metric definitions (name, weight, threshold). |
| `metrics[].name` | Yes | Metric identifier (for example `task_completion`). |
| `metrics[].weight` | Yes | Relative contribution of this metric in final scoring. |
| `metrics[].threshold` | Yes | Pass expectation for that metric. |
| `metrics[].description` | No | Additional explanation for metric intent. |
| `graders` | No | Global validators applied to every task. |
| `graders[].type` | Yes | Grader kind. Supported: `code`, `text`, `prompt`, `file`, `json_schema`, `program`, `behavior`, `action_sequence`, `skill_invocation`, `trigger`, `diff`, `tool_constraint`, `tool_calls`. |
| `graders[].name` | Yes | Unique grader identifier in results JSON. |
| `graders[].config` | No | Type-specific grader configuration block. |
| `tasks` | Yes | Glob paths pointing to task YAML files. |
| `hooks` | No | Optional lifecycle shell commands (before/after run/task). |
| `inputs` | No | Global templated input variables for tasks. |
| `tasks_from` | No | External file path to load task definitions from. |
| `range` | No | Restrict run to task index slice `[start, end]`. |
| `baseline` | No | Enable baseline comparison mode where supported. |

### task YAML pseudo structure

```yaml
id: positive-trigger-001
name: Positive Trigger 1
description: Ensure the skill triggers and produces expected behavior.
tags:
   - trigger
   - happy-path

inputs:
   prompt: "Generate a Python function normalize_email(email: str) -> str"
   files:
      - path: fixtures/sample.py
   context:
      scenario: basic

expected:
   should_trigger: true
   output_contains:
      - "normalize_email"
   output_not_contains:
      - "as an ai"
   outcomes:
      - type: task_completed
   behavior:
      max_tool_calls: 0

graders:
   - type: text
      name: has-python-shape
      config:
         regex_match:
            - "(?i)def\\s+normalize_email\\s*\\("
```

### task YAML possible fields

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique task identifier used in output JSON. |
| `name` | Yes | Task display name shown in reports. |
| `description` | No | What this task is testing. |
| `tags` | No | Labels for filtering/grouping. |
| `group` | No | Optional group name used in grouped summaries. |
| `enabled` | No | When false, task is skipped/ignored. |
| `inputs` | Yes | Prompt and optional context/files provided to model. |
| `inputs.prompt` | Yes | Main user prompt for this test. |
| `inputs.context` | No | Structured key/value context payload for the run. |
| `inputs.files` | No | Fixture files copied into run workspace. |
| `expected` | No | High-level expectations (triggering, content, behavior). |
| `expected.should_trigger` | No | Whether skill should trigger for this prompt. |
| `expected.output_contains` | No | Strings that must appear in final output. |
| `expected.output_not_contains` | No | Strings that must not appear in final output. |
| `expected.outcomes` | No | Expected semantic outcomes (task-specific semantics). |
| `expected.behavior` | No | Behavior limits such as tool calls/duration. |
| `graders` | No | Task-specific validators in addition to global graders. |
| `graders[].type` | Yes | Same supported types as eval-level graders. |
| `graders[].name` | Yes | Task-level grader identifier in output validations. |
| `graders[].config` | No | Type-specific grader configuration for this task only. |
| `hooks` | No | Per-task pre/post execution commands where supported. |

Tip: Put reusable checks in top-level `graders` in `eval.yaml` and task-specific checks in each task file.

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
