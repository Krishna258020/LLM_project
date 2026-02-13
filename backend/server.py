from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import aiomysql
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import requests
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MySQL connection pool
db_pool: Optional[aiomysql.Pool] = None

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ Ollama Configuration ============
OLLAMA_BASE_URL = os.environ.get('OLLAMA_URL', 'http://localhost:11434')

# ============ Database Initialization ============

async def init_db():
    """Initialize MySQL database and create tables"""
    global db_pool
    
    try:
        db_pool = await aiomysql.create_pool(
            host=os.environ.get('DB_HOST', 'localhost'),
            port=int(os.environ.get('DB_PORT', 3306)),
            user=os.environ.get('DB_USER', 'root'),
            password=os.environ.get('DB_PASSWORD', ''),
            db=os.environ.get('DB_NAME', 'debate_database'),
            autocommit=True,
            minsize=1,
            maxsize=10
        )
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        logger.error("Please run 'create_mysql_database.bat' to create the database first")
        raise
    
    # Create tables if they don't exist
    async with db_pool.acquire() as conn:
        async with conn.cursor() as cursor:
            # Debates table with new fields
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS debates (
                    id VARCHAR(36) PRIMARY KEY,
                    prompt TEXT NOT NULL,
                    result TEXT NOT NULL,
                    steps JSON NOT NULL,
                    timestamp DATETIME NOT NULL,
                    tags JSON DEFAULT NULL,
                    category VARCHAR(100) DEFAULT NULL,
                    is_favorite BOOLEAN DEFAULT FALSE,
                    duration_seconds INT DEFAULT NULL,
                    INDEX idx_timestamp (timestamp),
                    INDEX idx_category (category),
                    INDEX idx_favorite (is_favorite)
                )
            """)
            
            # Status checks table
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS status_checks (
                    id VARCHAR(36) PRIMARY KEY,
                    client_name VARCHAR(255) NOT NULL,
                    timestamp DATETIME NOT NULL,
                    INDEX idx_timestamp (timestamp)
                )
            """)
            
            # Users table for Phase 2
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(36) PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'user',
                    created_at DATETIME NOT NULL,
                    last_login DATETIME DEFAULT NULL,
                    INDEX idx_username (username),
                    INDEX idx_email (email)
                )
            """)
            
            # Templates table
            await cursor.execute("""
                CREATE TABLE IF NOT EXISTS templates (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    prompt_template TEXT NOT NULL,
                    category VARCHAR(100),
                    is_public BOOLEAN DEFAULT TRUE,
                    created_by VARCHAR(36),
                    created_at DATETIME NOT NULL,
                    usage_count INT DEFAULT 0,
                    INDEX idx_category (category),
                    INDEX idx_public (is_public)
                )
            """)
            
            # Seed default templates if table is empty
            await cursor.execute("SELECT COUNT(*) as count FROM templates")
            result = await cursor.fetchone()
            if result[0] == 0:
                default_templates = [
                    {
                        'id': str(uuid.uuid4()),
                        'name': 'Technical Analysis',
                        'description': 'Analyze technical concepts and provide detailed explanations',
                        'prompt_template': 'Explain the technical concept of [TOPIC] in detail, including its benefits, drawbacks, and real-world applications.',
                        'category': 'Technical',
                        'created_at': datetime.now(timezone.utc)
                    },
                    {
                        'id': str(uuid.uuid4()),
                        'name': 'Problem Solving',
                        'description': 'Break down complex problems into manageable solutions',
                        'prompt_template': 'Help me solve this problem: [PROBLEM]. Provide a step-by-step approach with clear reasoning.',
                        'category': 'Problem Solving',
                        'created_at': datetime.now(timezone.utc)
                    },
                    {
                        'id': str(uuid.uuid4()),
                        'name': 'Code Review',
                        'description': 'Review code for best practices and improvements',
                        'prompt_template': 'Review this code and suggest improvements: [CODE]. Focus on performance, readability, and best practices.',
                        'category': 'Technical',
                        'created_at': datetime.now(timezone.utc)
                    },
                    {
                        'id': str(uuid.uuid4()),
                        'name': 'Business Strategy',
                        'description': 'Analyze business scenarios and provide strategic insights',
                        'prompt_template': 'Analyze this business scenario: [SCENARIO]. Provide strategic recommendations and potential outcomes.',
                        'category': 'Business',
                        'created_at': datetime.now(timezone.utc)
                    },
                    {
                        'id': str(uuid.uuid4()),
                        'name': 'Learning Path',
                        'description': 'Create structured learning paths for any topic',
                        'prompt_template': 'Create a comprehensive learning path for [TOPIC]. Include resources, milestones, and estimated timeframes.',
                        'category': 'Education',
                        'created_at': datetime.now(timezone.utc)
                    },
                    {
                        'id': str(uuid.uuid4()),
                        'name': 'Comparison Analysis',
                        'description': 'Compare and contrast different options or approaches',
                        'prompt_template': 'Compare [OPTION A] vs [OPTION B]. Analyze pros, cons, use cases, and provide a recommendation.',
                        'category': 'Analysis',
                        'created_at': datetime.now(timezone.utc)
                    }
                ]
                
                for template in default_templates:
                    await cursor.execute("""
                        INSERT INTO templates (id, name, description, prompt_template, category, is_public, created_at, usage_count)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        template['id'],
                        template['name'],
                        template['description'],
                        template['prompt_template'],
                        template['category'],
                        True,
                        template['created_at'],
                        0
                    ))
                
                logger.info(f"Seeded {len(default_templates)} default templates")

    
    logger.info("Database initialized successfully")

# ============ Multi-Agent Debate Models ============

class DebateRequest(BaseModel):
    prompt: str
    tags: Optional[List[str]] = []
    category: Optional[str] = None
    category: Optional[str] = None

class DebateResponse(BaseModel):
    result: str
    steps: List[dict] = []
    duration_seconds: Optional[int] = None
    final_confidence: Optional[float] = None

class DebateHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prompt: str
    result: str
    steps: List[dict]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tags: Optional[List[str]] = []
    category: Optional[str] = None
    is_favorite: bool = False
    duration_seconds: Optional[int] = None

class DebateUpdate(BaseModel):
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    is_favorite: Optional[bool] = None

class Template(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    prompt_template: str
    category: Optional[str] = None
    is_public: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    usage_count: int = 0

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    prompt_template: str
    category: Optional[str] = None

# ============ Agent Classes ============

class OllamaAgent:
    """Base class for all Ollama agents"""
    
    def __init__(self, model_name: str, temperature: float = 0.7):
        self.model_name = model_name
        self.temperature = temperature
        self.base_url = OLLAMA_BASE_URL
    
    def generate(self, prompt: str, max_tokens: int = 512) -> str:
        """Call Ollama API to generate response"""
        try:
            url = f"{self.base_url}/api/generate"
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": self.temperature,
                    "num_predict": max_tokens
                }
            }
            
            logger.info(f"Calling {self.model_name} with prompt: {prompt[:100]}...")
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            
            result = response.json()
            generated_text = result.get('response', '').strip()
            logger.info(f"{self.model_name} response: {generated_text[:100]}...")
            
            return generated_text
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling {self.model_name}: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"Failed to connect to Ollama. Ensure Ollama is running and {self.model_name} is available."
            )
        except Exception as e:
            logger.error(f"Unexpected error in {self.model_name}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))


class SolverAgent(OllamaAgent):
    """Generates initial answer to user prompt"""

    def __init__(self):
        super().__init__(model_name="phi:latest", temperature=0.7)

    def solve(self, user_prompt: str) -> str:
        prompt = f"""You are a helpful AI assistant. Provide a clear, concise answer.

Question: {user_prompt}

Answer:"""
        return self.generate(prompt, max_tokens=300)


class CriticAgent(OllamaAgent):
    """Critiques the solver's answer"""

    def __init__(self):
        super().__init__(model_name="phi:latest", temperature=0.4)

    def critique(self, user_prompt: str, solver_answer: str) -> str:
        prompt = f"""You are a critical reviewer.

Question: {user_prompt}

Answer to review: {solver_answer}

Reply ONLY with "OK" if correct, otherwise critique briefly.
"""
        return self.generate(prompt, max_tokens=50)


class RefinerAgent(OllamaAgent):
    """Refines the answer based on critique"""

    def __init__(self):
        super().__init__(model_name="phi:latest", temperature=0.6)

    def refine(self, user_prompt: str, solver_answer: str, critique: str) -> str:
        prompt = f"""Rewrite the answer to fix the critique.

Question: {user_prompt}

Original answer: {solver_answer}

Critique: {critique}

Improved answer:"""
        return self.generate(prompt, max_tokens=300)


class JudgeAgent(OllamaAgent):
    """Produces final validated answer"""

    def __init__(self):
        super().__init__(model_name="phi:latest", temperature=0.5)

    def judge(self, user_prompt: str, refined_answer: str) -> str:
        prompt = f"""Produce a final authoritative answer.

Question: {user_prompt}

Refined answer: {refined_answer}

Final answer:"""
        return self.generate(prompt, max_tokens=300)




# ============ Multi-Agent Orchestrator ============

class DebateOrchestrator:
    """Orchestrates the multi-agent debate"""
    
    def __init__(self):
        self.solver = SolverAgent()
        self.critic = CriticAgent()
        self.refiner = RefinerAgent()
        self.judge = JudgeAgent()
    
    def run_debate(self, user_prompt: str) -> dict:
        """Run the full debate cycle"""
        steps = []
        
        # Step 1: Solver generates initial answer
        logger.info("Step 1: Solver generating initial answer...")
        solver_answer = self.solver.solve(user_prompt)
        steps.append({
            "agent": "Solver",
            "model": "mistral",
            "output": solver_answer,
            "confidence": 75  # Initial answer has moderate confidence
        })
        
        # Step 2: Critic reviews the answer
        logger.info("Step 2: Critic reviewing answer...")
        critique = self.critic.critique(user_prompt, solver_answer)
        
        # Calculate critic confidence based on approval
        critic_approved = critique.strip().upper() == "OK" or "OK" in critique.upper()[:10]
        critic_confidence = 95 if critic_approved else 70
        
        steps.append({
            "agent": "Critic",
            "model": "phi",
            "output": critique,
            "confidence": critic_confidence
        })
        
        # Step 3: Check if critique is OK
        if critic_approved:
            logger.info("Critique approved. Returning solver answer.")
            return {
                "result": solver_answer,
                "steps": steps,
                "final_confidence": 90  # High confidence when critic approves directly
            }
        
        # Step 4: Refiner improves the answer
        logger.info("Step 3: Refiner improving answer...")
        refined_answer = self.refiner.refine(user_prompt, solver_answer, critique)
        
        # Calculate refiner confidence based on improvement
        improvement_ratio = len(refined_answer) / max(len(solver_answer), 1)
        refiner_confidence = min(85 + (improvement_ratio * 5), 92)
        
        steps.append({
            "agent": "Refiner",
            "model": "llama3.1",
            "output": refined_answer,
            "confidence": round(refiner_confidence, 1)
        })
        
        # Step 5: Judge produces final answer
        logger.info("Step 4: Judge producing final answer...")
        final_answer = self.judge.judge(user_prompt, refined_answer)
        
        # Calculate judge confidence based on consensus
        # Higher confidence when all agents participated
        judge_confidence = 92 + (len(steps) * 1.5)  # More steps = more thorough review
        judge_confidence = min(judge_confidence, 98)
        
        steps.append({
            "agent": "Judge",
            "model": "mistral",
            "output": final_answer,
            "confidence": round(judge_confidence, 1)
        })
        
        # Calculate final confidence as weighted average
        # Judge has highest weight, then Refiner, Critic, Solver
        weights = {"Solver": 0.15, "Critic": 0.20, "Refiner": 0.30, "Judge": 0.35}
        final_confidence = sum(
            step["confidence"] * weights.get(step["agent"], 0.25) 
            for step in steps
        )
        
        return {
            "result": final_answer,
            "steps": steps,
            "final_confidence": round(final_confidence, 1)
        }


# Initialize orchestrator
orchestrator = DebateOrchestrator()

# ============ API Routes ============

@api_router.get("/")
async def root():
    return {"message": "Multi-Agent LLM Debate System", "status": "running"}


@api_router.get("/health")
async def health_check():
    """Check if Ollama is running and models are available"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        response.raise_for_status()
        models = response.json().get('models', [])
        model_names = [m['name'] for m in models]
        
        required_models = ['mistral', 'phi', 'llama']
        available = {model: any(model in name for name in model_names) for model in required_models}
        
        # Check database connection
        db_status = "connected"
        try:
            async with db_pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute("SELECT 1")
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        return {
            "ollama_status": "running",
            "models_available": available,
            "all_models": model_names,
            "database_status": db_status
        }
    except Exception as e:
        return {
            "ollama_status": "not running",
            "error": str(e)
        }


@api_router.post("/debate", response_model=DebateResponse)
async def create_debate(request: DebateRequest):
    """Run multi-agent debate on user prompt"""
    try:
        logger.info(f"Starting debate for prompt: {request.prompt}")
        
        # Track start time
        import time
        start_time = time.time()
        
        # Run the debate
        result = orchestrator.run_debate(request.prompt)
        
        # Calculate duration
        duration = int(time.time() - start_time)
        
        # Save to database
        debate_obj = DebateHistory(
            prompt=request.prompt,
            result=result['result'],
            steps=result['steps'],
            tags=request.tags or [],
            category=request.category,
            duration_seconds=duration
        )
        
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    INSERT INTO debates (id, prompt, result, steps, timestamp, tags, category, duration_seconds)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        debate_obj.id,
                        debate_obj.prompt,
                        debate_obj.result,
                        json.dumps(debate_obj.steps),
                        debate_obj.timestamp,
                        json.dumps(debate_obj.tags) if debate_obj.tags else None,
                        debate_obj.category,
                        debate_obj.duration_seconds
                    )
                )
        
        logger.info("Debate completed successfully")
        return DebateResponse(
            result=result['result'],
            steps=result['steps'],
            duration_seconds=duration
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in debate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/debates", response_model=List[DebateHistory])
async def get_debates():
    """Get all debate history"""
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                "SELECT * FROM debates ORDER BY timestamp DESC LIMIT 100"
            )
            debates = await cursor.fetchall()
    
    result = []
    for debate in debates:
        result.append(DebateHistory(
            id=debate['id'],
            prompt=debate['prompt'],
            result=debate['result'],
            steps=json.loads(debate['steps']) if isinstance(debate['steps'], str) else debate['steps'],
            timestamp=debate['timestamp'],
            tags=json.loads(debate['tags']) if debate.get('tags') and isinstance(debate['tags'], str) else (debate.get('tags') or []),
            category=debate.get('category'),
            is_favorite=bool(debate.get('is_favorite', False)),
            duration_seconds=debate.get('duration_seconds')
        ))
    
    return result


@api_router.patch("/debates/{debate_id}")
async def update_debate(debate_id: str, update: DebateUpdate):
    """Update debate metadata (tags, category, favorite)"""
    async with db_pool.acquire() as conn:
        async with conn.cursor() as cursor:
            updates = []
            values = []
            
            if update.tags is not None:
                updates.append("tags = %s")
                values.append(json.dumps(update.tags))
            
            if update.category is not None:
                updates.append("category = %s")
                values.append(update.category)
            
            if update.is_favorite is not None:
                updates.append("is_favorite = %s")
                values.append(update.is_favorite)
            
            if not updates:
                raise HTTPException(status_code=400, detail="No updates provided")
            
            values.append(debate_id)
            query = f"UPDATE debates SET {', '.join(updates)} WHERE id = %s"
            
            await cursor.execute(query, values)
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Debate not found")
    
    return {"message": "Debate updated successfully"}


@api_router.get("/debates/favorites")
async def get_favorite_debates():
    """Get all favorite debates"""
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                "SELECT * FROM debates WHERE is_favorite = TRUE ORDER BY timestamp DESC"
            )
            debates = await cursor.fetchall()
    
    result = []
    for debate in debates:
        result.append(DebateHistory(
            id=debate['id'],
            prompt=debate['prompt'],
            result=debate['result'],
            steps=json.loads(debate['steps']) if isinstance(debate['steps'], str) else debate['steps'],
            timestamp=debate['timestamp'],
            tags=json.loads(debate['tags']) if debate.get('tags') and isinstance(debate['tags'], str) else (debate.get('tags') or []),
            category=debate.get('category'),
            is_favorite=True,
            duration_seconds=debate.get('duration_seconds')
        ))
    
    return result


@api_router.get("/categories")
async def get_categories():
    """Get all unique categories"""
    async with db_pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "SELECT DISTINCT category FROM debates WHERE category IS NOT NULL ORDER BY category"
            )
            categories = await cursor.fetchall()
    
    return [cat[0] for cat in categories if cat[0]]


@api_router.get("/templates", response_model=List[Template])
async def get_templates():
    """Get all public templates"""
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                await cursor.execute(
                    "SELECT * FROM templates WHERE is_public = TRUE ORDER BY usage_count DESC, created_at DESC"
                )
                templates = await cursor.fetchall()
        
        result = []
        for template in templates:
            result.append(Template(
                id=template['id'],
                name=template['name'],
                description=template.get('description'),
                prompt_template=template['prompt_template'],
                category=template.get('category'),
                is_public=bool(template['is_public']),
                created_by=template.get('created_by'),
                created_at=template['created_at'],
                usage_count=template.get('usage_count', 0)
            ))
        
        logger.info(f"Retrieved {len(result)} templates")
        return result
    except Exception as e:
        logger.error(f"Error fetching templates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch templates: {str(e)}")


@api_router.post("/templates", response_model=Template)
async def create_template(template: TemplateCreate):
    """Create a new template"""
    try:
        template_obj = Template(
            name=template.name,
            description=template.description,
            prompt_template=template.prompt_template,
            category=template.category,
            is_public=True,  # Default to public
            usage_count=0
        )
        
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    """
                    INSERT INTO templates (id, name, description, prompt_template, category, is_public, created_at, usage_count)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        template_obj.id,
                        template_obj.name,
                        template_obj.description,
                        template_obj.prompt_template,
                        template_obj.category,
                        template_obj.is_public,
                        template_obj.created_at,
                        template_obj.usage_count
                    )
                )
        
        logger.info(f"Created template: {template_obj.name} (ID: {template_obj.id})")
        return template_obj
    except Exception as e:
        logger.error(f"Error creating template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create template: {str(e)}")


@api_router.post("/templates/{template_id}/use")
async def use_template(template_id: str):
    """Increment template usage count"""
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor() as cursor:
                await cursor.execute(
                    "UPDATE templates SET usage_count = usage_count + 1 WHERE id = %s",
                    (template_id,)
                )
                
                if cursor.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Template not found")
        
        logger.info(f"Template {template_id} usage incremented")
        return {"message": "Template usage recorded"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating template usage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update template usage: {str(e)}")


@api_router.get("/analytics/trends")
async def get_analytics_trends():
    """Get debate trends over time"""
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # Last 7 days
            await cursor.execute("""
                SELECT 
                    DATE(timestamp) as date,
                    COUNT(*) as count,
                    AVG(duration_seconds) as avg_duration
                FROM debates
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(timestamp)
                ORDER BY date
            """)
            trends = await cursor.fetchall()
    
    return [
        {
            "date": trend['date'].isoformat() if trend['date'] else None,
            "count": trend['count'],
            "avg_duration": float(trend['avg_duration']) if trend['avg_duration'] else None
        }
        for trend in trends
    ]


# ============ Phase 3: AI Insights ============

@api_router.get("/ai-insights/quality-scores")
async def get_quality_scores():
    """Get AI-powered quality scores for debates"""
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("""
                SELECT 
                    id,
                    prompt,
                    result,
                    duration_seconds,
                    timestamp,
                    CHAR_LENGTH(result) as result_length
                FROM debates
                ORDER BY timestamp DESC
                LIMIT 50
            """)
            debates = await cursor.fetchall()
    
    # Calculate quality scores based on multiple factors
    scored_debates = []
    for debate in debates:
        # Quality score calculation (0-100)
        length_score = min(len(debate['result']) / 50, 100)  # Longer = better (up to a point)
        speed_score = 100 if debate['duration_seconds'] and debate['duration_seconds'] < 60 else 50
        
        # Check for key quality indicators in result
        quality_keywords = ['analysis', 'conclusion', 'evidence', 'reasoning', 'therefore']
        keyword_score = sum(20 for kw in quality_keywords if kw.lower() in debate['result'].lower())
        
        total_score = min((length_score * 0.3 + speed_score * 0.2 + keyword_score * 0.5), 100)
        
        scored_debates.append({
            'id': debate['id'],
            'prompt': debate['prompt'][:100] + '...' if len(debate['prompt']) > 100 else debate['prompt'],
            'quality_score': round(total_score, 1),
            'length_score': round(length_score, 1),
            'speed_score': round(speed_score, 1),
            'keyword_score': round(keyword_score, 1),
            'timestamp': debate['timestamp'].isoformat() if debate['timestamp'] else None
        })
    
    return scored_debates


@api_router.get("/ai-insights/topic-clusters")
async def get_topic_clusters():
    """Get topic clustering analysis"""
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("""
                SELECT 
                    category,
                    COUNT(*) as count,
                    AVG(duration_seconds) as avg_duration,
                    AVG(CHAR_LENGTH(result)) as avg_length
                FROM debates
                WHERE category IS NOT NULL
                GROUP BY category
                ORDER BY count DESC
            """)
            clusters = await cursor.fetchall()
    
    return [
        {
            'category': cluster['category'],
            'debate_count': cluster['count'],
            'avg_duration': round(float(cluster['avg_duration']), 1) if cluster['avg_duration'] else 0,
            'avg_length': round(float(cluster['avg_length']), 1) if cluster['avg_length'] else 0,
            'popularity_score': min(cluster['count'] * 10, 100)
        }
        for cluster in clusters
    ]


@api_router.get("/ai-insights/recommendations")
async def get_recommendations():
    """Get AI-powered recommendations for users"""
    try:
        async with db_pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                # Get user's debate patterns
                await cursor.execute("""
                    SELECT 
                        category,
                        COUNT(*) as usage_count,
                        AVG(duration_seconds) as avg_duration
                    FROM debates
                    WHERE category IS NOT NULL
                    GROUP BY category
                    ORDER BY usage_count DESC
                    LIMIT 3
                """)
                top_categories = await cursor.fetchall()
                
                # Get total debates count
                await cursor.execute("SELECT COUNT(*) as total FROM debates")
                total_debates = await cursor.fetchone()
                total_count = total_debates['total'] if total_debates else 0
                
                # Get templates - if no categories in debates, get most popular templates
                if top_categories:
                    await cursor.execute("""
                        SELECT 
                            id,
                            name,
                            description,
                            category,
                            usage_count
                        FROM templates
                        WHERE category IN (
                            SELECT DISTINCT category 
                            FROM debates 
                            WHERE category IS NOT NULL 
                            LIMIT 5
                        )
                        ORDER BY usage_count DESC
                        LIMIT 5
                    """)
                else:
                    # No categories in debates, get most popular templates
                    await cursor.execute("""
                        SELECT 
                            id,
                            name,
                            description,
                            category,
                            usage_count
                        FROM templates
                        ORDER BY usage_count DESC
                        LIMIT 5
                    """)
                recommended_templates = await cursor.fetchall()
                
                # Get time-based insights
                await cursor.execute("""
                    SELECT 
                        HOUR(timestamp) as hour,
                        COUNT(*) as count,
                        AVG(duration_seconds) as avg_duration
                    FROM debates
                    WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY HOUR(timestamp)
                    ORDER BY count DESC
                    LIMIT 1
                """)
                best_time = await cursor.fetchone()
        
        # Build insights based on available data
        insights = []
        if top_categories:
            total_cat_debates = sum(cat['usage_count'] for cat in top_categories)
            insights.append(f"You've created {total_cat_debates} debates in your top categories")
        elif total_count > 0:
            insights.append(f"You've created {total_count} debates! Try adding categories to see more insights")
        else:
            insights.append("Create your first debate to start seeing personalized insights!")
        
        if best_time:
            insights.append(f"Your most productive hour is {best_time['hour']}:00")
        else:
            insights.append("Create more debates to discover your most productive time")
        
        if recommended_templates and len(recommended_templates) > 0:
            first_template_category = recommended_templates[0].get('category') or 'our'
            insights.append(f"Try exploring {first_template_category} templates to speed up your workflow")
        else:
            insights.append("Check out our template library to get started faster")
        
        recommendations = {
            'top_categories': [
                {
                    'category': cat['category'],
                    'usage_count': cat['usage_count'],
                    'avg_duration': round(float(cat['avg_duration']), 1) if cat.get('avg_duration') else 0
                }
                for cat in top_categories
            ],
            'recommended_templates': [
                {
                    'id': tmpl['id'],
                    'name': tmpl['name'],
                    'description': tmpl.get('description'),
                    'category': tmpl.get('category'),
                    'usage_count': tmpl.get('usage_count', 0)
                }
                for tmpl in recommended_templates
            ],
            'best_time_to_debate': {
                'hour': best_time['hour'] if best_time else 14,
                'count': best_time['count'] if best_time else 0,
                'avg_duration': round(float(best_time['avg_duration']), 1) if best_time and best_time.get('avg_duration') else 0
            },
            'insights': insights
        }
        
        return recommendations
    except Exception as e:
        logger.error(f"Error in get_recommendations: {str(e)}")
        # Return empty but valid response
        return {
            'top_categories': [],
            'recommended_templates': [],
            'best_time_to_debate': {'hour': 14, 'count': 0, 'avg_duration': 0},
            'insights': ['Create your first debate to start seeing personalized insights!']
        }


@api_router.get("/ai-insights/sentiment-analysis")
async def get_sentiment_analysis():
    """Analyze sentiment trends in debates"""
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("""
                SELECT 
                    id,
                    prompt,
                    result,
                    timestamp,
                    category
                FROM debates
                ORDER BY timestamp DESC
                LIMIT 100
            """)
            debates = await cursor.fetchall()
    
    # Simple sentiment analysis based on keywords
    positive_keywords = ['success', 'good', 'excellent', 'positive', 'agree', 'correct', 'valid']
    negative_keywords = ['fail', 'bad', 'poor', 'negative', 'disagree', 'incorrect', 'invalid']
    neutral_keywords = ['however', 'although', 'consider', 'perhaps', 'maybe']
    
    sentiment_data = []
    for debate in debates:
        result_lower = debate['result'].lower()
        
        positive_count = sum(1 for kw in positive_keywords if kw in result_lower)
        negative_count = sum(1 for kw in negative_keywords if kw in result_lower)
        neutral_count = sum(1 for kw in neutral_keywords if kw in result_lower)
        
        total = positive_count + negative_count + neutral_count
        if total == 0:
            sentiment = 'neutral'
            confidence = 50
        elif positive_count > negative_count:
            sentiment = 'positive'
            confidence = min((positive_count / total) * 100, 100)
        elif negative_count > positive_count:
            sentiment = 'negative'
            confidence = min((negative_count / total) * 100, 100)
        else:
            sentiment = 'neutral'
            confidence = min((neutral_count / total) * 100, 100)
        
        sentiment_data.append({
            'id': debate['id'],
            'sentiment': sentiment,
            'confidence': round(confidence, 1),
            'category': debate['category'],
            'timestamp': debate['timestamp'].isoformat() if debate['timestamp'] else None
        })
    
    # Calculate overall sentiment distribution
    sentiment_counts = {'positive': 0, 'negative': 0, 'neutral': 0}
    for item in sentiment_data:
        sentiment_counts[item['sentiment']] += 1
    
    return {
        'overall_distribution': sentiment_counts,
        'recent_sentiments': sentiment_data[:20],
        'sentiment_by_category': {}  # Can be enhanced later
    }


@api_router.get("/ai-insights/performance-metrics")
async def get_performance_metrics():
    """Get comprehensive performance metrics"""
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # Overall stats
            await cursor.execute("""
                SELECT 
                    COUNT(*) as total_debates,
                    AVG(duration_seconds) as avg_duration,
                    MIN(duration_seconds) as fastest_debate,
                    MAX(duration_seconds) as slowest_debate,
                    AVG(CHAR_LENGTH(result)) as avg_result_length
                FROM debates
                WHERE duration_seconds IS NOT NULL
            """)
            overall = await cursor.fetchone()
            
            # Weekly comparison
            await cursor.execute("""
                SELECT 
                    COUNT(*) as this_week
                FROM debates
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            """)
            this_week = await cursor.fetchone()
            
            await cursor.execute("""
                SELECT 
                    COUNT(*) as last_week
                FROM debates
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 14 DAY)
                AND timestamp < DATE_SUB(NOW(), INTERVAL 7 DAY)
            """)
            last_week = await cursor.fetchone()
            
            # Category performance
            await cursor.execute("""
                SELECT 
                    category,
                    COUNT(*) as count,
                    AVG(duration_seconds) as avg_duration
                FROM debates
                WHERE category IS NOT NULL
                GROUP BY category
                ORDER BY count DESC
                LIMIT 5
            """)
            top_categories = await cursor.fetchall()
    
    week_change = 0
    if last_week and last_week['last_week'] > 0:
        week_change = ((this_week['this_week'] - last_week['last_week']) / last_week['last_week']) * 100
    
    return {
        'overall_stats': {
            'total_debates': overall['total_debates'],
            'avg_duration': round(float(overall['avg_duration']), 1) if overall['avg_duration'] else 0,
            'fastest_debate': overall['fastest_debate'],
            'slowest_debate': overall['slowest_debate'],
            'avg_result_length': round(float(overall['avg_result_length']), 1) if overall['avg_result_length'] else 0
        },
        'weekly_comparison': {
            'this_week': this_week['this_week'],
            'last_week': last_week['last_week'],
            'change_percent': round(week_change, 1)
        },
        'top_categories': [
            {
                'category': cat['category'],
                'count': cat['count'],
                'avg_duration': round(float(cat['avg_duration']), 1) if cat['avg_duration'] else 0
            }
            for cat in top_categories
        ]
    }


# ============ Legacy Routes (keep for compatibility) ============

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(client_name=input.client_name)
    
    async with db_pool.acquire() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                """
                INSERT INTO status_checks (id, client_name, timestamp)
                VALUES (%s, %s, %s)
                """,
                (status_obj.id, status_obj.client_name, status_obj.timestamp)
            )
    
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                "SELECT * FROM status_checks ORDER BY timestamp DESC LIMIT 1000"
            )
            checks = await cursor.fetchall()
    
    result = []
    for check in checks:
        result.append(StatusCheck(
            id=check['id'],
            client_name=check['client_name'],
            timestamp=check['timestamp']
        ))
    
    return result

# CORS Configuration - Must be FIRST before any routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Note: app.include_router(api_router) is at the END of the file after all routes are defined

@app.on_event("startup")
async def startup_event():
    await init_db()
    logger.info("CORS origins configured: http://localhost:3000, http://127.0.0.1:3000")

@app.on_event("shutdown")
async def shutdown_event():
    if db_pool:
        db_pool.close()
        await db_pool.wait_closed()

# Add a simple test endpoint to verify CORS
@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS is working", "timestamp": datetime.now(timezone.utc).isoformat()}


# ============ Authentication Routes ============
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

@api_router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    """Register a new user"""
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # Check if username exists
            await cursor.execute(
                "SELECT id FROM users WHERE username = %s OR email = %s",
                (user.username, user.email)
            )
            existing = await cursor.fetchone()
            
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Username or email already registered"
                )
            
            # Create user
            user_id = str(uuid.uuid4())
            password_hash = get_password_hash(user.password)
            created_at = datetime.now(timezone.utc)
            
            await cursor.execute(
                """
                INSERT INTO users (id, username, email, password_hash, role, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user_id, user.username, user.email, password_hash, user.role, created_at)
            )
            
            # Create access token
            access_token = create_access_token(
                data={"sub": user_id, "username": user.username, "role": user.role},
                expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            )
            
            user_response = UserResponse(
                id=user_id,
                username=user.username,
                email=user.email,
                role=user.role,
                created_at=created_at
            )
            
            return Token(
                access_token=access_token,
                token_type="bearer",
                user=user_response
            )

@api_router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user"""
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                "SELECT * FROM users WHERE username = %s",
                (form_data.username,)
            )
            user = await cursor.fetchone()
            
            if not user or not verify_password(form_data.password, user['password_hash']):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Update last login
            await cursor.execute(
                "UPDATE users SET last_login = %s WHERE id = %s",
                (datetime.now(timezone.utc), user['id'])
            )
            
            # Create access token
            access_token = create_access_token(
                data={"sub": user['id'], "username": user['username'], "role": user['role']},
                expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            )
            
            user_response = UserResponse(
                id=user['id'],
                username=user['username'],
                email=user['email'],
                role=user['role'],
                created_at=user['created_at']
            )
            
            return Token(
                access_token=access_token,
                token_type="bearer",
                user=user_response
            )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(
                "SELECT * FROM users WHERE id = %s",
                (current_user['id'],)
            )
            user = await cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            return UserResponse(
                id=user['id'],
                username=user['username'],
                email=user['email'],
                role=user['role'],
                created_at=user['created_at']
            )

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_user)):
    """Get all users (admin only)"""
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    async with db_pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
            users = await cursor.fetchall()
    
    return [
        UserResponse(
            id=user['id'],
            username=user['username'],
            email=user['email'],
            role=user['role'],
            created_at=user['created_at']
        )
        for user in users
    ]


# ============ Include Router ============
# This MUST be at the end after all routes are defined
app.include_router(api_router)