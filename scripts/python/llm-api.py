#!/usr/bin/env python3
"""
BlackRoad LLM Cluster API
Distributed AI load balancer with web interface
"""

import http.server
import socketserver
import json
import urllib.request
import urllib.error
import time
from urllib.parse import parse_qs, urlparse

PORT = 8889

# Ollama cluster nodes
NODES = [
    "http://aria:11434",
    "http://lucidia:11434", 
    "http://octavia:11434",
    "http://cecilia:11434"
]

# Round-robin state
current_node_index = 0
request_count = 0
node_stats = {node: {"requests": 0, "errors": 0, "avg_time": 0} for node in NODES}

def check_node_health(node):
    """Check if a node is healthy"""
    try:
        req = urllib.request.Request(
            f"{node}/api/tags",
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=2) as response:
            return response.status == 200
    except:
        return False

def get_next_healthy_node():
    """Get next healthy node using round-robin"""
    global current_node_index
    
    attempts = 0
    max_attempts = len(NODES)
    
    while attempts < max_attempts:
        node = NODES[current_node_index]
        current_node_index = (current_node_index + 1) % len(NODES)
        
        if check_node_health(node):
            return node
        
        attempts += 1
    
    return None

def send_to_node(node, prompt, model="llama3:8b", stream=False):
    """Send prompt to specific Ollama node"""
    start_time = time.time()
    
    try:
        data = json.dumps({
            "model": model,
            "prompt": prompt,
            "stream": stream
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{node}/api/generate",
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            elapsed = time.time() - start_time
            
            # Update stats
            node_stats[node]["requests"] += 1
            node_stats[node]["avg_time"] = (
                node_stats[node]["avg_time"] * (node_stats[node]["requests"] - 1) + elapsed
            ) / node_stats[node]["requests"]
            
            return {
                "success": True,
                "response": result.get("response", ""),
                "node": node,
                "elapsed_time": elapsed,
                "model": model
            }
    except Exception as e:
        node_stats[node]["errors"] += 1
        return {
            "success": False,
            "error": str(e),
            "node": node
        }

class LLMClusterHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Health check endpoint
        if parsed_path.path == '/api/health':
            health_status = {}
            for node in NODES:
                health_status[node] = check_node_health(node)
            
            self.send_json_response({
                "healthy_nodes": sum(health_status.values()),
                "total_nodes": len(NODES),
                "nodes": health_status
            })
        
        # Stats endpoint
        elif parsed_path.path == '/api/stats':
            global request_count
            self.send_json_response({
                "total_requests": request_count,
                "nodes": node_stats,
                "cluster_size": len(NODES)
            })
        
        # Models endpoint
        elif parsed_path.path == '/api/models':
            models = {}
            for node in NODES:
                try:
                    req = urllib.request.Request(f"{node}/api/tags")
                    with urllib.request.urlopen(req, timeout=2) as response:
                        data = json.loads(response.read())
                        models[node] = [m["name"] for m in data.get("models", [])]
                except:
                    models[node] = []
            
            self.send_json_response(models)
        
        # Web UI
        elif parsed_path.path == '/' or parsed_path.path == '/index.html':
            self.send_html_ui()
        
        else:
            self.send_error(404, "Not found")
    
    def do_POST(self):
        if self.path == '/api/generate':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                prompt = data.get('prompt', '')
                model = data.get('model', 'llama3:8b')
                
                # Get next healthy node
                node = get_next_healthy_node()
                
                if node is None:
                    self.send_json_response({
                        "success": False,
                        "error": "No healthy nodes available"
                    }, status=503)
                    return
                
                # Send to node
                global request_count
                request_count += 1
                
                result = send_to_node(node, prompt, model)
                self.send_json_response(result)
                
            except Exception as e:
                self.send_json_response({
                    "success": False,
                    "error": str(e)
                }, status=500)
        else:
            self.send_error(404, "Not found")
    
    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))
    
    def send_html_ui(self):
        html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BlackRoad LLM Cluster</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'JetBrains Mono', monospace;
      background: linear-gradient(135deg, #000 0%, #1a0033 50%, #000 100%);
      color: #fff;
      min-height: 100vh;
      padding: 34px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      text-align: center;
      margin-bottom: 55px;
    }
    .title {
      font-size: 3rem;
      font-weight: 700;
      background: linear-gradient(90deg, #FF9D00, #FF0066, #7700FF, #0066FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 13px;
    }
    .subtitle { color: #0066FF; font-size: 1.2rem; }
    .grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 21px;
      margin-bottom: 34px;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(21px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 21px;
      padding: 34px;
    }
    .card-title {
      font-size: 1.5rem;
      margin-bottom: 21px;
      color: #FF0066;
    }
    textarea {
      width: 100%;
      min-height: 150px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 13px;
      padding: 13px;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 1rem;
      resize: vertical;
    }
    .btn {
      width: 100%;
      padding: 13px 21px;
      margin-top: 13px;
      background: linear-gradient(90deg, #7700FF, #0066FF);
      border: none;
      border-radius: 13px;
      color: white;
      font-family: 'JetBrains Mono', monospace;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn:hover { transform: scale(1.02); }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .response {
      margin-top: 21px;
      padding: 21px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 13px;
      border-left: 4px solid #0066FF;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 13px;
    }
    .stat {
      text-align: center;
      padding: 13px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(90deg, #FF0066, #0066FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .stat-label { font-size: 0.8rem; color: #888; margin-top: 5px; }
    .node-list { list-style: none; }
    .node-item {
      padding: 8px;
      margin: 5px 0;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .node-status {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 8px;
    }
    .node-healthy { background: #00ff00; box-shadow: 0 0 10px #00ff00; }
    .node-down { background: #ff0000; }
    .loading { display: none; text-align: center; color: #0066FF; margin: 13px 0; }
    .loading.active { display: block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">🤖 LLM Cluster</h1>
      <p class="subtitle">Distributed AI Load Balancer</p>
    </div>
    
    <div class="grid">
      <div class="card">
        <h2 class="card-title">💬 Send Prompt</h2>
        <textarea id="prompt" placeholder="Ask anything...">What is BlackRoad OS?</textarea>
        <button class="btn" onclick="sendPrompt()" id="sendBtn">🚀 Send to Cluster</button>
        <div class="loading" id="loading">⚡ Processing...</div>
        <div id="response"></div>
      </div>
      
      <div class="card">
        <h2 class="card-title">📊 Cluster Status</h2>
        <div class="stats-grid" id="stats">
          <div class="stat">
            <div class="stat-value" id="healthyNodes">-</div>
            <div class="stat-label">Healthy Nodes</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="totalRequests">0</div>
            <div class="stat-label">Requests</div>
          </div>
        </div>
        <h3 style="margin: 21px 0 13px; color: #FF0066;">Nodes:</h3>
        <ul class="node-list" id="nodeList"></ul>
        <button class="btn" onclick="refreshStatus()" style="margin-top: 21px;">🔄 Refresh</button>
      </div>
    </div>
  </div>
  
  <script>
    async function refreshStatus() {
      try {
        const healthRes = await fetch('/api/health');
        const health = await healthRes.json();
        
        const statsRes = await fetch('/api/stats');
        const stats = await statsRes.json();
        
        document.getElementById('healthyNodes').textContent = health.healthy_nodes + '/' + health.total_nodes;
        document.getElementById('totalRequests').textContent = stats.total_requests;
        
        const nodeList = document.getElementById('nodeList');
        nodeList.innerHTML = '';
        
        for (const [node, isHealthy] of Object.entries(health.nodes)) {
          const li = document.createElement('li');
          li.className = 'node-item';
          li.innerHTML = `
            <span>
              <span class="node-status ${isHealthy ? 'node-healthy' : 'node-down'}"></span>
              ${node.replace('http://', '')}
            </span>
            <span style="color: #888; font-size: 0.8rem;">
              ${stats.nodes[node].requests} reqs
            </span>
          `;
          nodeList.appendChild(li);
        }
      } catch (e) {
        console.error('Failed to refresh status:', e);
      }
    }
    
    async function sendPrompt() {
      const prompt = document.getElementById('prompt').value;
      const loading = document.getElementById('loading');
      const sendBtn = document.getElementById('sendBtn');
      const responseDiv = document.getElementById('response');
      
      if (!prompt.trim()) return;
      
      loading.classList.add('active');
      sendBtn.disabled = true;
      responseDiv.innerHTML = '';
      
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt, model: 'llama3:8b' })
        });
        
        const data = await res.json();
        
        if (data.success) {
          responseDiv.innerHTML = `
            <div class="response">
              <div style="color: #0066FF; font-size: 0.8rem; margin-bottom: 13px;">
                ✓ Routed to: ${data.node.replace('http://', '')} (${data.elapsed_time.toFixed(2)}s)
              </div>
              ${data.response}
            </div>
          `;
        } else {
          responseDiv.innerHTML = `
            <div class="response" style="border-left-color: #ff0000;">
              <strong style="color: #ff0000;">Error:</strong> ${data.error}
            </div>
          `;
        }
        
        refreshStatus();
      } catch (e) {
        responseDiv.innerHTML = `
          <div class="response" style="border-left-color: #ff0000;">
            <strong style="color: #ff0000;">Error:</strong> ${e.message}
          </div>
        `;
      } finally {
        loading.classList.remove('active');
        sendBtn.disabled = false;
      }
    }
    
    // Initial status load
    refreshStatus();
    
    // Auto-refresh every 5 seconds
    setInterval(refreshStatus, 5000);
    
    // Enter to send
    document.getElementById('prompt').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        sendPrompt();
      }
    });
  </script>
</body>
</html>"""
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))

if __name__ == '__main__':
    print(f"🤖 BlackRoad LLM Cluster API")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"")
    print(f"Starting server on port {PORT}...")
    print(f"")
    print(f"Endpoints:")
    print(f"  • http://localhost:{PORT}/           - Web UI")
    print(f"  • http://localhost:{PORT}/api/health - Health check")
    print(f"  • http://localhost:{PORT}/api/stats  - Cluster stats")
    print(f"  • http://localhost:{PORT}/api/models - Available models")
    print(f"")
    print(f"Cluster nodes: {len(NODES)}")
    for node in NODES:
        print(f"  • {node}")
    print(f"")
    print(f"Press Ctrl+C to stop")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    with socketserver.TCPServer(("", PORT), LLMClusterHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✓ Server stopped")
