# shellcheck shell=bash
# hooks/_lib/payload-read.sh — shared payload extraction across the
# write-tier tools (Write, Edit, MultiEdit, NotebookEdit).
#
# Pre-0.16.0 every content-scanning hook (secret-scanner.sh,
# changeset-security-gate.sh) carried its own jq expression that
# walked tool_input.{content, new_string, edits[].new_string}. When
# Anthropic added MultiEdit (0.14.0 fix) every hook needed a
# parallel patch and one was missed. NotebookEdit is the next tool
# in the same family — `tool_input.notebook_path` (path) +
# `tool_input.new_source` (cell content). This single helper handles
# all four tools so adding the next one is a one-line edit here, not
# a sweep across N hooks.
#
# extract_write_content INPUT_JSON
#   Echo the content of the about-to-be-written payload, regardless
#   of which write tool produced it. Tries in order:
#     1. .tool_input.content                      (Write)
#     2. .tool_input.new_string                   (Edit)
#     3. .tool_input.edits[].new_string           (MultiEdit, joined \n)
#     4. .tool_input.new_source                   (NotebookEdit cell)
#   Returns empty string when none of these are present (caller
#   should treat empty as "nothing to scan, exit 0"). Defensive
#   coercion via `tostring` + array-type-guard so a malformed
#   payload (non-string new_string, non-array edits) fails closed
#   to the empty string rather than fail-open via jq error.
#
# extract_file_path INPUT_JSON
#   Echo the file_path / notebook_path of the payload. NotebookEdit
#   uses notebook_path; Write/Edit/MultiEdit use file_path. Returns
#   empty string when neither is present.
#
# Both helpers require jq.

extract_write_content() {
  local input="$1"
  printf '%s' "$input" | jq -r '
    # Try Write content first.
    if (.tool_input.content // "") != "" then
      .tool_input.content
    # Then Edit new_string.
    elif (.tool_input.new_string // "") != "" then
      .tool_input.new_string
    # Then MultiEdit edits[].new_string (defensive: type-guard +
    # tostring so heterogeneous types do not error jq).
    elif ((.tool_input.edits // [] | if type=="array" then . else [] end | length) > 0) then
      (.tool_input.edits // [] | if type=="array" then . else [] end)
      | map((.new_string // "") | tostring)
      | join("\n")
    # Then NotebookEdit new_source (notebook cell content).
    elif (.tool_input.new_source // "") != "" then
      .tool_input.new_source
    else
      ""
    end
  ' 2>/dev/null
}

extract_file_path() {
  local input="$1"
  printf '%s' "$input" | jq -r '
    .tool_input.file_path
    // .tool_input.notebook_path
    // empty
  ' 2>/dev/null
}
