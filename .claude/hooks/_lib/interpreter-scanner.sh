# shellcheck shell=bash
# hooks/_lib/interpreter-scanner.sh — extract write-operation targets
# from interpreter `-e` / `--eval` invocations.
#
# 0.21.2 helix-022 #2: shared between blocked-paths-bash-gate.sh and
# protected-paths-bash-gate.sh. Pre-fix the protected gate had no
# interpreter scanner — `node -e "fs.writeFileSync('.rea/HALT','x')"`
# bypassed the protected-path check while the soft blocked-paths gate
# (which had its own copy of the scanner) caught equivalent writes
# against soft-list paths.
#
# Coverage:
#   node -e | --eval | -p | --print   (also fs.writeFile / appendFile
#                                       / createWriteStream variants)
#   python | python2 | python3 -c     (open(...,'w'), pathlib.write_*)
#   ruby -e                            (File.write, IO.write)
#   perl -e                            (open + print, syswrite)
#
# Returns: stdout — one path per line, raw (post-quote-strip but no
# normalization). Caller passes each through their own _normalize_target
# / _check_token / rea_path_is_protected pipeline.

# Extract write targets from an interpreter -e / --eval invocation.
# Usage: rea_interpreter_write_targets "$segment"
#        Returns each path on a separate line on stdout.
#        No output means no interpreter-write-shape was detected.
rea_interpreter_write_targets() {
  local segment="$1"

  # Node — fs.writeFileSync / fs.writeFile / fs.appendFileSync /
  #        fs.appendFile / fs.createWriteStream
  if [[ "$segment" =~ (^|[[:space:]])node[[:space:]]+(-e|--eval|-p|--print)[[:space:]]+ ]]; then
    printf '%s' "$segment" \
      | grep -oE "fs\.(writeFileSync|writeFile|appendFileSync|appendFile|createWriteStream)\([[:space:]]*[\"'][^\"']+[\"']" \
      | sed -E "s/.*\([[:space:]]*[\"']([^\"']+)[\"'].*/\\1/" \
      || true
  fi

  # Python — open(PATH, 'w'|'wb'|'a'|'ab'|'w+'|'r+'|'x'|'xb') |
  #          pathlib.Path(PATH).write_text|.write_bytes
  if [[ "$segment" =~ (^|[[:space:]])python[23]?[[:space:]]+(-c) ]]; then
    # open(...,'w'-style)
    printf '%s' "$segment" \
      | grep -oE "open\([[:space:]]*[\"'][^\"']+[\"'][[:space:]]*,[[:space:]]*[\"'](w|wb|a|ab|w\+|r\+|x|xb)[\"']" \
      | sed -E "s/open\([[:space:]]*[\"']([^\"']+)[\"'].*/\\1/" \
      || true
    # pathlib write_text / write_bytes
    printf '%s' "$segment" \
      | grep -oE "Path\([[:space:]]*[\"'][^\"']+[\"'][[:space:]]*\)\.(write_text|write_bytes)" \
      | sed -E "s/Path\([[:space:]]*[\"']([^\"']+)[\"'].*/\\1/" \
      || true
  fi

  # Ruby — File.write(PATH, ...) | IO.write(PATH, ...)
  if [[ "$segment" =~ (^|[[:space:]])ruby[[:space:]]+(-e) ]]; then
    printf '%s' "$segment" \
      | grep -oE "(File|IO)\.write\([[:space:]]*[\"'][^\"']+[\"']" \
      | sed -E "s/.*\([[:space:]]*[\"']([^\"']+)[\"'].*/\\1/" \
      || true
  fi

  # Perl — open(FH, '>file') | open(FH, '>>file') | sysopen(... O_WRONLY)
  # Conservative: capture the literal `>file` / `>>file` form, which is
  # the common shell-style spelling Perl accepts in 2-arg open.
  if [[ "$segment" =~ (^|[[:space:]])perl[[:space:]]+(-e) ]]; then
    printf '%s' "$segment" \
      | grep -oE "open\([[:space:]]*[A-Z_]+,[[:space:]]*[\"']>{1,2}[^\"']+[\"']" \
      | sed -E "s/.*[\"']>+([^\"']+)[\"'].*/\\1/" \
      || true
  fi
}
