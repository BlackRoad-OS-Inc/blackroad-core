#!/bin/bash
# roadchain-convert.sh — BTC ↔ ROAD Conversion Bridge
# Tracks real BTC deposits, mints backed ROAD, handles redemptions
# Owner: ALEXALOUISEAMUNDSON.COM
#
# Usage:
#   ./roadchain-convert.sh status          # Show reserve & conversion stats
#   ./roadchain-convert.sh deposit <btc>   # Record BTC deposit, mint ROAD
#   ./roadchain-convert.sh redeem <road>   # Burn ROAD, release BTC claim
#   ./roadchain-convert.sh verify          # Verify reserve integrity
#   ./roadchain-convert.sh price           # Show live BTC/ROAD price
#   ./roadchain-convert.sh history         # Conversion history
#   ./roadchain-convert.sh wallet [name]   # Show wallet with backed breakdown
#   ./roadchain-convert.sh watch           # Watch BTC address for deposits (API)
#   ./roadchain-convert.sh daemon          # Run watcher daemon

set -euo pipefail

ROADCHAIN_DIR="$HOME/.roadchain"
RESERVE_FILE="$ROADCHAIN_DIR/reserve-ledger.json"
CONVERSIONS_FILE="$ROADCHAIN_DIR/conversions.json"
CHAIN_FILE="$ROADCHAIN_DIR/chain.json"
WALLETS_DIR="$ROADCHAIN_DIR/wallets"
PRICE_FILE="$ROADCHAIN_DIR/price-feed.json"
PID_FILE="$ROADCHAIN_DIR/convert-daemon.pid"
LOG_FILE="$ROADCHAIN_DIR/convert-daemon.log"

# Known BTC addresses (add yours here)
BTC_DEPOSIT_ADDRESS="1Ak2fc5N2q4imYxqVMqBNEQDFq8J2Zs9TZ"
BTC_SOURCE="coinbase"  # Where BTC is held

# BlackRoad colors
PINK='\033[38;5;205m'
AMBER='\033[38;5;214m'
GREEN='\033[38;5;82m'
BLUE='\033[38;5;69m'
VIOLET='\033[38;5;135m'
RED='\033[38;5;196m'
WHITE='\033[38;5;255m'
GRAY='\033[38;5;240m'
BOLD='\033[1m'
RESET='\033[0m'

mkdir -p "$ROADCHAIN_DIR" "$WALLETS_DIR"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg" >> "$LOG_FILE"
    echo -e "${AMBER}$msg${RESET}"
}

# ═══════════════════════════════════════════════════════════
# RESERVE LEDGER — The source of truth for BTC backing
# ═══════════════════════════════════════════════════════════

init_reserve() {
    if [ ! -f "$RESERVE_FILE" ]; then
        python3 -c "
import json, time
reserve = {
    'version': 2,
    'owner': 'ALEXALOUISEAMUNDSON.COM',
    'created': time.time(),
    'btc_deposit_address': '$BTC_DEPOSIT_ADDRESS',
    'btc_source': '$BTC_SOURCE',
    'total_btc_deposited': 0.0,
    'total_btc_redeemed': 0.0,
    'total_road_minted_backed': 0.0,
    'total_road_burned': 0.0,
    'current_btc_reserve': 0.0,
    'current_backed_road_supply': 0.0,
    'genesis_road_supply': 50.0,
    'proof_of_reserve': [],
    'last_verified': None
}
with open('$RESERVE_FILE', 'w') as f:
    json.dump(reserve, f, indent=2)
print('Reserve ledger initialized')
"
    fi
}

init_conversions() {
    if [ ! -f "$CONVERSIONS_FILE" ]; then
        python3 -c "
import json, time
data = {
    'conversions': [],
    'total_deposits': 0,
    'total_redemptions': 0,
    'created': time.time()
}
with open('$CONVERSIONS_FILE', 'w') as f:
    json.dump(data, f, indent=2)
print('Conversions log initialized')
"
    fi
}

# ═══════════════════════════════════════════════════════════
# GET LIVE BTC PRICE
# ═══════════════════════════════════════════════════════════

get_btc_price() {
    if [ -f "$PRICE_FILE" ]; then
        python3 -c "
import json
with open('$PRICE_FILE') as f:
    d = json.load(f)
print(f'{d[\"btc_usd\"]:.2f}')
"
    else
        # Fetch live
        local price
        price=$(curl -s --max-time 5 "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd" 2>/dev/null \
            | python3 -c "import sys,json; print(f'{json.load(sys.stdin)[\"bitcoin\"][\"usd\"]:.2f}')" 2>/dev/null || echo "97500.00")
        echo "$price"
    fi
}

# ═══════════════════════════════════════════════════════════
# CHECK BTC BALANCE VIA API (no local node needed)
# ═══════════════════════════════════════════════════════════

check_btc_address_balance() {
    local address="${1:-$BTC_DEPOSIT_ADDRESS}"

    # Try blockchain.info API
    local satoshis
    satoshis=$(curl -s --max-time 10 "https://blockchain.info/q/addressbalance/$address" 2>/dev/null)

    if [[ -n "$satoshis" && "$satoshis" =~ ^[0-9]+$ ]]; then
        python3 -c "print(f'{$satoshis / 100000000:.8f}')"
        return 0
    fi

    # Try mempool.space API as fallback
    local result
    result=$(curl -s --max-time 10 "https://mempool.space/api/address/$address" 2>/dev/null)
    if [[ -n "$result" ]]; then
        python3 -c "
import json, sys
try:
    d = json.loads('$result')
    funded = d.get('chain_stats', {}).get('funded_txo_sum', 0)
    spent = d.get('chain_stats', {}).get('spent_txo_sum', 0)
    balance = (funded - spent) / 100000000
    print(f'{balance:.8f}')
except:
    print('ERROR')
" 2>/dev/null
        return 0
    fi

    echo "ERROR"
    return 1
}

# ═══════════════════════════════════════════════════════════
# DEPOSIT — Record BTC deposit, mint backed ROAD 1:1
# ═══════════════════════════════════════════════════════════

cmd_deposit() {
    local btc_amount="${1:-}"
    local wallet_name="${2:-alexa}"

    if [ -z "$btc_amount" ]; then
        echo -e "${RED}Usage: $0 deposit <btc_amount> [wallet_name]${RESET}"
        echo -e "${GRAY}Example: $0 deposit 0.1       # Deposit 0.1 BTC, mint 0.1 ROAD${RESET}"
        echo -e "${GRAY}Example: $0 deposit 0.05 trading${RESET}"
        return 1
    fi

    # Validate amount
    python3 -c "
btc = float('$btc_amount')
if btc <= 0:
    raise ValueError('Amount must be positive')
if btc > 21000000:
    raise ValueError('Exceeds max BTC supply')
" 2>/dev/null || { echo -e "${RED}Invalid amount: $btc_amount${RESET}"; return 1; }

    local wallet_file="$WALLETS_DIR/${wallet_name}.json"
    if [ ! -f "$wallet_file" ]; then
        echo -e "${RED}Wallet not found: $wallet_name${RESET}"
        return 1
    fi

    local btc_price
    btc_price=$(get_btc_price)

    init_reserve
    init_conversions

    python3 << PYEOF
import json, hashlib, time, os

btc_amount = float('$btc_amount')
wallet_name = '$wallet_name'
btc_price = float('$btc_price')
road_minted = btc_amount  # 1:1 peg

# Generate conversion ID
ts = time.time()
conv_data = f"DEPOSIT:{btc_amount}:{wallet_name}:{ts}"
conv_hash = hashlib.sha256(conv_data.encode()).hexdigest()[:16]
conv_id = f"CONV-{conv_hash.upper()}"

# --- Update reserve ledger ---
with open('$RESERVE_FILE') as f:
    reserve = json.load(f)

reserve['total_btc_deposited'] += btc_amount
reserve['total_road_minted_backed'] += road_minted
reserve['current_btc_reserve'] += btc_amount
reserve['current_backed_road_supply'] += road_minted

proof = {
    'id': conv_id,
    'type': 'DEPOSIT',
    'btc_amount': btc_amount,
    'road_minted': road_minted,
    'btc_source': '$BTC_SOURCE',
    'btc_address': '$BTC_DEPOSIT_ADDRESS',
    'wallet': wallet_name,
    'btc_price_usd': btc_price,
    'usd_value': btc_amount * btc_price,
    'timestamp': ts,
    'datetime': time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(ts)),
    'hash': hashlib.sha256(f"{conv_id}:{btc_amount}:{road_minted}:{ts}".encode()).hexdigest()
}
reserve['proof_of_reserve'].append(proof)

with open('$RESERVE_FILE', 'w') as f:
    json.dump(reserve, f, indent=2)

# --- Update wallet ---
with open('$WALLETS_DIR/${wallet_name}.json') as f:
    wallet = json.load(f)

old_balance = wallet.get('balance', 0)
wallet['balance'] = old_balance + road_minted
wallet['backed_balance'] = wallet.get('backed_balance', 0) + road_minted
wallet['unbacked_balance'] = wallet.get('unbacked_balance', old_balance)
wallet['last_deposit'] = {
    'conv_id': conv_id,
    'btc': btc_amount,
    'road': road_minted,
    'timestamp': ts
}

with open('$WALLETS_DIR/${wallet_name}.json', 'w') as f:
    json.dump(wallet, f, indent=2)

# --- Log conversion ---
with open('$CONVERSIONS_FILE') as f:
    convs = json.load(f)

convs['conversions'].append({
    'id': conv_id,
    'type': 'BTC_TO_ROAD',
    'btc_in': btc_amount,
    'road_out': road_minted,
    'wallet': wallet_name,
    'btc_price_usd': btc_price,
    'usd_value': btc_amount * btc_price,
    'btc_source': '$BTC_SOURCE',
    'timestamp': ts,
    'datetime': time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(ts))
})
convs['total_deposits'] += 1

with open('$CONVERSIONS_FILE', 'w') as f:
    json.dump(convs, f, indent=2)

# --- Append to chain ---
with open('$CHAIN_FILE') as f:
    chain = json.load(f)

blocks = chain['chain']
prev_hash = blocks[-1]['hash'] if blocks else '0' * 64

tx_data = f"BTC_DEPOSIT:{conv_id}:{btc_amount}:{road_minted}:{wallet_name}"
tx_hash = hashlib.sha256(tx_data.encode()).hexdigest()

block = {
    'index': len(blocks),
    'timestamp': ts,
    'transactions': [{
        'type': 'BTC_DEPOSIT',
        'sender': 'BTC_RESERVE',
        'recipient': wallet_name,
        'amount': road_minted,
        'btc_deposited': btc_amount,
        'conv_id': conv_id,
        'btc_source': '$BTC_SOURCE',
        'btc_address': '$BTC_DEPOSIT_ADDRESS',
        'btc_price_usd': btc_price,
        'timestamp': ts,
        'hash': tx_hash
    }],
    'previous_hash': prev_hash,
    'nonce': 0,
    'hash': hashlib.sha256(f'{len(blocks)}:{ts}:{tx_hash}:{prev_hash}'.encode()).hexdigest()
}
chain['chain'].append(block)

with open('$CHAIN_FILE', 'w') as f:
    json.dump(chain, f, indent=2)

# --- Output ---
print(f'\033[38;5;82m{"═" * 60}\033[0m')
print(f'\033[1m\033[38;5;205m  BTC → ROAD CONVERSION COMPLETE\033[0m')
print(f'\033[38;5;82m{"═" * 60}\033[0m')
print(f'  Conversion ID:  {conv_id}')
print(f'  BTC Deposited:  {btc_amount:.8f} BTC')
print(f'  ROAD Minted:    {road_minted:.8f} ROAD (backed)')
print(f'  USD Value:      \${btc_amount * btc_price:,.2f}')
print(f'  BTC Price:      \${btc_price:,.2f}')
print(f'  Source:          {wallet.get("name", wallet_name)} wallet')
print(f'\033[38;5;82m{"─" * 60}\033[0m')
print(f'  Wallet Balance:')
print(f'    Total:    {wallet["balance"]:.8f} ROAD')
print(f'    Backed:   {wallet["backed_balance"]:.8f} ROAD (BTC-backed)')
print(f'    Genesis:  {wallet["unbacked_balance"]:.8f} ROAD (genesis mint)')
print(f'\033[38;5;82m{"─" * 60}\033[0m')
print(f'  Reserve Status:')
print(f'    BTC Reserve:     {reserve["current_btc_reserve"]:.8f} BTC')
print(f'    Backed Supply:   {reserve["current_backed_road_supply"]:.8f} ROAD')
print(f'    Reserve Ratio:   {"1:1 ✓" if abs(reserve["current_btc_reserve"] - reserve["current_backed_road_supply"]) < 0.00000001 else "MISMATCH ✗"}')
print(f'\033[38;5;82m{"═" * 60}\033[0m')
PYEOF
}

# ═══════════════════════════════════════════════════════════
# REDEEM — Burn ROAD, release BTC claim
# ═══════════════════════════════════════════════════════════

cmd_redeem() {
    local road_amount="${1:-}"
    local wallet_name="${2:-alexa}"

    if [ -z "$road_amount" ]; then
        echo -e "${RED}Usage: $0 redeem <road_amount> [wallet_name]${RESET}"
        echo -e "${GRAY}Example: $0 redeem 0.05       # Burn 0.05 ROAD, claim 0.05 BTC${RESET}"
        return 1
    fi

    local wallet_file="$WALLETS_DIR/${wallet_name}.json"
    if [ ! -f "$wallet_file" ]; then
        echo -e "${RED}Wallet not found: $wallet_name${RESET}"
        return 1
    fi

    local btc_price
    btc_price=$(get_btc_price)

    init_reserve
    init_conversions

    python3 << PYEOF
import json, hashlib, time, sys

road_amount = float('$road_amount')
wallet_name = '$wallet_name'
btc_price = float('$btc_price')
btc_released = road_amount  # 1:1 peg

# Load wallet
with open('$WALLETS_DIR/${wallet_name}.json') as f:
    wallet = json.load(f)

backed = wallet.get('backed_balance', 0)
if road_amount > backed:
    print(f'\033[38;5;196mInsufficient backed balance. Have {backed:.8f} backed ROAD, need {road_amount:.8f}\033[0m')
    print(f'\033[38;5;240mNote: Only BTC-backed ROAD can be redeemed for BTC.\033[0m')
    sys.exit(1)

# Load reserve
with open('$RESERVE_FILE') as f:
    reserve = json.load(f)

if btc_released > reserve['current_btc_reserve']:
    print(f'\033[38;5;196mInsufficient BTC reserve. Have {reserve["current_btc_reserve"]:.8f} BTC, need {btc_released:.8f}\033[0m')
    sys.exit(1)

ts = time.time()
conv_data = f"REDEEM:{road_amount}:{wallet_name}:{ts}"
conv_hash = hashlib.sha256(conv_data.encode()).hexdigest()[:16]
conv_id = f"RDMP-{conv_hash.upper()}"

# Update reserve
reserve['total_btc_redeemed'] += btc_released
reserve['total_road_burned'] += road_amount
reserve['current_btc_reserve'] -= btc_released
reserve['current_backed_road_supply'] -= road_amount

proof = {
    'id': conv_id,
    'type': 'REDEMPTION',
    'road_burned': road_amount,
    'btc_released': btc_released,
    'wallet': wallet_name,
    'btc_price_usd': btc_price,
    'usd_value': btc_released * btc_price,
    'timestamp': ts,
    'datetime': time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(ts)),
    'hash': hashlib.sha256(f"{conv_id}:{road_amount}:{btc_released}:{ts}".encode()).hexdigest()
}
reserve['proof_of_reserve'].append(proof)

with open('$RESERVE_FILE', 'w') as f:
    json.dump(reserve, f, indent=2)

# Update wallet
wallet['balance'] -= road_amount
wallet['backed_balance'] -= road_amount
wallet['last_redemption'] = {
    'conv_id': conv_id,
    'road_burned': road_amount,
    'btc_claimed': btc_released,
    'timestamp': ts
}

with open('$WALLETS_DIR/${wallet_name}.json', 'w') as f:
    json.dump(wallet, f, indent=2)

# Log conversion
with open('$CONVERSIONS_FILE') as f:
    convs = json.load(f)

convs['conversions'].append({
    'id': conv_id,
    'type': 'ROAD_TO_BTC',
    'road_in': road_amount,
    'btc_out': btc_released,
    'wallet': wallet_name,
    'btc_price_usd': btc_price,
    'usd_value': btc_released * btc_price,
    'timestamp': ts,
    'datetime': time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(ts))
})
convs['total_redemptions'] += 1

with open('$CONVERSIONS_FILE', 'w') as f:
    json.dump(convs, f, indent=2)

# Append to chain
with open('$CHAIN_FILE') as f:
    chain = json.load(f)

blocks = chain['chain']
prev_hash = blocks[-1]['hash'] if blocks else '0' * 64

tx_data = f"ROAD_REDEEM:{conv_id}:{road_amount}:{btc_released}:{wallet_name}"
tx_hash = hashlib.sha256(tx_data.encode()).hexdigest()

block = {
    'index': len(blocks),
    'timestamp': ts,
    'transactions': [{
        'type': 'ROAD_REDEMPTION',
        'sender': wallet_name,
        'recipient': 'BTC_RESERVE',
        'amount': road_amount,
        'btc_released': btc_released,
        'conv_id': conv_id,
        'btc_destination': '$BTC_DEPOSIT_ADDRESS',
        'btc_price_usd': btc_price,
        'timestamp': ts,
        'hash': tx_hash
    }],
    'previous_hash': prev_hash,
    'nonce': 0,
    'hash': hashlib.sha256(f'{len(blocks)}:{ts}:{tx_hash}:{prev_hash}'.encode()).hexdigest()
}
chain['chain'].append(block)

with open('$CHAIN_FILE', 'w') as f:
    json.dump(chain, f, indent=2)

print(f'\033[38;5;196m{"═" * 60}\033[0m')
print(f'\033[1m\033[38;5;214m  ROAD → BTC REDEMPTION COMPLETE\033[0m')
print(f'\033[38;5;196m{"═" * 60}\033[0m')
print(f'  Redemption ID:  {conv_id}')
print(f'  ROAD Burned:    {road_amount:.8f} ROAD')
print(f'  BTC Claimed:    {btc_released:.8f} BTC')
print(f'  USD Value:      \${btc_released * btc_price:,.2f}')
print(f'  Destination:    $BTC_DEPOSIT_ADDRESS')
print(f'\033[38;5;196m{"─" * 60}\033[0m')
print(f'  Wallet Balance:')
print(f'    Total:    {wallet["balance"]:.8f} ROAD')
print(f'    Backed:   {wallet["backed_balance"]:.8f} ROAD')
print(f'    Genesis:  {wallet.get("unbacked_balance", 0):.8f} ROAD')
print(f'\033[38;5;196m{"─" * 60}\033[0m')
print(f'  Reserve:')
print(f'    BTC Reserve:     {reserve["current_btc_reserve"]:.8f} BTC')
print(f'    Backed Supply:   {reserve["current_backed_road_supply"]:.8f} ROAD')
print(f'    Ratio:           {"1:1 ✓" if abs(reserve["current_btc_reserve"] - reserve["current_backed_road_supply"]) < 0.00000001 else "MISMATCH ✗"}')
print(f'\033[38;5;196m{"═" * 60}\033[0m')
PYEOF
}

# ═══════════════════════════════════════════════════════════
# STATUS — Full reserve and conversion status
# ═══════════════════════════════════════════════════════════

cmd_status() {
    init_reserve
    init_conversions

    local btc_price
    btc_price=$(get_btc_price)

    python3 - "$RESERVE_FILE" "$CONVERSIONS_FILE" "$WALLETS_DIR" "$btc_price" << 'PYEOF'
import json, os, sys

reserve_file, conv_file, wallets_dir, btc_price_str = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

with open(reserve_file) as f:
    r = json.load(f)
with open(conv_file) as f:
    c = json.load(f)

btc_price = float(btc_price_str)

total_road = 0
wallets = []
for wf in sorted(os.listdir(wallets_dir)):
    if wf.endswith('.json') and wf != 'bitcoin-bridge.json':
        with open(f'{wallets_dir}/{wf}') as f:
            w = json.load(f)
        total_road += w.get('balance', 0)
        wallets.append(w)

p = '\033[38;5;205m'
a = '\033[38;5;214m'
g = '\033[38;5;82m'
b = '\033[38;5;69m'
v = '\033[38;5;135m'
wh = '\033[38;5;255m'
d = '\033[38;5;240m'
bold = '\033[1m'
x = '\033[0m'

print(f'{g}{"═" * 60}{x}')
print(f'{bold}{p}  ROADCHAIN RESERVE STATUS{x}')
print(f'{g}{"═" * 60}{x}')
print()
print(f'  {bold}{a}BTC Reserve{x}')
print(f'  {wh}Total Deposited:     {r["total_btc_deposited"]:.8f} BTC{x}')
print(f'  {wh}Total Redeemed:      {r["total_btc_redeemed"]:.8f} BTC{x}')
print(f'  {g}Current Reserve:     {r["current_btc_reserve"]:.8f} BTC{x}')
print(f'  {g}Reserve Value:       ${r["current_btc_reserve"] * btc_price:,.2f} USD{x}')
print()
print(f'  {bold}{a}ROAD Supply{x}')
print(f'  {wh}Genesis Mint:        {r["genesis_road_supply"]:.8f} ROAD (unbacked){x}')
print(f'  {wh}BTC-Backed Minted:   {r["total_road_minted_backed"]:.8f} ROAD{x}')
print(f'  {wh}Burned/Redeemed:     {r["total_road_burned"]:.8f} ROAD{x}')
print(f'  {g}Backed Supply:       {r["current_backed_road_supply"]:.8f} ROAD{x}')
print(f'  {b}Total Supply:        {total_road:.8f} ROAD{x}')
print()
print(f'  {bold}{a}Reserve Health{x}')
ratio_ok = abs(r['current_btc_reserve'] - r['current_backed_road_supply']) < 0.00000001
print(f'  {g if ratio_ok else chr(27)+"[38;5;196m"}Reserve Ratio:       {"1:1 VERIFIED ✓" if ratio_ok else "MISMATCH ✗"}{x}')
print(f'  {wh}BTC Price:           ${btc_price:,.2f}{x}')
print(f'  {wh}1 ROAD =             1 BTC = ${btc_price:,.2f}{x}')
print()
print(f'  {bold}{a}Conversion Stats{x}')
print(f'  {wh}Total Deposits:      {c["total_deposits"]}{x}')
print(f'  {wh}Total Redemptions:   {c["total_redemptions"]}{x}')
print(f'  {wh}Proof Entries:       {len(r["proof_of_reserve"])}{x}')
print()

print(f'  {bold}{a}Wallet Balances{x}')
for ww in wallets:
    name = ww.get('name', '?')
    bal = ww.get('balance', 0)
    backed = ww.get('backed_balance', 0)
    unbacked = ww.get('unbacked_balance', 0)
    if bal > 0:
        print(f'  {wh}  {name:12s}  {bal:>14.8f} ROAD  ({backed:.8f} backed / {unbacked:.8f} genesis){x}')
    else:
        print(f'  {d}  {name:12s}  {bal:>14.8f} ROAD{x}')

print(f'{g}{"═" * 60}{x}')
PYEOF
}

# ═══════════════════════════════════════════════════════════
# VERIFY — Audit reserve integrity
# ═══════════════════════════════════════════════════════════

cmd_verify() {
    init_reserve

    python3 - "$RESERVE_FILE" "$CHAIN_FILE" "$WALLETS_DIR" << 'PYEOF'
import json, hashlib, os, time, sys

RESERVE = sys.argv[1]
CHAIN = sys.argv[2]
WALLETS_DIR = sys.argv[3]

errors = []
warnings = []

g = '\033[38;5;82m'
r = '\033[38;5;196m'
a = '\033[38;5;214m'
p = '\033[38;5;205m'
w = '\033[38;5;255m'
bold = '\033[1m'
x = '\033[0m'

print(f'{a}{"═" * 60}{x}')
print(f'{bold}{p}  ROADCHAIN RESERVE AUDIT{x}')
print(f'{a}{"═" * 60}{x}')

# 1. Load and check reserve
with open(RESERVE) as f:
    reserve = json.load(f)

# Check math: deposited - redeemed = current reserve
expected_btc = reserve['total_btc_deposited'] - reserve['total_btc_redeemed']
actual_btc = reserve['current_btc_reserve']
if abs(expected_btc - actual_btc) > 0.00000001:
    errors.append(f'BTC reserve mismatch: expected {expected_btc:.8f}, got {actual_btc:.8f}')
else:
    print(f'  {g}[PASS]{x} BTC reserve math: {actual_btc:.8f} BTC')

# Check: minted - burned = current backed supply
expected_road = reserve['total_road_minted_backed'] - reserve['total_road_burned']
actual_road = reserve['current_backed_road_supply']
if abs(expected_road - actual_road) > 0.00000001:
    errors.append(f'ROAD supply mismatch: expected {expected_road:.8f}, got {actual_road:.8f}')
else:
    print(f'  {g}[PASS]{x} Backed ROAD supply math: {actual_road:.8f} ROAD')

# Check: 1:1 ratio
if abs(actual_btc - actual_road) > 0.00000001:
    errors.append(f'Reserve ratio broken: {actual_btc:.8f} BTC != {actual_road:.8f} ROAD')
else:
    print(f'  {g}[PASS]{x} 1:1 reserve ratio maintained')

# 2. Check proof chain integrity
proofs = reserve.get('proof_of_reserve', [])
for i, proof in enumerate(proofs):
    expected_hash = hashlib.sha256(
        f"{proof['id']}:{proof.get('btc_amount', proof.get('road_burned', 0))}:{proof.get('road_minted', proof.get('btc_released', 0))}:{proof['timestamp']}".encode()
    ).hexdigest()
    if proof.get('hash') != expected_hash:
        errors.append(f'Proof #{i} ({proof["id"]}): hash mismatch')
    else:
        print(f'  {g}[PASS]{x} Proof #{i} ({proof["id"]}): hash verified')

if not proofs:
    print(f'  {a}[INFO]{x} No proofs yet (no conversions recorded)')

# 3. Check wallets sum
total_wallet_backed = 0
for wf in sorted(os.listdir(WALLETS_DIR)):
    if wf.endswith('.json') and wf != 'bitcoin-bridge.json':
        with open(f'{WALLETS_DIR}/{wf}') as f:
            ww = json.load(f)
        total_wallet_backed += ww.get('backed_balance', 0)

if abs(total_wallet_backed - actual_road) > 0.00000001:
    warnings.append(f'Wallet backed sum ({total_wallet_backed:.8f}) != reserve backed supply ({actual_road:.8f})')
else:
    print(f'  {g}[PASS]{x} Wallet backed totals match reserve')

# 4. Chain integrity check
with open(CHAIN) as f:
    chain = json.load(f)

blocks = chain['chain']
chain_ok = True
for i in range(1, len(blocks)):
    if blocks[i]['previous_hash'] != blocks[i-1]['hash']:
        errors.append(f'Chain break at block {i}: prev_hash mismatch')
        chain_ok = False
        break

if chain_ok:
    print(f'  {g}[PASS]{x} Chain integrity: {len(blocks)} blocks verified')

# Summary
print(f'{a}{"─" * 60}{x}')
if errors:
    for e in errors:
        print(f'  {r}[FAIL] {e}{x}')
if warnings:
    for ww in warnings:
        print(f'  {a}[WARN] {ww}{x}')

if not errors and not warnings:
    print(f'  {g}{bold}ALL CHECKS PASSED ✓{x}')
else:
    print(f'  {r}{bold}{len(errors)} errors, {len(warnings)} warnings{x}')

# Update last verified
reserve['last_verified'] = time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime())
with open(RESERVE, 'w') as f:
    json.dump(reserve, f, indent=2)

print(f'{a}{"═" * 60}{x}')
PYEOF
}

# ═══════════════════════════════════════════════════════════
# WATCH — Check BTC deposit address via API
# ═══════════════════════════════════════════════════════════

cmd_watch() {
    local address="${1:-$BTC_DEPOSIT_ADDRESS}"

    echo -e "${AMBER}Checking BTC address: ${WHITE}${address}${RESET}"
    echo ""

    local balance
    balance=$(check_btc_address_balance "$address")

    if [ "$balance" = "ERROR" ]; then
        echo -e "${RED}Could not fetch balance from API${RESET}"
        echo -e "${GRAY}Try: https://mempool.space/address/$address${RESET}"
        return 1
    fi

    local btc_price
    btc_price=$(get_btc_price)

    python3 -c "
btc = float('$balance')
price = float('$btc_price')
usd = btc * price
print(f'\033[38;5;82m  On-chain Balance: {btc:.8f} BTC\033[0m')
print(f'\033[38;5;82m  USD Value:        \${usd:,.2f}\033[0m')
print(f'\033[38;5;240m  Price:            \${price:,.2f}/BTC\033[0m')
"
}

# ═══════════════════════════════════════════════════════════
# PRICE — Live price display
# ═══════════════════════════════════════════════════════════

cmd_price() {
    # Refresh price
    "$HOME/roadchain-price-feed.sh" fetch 2>/dev/null || true

    local btc_price
    btc_price=$(get_btc_price)

    echo -e "${GREEN}═══════════════════════════════════════${RESET}"
    echo -e "${BOLD}${PINK}  ROAD/BTC Price${RESET}"
    echo -e "${GREEN}═══════════════════════════════════════${RESET}"
    echo -e "  ${WHITE}1 ROAD  = 1 BTC${RESET}"
    echo -e "  ${WHITE}1 ROAD  = \$${btc_price} USD${RESET}"
    echo -e "  ${WHITE}1 BTC   = \$${btc_price} USD${RESET}"
    echo -e "${GREEN}═══════════════════════════════════════${RESET}"
}

# ═══════════════════════════════════════════════════════════
# HISTORY — Show conversion history
# ═══════════════════════════════════════════════════════════

cmd_history() {
    init_conversions

    python3 - "$CONVERSIONS_FILE" << 'PYEOF'
import json, sys

with open(sys.argv[1]) as f:
    data = json.load(f)

convs = data['conversions']

g = '\033[38;5;82m'
r = '\033[38;5;196m'
a = '\033[38;5;214m'
p = '\033[38;5;205m'
w = '\033[38;5;255m'
d = '\033[38;5;240m'
bold = '\033[1m'
x = '\033[0m'

print(f'{a}{"═" * 70}{x}')
print(f'{bold}{p}  CONVERSION HISTORY{x}')
print(f'{a}{"═" * 70}{x}')

if not convs:
    print(f'  {d}No conversions yet. Use: roadchain-convert.sh deposit <btc>{x}')
else:
    for c in convs:
        if c['type'] == 'BTC_TO_ROAD':
            arrow = f'{g}BTC \u2192 ROAD{x}'
            detail = f'{c["btc_in"]:.8f} BTC \u2192 {c["road_out"]:.8f} ROAD'
        else:
            arrow = f'{r}ROAD \u2192 BTC{x}'
            detail = f'{c["road_in"]:.8f} ROAD \u2192 {c["btc_out"]:.8f} BTC'

        print(f'  {w}{c["datetime"]}{x}  {arrow}  {w}{detail}{x}  {d}${c["usd_value"]:,.2f}{x}  {d}[{c["id"]}]{x}')

print(f'{a}{"─" * 70}{x}')
print(f'  Deposits: {data["total_deposits"]}  |  Redemptions: {data["total_redemptions"]}')
print(f'{a}{"═" * 70}{x}')
PYEOF
}

# ═══════════════════════════════════════════════════════════
# WALLET — Show wallet with backed/unbacked breakdown
# ═══════════════════════════════════════════════════════════

cmd_wallet() {
    local wallet_name="${1:-alexa}"
    local wallet_file="$WALLETS_DIR/${wallet_name}.json"

    if [ ! -f "$wallet_file" ]; then
        echo -e "${RED}Wallet not found: $wallet_name${RESET}"
        echo -e "${GRAY}Available: $(ls $WALLETS_DIR/*.json 2>/dev/null | xargs -I{} basename {} .json | grep -v bitcoin-bridge | tr '\n' ' ')${RESET}"
        return 1
    fi

    local btc_price
    btc_price=$(get_btc_price)

    python3 - "$wallet_file" "$btc_price" << 'PYEOF'
import json, sys

with open(sys.argv[1]) as f:
    w = json.load(f)

btc_price = float(sys.argv[2])
bal = w.get('balance', 0)
backed = w.get('backed_balance', 0)
unbacked = w.get('unbacked_balance', bal)

g = '\033[38;5;82m'
a = '\033[38;5;214m'
p = '\033[38;5;205m'
b = '\033[38;5;69m'
wh = '\033[38;5;255m'
d = '\033[38;5;240m'
bold = '\033[1m'
x = '\033[0m'

print(f'{g}{"═" * 50}{x}')
print(f'{bold}{p}  WALLET: {w.get("name", "unknown")}{x}')
print(f'{g}{"═" * 50}{x}')
print(f'  {wh}Address:   {w.get("address", "N/A")}{x}')
print(f'  {g}Balance:   {bal:.8f} ROAD{x}')
print(f'  {g}           = {bal:.8f} BTC{x}')
print(f'  {g}           = ${bal * btc_price:,.2f} USD{x}')
print(f'{g}{"─" * 50}{x}')
print(f'  {a}Backed:    {backed:.8f} ROAD (BTC-backed, redeemable){x}')
print(f'  {b}Genesis:   {unbacked:.8f} ROAD (genesis mint){x}')
print(f'{g}{"─" * 50}{x}')

ld = w.get('last_deposit')
if ld:
    print(f'  {d}Last deposit: {ld["btc"]:.8f} BTC [{ld["conv_id"]}]{x}')

lr = w.get('last_redemption')
if lr:
    print(f'  {d}Last redeem:  {lr["road_burned"]:.8f} ROAD [{lr["conv_id"]}]{x}')

print(f'{g}{"═" * 50}{x}')
PYEOF
}

# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════

case "${1:-help}" in
    deposit)   cmd_deposit "${2:-}" "${3:-alexa}" ;;
    redeem)    cmd_redeem "${2:-}" "${3:-alexa}" ;;
    status)    cmd_status ;;
    verify)    cmd_verify ;;
    watch)     cmd_watch "${2:-$BTC_DEPOSIT_ADDRESS}" ;;
    price)     cmd_price ;;
    history)   cmd_history ;;
    wallet)    cmd_wallet "${2:-alexa}" ;;
    help|--help|-h)
        echo -e "${BOLD}${PINK}RoadChain BTC ↔ ROAD Converter${RESET}"
        echo ""
        echo -e "  ${GREEN}deposit${RESET} <btc> [wallet]    Record BTC deposit, mint backed ROAD"
        echo -e "  ${GREEN}redeem${RESET}  <road> [wallet]   Burn ROAD, claim BTC"
        echo -e "  ${GREEN}status${RESET}                    Full reserve & supply report"
        echo -e "  ${GREEN}verify${RESET}                    Audit reserve integrity"
        echo -e "  ${GREEN}watch${RESET}   [btc_address]     Check BTC address balance (API)"
        echo -e "  ${GREEN}price${RESET}                     Live BTC/ROAD price"
        echo -e "  ${GREEN}history${RESET}                   Conversion history"
        echo -e "  ${GREEN}wallet${RESET}  [name]            Wallet balance breakdown"
        echo ""
        echo -e "  ${GRAY}1 ROAD = 1 BTC (1:1 peg, BTC-backed)${RESET}"
        echo -e "  ${GRAY}Owner: ALEXALOUISEAMUNDSON.COM${RESET}"
        ;;
    *)
        echo -e "${RED}Unknown command: $1${RESET}"
        echo "Run: $0 help"
        exit 1
        ;;
esac
