#!/usr/bin/env python3
"""
BlackRoad LLM Multi-Language Code Templates
Templates for all major programming languages
"""
import json
from datetime import datetime

print("💻 BLACKROAD MULTI-LANGUAGE CODE TEMPLATES")
print("=" * 70)
print()

# ============================================================================
# MULTI-LANGUAGE CODE TEMPLATES
# ============================================================================

language_templates = {
    "python": {
        "description": "Python code generation",
        "examples": [
            {
                "prompt": "Create a FastAPI REST API",
                "response": """from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(title="BlackRoad API")

class Item(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None

items_db = []

@app.get("/")
async def root():
    return {"message": "BlackRoad API", "version": "1.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/items", response_model=List[Item])
async def list_items():
    return items_db

@app.post("/items", response_model=Item)
async def create_item(item: Item):
    item.id = len(items_db) + 1
    items_db.append(item)
    return item

@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    for item in items_db:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
""",
                "tags": ["python", "fastapi", "api"]
            },
            {
                "prompt": "Create async web scraper",
                "response": """import asyncio
import aiohttp
from bs4 import BeautifulSoup
from typing import List
import time

async def fetch_page(session, url):
    async with session.get(url) as response:
        return await response.text()

async def scrape_url(session, url):
    try:
        html = await fetch_page(session, url)
        soup = BeautifulSoup(html, 'html.parser')
        
        title = soup.find('title').text if soup.find('title') else 'No title'
        links = [a['href'] for a in soup.find_all('a', href=True)]
        
        return {
            'url': url,
            'title': title,
            'links_count': len(links),
            'links': links[:10]  # First 10 links
        }
    except Exception as e:
        return {'url': url, 'error': str(e)}

async def scrape_multiple(urls: List[str]):
    async with aiohttp.ClientSession() as session:
        tasks = [scrape_url(session, url) for url in urls]
        return await asyncio.gather(*tasks)

if __name__ == '__main__':
    urls = [
        'https://blackroad.io',
        'https://blackroad.systems',
        'https://lucidia.earth'
    ]
    
    start = time.time()
    results = asyncio.run(scrape_multiple(urls))
    elapsed = time.time() - start
    
    print(f"Scraped {len(urls)} URLs in {elapsed:.2f}s")
    for result in results:
        print(result)
""",
                "tags": ["python", "async", "scraping"]
            }
        ]
    },
    
    "javascript": {
        "description": "JavaScript/Node.js code generation",
        "examples": [
            {
                "prompt": "Create Express REST API",
                "response": """const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// In-memory database
let items = [];
let nextId = 1;

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'BlackRoad API', version: '1.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/items', (req, res) => {
  res.json(items);
});

app.post('/items', (req, res) => {
  const item = {
    id: nextId++,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  items.push(item);
  res.status(201).json(item);
});

app.get('/items/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

app.listen(PORT, () => {
  console.log(`BlackRoad API listening on port ${PORT}`);
});
""",
                "tags": ["javascript", "express", "api"]
            },
            {
                "prompt": "Create React component with hooks",
                "response": """import React, { useState, useEffect } from 'react';

const DataFetcher = ({ url }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="data-container">
      <h2>Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default DataFetcher;
""",
                "tags": ["javascript", "react", "hooks"]
            }
        ]
    },
    
    "typescript": {
        "description": "TypeScript code generation",
        "examples": [
            {
                "prompt": "Create TypeScript API client",
                "response": """interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface Item {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}

class BlackRoadApiClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: { ...this.headers, ...options.headers }
    });

    const data = await response.json();

    return {
      data,
      status: response.status,
      message: response.statusText
    };
  }

  async getItems(): Promise<ApiResponse<Item[]>> {
    return this.request<Item[]>('/items');
  }

  async getItem(id: number): Promise<ApiResponse<Item>> {
    return this.request<Item>(`/items/${id}`);
  }

  async createItem(item: Omit<Item, 'id' | 'createdAt'>): Promise<ApiResponse<Item>> {
    return this.request<Item>('/items', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }
}

export { BlackRoadApiClient, Item, ApiResponse };
""",
                "tags": ["typescript", "api", "client"]
            }
        ]
    },
    
    "rust": {
        "description": "Rust code generation",
        "examples": [
            {
                "prompt": "Create Rust HTTP server with Actix",
                "response": """use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Item {
    id: u32,
    name: String,
    description: Option<String>,
}

struct AppState {
    items: Mutex<Vec<Item>>,
}

async fn health() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy"
    }))
}

async fn list_items(data: web::Data<AppState>) -> impl Responder {
    let items = data.items.lock().unwrap();
    HttpResponse::Ok().json(&*items)
}

async fn create_item(
    item: web::Json<Item>,
    data: web::Data<AppState>
) -> impl Responder {
    let mut items = data.items.lock().unwrap();
    let new_item = Item {
        id: items.len() as u32 + 1,
        name: item.name.clone(),
        description: item.description.clone(),
    };
    items.push(new_item.clone());
    HttpResponse::Created().json(new_item)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let app_state = web::Data::new(AppState {
        items: Mutex::new(Vec::new()),
    });

    println!("Starting BlackRoad server on 0.0.0.0:8080");

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .route("/health", web::get().to(health))
            .route("/items", web::get().to(list_items))
            .route("/items", web::post().to(create_item))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
""",
                "tags": ["rust", "actix", "server"]
            }
        ]
    },
    
    "go": {
        "description": "Go code generation",
        "examples": [
            {
                "prompt": "Create Go REST API with Gin",
                "response": """package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type Item struct {
    ID          int    `json:"id"`
    Name        string `json:"name"`
    Description string `json:"description,omitempty"`
}

var items = []Item{}
var nextID = 1

func main() {
    router := gin.Default()

    router.GET("/", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "message": "BlackRoad API",
            "version": "1.0",
        })
    })

    router.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "healthy"})
    })

    router.GET("/items", func(c *gin.Context) {
        c.JSON(http.StatusOK, items)
    })

    router.POST("/items", func(c *gin.Context) {
        var item Item
        if err := c.BindJSON(&item); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        item.ID = nextID
        nextID++
        items = append(items, item)
        
        c.JSON(http.StatusCreated, item)
    })

    router.GET("/items/:id", func(c *gin.Context) {
        id := c.Param("id")
        for _, item := range items {
            if item.ID == id {
                c.JSON(http.StatusOK, item)
                return
            }
        }
        c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
    })

    router.Run(":8080")
}
""",
                "tags": ["go", "gin", "api"]
            }
        ]
    },
    
    "java": {
        "description": "Java code generation",
        "examples": [
            {
                "prompt": "Create Spring Boot REST API",
                "response": """package io.blackroad.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@SpringBootApplication
@RestController
@RequestMapping("/api")
public class BlackRoadApiApplication {

    private List<Item> items = new ArrayList<>();
    private AtomicInteger nextId = new AtomicInteger(1);

    public static void main(String[] args) {
        SpringApplication.run(BlackRoadApiApplication.class, args);
    }

    @GetMapping("/")
    public Response root() {
        return new Response("BlackRoad API", "1.0");
    }

    @GetMapping("/health")
    public Health health() {
        return new Health("healthy");
    }

    @GetMapping("/items")
    public List<Item> listItems() {
        return items;
    }

    @PostMapping("/items")
    public Item createItem(@RequestBody Item item) {
        item.setId(nextId.getAndIncrement());
        items.add(item);
        return item;
    }

    @GetMapping("/items/{id}")
    public Item getItem(@PathVariable int id) {
        return items.stream()
            .filter(item -> item.getId() == id)
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Item not found"));
    }
}

class Item {
    private int id;
    private String name;
    private String description;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

record Response(String message, String version) {}
record Health(String status) {}
""",
                "tags": ["java", "spring-boot", "api"]
            }
        ]
    },
    
    "c": {
        "description": "C code generation",
        "examples": [
            {
                "prompt": "Create C HTTP server",
                "response": """#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>

#define PORT 8080
#define BUFFER_SIZE 1024

void handle_request(int client_socket) {
    char buffer[BUFFER_SIZE] = {0};
    read(client_socket, buffer, BUFFER_SIZE);
    
    printf("Request: %s\\n", buffer);
    
    const char *response = 
        "HTTP/1.1 200 OK\\r\\n"
        "Content-Type: application/json\\r\\n"
        "Connection: close\\r\\n"
        "\\r\\n"
        "{\\"message\\": \\"BlackRoad Server\\", \\"version\\": \\"1.0\\"}";
    
    write(client_socket, response, strlen(response));
    close(client_socket);
}

int main() {
    int server_fd, client_socket;
    struct sockaddr_in address;
    int opt = 1;
    int addrlen = sizeof(address);
    
    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        perror("socket failed");
        exit(EXIT_FAILURE);
    }
    
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt))) {
        perror("setsockopt");
        exit(EXIT_FAILURE);
    }
    
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);
    
    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("bind failed");
        exit(EXIT_FAILURE);
    }
    
    if (listen(server_fd, 3) < 0) {
        perror("listen");
        exit(EXIT_FAILURE);
    }
    
    printf("BlackRoad server listening on port %d\\n", PORT);
    
    while(1) {
        if ((client_socket = accept(server_fd, (struct sockaddr *)&address, 
                                    (socklen_t*)&addrlen)) < 0) {
            perror("accept");
            continue;
        }
        
        handle_request(client_socket);
    }
    
    return 0;
}
""",
                "tags": ["c", "server", "http"]
            }
        ]
    },
    
    "cpp": {
        "description": "C++ code generation",
        "examples": [
            {
                "prompt": "Create C++ REST API with Crow",
                "response": """#include "crow_all.h"
#include <vector>
#include <memory>

struct Item {
    int id;
    std::string name;
    std::string description;
};

std::vector<Item> items;
int nextId = 1;

int main() {
    crow::SimpleApp app;

    CROW_ROUTE(app, "/")([](){
        crow::json::wvalue response;
        response["message"] = "BlackRoad API";
        response["version"] = "1.0";
        return response;
    });

    CROW_ROUTE(app, "/health")([](){
        crow::json::wvalue response;
        response["status"] = "healthy";
        return response;
    });

    CROW_ROUTE(app, "/items").methods("GET"_method)([](){
        crow::json::wvalue response;
        response = crow::json::wvalue::list();
        
        for(const auto& item : items) {
            crow::json::wvalue item_json;
            item_json["id"] = item.id;
            item_json["name"] = item.name;
            item_json["description"] = item.description;
            response.push_back(std::move(item_json));
        }
        
        return response;
    });

    CROW_ROUTE(app, "/items").methods("POST"_method)([](const crow::request& req){
        auto body = crow::json::load(req.body);
        if (!body)
            return crow::response(400);
        
        Item item;
        item.id = nextId++;
        item.name = body["name"].s();
        item.description = body["description"].s();
        items.push_back(item);
        
        crow::json::wvalue response;
        response["id"] = item.id;
        response["name"] = item.name;
        response["description"] = item.description;
        
        return crow::response{response};
    });

    app.port(8080).multithreaded().run();
}
""",
                "tags": ["cpp", "crow", "api"]
            }
        ]
    },
    
    "ruby": {
        "description": "Ruby code generation",
        "examples": [
            {
                "prompt": "Create Ruby Sinatra API",
                "response": """require 'sinatra'
require 'json'

set :port, 4567
set :bind, '0.0.0.0'

items = []
next_id = 1

get '/' do
  content_type :json
  { message: 'BlackRoad API', version: '1.0' }.to_json
end

get '/health' do
  content_type :json
  { status: 'healthy' }.to_json
end

get '/items' do
  content_type :json
  items.to_json
end

post '/items' do
  content_type :json
  data = JSON.parse(request.body.read)
  
  item = {
    id: next_id,
    name: data['name'],
    description: data['description']
  }
  
  next_id += 1
  items << item
  
  status 201
  item.to_json
end

get '/items/:id' do
  content_type :json
  id = params['id'].to_i
  item = items.find { |i| i[:id] == id }
  
  if item
    item.to_json
  else
    status 404
    { error: 'Item not found' }.to_json
  end
end
""",
                "tags": ["ruby", "sinatra", "api"]
            }
        ]
    },
    
    "php": {
        "description": "PHP code generation",
        "examples": [
            {
                "prompt": "Create PHP REST API",
                "response": """<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$items = [];
$nextId = 1;

function response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if ($path === '/' && $method === 'GET') {
    response([
        'message' => 'BlackRoad API',
        'version' => '1.0'
    ]);
}

if ($path === '/health' && $method === 'GET') {
    response(['status' => 'healthy']);
}

if ($path === '/items' && $method === 'GET') {
    response($items);
}

if ($path === '/items' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $item = [
        'id' => $nextId++,
        'name' => $data['name'] ?? '',
        'description' => $data['description'] ?? ''
    ];
    
    $items[] = $item;
    response($item, 201);
}

if (preg_match('/\\/items\\/(\\d+)/', $path, $matches) && $method === 'GET') {
    $id = (int)$matches[1];
    
    foreach ($items as $item) {
        if ($item['id'] === $id) {
            response($item);
        }
    }
    
    response(['error' => 'Item not found'], 404);
}

response(['error' => 'Not found'], 404);
?>
""",
                "tags": ["php", "api", "rest"]
            }
        ]
    },
    
    "swift": {
        "description": "Swift code generation",
        "examples": [
            {
                "prompt": "Create Swift Vapor API",
                "response": """import Vapor

struct Item: Content {
    var id: Int?
    var name: String
    var description: String?
}

var items: [Item] = []
var nextId = 1

func routes(_ app: Application) throws {
    app.get { req -> [String: String] in
        return [
            "message": "BlackRoad API",
            "version": "1.0"
        ]
    }
    
    app.get("health") { req -> [String: String] in
        return ["status": "healthy"]
    }
    
    app.get("items") { req -> [Item] in
        return items
    }
    
    app.post("items") { req -> Item in
        let item = try req.content.decode(Item.self)
        var newItem = item
        newItem.id = nextId
        nextId += 1
        items.append(newItem)
        return newItem
    }
    
    app.get("items", ":id") { req -> Item in
        guard let id = req.parameters.get("id", as: Int.self) else {
            throw Abort(.badRequest)
        }
        
        guard let item = items.first(where: { $0.id == id }) else {
            throw Abort(.notFound)
        }
        
        return item
    }
}

@main
struct BlackRoadAPI {
    static func main() throws {
        var env = try Environment.detect()
        try LoggingSystem.bootstrap(from: &env)
        let app = Application(env)
        defer { app.shutdown() }
        
        try configure(app)
        try app.run()
    }
}
""",
                "tags": ["swift", "vapor", "api"]
            }
        ]
    },
    
    "kotlin": {
        "description": "Kotlin code generation",
        "examples": [
            {
                "prompt": "Create Kotlin Ktor API",
                "response": """import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import io.ktor.http.*
import kotlinx.serialization.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.contentnegotiation.*

@Serializable
data class Item(
    val id: Int? = null,
    val name: String,
    val description: String? = null
)

val items = mutableListOf<Item>()
var nextId = 1

fun main() {
    embeddedServer(Netty, port = 8080) {
        install(ContentNegotiation) {
            json()
        }
        
        routing {
            get("/") {
                call.respond(mapOf(
                    "message" to "BlackRoad API",
                    "version" to "1.0"
                ))
            }
            
            get("/health") {
                call.respond(mapOf("status" to "healthy"))
            }
            
            get("/items") {
                call.respond(items)
            }
            
            post("/items") {
                val item = call.receive<Item>()
                val newItem = item.copy(id = nextId++)
                items.add(newItem)
                call.respond(HttpStatusCode.Created, newItem)
            }
            
            get("/items/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                val item = items.find { it.id == id }
                
                if (item != null) {
                    call.respond(item)
                } else {
                    call.respond(HttpStatusCode.NotFound, 
                        mapOf("error" to "Item not found"))
                }
            }
        }
    }.start(wait = true)
}
""",
                "tags": ["kotlin", "ktor", "api"]
            }
        ]
    },
    
    "elixir": {
        "description": "Elixir code generation",
        "examples": [
            {
                "prompt": "Create Elixir Phoenix API",
                "response": """defmodule BlackRoadApi.Router do
  use Plug.Router

  plug :match
  plug Plug.Parsers, parsers: [:json], json_decoder: Jason
  plug :dispatch

  @items_agent :items_store

  def init(opts) do
    Agent.start_link(fn -> %{items: [], next_id: 1} end, name: @items_agent)
    opts
  end

  get "/" do
    send_resp(conn, 200, Jason.encode!(%{
      message: "BlackRoad API",
      version: "1.0"
    }))
  end

  get "/health" do
    send_resp(conn, 200, Jason.encode!(%{status: "healthy"}))
  end

  get "/items" do
    items = Agent.get(@items_agent, fn state -> state.items end)
    send_resp(conn, 200, Jason.encode!(items))
  end

  post "/items" do
    item = conn.body_params
    
    new_item = Agent.get_and_update(@items_agent, fn state ->
      new_id = state.next_id
      item_with_id = Map.put(item, "id", new_id)
      
      {item_with_id, %{
        items: [item_with_id | state.items],
        next_id: new_id + 1
      }}
    end)
    
    send_resp(conn, 201, Jason.encode!(new_item))
  end

  get "/items/:id" do
    id = String.to_integer(id)
    items = Agent.get(@items_agent, fn state -> state.items end)
    
    case Enum.find(items, fn item -> item["id"] == id end) do
      nil -> send_resp(conn, 404, Jason.encode!(%{error: "Item not found"}))
      item -> send_resp(conn, 200, Jason.encode!(item))
    end
  end

  match _ do
    send_resp(conn, 404, Jason.encode!(%{error: "Not found"}))
  end
end
""",
                "tags": ["elixir", "phoenix", "api"]
            }
        ]
    },
    
    "bash": {
        "description": "Bash script generation",
        "examples": [
            {
                "prompt": "Create bash deployment script",
                "response": """#!/bin/bash
# BlackRoad Deployment Script
set -e

SERVICE_NAME="${1:-blackroad-service}"
ENVIRONMENT="${2:-production}"

echo "🚀 BlackRoad Deployment"
echo "   Service: $SERVICE_NAME"
echo "   Environment: $ENVIRONMENT"
echo ""

# Colors
GREEN='\\033[0;32m'
RED='\\033[0;31m'
NC='\\033[0m'

# Check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    if ! command -v npm &> /dev/null; then
        echo "${RED}❌ npm not found${NC}"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        echo "${RED}❌ git not found${NC}"
        exit 1
    fi
    
    echo "${GREEN}✅ Prerequisites OK${NC}"
}

# Build
build() {
    echo "📦 Building..."
    npm install
    npm run build
    echo "${GREEN}✅ Build complete${NC}"
}

# Test
test() {
    echo "🧪 Running tests..."
    npm run test || true
    echo "${GREEN}✅ Tests complete${NC}"
}

# Deploy
deploy() {
    echo "🚢 Deploying to $ENVIRONMENT..."
    
    case $ENVIRONMENT in
        production)
            railway up --service $SERVICE_NAME
            ;;
        staging)
            wrangler pages deploy dist --project-name=$SERVICE_NAME-staging
            ;;
        *)
            echo "${RED}❌ Unknown environment: $ENVIRONMENT${NC}"
            exit 1
            ;;
    esac
    
    echo "${GREEN}✅ Deployed!${NC}"
}

# Main
main() {
    check_prerequisites
    build
    test
    deploy
    
    echo ""
    echo "${GREEN}🎉 Deployment complete!${NC}"
}

main
""",
                "tags": ["bash", "deployment", "script"]
            }
        ]
    },
    
    "sql": {
        "description": "SQL code generation",
        "examples": [
            {
                "prompt": "Create database schema",
                "response": """-- BlackRoad Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Item tags junction table
CREATE TABLE item_tags (
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
);

-- Indexes
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_created_at ON items(created_at);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
""",
                "tags": ["sql", "database", "schema"]
            }
        ]
    }
}

# ============================================================================
# SAVE ALL LANGUAGE TEMPLATES
# ============================================================================

all_templates = {
    "metadata": {
        "created": datetime.now().isoformat(),
        "version": "2.0",
        "purpose": "Multi-language code templates for BlackRoad LLM",
        "languages": len(language_templates)
    },
    "templates": language_templates,
    "stats": {
        "total_languages": len(language_templates),
        "total_examples": sum(len(lang["examples"]) for lang in language_templates.values()),
        "languages": list(language_templates.keys())
    }
}

with open('blackroad_all_language_templates.json', 'w') as f:
    json.dump(all_templates, f, indent=2)

print("📊 MULTI-LANGUAGE TEMPLATE STATISTICS")
print("=" * 70)
print()
print(f"Languages: {all_templates['stats']['total_languages']}")
print(f"Total examples: {all_templates['stats']['total_examples']}")
print()

for lang, data in language_templates.items():
    print(f"💻 {lang.upper()}:")
    print(f"   Examples: {len(data['examples'])}")
    print(f"   Description: {data['description']}")
    print()

print("💾 Saved to: blackroad_all_language_templates.json")
print()
print(f"✅ Ready to train on {all_templates['stats']['total_languages']} programming languages!")
