#!/bin/bash

# Setup script for powerdrill-mcp

echo "Setting up Powerdrill MCP server..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the TypeScript code
echo "Building TypeScript code..."
npm run build

# Check if .env file exists, if not create it from example
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cp .env.example .env
  echo "Please edit .env file with your Powerdrill credentials"
fi

# Create claude_desktop_config.json if it doesn't exist
if [ ! -f claude_desktop_config.json ]; then
  echo "Creating Claude Desktop configuration file..."
  cat > claude_desktop_config.json << EOL
{
  "powerdrill": {
    "command": "node",
    "args": ["$(pwd)/dist/index.js"],
    "env": {
      "POWERDRILL_USER_ID": "${POWERDRILL_USER_ID:-your_user_id}",
      "POWERDRILL_PROJECT_API_KEY": "${POWERDRILL_PROJECT_API_KEY:-your_project_api_key}"
    }
  }
}
EOL
  echo "Created Claude Desktop configuration at $(pwd)/claude_desktop_config.json"
  echo "Copy this file to Claude Desktop configuration folder or update with your credentials"
fi

# Create cursor_config.json if it doesn't exist
if [ ! -f cursor_config.json ]; then
  echo "Creating Cursor configuration file..."
  cat > cursor_config.json << EOL
{
  "powerdrill": {
    "command": "node",
    "args": ["$(pwd)/dist/index.js"],
    "env": {
      "POWERDRILL_USER_ID": "${POWERDRILL_USER_ID:-your_user_id}",
      "POWERDRILL_PROJECT_API_KEY": "${POWERDRILL_PROJECT_API_KEY:-your_project_api_key}"
    }
  }
}
EOL
  echo "Created Cursor configuration at $(pwd)/cursor_config.json"
  echo "Use this file to configure Cursor MCP Tools"
fi

echo "Setup complete!"
echo ""
echo "To run the server:"
echo "npm start"
echo ""
echo "To configure Claude Desktop:"
echo "1. Open Claude Desktop"
echo "2. Go to Settings > Server Settings"
echo "3. Either update your configuration file or use the created claude_desktop_config.json"
echo "4. Restart Claude Desktop"
echo ""
echo "To configure Cursor:"
echo "1. Open Cursor"
echo "2. Go to Settings > MCP Tools"
echo "3. Use the created cursor_config.json"
echo "4. Restart Cursor if needed" 