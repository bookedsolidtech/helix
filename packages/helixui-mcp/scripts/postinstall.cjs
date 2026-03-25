// postinstall — print MCP configuration instructions after npm install
'use strict';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';

function print(msg) {
  process.stdout.write(msg + '\n');
}

print('');
print(`${BOLD}${CYAN}@helixui/mcp installed!${RESET}`);
print('');
print('Add the MCP server to your editor:');
print('');
print(`${BOLD}Claude Code (.mcp.json)${RESET}`);
print(`${DIM}Create .mcp.json in your project root:${RESET}`);
print('');
print(`${GREEN}{
  "mcpServers": {
    "helixui": {
      "command": "helixui-mcp",
      "env": {
        "HELIXUI_MCP_PROJECT_ROOT": "\${workspaceFolder}"
      }
    }
  }
}${RESET}`);
print('');
print(`${BOLD}Cursor (settings.json)${RESET}`);
print(`${DIM}Add to .cursor/mcp.json:${RESET}`);
print('');
print(`${GREEN}{
  "mcpServers": {
    "helixui": {
      "command": "helixui-mcp",
      "env": {
        "HELIXUI_MCP_PROJECT_ROOT": "\${workspaceFolder}"
      }
    }
  }
}${RESET}`);
print('');
print(`${DIM}Run \`helixui-mcp-cli check\` to verify your setup.${RESET}`);
print('');
