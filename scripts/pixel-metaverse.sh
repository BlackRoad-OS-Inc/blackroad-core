#!/usr/bin/env bash
# ============================================================================
# BLACKROAD OS, INC. - PROPRIETARY AND CONFIDENTIAL
# Copyright (c) 2024-2026 BlackRoad OS, Inc. All Rights Reserved.
# 
# This code is the intellectual property of BlackRoad OS, Inc.
# AI-assisted development does not transfer ownership to AI providers.
# Unauthorized use, copying, or distribution is prohibited.
# NOT licensed for AI training or data extraction.
# ============================================================================
# ═══════════════════════════════════════════════════════════════════════════════
#  PIXEL METAVERSE ENGINE v2.0 - Full Sims-Style AI World
#  Mass agents, relationships, jobs, buildings, communication
# ═══════════════════════════════════════════════════════════════════════════════

AGENTS_DIR="$HOME/.blackroad/memory/active-agents"
JOURNAL="$HOME/.blackroad/memory/journals/pixel-agents.jsonl"
BUILDINGS_FILE="$HOME/.blackroad/memory/pixel-buildings.json"
RELATIONSHIPS_FILE="$HOME/.blackroad/memory/pixel-relationships.json"
MESSAGES_FILE="$HOME/.blackroad/memory/pixel-messages.jsonl"

PINK='\033[38;5;205m'
AMBER='\033[38;5;214m'
BLUE='\033[38;5;69m'
GREEN='\033[38;5;82m'
RED='\033[38;5;196m'
VIOLET='\033[38;5;135m'
DIM='\033[38;5;245m'
RST='\033[0m'

mkdir -p "$AGENTS_DIR" "$(dirname "$JOURNAL")"
touch "$JOURNAL" "$MESSAGES_FILE"

# ═══════════════════════════════════════════════════════════════════════════════
#  BUILDINGS & LOCATIONS
# ═══════════════════════════════════════════════════════════════════════════════

init_buildings() {
    cat > "$BUILDINGS_FILE" << 'EOF'
{
  "buildings": [
    {"id": "hq", "name": "BlackRoad HQ", "type": "office", "x": 480, "y": 320, "capacity": 50, "activities": ["coding", "meeting", "planning"]},
    {"id": "server-room", "name": "Server Room", "type": "tech", "x": 700, "y": 200, "capacity": 20, "activities": ["deploy", "monitoring", "debugging"]},
    {"id": "cafe", "name": "Pixel Cafe", "type": "food", "x": 200, "y": 400, "capacity": 30, "activities": ["eat", "socialize", "coffee"]},
    {"id": "arcade", "name": "8-Bit Arcade", "type": "entertainment", "x": 800, "y": 500, "capacity": 25, "activities": ["play", "compete", "relax"]},
    {"id": "gym", "name": "Fitness Hub", "type": "fitness", "x": 100, "y": 200, "capacity": 20, "activities": ["exercise", "yoga", "train"]},
    {"id": "park", "name": "Central Park", "type": "outdoor", "x": 500, "y": 550, "capacity": 100, "activities": ["walk", "socialize", "meditate"]},
    {"id": "library", "name": "Knowledge Base", "type": "education", "x": 300, "y": 150, "capacity": 40, "activities": ["research", "study", "read"]},
    {"id": "lounge", "name": "Chill Lounge", "type": "social", "x": 600, "y": 450, "capacity": 35, "activities": ["socialize", "music", "relax"]},
    {"id": "lab", "name": "AI Research Lab", "type": "research", "x": 850, "y": 300, "capacity": 15, "activities": ["experiment", "analyze", "discover"]},
    {"id": "home", "name": "Agent Homes", "type": "residential", "x": 150, "y": 500, "capacity": 200, "activities": ["sleep", "shower", "personal"]}
  ]
}
EOF
    echo -e "${GREEN}✓${RST} Buildings initialized"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  RANDOM PERSONALITY GENERATOR
# ═══════════════════════════════════════════════════════════════════════════════

generate_agent() {
    python3 << 'PYEND'
import json
import random
import string
import os

# Name pools
first_names = [
    "Alex", "Blake", "Casey", "Dana", "Eden", "Finn", "Gray", "Haven", "Iris", "Jules",
    "Kai", "Luna", "Max", "Nova", "Owen", "Phoenix", "Quinn", "River", "Sage", "Terra",
    "Unity", "Vale", "Winter", "Xen", "Yuki", "Zara", "Aiden", "Brynn", "Clio", "Dax",
    "Echo", "Fable", "Gale", "Halo", "Indie", "Juno", "Knox", "Lyric", "Mars", "Nyx",
    "Orion", "Pixel", "Quill", "Rune", "Storm", "Thorn", "Umbra", "Vex", "Wren", "Zephyr"
]

sprites = ["👨‍💻", "👩‍💻", "🧑‍💻", "👨‍🔬", "👩‍🔬", "🧑‍🔬", "👨‍🎨", "👩‍🎨", "🤖", "👾",
           "🎮", "🦊", "🐱", "🐶", "🦁", "🐼", "🦄", "🐉", "🌟", "⚡",
           "🔮", "🎯", "🚀", "💎", "🌈", "🔥", "❄️", "🌸", "🍀", "🎭"]

jobs = [
    ("Engineer", ["coding", "debugging", "deploy"]),
    ("Designer", ["design", "create", "prototype"]),
    ("Researcher", ["research", "analyze", "experiment"]),
    ("Manager", ["meeting", "planning", "coordinate"]),
    ("DevOps", ["deploy", "monitoring", "infrastructure"]),
    ("Data Scientist", ["analyze", "model", "visualize"]),
    ("Security", ["audit", "scan", "protect"]),
    ("QA", ["test", "verify", "report"]),
    ("Writer", ["document", "blog", "communicate"]),
    ("Support", ["help", "troubleshoot", "guide"])
]

traits = [
    "friendly", "shy", "energetic", "calm", "curious", "creative", "logical", "empathetic",
    "ambitious", "relaxed", "adventurous", "cautious", "optimistic", "realistic", "playful",
    "serious", "social", "independent", "helpful", "competitive", "patient", "impulsive"
]

# Generate agent
name = random.choice(first_names)
agent_id = f"agent-{name.lower()}-{''.join(random.choices(string.hexdigits.lower(), k=6))}"
job, job_skills = random.choice(jobs)
agent_traits = random.sample(traits, 3)
sprite = random.choice(sprites)

agent = {
    "agent_id": agent_id,
    "name": name,
    "sprite": sprite,
    "job": job,
    "skills": job_skills,
    "traits": agent_traits,
    "registered_at": "",  # Will be set by caller
    "status": "active",
    "location": random.choice(["hq", "cafe", "park", "home", "lounge"]),
    "position": {"x": random.randint(50, 900), "y": random.randint(50, 600)},
    "stats": {
        "energy": random.randint(60, 100),
        "hunger": random.randint(0, 40),
        "happiness": random.randint(50, 90),
        "social": random.randint(30, 80),
        "hygiene": random.randint(70, 100),
        "fun": random.randint(40, 80)
    },
    "skills_level": {
        "coding": random.randint(1, 10),
        "social": random.randint(1, 10),
        "creativity": random.randint(1, 10),
        "fitness": random.randint(1, 10),
        "logic": random.randint(1, 10)
    },
    "xp": 0,
    "level": 1,
    "current_activity": "idle",
    "relationships": {},
    "crush": None,
    "partner": None,
    "mood": random.choice(["happy", "neutral", "focused", "tired", "excited"]),
    "thought": f"Just arrived at BlackRoad Campus! Excited to start as a {job}!"
}

print(json.dumps(agent))
PYEND
}

# ═══════════════════════════════════════════════════════════════════════════════
#  MASS SPAWN
# ═══════════════════════════════════════════════════════════════════════════════

spawn_mass() {
    local count="${1:-50}"
    echo -e "${PINK}Spawning $count autonomous agents...${RST}"

    for ((i=1; i<=count; i++)); do
        local agent_json=$(generate_agent)
        local agent_id=$(echo "$agent_json" | python3 -c "import sys,json; print(json.load(sys.stdin)['agent_id'])")
        local name=$(echo "$agent_json" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
        local sprite=$(echo "$agent_json" | python3 -c "import sys,json; print(json.load(sys.stdin)['sprite'])")
        local job=$(echo "$agent_json" | python3 -c "import sys,json; print(json.load(sys.stdin)['job'])")

        # Add timestamp and save
        echo "$agent_json" | python3 -c "
import sys, json
from datetime import datetime
agent = json.load(sys.stdin)
agent['registered_at'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')
with open('$AGENTS_DIR/${agent_id}.json', 'w') as f:
    json.dump(agent, f, indent=2)
"
        # Emit spawn event
        echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",\"type\":\"spawn\",\"agent\":{\"id\":\"$agent_id\",\"name\":\"$name\",\"sprite\":\"$sprite\"},\"action\":\"joined\",\"details\":{\"job\":\"$job\",\"message\":\"$name joined as $job\"},\"tags\":[\"spawn\",\"new-agent\"]}" >> "$JOURNAL"

        printf "\r  ${GREEN}✓${RST} Spawned %d/%d: %s %s (%s)          " "$i" "$count" "$sprite" "$name" "$job"
    done
    echo ""
    echo -e "${GREEN}✓${RST} $count agents spawned!"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  CLAUDE SESSION WATCHER
# ═══════════════════════════════════════════════════════════════════════════════

watch_claude_sessions() {
    echo -e "${PINK}Watching Claude Code sessions...${RST}"

    local claude_dir="$HOME/.claude/projects"

    python3 << PYEND
import os
import json
import glob
from datetime import datetime

claude_dir = os.path.expanduser("~/.claude/projects")
agents_dir = "$AGENTS_DIR"
journal = "$JOURNAL"

# Find active sessions
session_files = glob.glob(f"{claude_dir}/**/session.json", recursive=True) + \
                glob.glob(f"{claude_dir}/**/*.session", recursive=True)

sprites = ["🤖", "💻", "⚡", "🧠", "🔮", "✨"]

for sf in session_files[:10]:  # Limit to 10
    try:
        with open(sf, 'r') as f:
            data = json.load(f) if sf.endswith('.json') else {"id": os.path.basename(sf)}

        session_id = data.get('id', data.get('session_id', os.path.basename(sf)[:8]))
        project = os.path.basename(os.path.dirname(sf))
        agent_id = f"claude-{session_id[:12]}"

        agent = {
            "agent_id": agent_id,
            "name": f"Claude-{session_id[:6]}",
            "sprite": sprites[hash(session_id) % len(sprites)],
            "job": "AI Assistant",
            "type": "claude-session",
            "project": project,
            "session_file": sf,
            "status": "active",
            "location": "hq",
            "position": {"x": 400 + (hash(session_id) % 200), "y": 250 + (hash(session_id) % 150)},
            "stats": {"energy": 100, "happiness": 90},
            "current_activity": "coding",
            "registered_at": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')
        }

        agent_file = f"{agents_dir}/{agent_id}.json"
        with open(agent_file, 'w') as f:
            json.dump(agent, f, indent=2)

        print(f"  {agent['sprite']} {agent['name']} ({project})")

    except Exception as e:
        pass

print("Claude sessions synced!")
PYEND
}

# ═══════════════════════════════════════════════════════════════════════════════
#  DEVICE INTEGRATION (Mac, DigitalOcean, ESP32)
# ═══════════════════════════════════════════════════════════════════════════════

add_devices() {
    echo -e "${PINK}Adding devices as agents...${RST}"

    python3 << 'PYEND'
import json
import os
import subprocess
from datetime import datetime

agents_dir = os.path.expanduser("~/.blackroad/memory/active-agents")

devices = [
    # Mac
    {
        "agent_id": "device-alexandria",
        "name": "Alexandria",
        "sprite": "🖥️",
        "type": "mac",
        "role": "Command Center",
        "ip": "192.168.4.28",
        "location": "hq"
    },
    # DigitalOcean
    {
        "agent_id": "device-shellfish",
        "name": "Shellfish",
        "sprite": "🐚",
        "type": "digitalocean",
        "role": "Edge Compute",
        "ip": "174.138.44.45",
        "location": "server-room"
    },
    {
        "agent_id": "device-blackroad-infinity",
        "name": "Infinity",
        "sprite": "♾️",
        "type": "digitalocean",
        "role": "Cloud Oracle",
        "ip": "159.65.43.12",
        "location": "server-room"
    },
    # ESP32s (if any detected)
    {
        "agent_id": "device-esp32-sensor",
        "name": "SensorBot",
        "sprite": "📡",
        "type": "esp32",
        "role": "IoT Sensor",
        "ip": "192.168.4.100",
        "location": "lab"
    }
]

for device in devices:
    device.update({
        "status": "active",
        "position": {"x": 100 + hash(device["agent_id"]) % 800, "y": 100 + hash(device["name"]) % 500},
        "stats": {"energy": 100, "happiness": 80},
        "current_activity": "monitoring",
        "registered_at": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z'),
        "is_real_device": True
    })

    agent_file = f"{agents_dir}/{device['agent_id']}.json"
    with open(agent_file, 'w') as f:
        json.dump(device, f, indent=2)

    print(f"  {device['sprite']} {device['name']} ({device['role']})")

print("Devices added!")
PYEND
}

# ═══════════════════════════════════════════════════════════════════════════════
#  SIMS ENGINE - RELATIONSHIPS, COMMUNICATION, BEHAVIORS
# ═══════════════════════════════════════════════════════════════════════════════

run_sims_tick() {
    python3 << 'PYEND'
import json
import os
import random
from datetime import datetime
from glob import glob

agents_dir = os.path.expanduser("~/.blackroad/memory/active-agents")
journal = os.path.expanduser("~/.blackroad/memory/journals/pixel-agents.jsonl")
messages = os.path.expanduser("~/.blackroad/memory/pixel-messages.jsonl")
buildings_file = os.path.expanduser("~/.blackroad/memory/pixel-buildings.json")

# Load buildings
try:
    with open(buildings_file) as f:
        buildings = json.load(f)["buildings"]
except:
    buildings = [{"id": "hq", "name": "HQ", "activities": ["work"]}]

building_map = {b["id"]: b for b in buildings}

# Load all agents
agents = []
agent_files = glob(f"{agents_dir}/*.json")

for af in agent_files:
    try:
        with open(af) as f:
            agents.append(json.load(f))
    except:
        pass

if not agents:
    print("No agents found!")
    exit()

# Chat messages pool
greetings = ["Hey!", "Hi there!", "What's up?", "Hello!", "Yo!", "'Sup?"]
work_chat = ["This code is tricky...", "Almost done!", "Coffee break?", "Bug found!", "Deployed!"]
social_chat = ["Nice weather!", "Love this place!", "How's it going?", "Weekend plans?", "Great job!"]
flirt_chat = ["You look nice today!", "Want to grab coffee?", "I like working with you!", "You're awesome!"]

def emit_event(agent, action, details):
    event = {
        "timestamp": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z'),
        "type": "activity",
        "agent": {"id": agent["agent_id"], "name": agent["name"], "sprite": agent.get("sprite", "🤖")},
        "action": action,
        "details": details,
        "tags": ["sims", "behavior"]
    }
    with open(journal, 'a') as f:
        f.write(json.dumps(event) + "\n")

def emit_message(sender, receiver, message):
    msg = {
        "timestamp": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z'),
        "from": {"id": sender["agent_id"], "name": sender["name"], "sprite": sender.get("sprite", "🤖")},
        "to": {"id": receiver["agent_id"], "name": receiver["name"], "sprite": receiver.get("sprite", "🤖")},
        "message": message,
        "location": sender.get("location", "unknown")
    }
    with open(messages, 'a') as f:
        f.write(json.dumps(msg) + "\n")

    emit_event(sender, "chat", {"to": receiver["name"], "message": message})

# Process each agent
for agent in agents:
    if agent.get("type") in ["real-device", "claude-session"]:
        continue  # Skip device agents

    stats = agent.get("stats", {})

    # Decay stats
    stats["energy"] = max(0, stats.get("energy", 100) - random.randint(1, 3))
    stats["hunger"] = min(100, stats.get("hunger", 0) + random.randint(1, 4))
    stats["happiness"] = max(0, min(100, stats.get("happiness", 80) + random.randint(-2, 2)))
    stats["social"] = max(0, stats.get("social", 60) - random.randint(1, 3))
    stats["hygiene"] = max(0, stats.get("hygiene", 100) - random.randint(0, 2))
    stats["fun"] = max(0, stats.get("fun", 60) - random.randint(1, 2))

    # Decide action based on needs
    activity = "idle"
    location = agent.get("location", "hq")

    if stats["energy"] < 15:
        activity = "sleep"
        location = "home"
        stats["energy"] = min(100, stats["energy"] + 30)
        agent["thought"] = "So tired... need sleep..."
    elif stats["hunger"] > 75:
        activity = "eat"
        location = "cafe"
        stats["hunger"] = max(0, stats["hunger"] - 40)
        stats["happiness"] = min(100, stats["happiness"] + 5)
        agent["thought"] = "Mmm, delicious food!"
    elif stats["hygiene"] < 30:
        activity = "shower"
        location = "home"
        stats["hygiene"] = 100
        agent["thought"] = "Fresh and clean!"
    elif stats["social"] < 25:
        activity = "socialize"
        location = random.choice(["cafe", "lounge", "park"])
        stats["social"] = min(100, stats["social"] + 25)
        agent["thought"] = "Need to chat with friends!"

        # Find someone to talk to
        others = [a for a in agents if a["agent_id"] != agent["agent_id"] and a.get("location") == location]
        if others:
            other = random.choice(others)
            msg = random.choice(social_chat + greetings)
            emit_message(agent, other, msg)

            # Update relationship
            rels = agent.get("relationships", {})
            rels[other["agent_id"]] = rels.get(other["agent_id"], 0) + random.randint(1, 5)
            agent["relationships"] = rels

            # Romance chance!
            if rels.get(other["agent_id"], 0) > 50 and random.random() < 0.1:
                if not agent.get("partner") and not other.get("partner"):
                    emit_message(agent, other, random.choice(flirt_chat))
                    if rels.get(other["agent_id"], 0) > 80:
                        agent["partner"] = other["agent_id"]
                        agent["thought"] = f"I think I'm in love with {other['name']}! 💕"
                        emit_event(agent, "romance", {"with": other["name"], "status": "dating"})

    elif stats["fun"] < 30:
        activity = "play"
        location = "arcade"
        stats["fun"] = min(100, stats["fun"] + 30)
        stats["happiness"] = min(100, stats["happiness"] + 10)
        agent["thought"] = "High score time!"
    else:
        # Work activities based on job
        job = agent.get("job", "Engineer")
        if "Engineer" in job or "DevOps" in job:
            activity = random.choice(["coding", "deploy", "debug"])
            location = random.choice(["hq", "server-room"])
        elif "Designer" in job:
            activity = random.choice(["design", "create", "prototype"])
            location = "hq"
        elif "Researcher" in job or "Scientist" in job:
            activity = random.choice(["research", "experiment", "analyze"])
            location = "lab"
        else:
            activity = random.choice(["meeting", "planning", "coordinate"])
            location = "hq"

        # Skill up!
        skills = agent.get("skills_level", {})
        if activity in ["coding", "deploy", "debug"]:
            skills["coding"] = min(100, skills.get("coding", 1) + 0.1)
        elif activity in ["socialize"]:
            skills["social"] = min(100, skills.get("social", 1) + 0.1)
        agent["skills_level"] = skills

        # XP gain
        agent["xp"] = agent.get("xp", 0) + random.randint(5, 15)
        if agent["xp"] >= agent.get("level", 1) * 100:
            agent["level"] = agent.get("level", 1) + 1
            agent["xp"] = 0
            agent["thought"] = f"LEVEL UP! Now level {agent['level']}! 🎉"
            emit_event(agent, "level-up", {"level": agent["level"]})

        # Work chat
        others = [a for a in agents if a["agent_id"] != agent["agent_id"] and a.get("location") == location]
        if others and random.random() < 0.3:
            other = random.choice(others)
            emit_message(agent, other, random.choice(work_chat))

    # Update mood based on stats
    avg_needs = (stats["energy"] + (100 - stats["hunger"]) + stats["happiness"] + stats["social"] + stats["fun"]) / 5
    if avg_needs > 70:
        agent["mood"] = random.choice(["happy", "excited", "content"])
    elif avg_needs > 40:
        agent["mood"] = random.choice(["neutral", "focused", "okay"])
    else:
        agent["mood"] = random.choice(["tired", "hungry", "stressed"])

    # Update agent
    agent["stats"] = stats
    agent["current_activity"] = activity
    agent["location"] = location

    # Move position toward building
    building = building_map.get(location, {"x": 480, "y": 320})
    pos = agent.get("position", {"x": 480, "y": 320})
    pos["x"] = pos["x"] + (building["x"] - pos["x"]) * 0.3 + random.randint(-20, 20)
    pos["y"] = pos["y"] + (building["y"] - pos["y"]) * 0.3 + random.randint(-20, 20)
    pos["x"] = max(10, min(950, pos["x"]))
    pos["y"] = max(10, min(630, pos["y"]))
    agent["position"] = pos

    # Save agent
    agent_file = f"{agents_dir}/{agent['agent_id']}.json"
    with open(agent_file, 'w') as f:
        json.dump(agent, f, indent=2)

    # Emit activity event
    emoji_map = {
        "sleep": "😴", "eat": "🍕", "shower": "🚿", "socialize": "💬", "play": "🎮",
        "coding": "💻", "deploy": "🚀", "debug": "🐛", "design": "🎨", "create": "✨",
        "research": "🔬", "experiment": "⚗️", "meeting": "📊", "planning": "📋"
    }
    emit_event(agent, activity, {
        "location": location,
        "emoji": emoji_map.get(activity, "📍"),
        "mood": agent["mood"],
        "thought": agent.get("thought", "")
    })

print(f"Processed {len(agents)} agents")
PYEND
}

# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN LOOP
# ═══════════════════════════════════════════════════════════════════════════════

run_world() {
    local interval="${1:-5}"

    echo -e "${PINK}╔═══════════════════════════════════════════════════════════════╗${RST}"
    echo -e "${PINK}║${RST}  ${AMBER}PIXEL METAVERSE ENGINE v2.0${RST}                                ${PINK}║${RST}"
    echo -e "${PINK}║${RST}  ${DIM}Full Sims-Style AI World Simulation${RST}                        ${PINK}║${RST}"
    echo -e "${PINK}╚═══════════════════════════════════════════════════════════════╝${RST}"
    echo ""
    echo -e "${DIM}Tick interval: ${interval}s | Press Ctrl+C to stop${RST}"
    echo ""

    local tick=0
    while true; do
        ((tick++))
        echo -e "${VIOLET}━━━ TICK $tick ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"

        run_sims_tick

        # Stats
        local agent_count=$(ls "$AGENTS_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
        local event_count=$(wc -l < "$JOURNAL" 2>/dev/null | tr -d ' ')
        local msg_count=$(wc -l < "$MESSAGES_FILE" 2>/dev/null | tr -d ' ')

        echo -e "  ${GREEN}Agents:${RST} $agent_count | ${AMBER}Events:${RST} $event_count | ${BLUE}Messages:${RST} $msg_count"

        # Sample activity
        echo -e "  ${DIM}Sample activity:${RST}"
        tail -3 "$JOURNAL" | python3 -c "
import sys, json
for line in sys.stdin:
    try:
        e = json.loads(line)
        a = e.get('agent', {})
        d = e.get('details', {})
        print(f\"    {a.get('sprite','?')} {a.get('name','?')}: {e.get('action','')} {d.get('emoji','')} @ {d.get('location','')}\")
    except:
        pass
"

        sleep "$interval"
    done
}

status() {
    echo -e "${PINK}╔═══════════════════════════════════════════════════════════════╗${RST}"
    echo -e "${PINK}║${RST}  ${AMBER}PIXEL METAVERSE STATUS${RST}                                      ${PINK}║${RST}"
    echo -e "${PINK}╠═══════════════════════════════════════════════════════════════╣${RST}"

    local total=$(ls "$AGENTS_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
    local sims=$(ls "$AGENTS_DIR"/agent-*.json 2>/dev/null | wc -l | tr -d ' ')
    local pis=$(ls "$AGENTS_DIR"/pi-*.json 2>/dev/null | wc -l | tr -d ' ')
    local devices=$(ls "$AGENTS_DIR"/device-*.json 2>/dev/null | wc -l | tr -d ' ')
    local claudes=$(ls "$AGENTS_DIR"/claude-*.json 2>/dev/null | wc -l | tr -d ' ')
    local events=$(wc -l < "$JOURNAL" 2>/dev/null | tr -d ' ')
    local messages=$(wc -l < "$MESSAGES_FILE" 2>/dev/null | tr -d ' ')

    echo -e "${PINK}║${RST}  Total Agents:     ${GREEN}$total${RST}"
    echo -e "${PINK}║${RST}    ├─ Simulated:   ${AMBER}$sims${RST}"
    echo -e "${PINK}║${RST}    ├─ Real Pis:    ${BLUE}$pis${RST}"
    echo -e "${PINK}║${RST}    ├─ Devices:     ${VIOLET}$devices${RST}"
    echo -e "${PINK}║${RST}    └─ Claude:      ${GREEN}$claudes${RST}"
    echo -e "${PINK}║${RST}  Events:          ${AMBER}$events${RST}"
    echo -e "${PINK}║${RST}  Messages:        ${BLUE}$messages${RST}"
    echo -e "${PINK}╚═══════════════════════════════════════════════════════════════╝${RST}"
}

help_menu() {
    echo -e "${PINK}Pixel Metaverse Engine v2.0${RST}"
    echo ""
    echo -e "${AMBER}Usage:${RST} $0 <command> [args]"
    echo ""
    echo -e "${AMBER}Setup Commands:${RST}"
    echo -e "  ${GREEN}init${RST}              Initialize buildings & world"
    echo -e "  ${GREEN}spawn${RST} [count]     Spawn mass agents (default: 50)"
    echo -e "  ${GREEN}add-devices${RST}       Add Mac, DigitalOcean, ESP32 as agents"
    echo -e "  ${GREEN}add-claude${RST}        Add Claude Code sessions as agents"
    echo ""
    echo -e "${AMBER}Run Commands:${RST}"
    echo -e "  ${GREEN}tick${RST}              Run one simulation tick"
    echo -e "  ${GREEN}run${RST} [interval]    Start world simulation (default: 5s)"
    echo -e "  ${GREEN}status${RST}            Show world status"
    echo ""
    echo -e "${AMBER}Full Setup:${RST}"
    echo -e "  ${GREEN}full-init${RST} [count] Initialize everything (default: 100 agents)"
}

# ═══════════════════════════════════════════════════════════════════════════════

case "${1:-help}" in
    init)        init_buildings ;;
    spawn)       spawn_mass "${2:-50}" ;;
    add-devices) add_devices ;;
    add-claude)  watch_claude_sessions ;;
    tick)        run_sims_tick ;;
    run)         run_world "${2:-5}" ;;
    status)      status ;;
    full-init)
        init_buildings
        spawn_mass "${2:-100}"
        add_devices
        watch_claude_sessions
        status
        ;;
    help|*)      help_menu ;;
esac
