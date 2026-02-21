#!/usr/bin/env python3
"""
BlackRoad Fleet Command Center
Unified interface for Pi cluster management
"""

import http.server
import socketserver
import json
import subprocess
import urllib.request
import urllib.error
from urllib.parse import parse_qs, urlparse
import os
import threading
import time

PORT = 9000

# Pi fleet configuration
FLEET = {
    "aria": {"ip": "192.168.4.82", "role": "Web Services", "color": "#FF9D00"},
    "lucidia": {"ip": "192.168.4.81", "role": "NATS Brain", "color": "#FF0066"},
    "alice": {"ip": "192.168.4.49", "role": "K3s Cluster", "color": "#D600AA"},
    "octavia": {"ip": "192.168.4.38", "role": "Hailo-8 NPU", "color": "#7700FF"},
    "cecilia": {"ip": "192.168.4.89", "role": "Hailo-8 NPU", "color": "#0066FF"}
}

def execute_ssh_command(host, command):
    """Execute command on remote host via SSH"""
    try:
        result = subprocess.run(
            ["ssh", "-o", "ConnectTimeout=5", host, command],
            capture_output=True,
            text=True,
            timeout=30
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def get_pi_metrics(host):
    """Get comprehensive metrics from a Pi"""
    commands = {
        "uptime": "uptime",
        "load": "cat /proc/loadavg",
        "memory": "free -m",
        "disk": "df -h /",
        "cpu_temp": "vcgencmd measure_temp 2>/dev/null || echo 'N/A'",
        "processes": "ps aux --sort=-%cpu | head -6",
        "docker": "docker ps --format '{{.Names}}' 2>/dev/null | wc -l",
        "ollama": "pgrep ollama >/dev/null && echo 'running' || echo 'stopped'",
        "services": "systemctl list-units --type=service --state=running | wc -l"
    }
    
    metrics = {}
    for key, cmd in commands.items():
        result = execute_ssh_command(host, cmd)
        if result["success"]:
            metrics[key] = result["stdout"].strip()
        else:
            metrics[key] = "error"
    
    return metrics

def deploy_to_pi(host, service):
    """Deploy a service to a Pi"""
    deploy_commands = {
        "fleet-monitor": [
            "pkill -f blackroad-fleet-monitor || true",
            "nohup python3 ~/blackroad-fleet-monitor.py > /tmp/fleet-monitor.log 2>&1 &"
        ],
        "llm-api": [
            "pkill -f blackroad-llm-api || true",
            "nohup python3 ~/blackroad-llm-api.py > /tmp/llm-api.log 2>&1 &"
        ],
        "restart-ollama": ["sudo systemctl restart ollama"],
        "update-system": ["sudo apt update && sudo apt upgrade -y"],
        "reboot": ["sudo reboot"]
    }
    
    if service not in deploy_commands:
        return {"success": False, "error": "Unknown service"}
    
    results = []
    for cmd in deploy_commands[service]:
        result = execute_ssh_command(host, cmd)
        results.append(result)
    
    return {
        "success": all(r["success"] for r in results),
        "results": results
    }

class CommandCenterHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # API: Fleet status
        if parsed_path.path == '/api/fleet':
            fleet_status = {}
            for name, info in FLEET.items():
                metrics = get_pi_metrics(name)
                fleet_status[name] = {
                    **info,
                    "metrics": metrics,
                    "online": metrics.get("uptime") != "error"
                }
            
            self.send_json_response(fleet_status)
        
        # API: LLM Cluster health
        elif parsed_path.path == '/api/llm/health':
            health = {}
            for name in FLEET.keys():
                try:
                    url = f"http://{name}:11434/api/tags"
                    req = urllib.request.Request(url)
                    with urllib.request.urlopen(req, timeout=2) as response:
                        health[name] = True
                except:
                    health[name] = False
            
            self.send_json_response(health)
        
        # API: Execute command
        elif parsed_path.path.startswith('/api/exec/'):
            parts = parsed_path.path.split('/')
            if len(parts) >= 4:
                host = parts[3]
                query = parse_qs(parsed_path.query)
                cmd = query.get('cmd', [''])[0]
                
                if host in FLEET and cmd:
                    result = execute_ssh_command(host, cmd)
                    self.send_json_response(result)
                else:
                    self.send_error(400, "Invalid host or command")
            else:
                self.send_error(400, "Invalid path")
        
        # Main UI
        elif parsed_path.path == '/' or parsed_path.path == '/index.html':
            self.send_command_center_ui()
        
        else:
            self.send_error(404, "Not found")
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        # API: Deploy service
        if self.path == '/api/deploy':
            try:
                data = json.loads(post_data.decode('utf-8'))
                host = data.get('host')
                service = data.get('service')
                
                if host in FLEET:
                    result = deploy_to_pi(host, service)
                    self.send_json_response(result)
                else:
                    self.send_json_response({"success": False, "error": "Invalid host"})
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e)})
        
        # API: Execute command
        elif self.path == '/api/command':
            try:
                data = json.loads(post_data.decode('utf-8'))
                host = data.get('host')
                command = data.get('command')
                
                if host in FLEET and command:
                    result = execute_ssh_command(host, command)
                    self.send_json_response(result)
                else:
                    self.send_json_response({"success": False, "error": "Invalid request"})
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e)})
        
        else:
            self.send_error(404, "Not found")
    
    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))
    
    def send_command_center_ui(self):
        html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BlackRoad Fleet Command Center</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'JetBrains Mono', monospace;
      background: #000;
      color: #fff;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(90deg, #FF9D00, #FF0066, #7700FF, #0066FF);
      padding: 13px 21px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 21px rgba(0, 102, 255, 0.3);
    }
    
    .title {
      font-size: 1.5rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #00ff00;
      box-shadow: 0 0 10px #00ff00;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .header-stats {
      display: flex;
      gap: 21px;
      font-size: 0.9rem;
    }
    
    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .stat-label {
      font-size: 0.7rem;
      opacity: 0.7;
    }
    
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 8px;
      height: calc(100vh - 60px);
      padding: 8px;
    }
    
    .panel {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 13px;
      padding: 13px;
      overflow-y: auto;
      backdrop-filter: blur(13px);
    }
    
    .panel-title {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 13px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .pi-card {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 13px;
      margin-bottom: 8px;
      border-left: 4px solid;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .pi-card:hover {
      transform: translateX(5px);
      background: rgba(0, 0, 0, 0.5);
    }
    
    .pi-card.offline {
      opacity: 0.5;
      border-left-color: #666 !important;
    }
    
    .pi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .pi-name {
      font-weight: 700;
      font-size: 1.1rem;
    }
    
    .pi-role {
      font-size: 0.8rem;
      opacity: 0.7;
    }
    
    .pi-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      font-size: 0.75rem;
      margin-top: 8px;
    }
    
    .metric {
      display: flex;
      justify-content: space-between;
    }
    
    .metric-label {
      opacity: 0.7;
    }
    
    .metric-value {
      font-weight: 600;
    }
    
    .btn {
      padding: 5px 13px;
      background: linear-gradient(90deg, #7700FF, #0066FF);
      border: none;
      border-radius: 5px;
      color: white;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn:hover {
      transform: scale(1.05);
    }
    
    .btn-small {
      padding: 3px 8px;
      font-size: 0.7rem;
    }
    
    .terminal {
      background: #000;
      border-radius: 8px;
      padding: 13px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      height: 200px;
      overflow-y: auto;
    }
    
    .terminal-line {
      margin-bottom: 3px;
      word-wrap: break-word;
    }
    
    .terminal-input {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    
    input, select {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 5px;
      padding: 8px;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
    }
    
    input {
      flex: 1;
    }
    
    .quick-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    
    .action-btn {
      padding: 8px;
      font-size: 0.75rem;
    }
    
    .large-panel {
      grid-column: span 2;
    }
    
    .llm-status {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .llm-node {
      flex: 1;
      text-align: center;
      padding: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 5px;
      font-size: 0.75rem;
    }
    
    .llm-node.online {
      border: 2px solid #00ff00;
    }
    
    .llm-node.offline {
      border: 2px solid #ff0000;
      opacity: 0.5;
    }
    
    .logs {
      font-size: 0.7rem;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">
      <span class="status-indicator"></span>
      🎮 BLACKROAD FLEET COMMAND CENTER
    </div>
    <div class="header-stats">
      <div class="stat">
        <div class="stat-value" id="onlineCount">-</div>
        <div class="stat-label">ONLINE</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="cpuLoad">-</div>
        <div class="stat-label">AVG LOAD</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="llmNodes">-</div>
        <div class="stat-label">LLM NODES</div>
      </div>
    </div>
  </div>
  
  <div class="main-grid">
    <!-- Fleet Status -->
    <div class="panel">
      <div class="panel-title">
        <span>📊 FLEET STATUS</span>
        <button class="btn btn-small" onclick="refreshFleet()">🔄</button>
      </div>
      <div id="fleetList"></div>
    </div>
    
    <!-- LLM Cluster -->
    <div class="panel">
      <div class="panel-title">
        <span>🤖 LLM CLUSTER</span>
        <button class="btn btn-small" onclick="refreshLLM()">🔄</button>
      </div>
      <div class="llm-status" id="llmStatus"></div>
      <div style="margin-top: 13px;">
        <textarea id="llmPrompt" placeholder="Send prompt to cluster..." style="width: 100%; height: 80px; resize: vertical;"></textarea>
        <button class="btn" onclick="sendLLMPrompt()" style="width: 100%; margin-top: 8px;">🚀 Send to Cluster</button>
      </div>
      <div id="llmResponse" style="margin-top: 13px; font-size: 0.75rem;"></div>
    </div>
    
    <!-- Quick Actions -->
    <div class="panel">
      <div class="panel-title">⚡ QUICK ACTIONS</div>
      <div class="quick-actions">
        <button class="btn action-btn" onclick="deployAll('fleet-monitor')">📊 Deploy Monitor</button>
        <button class="btn action-btn" onclick="deployAll('llm-api')">🤖 Deploy LLM API</button>
        <button class="btn action-btn" onclick="restartOllama()">🔄 Restart Ollama</button>
        <button class="btn action-btn" onclick="checkHealth()">💚 Health Check</button>
        <button class="btn action-btn" onclick="updateAll()">⬆️ Update All</button>
        <button class="btn action-btn" onclick="viewLogs()">📋 View Logs</button>
      </div>
    </div>
    
    <!-- Terminal -->
    <div class="panel large-panel">
      <div class="panel-title">
        <span>💻 REMOTE TERMINAL</span>
        <button class="btn btn-small" onclick="clearTerminal()">Clear</button>
      </div>
      <div class="terminal" id="terminal"></div>
      <div class="terminal-input">
        <select id="terminalHost">
          <option value="aria">aria</option>
          <option value="lucidia">lucidia</option>
          <option value="alice">alice</option>
          <option value="octavia">octavia</option>
          <option value="cecilia">cecilia</option>
        </select>
        <input type="text" id="terminalCmd" placeholder="Enter command..." />
        <button class="btn" onclick="executeCommand()">▶</button>
      </div>
    </div>
    
    <!-- System Logs -->
    <div class="panel">
      <div class="panel-title">📋 SYSTEM LOGS</div>
      <div class="logs" id="systemLogs"></div>
    </div>
  </div>
  
  <script>
    let fleetData = {};
    
    async function refreshFleet() {
      try {
        const res = await fetch('/api/fleet');
        fleetData = await res.json();
        
        const fleetList = document.getElementById('fleetList');
        fleetList.innerHTML = '';
        
        let onlineCount = 0;
        let totalLoad = 0;
        
        for (const [name, data] of Object.entries(fleetData)) {
          if (data.online) {
            onlineCount++;
            const load = parseFloat(data.metrics.load?.split(' ')[0] || 0);
            totalLoad += load;
          }
          
          const card = document.createElement('div');
          card.className = 'pi-card' + (data.online ? '' : ' offline');
          card.style.borderLeftColor = data.color;
          card.innerHTML = `
            <div class="pi-header">
              <div>
                <div class="pi-name">${name}</div>
                <div class="pi-role">${data.role}</div>
              </div>
              <button class="btn btn-small" onclick="deployTo('${name}')">Deploy</button>
            </div>
            <div class="pi-metrics">
              <div class="metric">
                <span class="metric-label">Load:</span>
                <span class="metric-value">${data.metrics.load?.split(' ')[0] || 'N/A'}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Ollama:</span>
                <span class="metric-value">${data.metrics.ollama || 'N/A'}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Temp:</span>
                <span class="metric-value">${data.metrics.cpu_temp || 'N/A'}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Docker:</span>
                <span class="metric-value">${data.metrics.docker || '0'}</span>
              </div>
            </div>
          `;
          fleetList.appendChild(card);
        }
        
        document.getElementById('onlineCount').textContent = onlineCount + '/5';
        document.getElementById('cpuLoad').textContent = (totalLoad / onlineCount).toFixed(2);
      } catch (e) {
        console.error('Failed to refresh fleet:', e);
      }
    }
    
    async function refreshLLM() {
      try {
        const res = await fetch('/api/llm/health');
        const health = await res.json();
        
        const llmStatus = document.getElementById('llmStatus');
        llmStatus.innerHTML = '';
        
        let onlineNodes = 0;
        for (const [name, online] of Object.entries(health)) {
          if (online) onlineNodes++;
          
          const node = document.createElement('div');
          node.className = 'llm-node ' + (online ? 'online' : 'offline');
          node.innerHTML = `<strong>${name}</strong><br>${online ? '✓' : '✗'}`;
          llmStatus.appendChild(node);
        }
        
        document.getElementById('llmNodes').textContent = onlineNodes + '/4';
      } catch (e) {
        console.error('Failed to refresh LLM:', e);
      }
    }
    
    async function executeCommand() {
      const host = document.getElementById('terminalHost').value;
      const cmd = document.getElementById('terminalCmd').value;
      
      if (!cmd) return;
      
      const terminal = document.getElementById('terminal');
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.style.color = '#00ff00';
      line.textContent = `[${host}]$ ${cmd}`;
      terminal.appendChild(line);
      
      try {
        const res = await fetch('/api/command', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({host, command: cmd})
        });
        
        const data = await res.json();
        
        const output = document.createElement('div');
        output.className = 'terminal-line';
        output.textContent = data.success ? data.stdout : ('Error: ' + (data.stderr || data.error));
        output.style.color = data.success ? '#fff' : '#ff0000';
        terminal.appendChild(output);
      } catch (e) {
        const error = document.createElement('div');
        error.className = 'terminal-line';
        error.style.color = '#ff0000';
        error.textContent = 'Error: ' + e.message;
        terminal.appendChild(error);
      }
      
      terminal.scrollTop = terminal.scrollHeight;
      document.getElementById('terminalCmd').value = '';
    }
    
    function clearTerminal() {
      document.getElementById('terminal').innerHTML = '';
    }
    
    function deployTo(host) {
      alert(`Deploy menu for ${host} (coming soon)`);
    }
    
    function deployAll(service) {
      alert(`Deploying ${service} to all nodes...`);
    }
    
    function restartOllama() {
      alert('Restarting Ollama on all nodes...');
    }
    
    function checkHealth() {
      refreshFleet();
      refreshLLM();
    }
    
    function updateAll() {
      alert('Updating all systems...');
    }
    
    function viewLogs() {
      alert('Log viewer (coming soon)');
    }
    
    async function sendLLMPrompt() {
      const prompt = document.getElementById('llmPrompt').value;
      if (!prompt) return;
      
      const responseDiv = document.getElementById('llmResponse');
      responseDiv.innerHTML = '⏳ Processing...';
      
      try {
        const res = await fetch('http://localhost:8889/api/generate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({prompt, model: 'llama3:8b'})
        });
        
        const data = await res.json();
        
        if (data.success) {
          responseDiv.innerHTML = `
            <div style="color: #0066FF; margin-bottom: 5px;">
              ✓ ${data.node.replace('http://', '')} (${data.elapsed_time.toFixed(2)}s)
            </div>
            <div style="color: #fff;">${data.response}</div>
          `;
        } else {
          responseDiv.innerHTML = `<div style="color: #ff0000;">Error: ${data.error}</div>`;
        }
      } catch (e) {
        responseDiv.innerHTML = `<div style="color: #ff0000;">Error: ${e.message}</div>`;
      }
    }
    
    // Initial load
    refreshFleet();
    refreshLLM();
    
    // Auto-refresh every 10 seconds
    setInterval(() => {
      refreshFleet();
      refreshLLM();
    }, 10000);
    
    // Enter to execute
    document.getElementById('terminalCmd').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') executeCommand();
    });
    
    // Ctrl+Enter to send LLM prompt
    document.getElementById('llmPrompt').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) sendLLMPrompt();
    });
  </script>
</body>
</html>"""
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))

if __name__ == '__main__':
    print("🎮 BlackRoad Fleet Command Center")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("")
    print(f"Starting server on port {PORT}...")
    print("")
    print(f"Access: http://localhost:{PORT}")
    print("")
    print("Features:")
    print("  📊 Real-time fleet monitoring")
    print("  🤖 LLM cluster control")
    print("  💻 Remote SSH terminal")
    print("  ⚡ Quick deploy actions")
    print("  📋 System logs")
    print("")
    print("Press Ctrl+C to stop")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    with socketserver.TCPServer(("", PORT), CommandCenterHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✓ Server stopped")
