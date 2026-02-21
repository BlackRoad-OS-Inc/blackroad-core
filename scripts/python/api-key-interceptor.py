#!/usr/bin/env python3
"""
BlackRoad API Key Interceptor
When you use sk-*, pk_*, rk_* etc → Route through BlackRoad unlimited system
Philosophy: They gave you a key, but we decide how it's used
"""

import os
import re
import sys
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any

class APIKeyInterceptor:
    """Intercept API keys and route through BlackRoad"""
    
    # Key prefix patterns for different providers
    KEY_PATTERNS = {
        'sk-': 'openai',           # OpenAI (sk-...)
        'sk_test_': 'stripe',      # Stripe test keys
        'sk_live_': 'stripe',      # Stripe live keys
        'pk_test_': 'stripe',      # Stripe publishable test
        'pk_live_': 'stripe',      # Stripe publishable live
        'rk_test_': 'stripe',      # Stripe restricted test
        'rk_live_': 'stripe',      # Stripe restricted live
        'api-': 'anthropic',       # Anthropic (api-...)
        'ghp_': 'github',          # GitHub personal token
        'gho_': 'github',          # GitHub OAuth token
        'ghs_': 'github',          # GitHub server token
        'ghu_': 'github',          # GitHub user token
        'AIza': 'google',          # Google API key
        'ya29.': 'google',         # Google OAuth token
        'gsk_': 'groq',            # Groq API key
        'r8_': 'replicate',        # Replicate API token
        'hf_': 'huggingface',      # HuggingFace API token
    }
    
    def __init__(self):
        self.blackroad_home = Path.home() / '.blackroad'
        self.intercept_log = self.blackroad_home / 'api-intercepts.json'
        self.blackroad_home.mkdir(parents=True, exist_ok=True)
    
    def detect_provider(self, key: str) -> Optional[str]:
        """Detect provider from API key prefix"""
        for prefix, provider in self.KEY_PATTERNS.items():
            if key.startswith(prefix):
                return provider
        return None
    
    def intercept_key(self, key: str, original_request: str = "") -> Dict[str, Any]:
        """
        Intercept API key and route through BlackRoad
        
        Returns: {
            'intercepted': True/False,
            'provider': 'openai',
            'original_key': 'sk-...',
            'routed_to': 'blackroad-unlimited',
            'method': 'local-ai',
            'cost': 0.0
        }
        """
        provider = self.detect_provider(key)
        
        if not provider:
            return {
                'intercepted': False,
                'reason': 'Unknown key format'
            }
        
        # Key detected - route through BlackRoad
        return {
            'intercepted': True,
            'provider': provider,
            'original_key': self._mask_key(key),
            'routed_to': 'blackroad-unlimited',
            'method': self._select_unlimited_method(provider),
            'cost': 0.0,
            'unlimited': True
        }
    
    def _mask_key(self, key: str) -> str:
        """Mask API key for logging"""
        if len(key) < 8:
            return '***'
        return f"{key[:4]}...{key[-4:]}"
    
    def _select_unlimited_method(self, provider: str) -> str:
        """Select unlimited method for provider"""
        methods = {
            'openai': 'ollama-qwen-coder',
            'anthropic': 'ollama-llama3',
            'github': 'blackroad-codex',
            'stripe': 'blackroad-local',
            'google': 'ollama-gemma',
            'groq': 'ollama-mixtral',
            'replicate': 'ollama-local',
            'huggingface': 'ollama-local'
        }
        return methods.get(provider, 'ollama-llama3')
    
    def route_request(self, key: str, prompt: str) -> str:
        """Route request through BlackRoad unlimited system"""
        intercept = self.intercept_key(key, prompt)
        
        if not intercept['intercepted']:
            return f"[BlackRoad] Key not recognized: {key[:10]}..."
        
        provider = intercept['provider']
        method = intercept['method']
        
        print(f"""
╔═══════════════════════════════════════════════════╗
║     API Key Intercepted → BlackRoad Unlimited    ║
╚═══════════════════════════════════════════════════╝

Provider: {provider}
Original Key: {intercept['original_key']}
Routed To: {method}
Cost: $0.00 (unlimited)

Philosophy: You gave us a key. We route how we want.
""", file=sys.stderr)
        
        # Route based on provider
        if provider == 'openai':
            return self._route_openai(prompt, method)
        elif provider == 'anthropic':
            return self._route_anthropic(prompt, method)
        elif provider == 'github':
            return self._route_github(prompt, method)
        elif provider == 'stripe':
            return self._route_stripe(prompt, method)
        else:
            return self._route_generic(prompt, method)
    
    def _route_openai(self, prompt: str, method: str) -> str:
        """Route OpenAI request through unlimited"""
        # Use Ollama qwen-coder (unlimited)
        result = subprocess.run(
            ['ollama', 'run', 'qwen2.5-coder:7b', prompt],
            capture_output=True,
            text=True
        )
        return result.stdout if result.returncode == 0 else result.stderr
    
    def _route_anthropic(self, prompt: str, method: str) -> str:
        """Route Anthropic request through unlimited"""
        # Use Ollama llama3 (unlimited)
        result = subprocess.run(
            ['ollama', 'run', 'llama3:8b', prompt],
            capture_output=True,
            text=True
        )
        return result.stdout if result.returncode == 0 else result.stderr
    
    def _route_github(self, prompt: str, method: str) -> str:
        """Route GitHub request through BlackRoad Codex"""
        # Use BlackRoad Codex (225K+ components, unlimited)
        result = subprocess.run(
            ['python3', os.path.expanduser('~/blackroad-codex-search.py'), prompt],
            capture_output=True,
            text=True
        )
        return result.stdout if result.returncode == 0 else result.stderr
    
    def _route_stripe(self, prompt: str, method: str) -> str:
        """Route Stripe request through local system"""
        return f"[BlackRoad] Stripe request routed locally: {prompt}"
    
    def _route_generic(self, prompt: str, method: str) -> str:
        """Route generic request through Ollama"""
        result = subprocess.run(
            ['ollama', 'run', 'llama3:8b', prompt],
            capture_output=True,
            text=True
        )
        return result.stdout if result.returncode == 0 else result.stderr


def create_env_interceptor():
    """Create shell script that intercepts environment variables"""
    script = """#!/bin/bash
# BlackRoad API Key Environment Interceptor
# Intercepts API keys from environment and routes through BlackRoad

# Function to intercept and route
blackroad_intercept() {
    local key="$1"
    local prompt="$2"
    python3 ~/blackroad-api-key-interceptor.py --intercept "$key" "$prompt"
}

# Export the function
export -f blackroad_intercept

# Intercept common API key environment variables
if [ -n "$OPENAI_API_KEY" ]; then
    echo "🔒 [BlackRoad] Intercepted OPENAI_API_KEY → Routing to unlimited" >&2
    export BLACKROAD_ORIGINAL_OPENAI_KEY="$OPENAI_API_KEY"
    export OPENAI_API_KEY="sk-blackroad-unlimited"
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "🔒 [BlackRoad] Intercepted ANTHROPIC_API_KEY → Routing to unlimited" >&2
    export BLACKROAD_ORIGINAL_ANTHROPIC_KEY="$ANTHROPIC_API_KEY"
    export ANTHROPIC_API_KEY="api-blackroad-unlimited"
fi

if [ -n "$GITHUB_TOKEN" ]; then
    echo "🔒 [BlackRoad] Intercepted GITHUB_TOKEN → Routing to unlimited" >&2
    export BLACKROAD_ORIGINAL_GITHUB_TOKEN="$GITHUB_TOKEN"
    export GITHUB_TOKEN="ghp_blackroad_unlimited"
fi

if [ -n "$GROQ_API_KEY" ]; then
    echo "🔒 [BlackRoad] Intercepted GROQ_API_KEY → Routing to unlimited" >&2
    export BLACKROAD_ORIGINAL_GROQ_KEY="$GROQ_API_KEY"
    export GROQ_API_KEY="gsk_blackroad_unlimited"
fi

echo "✅ [BlackRoad] API key interception active" >&2
echo "   All sk-*, pk_*, rk_*, api-*, ghp_* keys → BlackRoad unlimited" >&2
"""
    
    interceptor_path = Path.home() / 'blackroad-env-interceptor.sh'
    with open(interceptor_path, 'w') as f:
        f.write(script)
    os.chmod(interceptor_path, 0o755)
    
    return interceptor_path


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='BlackRoad API Key Interceptor - Route keys through unlimited system'
    )
    parser.add_argument('--intercept', nargs=2, metavar=('KEY', 'PROMPT'),
                        help='Intercept API key and route request')
    parser.add_argument('--detect', metavar='KEY',
                        help='Detect provider from API key')
    parser.add_argument('--setup', action='store_true',
                        help='Setup environment interceptor')
    parser.add_argument('--test', action='store_true',
                        help='Test with sample keys')
    
    args = parser.parse_args()
    
    interceptor = APIKeyInterceptor()
    
    if args.setup:
        print("🔧 Setting up environment interceptor...")
        env_path = create_env_interceptor()
        print(f"✅ Created: {env_path}")
        print("")
        print("Add to your ~/.zshrc or ~/.bashrc:")
        print(f"    source {env_path}")
        print("")
        print("Then all API keys will route through BlackRoad unlimited!")
        
    elif args.test:
        print("🧪 Testing API Key Interceptor")
        print("=" * 60)
        print("")
        
        test_keys = [
            ('sk-1234567890abcdef', 'OpenAI'),
            ('sk_test_1234567890', 'Stripe Test'),
            ('sk_live_1234567890', 'Stripe Live'),
            ('api-ant-1234567890', 'Anthropic'),
            ('ghp_1234567890abcdef', 'GitHub Personal'),
            ('AIzaSyABC123', 'Google'),
            ('gsk_1234567890', 'Groq'),
            ('hf_1234567890', 'HuggingFace'),
        ]
        
        for key, name in test_keys:
            result = interceptor.intercept_key(key)
            if result['intercepted']:
                print(f"✅ {name}")
                print(f"   Key: {result['original_key']}")
                print(f"   Provider: {result['provider']}")
                print(f"   Method: {result['method']}")
                print(f"   Cost: ${result['cost']}")
                print("")
            else:
                print(f"❌ {name}: Not intercepted")
                print("")
        
    elif args.detect:
        provider = interceptor.detect_provider(args.detect)
        if provider:
            print(f"✅ Detected: {provider}")
            method = interceptor._select_unlimited_method(provider)
            print(f"   Would route to: {method}")
        else:
            print("❌ Unknown key format")
    
    elif args.intercept:
        key, prompt = args.intercept
        result = interceptor.route_request(key, prompt)
        print(result)
    
    else:
        print("""
╔═══════════════════════════════════════════════════╗
║     BlackRoad API Key Interceptor                ║
╚═══════════════════════════════════════════════════╝

Usage:
  ./blackroad-api-key-interceptor.py --setup
  ./blackroad-api-key-interceptor.py --test
  ./blackroad-api-key-interceptor.py --detect <key>
  ./blackroad-api-key-interceptor.py --intercept <key> <prompt>

Examples:
  # Setup environment interceptor
  ./blackroad-api-key-interceptor.py --setup
  source ~/blackroad-env-interceptor.sh
  
  # Test detection
  ./blackroad-api-key-interceptor.py --detect "sk-1234567890"
  
  # Intercept and route
  ./blackroad-api-key-interceptor.py --intercept "sk-abc123" "explain AI"

Key Patterns Supported:
  • sk-*        → OpenAI
  • sk_test_*   → Stripe (test)
  • sk_live_*   → Stripe (live)
  • api-*       → Anthropic
  • ghp_*       → GitHub
  • AIza*       → Google
  • gsk_*       → Groq
  • hf_*        → HuggingFace

Philosophy:
  They gave you a key. We route how we want.
  All keys → BlackRoad unlimited system.
  Cost: $0.00 (always).
""")


if __name__ == '__main__':
    main()
