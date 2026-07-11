#!/bin/bash
# GoDaddy Server Capability Check Script
# Run this on your LOCAL machine (Mac/Linux/Windows with Git Bash)

echo "======================================"
echo "PBG Social - GoDaddy Server Check"
echo "======================================"
echo ""

# SSH credentials
SSH_USER="g2dyxj8rsnqr"
SSH_HOST="72.167.211.68"
SSH_PORT="22"

echo "Connecting to $SSH_HOST..."
echo ""

# Run comprehensive check
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << 'EOF'
echo "✓ SSH Connection successful!"
echo ""
echo "=== SYSTEM INFO ==="
echo "Hostname: $(hostname)"
echo "OS: $(uname -s)"
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo ""

echo "=== USER INFO ==="
echo "Current user: $(whoami)"
echo "Home directory: $HOME"
echo "User groups: $(groups)"
echo ""

echo "=== SUDO ACCESS ==="
if sudo -n true 2>/dev/null; then
    echo "✓ Has sudo access (passwordless)"
elif sudo -l 2>/dev/null | grep -q "(ALL)"; then
    echo "✓ Has sudo access (with password)"
else
    echo "✗ No sudo access"
fi
echo ""

echo "=== INSTALLED SOFTWARE ==="

# Check Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js: $(node --version)"
else
    echo "✗ Node.js: Not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✓ npm: $(npm --version)"
else
    echo "✗ npm: Not installed"
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo "✓ Docker: $(docker --version 2>&1 | head -1)"
else
    echo "✗ Docker: Not installed"
fi

# Check Git
if command -v git &> /dev/null; then
    echo "✓ Git: $(git --version)"
else
    echo "✗ Git: Not installed"
fi

# Check Python
if command -v python3 &> /dev/null; then
    echo "✓ Python: $(python3 --version)"
elif command -v python &> /dev/null; then
    echo "✓ Python: $(python --version)"
else
    echo "✗ Python: Not installed"
fi

# Check PHP
if command -v php &> /dev/null; then
    echo "✓ PHP: $(php --version | head -1)"
else
    echo "✗ PHP: Not installed"
fi

# Check MySQL/MariaDB
if command -v mysql &> /dev/null; then
    echo "✓ MySQL: $(mysql --version)"
else
    echo "✗ MySQL: Not installed"
fi

echo ""
echo "=== PACKAGE MANAGERS ==="
if command -v apt-get &> /dev/null; then
    echo "✓ apt-get available (Debian/Ubuntu)"
elif command -v yum &> /dev/null; then
    echo "✓ yum available (RedHat/CentOS)"
elif command -v apk &> /dev/null; then
    echo "✓ apk available (Alpine)"
else
    echo "✗ No standard package manager found"
fi

echo ""
echo "=== SYSTEM RESOURCES ==="
echo "--- Memory ---"
free -h 2>/dev/null || echo "free command not available"
echo ""
echo "--- Disk Space ---"
df -h . | tail -1
echo ""

echo "=== NETWORK INFO ==="
echo "Open ports (listening services):"
if command -v netstat &> /dev/null; then
    netstat -tuln 2>/dev/null | grep LISTEN | head -10
elif command -v ss &> /dev/null; then
    ss -tuln 2>/dev/null | grep LISTEN | head -10
else
    echo "netstat/ss not available"
fi
echo ""

echo "=== PERMISSIONS CHECK ==="
# Check if we can write to home directory
if [ -w "$HOME" ]; then
    echo "✓ Can write to home directory"
    # Try creating a test directory
    if mkdir -p "$HOME/test_pbg_deploy" 2>/dev/null; then
        echo "✓ Can create directories"
        rmdir "$HOME/test_pbg_deploy"
    else
        echo "✗ Cannot create directories"
    fi
else
    echo "✗ Cannot write to home directory"
fi

# Check if we can run background processes
if command -v nohup &> /dev/null; then
    echo "✓ Can run background processes (nohup available)"
else
    echo "? nohup not available (might still work)"
fi

echo ""
echo "=== RUNNING PROCESSES ==="
echo "Web servers running:"
ps aux | grep -E "(httpd|apache|nginx)" | grep -v grep | head -5
echo ""

echo "======================================"
echo "Check complete!"
echo "======================================"
echo ""
echo "Please share this ENTIRE output with me."
EOF

echo ""
echo "If the connection failed, make sure:"
echo "1. SSH is enabled in cPanel"
echo "2. Password is correct"
echo "3. You're connected to the internet"
