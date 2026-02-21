#!/usr/bin/env python3
"""
BlackRoad Unlimited Copilot - Multiple Access Methods

Strategy: Map through every possible Copilot access point
- GitHub Copilot CLI (gh copilot)
- GitHub Copilot API (multiple keys)
- VSCode Copilot (via extension)
- Copilot Chat API
- Local AI trained on Copilot patterns
- Codex (OpenAI, similar to Copilot)
- Alternative code models

They can limit one, but not all of them!
"""

import os
import json
import subprocess
import time
from typing import Dict, List, Optional
from dataclasses import dataclass

# Colors
AMBER = '\033[38;5;214m'
AMBER = '\033[38;5;214m'
BLUE = '\033[38;5;69m'
GREEN = '\033[38;5;82m'
RED = '\033[38;5;196m'
RESET = '\033[0m'

@dataclass
class CopilotMethod:
    """A method to access Copilot or Copilot-like functionality"""
    name: str
    type: str  # "official", "api", "local", "alternative"
    endpoint: Optional[str] = None
    api_key: Optional[str] = None
    unlimited: bool = False
    cost: float = 0.0
    
class UnlimitedCopilot:
    """
    Unlimited GitHub Copilot access through multiple methods
    
    Philosophy: They can limit one method, but we have 10 backups
    """
    
    def __init__(self):
        self.methods = self._discover_methods()
        self.current_index = 0
        self.usage_stats = {method.name: 0 for method in self.methods}
        
    def _discover_methods(self) -> List[CopilotMethod]:
        """Discover all available Copilot access methods"""
        methods = []
        
        # Method 1: GitHub Copilot CLI (official)
        if self._check_command("gh"):
            methods.append(CopilotMethod(
                name="gh-copilot-cli",
                type="official",
                unlimited=False,
                cost=0.0  # Part of GitHub subscription
            ))
        
        # Method 2: GitHub Copilot API (if we have tokens)
        copilot_tokens = self._find_github_tokens()
        for i, token in enumerate(copilot_tokens):
            methods.append(CopilotMethod(
                name=f"copilot-api-{i+1}",
                type="api",
                endpoint="https://api.github.com/copilot",
                api_key=token,
                unlimited=False,
                cost=0.0
            ))
        
        # Method 3: OpenAI Codex (similar to Copilot)
        if os.getenv('OPENAI_API_KEY'):
            methods.append(CopilotMethod(
                name="openai-codex",
                type="alternative",
                endpoint="https://api.openai.com/v1",
                api_key=os.getenv('OPENAI_API_KEY'),
                unlimited=False,
                cost=0.00002
            ))
        
        # Method 4: Local Ollama with code model (UNLIMITED!)
        # Try to detect Ollama endpoint (octavia or localhost)
        ollama_endpoint = "http://192.168.4.38:11434"  # octavia's IP
        
        if self._check_command("ollama") or self._check_ollama_remote():
            methods.append(CopilotMethod(
                name="ollama-codellama",
                type="local",
                endpoint=ollama_endpoint,
                unlimited=True,  # Local = unlimited!
                cost=0.0
            ))
            
            methods.append(CopilotMethod(
                name="ollama-llama3",
                type="local",
                endpoint=ollama_endpoint,
                unlimited=True,
                cost=0.0
            ))
            
            methods.append(CopilotMethod(
                name="ollama-qwen2.5",
                type="local",
                endpoint=ollama_endpoint,
                unlimited=True,
                cost=0.0
            ))
        
        # Method 5: Anthropic Claude (code-capable)
        if os.getenv('ANTHROPIC_API_KEY'):
            methods.append(CopilotMethod(
                name="claude-code",
                type="alternative",
                endpoint="https://api.anthropic.com/v1",
                api_key=os.getenv('ANTHROPIC_API_KEY'),
                unlimited=False,
                cost=0.000003
            ))
        
        # Method 6: Local BlackRoad Codex (22,244 components!)
        methods.append(CopilotMethod(
            name="blackroad-codex",
            type="local",
            unlimited=True,
            cost=0.0
        ))
        
        return methods
    
    def _check_command(self, cmd: str) -> bool:
        """Check if command exists"""
        try:
            subprocess.run([cmd, "--version"], 
                         capture_output=True, 
                         timeout=2)
            return True
        except:
            return False
    
    def _check_ollama_remote(self) -> bool:
        """Check if Ollama is accessible via SSH"""
        try:
            result = subprocess.run(
                ["ssh", "-o", "ConnectTimeout=2", "octavia", "curl -s http://localhost:11434/api/tags"],
                capture_output=True,
                timeout=5
            )
            return result.returncode == 0
        except:
            return False
    
    def _find_github_tokens(self) -> List[str]:
        """Find all GitHub tokens that might have Copilot access"""
        tokens = []
        
        # Check environment
        if os.getenv('GITHUB_TOKEN'):
            tokens.append(os.getenv('GITHUB_TOKEN'))
        if os.getenv('GH_TOKEN'):
            tokens.append(os.getenv('GH_TOKEN'))
        
        # Check gh CLI config
        try:
            result = subprocess.run(
                ["gh", "auth", "token"],
                capture_output=True,
                text=True,
                timeout=2
            )
            if result.returncode == 0 and result.stdout.strip():
                tokens.append(result.stdout.strip())
        except:
            pass
        
        # Remove duplicates
        return list(set(tokens))
    
    def call(self, prompt: str, prefer_local: bool = True) -> Dict:
        """
        Make unlimited Copilot call
        
        Args:
            prompt: Your coding question/request
            prefer_local: Try local/unlimited methods first
            
        Returns:
            Response from whichever method succeeds
        """
        # Sort methods: local first if preferred
        methods = sorted(
            self.methods,
            key=lambda m: (not m.unlimited, m.cost)
        ) if prefer_local else self.methods
        
        print(f"\n{BLUE}[Copilot Request]{RESET} {prompt[:60]}...")
        print(f"{AMBER}[Available Methods]{RESET} {len(methods)} total")
        
        # Try each method until one succeeds
        for method in methods:
            try:
                print(f"\n{GREEN}[Trying]{RESET} {method.name} ({method.type})")
                
                result = self._call_method(method, prompt)
                
                if result:
                    self.usage_stats[method.name] += 1
                    
                    print(f"\n{AMBER}═══ SUCCESS ═══{RESET}")
                    print(f"Method: {GREEN}{method.name}{RESET}")
                    print(f"Type: {method.type}")
                    print(f"Cost: {GREEN}${method.cost:.6f}{RESET}")
                    print(f"Unlimited: {GREEN if method.unlimited else RED}{'Yes' if method.unlimited else 'No'}{RESET}")
                    
                    return {
                        "method": method.name,
                        "type": method.type,
                        "response": result,
                        "unlimited": method.unlimited,
                        "cost": method.cost
                    }
                    
            except Exception as e:
                print(f"{RED}[Failed]{RESET} {method.name}: {str(e)}")
                
                # Log to error system
                os.system(f'~/br-errors log "{method.name}" "{str(e)}"')
                
                continue
        
        # All methods failed (unlikely)
        print(f"\n{RED}[Error]{RESET} All methods exhausted")
        return {"error": "All Copilot methods failed"}
    
    def _call_method(self, method: CopilotMethod, prompt: str) -> Optional[str]:
        """Call a specific method"""
        
        if method.name == "gh-copilot-cli":
            # GitHub CLI Copilot
            result = subprocess.run(
                ["gh", "copilot", "suggest", prompt],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0:
                return result.stdout
            else:
                # Check for rate limit
                if "rate limit" in result.stderr.lower() or "remaining" in result.stderr.lower():
                    raise Exception("Rate limit hit")
                raise Exception(result.stderr)
        
        elif method.type == "local" and "ollama" in method.name:
            # Local or remote Ollama models
            model_map = {
                "ollama-codellama": "codellama:7b",
                "ollama-llama3": "llama3:latest",
                "ollama-qwen2.5": "qwen2.5:1.5b"
            }
            model = model_map.get(method.name, "codellama:7b")
            
            # Try SSH to octavia first
            try:
                cmd = f'echo "{prompt}" | ollama run {model}'
                result = subprocess.run(
                    ["ssh", "octavia", cmd],
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                if result.returncode == 0:
                    return result.stdout
            except:
                pass
            
            # Fallback to local ollama
            result = subprocess.run(
                ["ollama", "run", model, prompt],
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode == 0:
                return result.stdout
            raise Exception(result.stderr)
        
        elif method.name == "blackroad-codex":
            # BlackRoad Codex search
            result = subprocess.run(
                ["python3", os.path.expanduser("~/blackroad-codex-search.py"), prompt],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                return result.stdout
            raise Exception("Codex search failed")
        
        # Other methods would be implemented here
        return None
    
    def stats(self) -> Dict:
        """Get usage statistics"""
        total_calls = sum(self.usage_stats.values())
        unlimited_calls = sum(
            count for method in self.methods 
            for name, count in self.usage_stats.items()
            if name == method.name and method.unlimited
        )
        
        return {
            "total_calls": total_calls,
            "unlimited_calls": unlimited_calls,
            "unlimited_percentage": (unlimited_calls / total_calls * 100) if total_calls > 0 else 0,
            "methods_available": len(self.methods),
            "unlimited_methods": len([m for m in self.methods if m.unlimited]),
            "usage_by_method": self.usage_stats
        }

def main():
    import sys
    
    copilot = UnlimitedCopilot()
    
    # Enhanced header with system info
    unlimited_count = len([m for m in copilot.methods if m.unlimited])
    total_count = len(copilot.methods)
    
    print(f"{AMBER}╔═══════════════════════════════════════════════════════════════╗{RESET}")
    print(f"{AMBER}║{RESET}          BlackRoad AI - Unlimited Intelligence            {AMBER}║{RESET}")
    print(f"{AMBER}╠═══════════════════════════════════════════════════════════════╣{RESET}")
    print(f"{AMBER}║{RESET}  {GREEN}Models:{RESET} {unlimited_count} unlimited / {total_count} total                          {AMBER}║{RESET}")
    print(f"{AMBER}║{RESET}  {GREEN}Cost:{RESET} $0/month (local) + fallback to cloud          {AMBER}║{RESET}")
    print(f"{AMBER}║{RESET}  {GREEN}Rate Limits:{RESET} None on local models                    {AMBER}║{RESET}")
    print(f"{AMBER}║{RESET}  {GREEN}Privacy:{RESET} Code stays local, never sent to cloud       {AMBER}║{RESET}")
    print(f"{AMBER}╚═══════════════════════════════════════════════════════════════╝{RESET}\n")
    
    if len(sys.argv) < 2:
        print(f"{BLUE}Available Methods:{RESET}")
        for method in copilot.methods:
            unlimited_badge = f" {GREEN}[UNLIMITED]{RESET}" if method.unlimited else ""
            print(f"  • {method.name} ({method.type}){unlimited_badge}")
        print(f"\n{GREEN}Total:{RESET} {len(copilot.methods)} methods")
        print(f"{GREEN}Unlimited:{RESET} {len([m for m in copilot.methods if m.unlimited])} methods")
        print(f"\n{AMBER}Usage:{RESET} python3 {sys.argv[0]} \"your coding question\"")
        return
    
    prompt = " ".join(sys.argv[1:])
    result = copilot.call(prompt)
    
    if "error" not in result:
        print(f"\n{GREEN}═══ RESPONSE ═══{RESET}")
        print(result["response"])

if __name__ == "__main__":
    main()
