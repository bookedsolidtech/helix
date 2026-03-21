# Failure Lessons: authentication

> Auto-generated from 19 recovery attempts. Updated 2026-03-12T00:29:33.102Z.

## Statistics

- **Total attempts**: 19
- **Successes**: 0 (0%)
- **Failures**: 19
- **Strategies tried**: escalate_to_user

## Common Error Patterns

- Authentication failed: Invalid or expired API key. Please check your ANTHROPIC_API_KEY, or run 'claude login' to re-authenticate.

## Guidance for Agents

Authentication errors require valid credentials. Do not retry — escalate to the user.

**Warning**: Recovery success rate is very low for this category. Consider a fundamentally different approach.
