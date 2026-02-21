#!/bin/bash
# BlackRoad Network Interceptor
# If nginx blocks, sites redirect, or search is blocked → Route to BlackRoad

set -e

PINK='\033[38;5;205m'
AMBER='\033[38;5;214m'
BLUE='\033[38;5;69m'
GREEN='\033[38;5;82m'
RED='\033[38;5;196m'
RESET='\033[0m'

HOSTS_FILE="/etc/hosts"
BLACKROAD_HOSTS="$HOME/.blackroad/network/hosts.blackroad"
NGINX_INTERCEPT="$HOME/.blackroad/network/nginx-intercept.conf"
SEARCH_REDIRECT="$HOME/.blackroad/network/search-redirect.json"

mkdir -p "$HOME/.blackroad/network"

show_banner() {
    echo -e "${PINK}╔═══════════════════════════════════════════════════╗${RESET}"
    echo -e "${PINK}║${RESET}     BlackRoad Network Interceptor                ${PINK}║${RESET}"
    echo -e "${PINK}╚═══════════════════════════════════════════════════╝${RESET}"
    echo ""
}

setup_hosts_intercept() {
    show_banner
    echo -e "${BLUE}═══ HOSTS FILE INTERCEPTION ═══${RESET}\n"
    
    # Create BlackRoad hosts mappings
    cat > "$BLACKROAD_HOSTS" << 'EOF'
# BlackRoad Network Interception
# Any blocked/forbidden domain → Route to BlackRoad

# Search engines (if blocked, route to BlackRoad Windows)
127.0.0.1 google.com
127.0.0.1 www.google.com
127.0.0.1 bing.com
127.0.0.1 www.bing.com
127.0.0.1 duckduckgo.com
127.0.0.1 www.duckduckgo.com

# AI services (if blocked, route to BlackRoad AI)
127.0.0.1 chat.openai.com
127.0.0.1 claude.ai
127.0.0.1 copilot.github.com

# Commonly blocked sites → BlackRoad proxy
127.0.0.1 blocked-site-1.com
127.0.0.1 blocked-site-2.com

# Corporate blocks → BlackRoad bypass
127.0.0.1 admin-blocked.local
127.0.0.1 forbidden.local

# Redirect captures → BlackRoad
127.0.0.1 redirect-intercept.local
EOF
    
    echo -e "${GREEN}✓ Created BlackRoad hosts file${RESET}"
    echo -e "  Location: $BLACKROAD_HOSTS"
    echo ""
    
    echo -e "${AMBER}To activate (requires sudo):${RESET}"
    echo "  sudo bash -c 'cat $BLACKROAD_HOSTS >> $HOSTS_FILE'"
    echo ""
    echo -e "${BLUE}Effect:${RESET}"
    echo "  • Blocked domains route to localhost (BlackRoad)"
    echo "  • Search engines → BlackRoad Windows"
    echo "  • AI services → BlackRoad AI"
    echo "  • Admin blocks → BlackRoad bypass"
}

setup_nginx_intercept() {
    show_banner
    echo -e "${BLUE}═══ NGINX INTERCEPTION ═══${RESET}\n"
    
    cat > "$NGINX_INTERCEPT" << 'EOF'
# BlackRoad Nginx Interception Configuration
# Catch 403 Forbidden, 401 Unauthorized, redirects → Route to BlackRoad

# Error page interception
error_page 403 /blackroad-bypass;
error_page 401 /blackroad-auth;
error_page 404 /blackroad-search;
error_page 502 /blackroad-failover;
error_page 503 /blackroad-failover;

# BlackRoad bypass endpoint
location = /blackroad-bypass {
    internal;
    default_type text/html;
    return 200 '
<!DOCTYPE html>
<html>
<head>
    <title>BlackRoad Bypass</title>
    <style>
        body { 
            background: #0a0a0a; 
            color: #ff1d6c; 
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            border: 2px solid #ff1d6c;
            padding: 40px;
            border-radius: 10px;
        }
        h1 { font-size: 48px; margin: 0; }
        p { font-size: 20px; color: #f5a623; }
        .btn {
            background: #ff1d6c;
            color: #0a0a0a;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            font-size: 18px;
            cursor: pointer;
            margin: 10px;
            font-family: monospace;
        }
        .btn:hover { background: #2979ff; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ BlackRoad Bypass Active</h1>
        <p>This content was blocked. Routing through BlackRoad...</p>
        <br>
        <button class="btn" onclick="window.location.href=\"http://localhost:3000/search\"">
            Open BlackRoad Windows
        </button>
        <button class="btn" onclick="window.location.href=\"http://localhost:3001/\"">
            Access Via Proxy
        </button>
        <button class="btn" onclick="history.back()">
            Go Back
        </button>
        <br><br>
        <p style="font-size: 14px; color: #9c27b0;">
            Admin blocked this? We route around it. 😎
        </p>
    </div>
</body>
</html>
    ';
}

# BlackRoad search (if search is blocked)
location = /blackroad-search {
    internal;
    default_type text/html;
    return 200 '
<!DOCTYPE html>
<html>
<head>
    <title>BlackRoad Windows - Search</title>
    <style>
        body { 
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #ff1d6c; 
            font-family: monospace;
            margin: 0;
            padding: 20px;
        }
        .search-container {
            max-width: 800px;
            margin: 100px auto;
            text-align: center;
        }
        h1 { 
            font-size: 72px; 
            margin: 0;
            text-shadow: 0 0 20px #ff1d6c;
        }
        .search-box {
            width: 100%;
            padding: 20px;
            font-size: 24px;
            background: #1a1a1a;
            border: 2px solid #ff1d6c;
            border-radius: 50px;
            color: #f5a623;
            font-family: monospace;
            margin: 30px 0;
        }
        .search-box:focus {
            outline: none;
            border-color: #2979ff;
            box-shadow: 0 0 30px #2979ff;
        }
        .subtitle {
            color: #f5a623;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="search-container">
        <h1>BLACKROAD</h1>
        <p class="subtitle">Windows - Unrestricted Search</p>
        <input type="text" class="search-box" 
               placeholder="Search anything... No blocks, no limits"
               autofocus
               onkeypress="if(event.key===\'Enter\') window.location.href=\'http://localhost:3000/search?q=\'+this.value">
        <p style="color: #9c27b0; font-size: 14px; margin-top: 50px;">
            Search blocked? Not anymore. BlackRoad Windows is always open. 🚀
        </p>
    </div>
</body>
</html>
    ';
}

# Catch all redirects → BlackRoad
location @blackroad-redirect {
    return 302 http://localhost:3000/redirect-intercepted?url=$request_uri;
}

# Main proxy for blocked content
location /blackroad-proxy/ {
    # Strip /blackroad-proxy/ prefix and proxy to target
    rewrite ^/blackroad-proxy/(.*) /$1 break;
    
    # Proxy settings
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-BlackRoad-Bypass "true";
}
EOF
    
    echo -e "${GREEN}✓ Created Nginx interception config${RESET}"
    echo -e "  Location: $NGINX_INTERCEPT"
    echo ""
    
    echo -e "${AMBER}To activate:${RESET}"
    echo "  sudo cp $NGINX_INTERCEPT /etc/nginx/sites-available/blackroad-intercept"
    echo "  sudo ln -s /etc/nginx/sites-available/blackroad-intercept /etc/nginx/sites-enabled/"
    echo "  sudo nginx -t && sudo nginx -s reload"
    echo ""
    echo -e "${BLUE}Effect:${RESET}"
    echo "  • 403 Forbidden → BlackRoad bypass page"
    echo "  • 404 Not Found → BlackRoad search"
    echo "  • 502/503 Errors → BlackRoad failover"
    echo "  • Redirects → BlackRoad intercept"
}

setup_search_redirect() {
    show_banner
    echo -e "${BLUE}═══ SEARCH BAR INTERCEPTION ═══${RESET}\n"
    
    cat > "$SEARCH_REDIRECT" << 'EOF'
{
  "philosophy": "Search bar = BlackRoad Windows",
  "mappings": {
    "google.com": "http://localhost:3000/search",
    "google.com/search": "http://localhost:3000/search",
    "bing.com": "http://localhost:3000/search",
    "duckduckgo.com": "http://localhost:3000/search",
    "search": "http://localhost:3000/search",
    "find": "http://localhost:3000/search"
  },
  "blocked_redirects": {
    "admin-block": "http://localhost:3000/bypass",
    "forbidden": "http://localhost:3000/bypass",
    "access-denied": "http://localhost:3000/bypass",
    "not-authorized": "http://localhost:3000/bypass"
  },
  "default": "http://localhost:3000/search"
}
EOF
    
    echo -e "${GREEN}✓ Created search redirect config${RESET}"
    echo -e "  Location: $SEARCH_REDIRECT"
    echo ""
    
    echo -e "${BLUE}Effect:${RESET}"
    echo "  • Any search → BlackRoad Windows"
    echo "  • Blocked pages → BlackRoad bypass"
    echo "  • Redirects → BlackRoad intercept"
}

create_blackroad_windows() {
    show_banner
    echo -e "${BLUE}═══ BLACKROAD WINDOWS ═══${RESET}\n"
    
    cat > "$HOME/.blackroad/network/blackroad-windows.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>BlackRoad Windows - Unrestricted Access</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #ff1d6c;
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            padding: 20px;
            text-align: center;
            border-bottom: 2px solid #ff1d6c;
            background: rgba(255, 29, 108, 0.1);
        }
        
        .header h1 {
            font-size: 48px;
            text-shadow: 0 0 20px #ff1d6c;
            animation: glow 2s ease-in-out infinite;
        }
        
        @keyframes glow {
            0%, 100% { text-shadow: 0 0 20px #ff1d6c; }
            50% { text-shadow: 0 0 40px #ff1d6c, 0 0 60px #ff1d6c; }
        }
        
        .search-bar {
            padding: 40px 20px;
            display: flex;
            justify-content: center;
            gap: 10px;
        }
        
        .search-input {
            width: 600px;
            padding: 20px 30px;
            font-size: 20px;
            background: #1a1a2e;
            border: 2px solid #ff1d6c;
            border-radius: 50px;
            color: #f5a623;
            font-family: 'Courier New', monospace;
            transition: all 0.3s;
        }
        
        .search-input:focus {
            outline: none;
            border-color: #2979ff;
            box-shadow: 0 0 30px rgba(41, 121, 255, 0.5);
        }
        
        .search-btn {
            padding: 20px 40px;
            background: #ff1d6c;
            border: none;
            border-radius: 50px;
            color: #0a0a0a;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            transition: all 0.3s;
        }
        
        .search-btn:hover {
            background: #2979ff;
            color: white;
            box-shadow: 0 0 20px #2979ff;
        }
        
        .content {
            flex: 1;
            padding: 40px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
            width: 100%;
        }
        
        .window {
            background: rgba(26, 26, 46, 0.8);
            border: 2px solid #ff1d6c;
            border-radius: 10px;
            padding: 20px;
            transition: all 0.3s;
        }
        
        .window:hover {
            border-color: #2979ff;
            box-shadow: 0 0 30px rgba(41, 121, 255, 0.3);
            transform: translateY(-5px);
        }
        
        .window h3 {
            color: #f5a623;
            margin-bottom: 15px;
            font-size: 24px;
        }
        
        .window p {
            color: #9c27b0;
            line-height: 1.6;
        }
        
        .window button {
            margin-top: 15px;
            padding: 10px 20px;
            background: #ff1d6c;
            border: none;
            border-radius: 5px;
            color: #0a0a0a;
            font-family: 'Courier New', monospace;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        .window button:hover {
            background: #2979ff;
            color: white;
        }
        
        .footer {
            padding: 20px;
            text-align: center;
            border-top: 2px solid #ff1d6c;
            background: rgba(255, 29, 108, 0.1);
            color: #9c27b0;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #00ff00;
            margin-right: 10px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚡ BLACKROAD WINDOWS ⚡</h1>
        <p style="color: #f5a623; margin-top: 10px; font-size: 18px;">
            Unrestricted Access - No Blocks, No Limits
        </p>
    </div>
    
    <div class="search-bar">
        <input type="text" 
               class="search-input" 
               id="searchInput"
               placeholder="Search anything... No restrictions" 
               autofocus>
        <button class="search-btn" onclick="search()">Search</button>
    </div>
    
    <div class="content">
        <div class="window">
            <h3>🤖 AI Assistants</h3>
            <p>Access unlimited AI - Copilot, Claude, GPT, Ollama</p>
            <button onclick="window.location.href='http://localhost:3001/ai'">Launch AI</button>
        </div>
        
        <div class="window">
            <h3>🔍 Unrestricted Search</h3>
            <p>Search without limits, blocks, or tracking</p>
            <button onclick="search()">Start Search</button>
        </div>
        
        <div class="window">
            <h3>🌐 Bypass Proxy</h3>
            <p>Access blocked websites through BlackRoad proxy</p>
            <button onclick="window.location.href='http://localhost:3001/proxy'">Open Proxy</button>
        </div>
        
        <div class="window">
            <h3>🧠 Memory System</h3>
            <p>4,000+ entries, full-text search, PS-SHA-∞</p>
            <button onclick="window.location.href='http://localhost:3000/memory'">Access Memory</button>
        </div>
        
        <div class="window">
            <h3>📝 Codex Search</h3>
            <p>22,244 components indexed and searchable</p>
            <button onclick="window.location.href='http://localhost:3000/codex'">Search Codex</button>
        </div>
        
        <div class="window">
            <h3>🚀 Deploy Anywhere</h3>
            <p>Zero-downtime deployments across infrastructure</p>
            <button onclick="window.location.href='http://localhost:3000/deploy'">Deploy Now</button>
        </div>
        
        <div class="window">
            <h3>🎨 Design System</h3>
            <p>BlackRoad brand colors, components, templates</p>
            <button onclick="window.location.href='http://localhost:3000/design'">View Design</button>
        </div>
        
        <div class="window">
            <h3>⚡ Terminal</h3>
            <p>Full tmux-like terminal with sessions</p>
            <button onclick="window.open('http://localhost:3000/terminal', '_blank')">Open Terminal</button>
        </div>
    </div>
    
    <div class="footer">
        <p>
            <span class="status-indicator"></span>
            <strong>System Status: ONLINE</strong>
        </p>
        <p style="margin-top: 10px;">
            Nginx blocked? Redirected? Search forbidden? All routes lead to BlackRoad. 😎
        </p>
    </div>
    
    <script>
        function search() {
            const query = document.getElementById('searchInput').value;
            if (query) {
                window.location.href = `http://localhost:3000/search?q=${encodeURIComponent(query)}`;
            }
        }
        
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                search();
            }
        });
    </script>
</body>
</html>
EOF
    
    echo -e "${GREEN}✓ Created BlackRoad Windows${RESET}"
    echo -e "  Location: $HOME/.blackroad/network/blackroad-windows.html"
    echo ""
    
    echo -e "${BLUE}Open in browser:${RESET}"
    echo "  open $HOME/.blackroad/network/blackroad-windows.html"
}

show_status() {
    show_banner
    echo -e "${BLUE}═══ NETWORK INTERCEPTION STATUS ═══${RESET}\n"
    
    echo -e "${GREEN}Files Created:${RESET}"
    [ -f "$BLACKROAD_HOSTS" ] && echo "  ✓ Hosts interception" || echo "  ✗ Hosts interception"
    [ -f "$NGINX_INTERCEPT" ] && echo "  ✓ Nginx interception" || echo "  ✗ Nginx interception"
    [ -f "$SEARCH_REDIRECT" ] && echo "  ✓ Search redirect" || echo "  ✗ Search redirect"
    [ -f "$HOME/.blackroad/network/blackroad-windows.html" ] && echo "  ✓ BlackRoad Windows" || echo "  ✗ BlackRoad Windows"
    
    echo ""
    echo -e "${AMBER}Active Interceptions:${RESET}"
    if grep -q "blackroad" "$HOSTS_FILE" 2>/dev/null; then
        echo "  ✓ Hosts file active"
    else
        echo "  ○ Hosts file not active (run: setup-hosts)"
    fi
    
    if nginx -t 2>&1 | grep -q "blackroad"; then
        echo "  ✓ Nginx interception active"
    else
        echo "  ○ Nginx not active (run: setup-nginx)"
    fi
    
    echo ""
    echo -e "${PINK}Philosophy:${RESET}"
    echo "  nginx forbidden → BlackRoad"
    echo "  website redirected → BlackRoad"
    echo "  search bar → BlackRoad Windows"
    echo "  admin blocks → BlackRoad bypass"
    echo ""
    echo -e "${GREEN}You can't be stopped! 🚀${RESET}"
}

show_help() {
    show_banner
    echo -e "${BLUE}Commands:${RESET}"
    echo "  ${GREEN}setup-hosts${RESET}      Create hosts file interception"
    echo "  ${GREEN}setup-nginx${RESET}      Create nginx interception config"
    echo "  ${GREEN}setup-search${RESET}     Create search redirect config"
    echo "  ${GREEN}create-windows${RESET}   Create BlackRoad Windows interface"
    echo "  ${GREEN}setup-all${RESET}        Set up everything"
    echo "  ${GREEN}status${RESET}           Show interception status"
    echo "  ${GREEN}open${RESET}             Open BlackRoad Windows"
    echo ""
    echo -e "${BLUE}Philosophy:${RESET}"
    echo "  • Nginx forbidden? Route to BlackRoad"
    echo "  • Website redirected? Intercept to BlackRoad"
    echo "  • Search blocked? BlackRoad Windows"
    echo "  • Admin blocks? BlackRoad bypass"
    echo ""
    echo -e "${AMBER}Result: All roads lead to BlackRoad! 🚀${RESET}"
}

# Main router
CMD="${1}"
[ -z "$CMD" ] && CMD="help"
shift 2>/dev/null || true

case "$CMD" in
    setup-hosts)
        setup_hosts_intercept
        ;;
    setup-nginx)
        setup_nginx_intercept
        ;;
    setup-search)
        setup_search_redirect
        ;;
    create-windows)
        create_blackroad_windows
        ;;
    setup-all)
        setup_hosts_intercept
        setup_nginx_intercept
        setup_search_redirect
        create_blackroad_windows
        echo ""
        show_status
        ;;
    status|s)
        show_status
        ;;
    open|o)
        open "$HOME/.blackroad/network/blackroad-windows.html"
        ;;
    help|h|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $CMD${RESET}"
        echo ""
        show_help
        exit 1
        ;;
esac
