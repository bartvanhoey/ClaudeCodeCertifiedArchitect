import anthropic
import json
from typing import Any
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic()


def criteria_extractor_agent(job_posting: str) -> dict:
    """Extract job criteria (skills, experience, culture fit) from posting."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Extract job criteria from this posting. Return JSON with:
- required_skills: list of technical/professional skills
- experience_level: years of experience required
- culture_fit: key personality/values traits

Job Posting:
{job_posting}

Return valid JSON only, no markdown."""
            }
        ]
    )

    try:
        return json.loads(response.content[0].text)
    except (json.JSONDecodeError, IndexError):
        return {
            "required_skills": [],
            "experience_level": "Not specified",
            "culture_fit": []
        }


def keyword_matcher_agent(candidate_resume: str, required_skills: list) -> dict:
    """Quick keyword matching for initial filtering."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[
            {
                "role": "user",
                "content": f"""Perform keyword matching on this resume against required skills.
Required Skills: {json.dumps(required_skills)}

Resume:
{candidate_resume}

Return JSON with:
- matched_skills: list of found skills
- match_percentage: 0-100
- quick_verdict: "pass" or "fail" (fail if <50% match)

Return valid JSON only."""
            }
        ]
    )

    try:
        return json.loads(response.content[0].text)
    except (json.JSONDecodeError, IndexError):
        return {
            "matched_skills": [],
            "match_percentage": 0,
            "quick_verdict": "fail"
        }


def deep_evaluator_agent(candidate_resume: str, job_criteria: dict) -> dict:
    """Deep evaluation of candidate against job criteria."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Perform deep evaluation of this candidate:

Required Skills: {json.dumps(job_criteria.get('required_skills', []))}
Experience Level: {job_criteria.get('experience_level', 'Not specified')}
Culture Fit Traits: {json.dumps(job_criteria.get('culture_fit', []))}

Resume:
{candidate_resume}

Evaluate and return JSON with:
- skills_assessment: detailed analysis of skill match
- experience_assessment: years and relevance
- culture_fit_score: 1-10
- growth_potential: 1-10
- overall_fit_score: 1-10

Return valid JSON only."""
            }
        ]
    )

    try:
        return json.loads(response.content[0].text)
    except (json.JSONDecodeError, IndexError):
        return {
            "skills_assessment": "Unable to assess",
            "experience_assessment": "Unable to assess",
            "culture_fit_score": 0,
            "growth_potential": 0,
            "overall_fit_score": 0
        }


def aggregator_agent(
    candidate_name: str,
    quick_eval: dict,
    deep_eval: dict,
    job_criteria: dict
) -> dict:
    """Aggregate all evaluations into hire/pass recommendation."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Aggregate evaluations and make hiring recommendation for {candidate_name}:

Quick Evaluation:
{json.dumps(quick_eval, indent=2)}

Deep Evaluation:
{json.dumps(deep_eval, indent=2)}

Job Criteria:
{json.dumps(job_criteria, indent=2)}

Return JSON with:
- recommendation: "HIRE" or "PASS"
- confidence: 1-10
- reasoning: brief summary of decision
- strengths: list of key strengths
- concerns: list of potential concerns (if any)

Return valid JSON only."""
            }
        ]
    )

    try:
        return json.loads(response.content[0].text)
    except (json.JSONDecodeError, IndexError):
        return {
            "recommendation": "PASS",
            "confidence": 0,
            "reasoning": "Unable to aggregate evaluations",
            "strengths": [],
            "concerns": []
        }


def screening_coordinator(job_posting: str, candidates: list) -> list:
    """
    Hub coordinator that orchestrates the screening pipeline.
    Decomposes job criteria, evaluates each candidate through routing logic.
    """
    tools = [
        {
            "name": "extract_criteria",
            "description": "Extract job criteria from posting",
            "input_schema": {
                "type": "object",
                "properties": {
                    "job_posting": {
                        "type": "string",
                        "description": "The job posting text"
                    }
                },
                "required": ["job_posting"]
            }
        },
        {
            "name": "quick_match",
            "description": "Quick keyword matching of resume against skills",
            "input_schema": {
                "type": "object",
                "properties": {
                    "candidate_resume": {
                        "type": "string",
                        "description": "Candidate resume text"
                    },
                    "required_skills": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of required skills"
                    }
                },
                "required": ["candidate_resume", "required_skills"]
            }
        },
        {
            "name": "deep_evaluate",
            "description": "Deep evaluation of candidate against all criteria",
            "input_schema": {
                "type": "object",
                "properties": {
                    "candidate_resume": {
                        "type": "string",
                        "description": "Candidate resume text"
                    },
                    "job_criteria": {
                        "type": "object",
                        "description": "Job criteria including skills, experience, culture fit"
                    }
                },
                "required": ["candidate_resume", "job_criteria"]
            }
        },
        {
            "name": "make_recommendation",
            "description": "Aggregate evaluations and make final recommendation",
            "input_schema": {
                "type": "object",
                "properties": {
                    "candidate_name": {
                        "type": "string",
                        "description": "Candidate name"
                    },
                    "quick_eval": {
                        "type": "object",
                        "description": "Quick evaluation results"
                    },
                    "deep_eval": {
                        "type": "object",
                        "description": "Deep evaluation results"
                    },
                    "job_criteria": {
                        "type": "object",
                        "description": "Job criteria"
                    }
                },
                "required": ["candidate_name", "quick_eval", "deep_eval", "job_criteria"]
            }
        }
    ]

    messages = [
        {
            "role": "user",
            "content": f"""You are a hiring coordinator. Screen these candidates:

Job Posting:
{job_posting}

Candidates to evaluate:
{json.dumps(candidates, indent=2)}

For each candidate:
1. Extract job criteria from the posting
2. Run quick keyword matching
3. If quick match passes (>50%), run deep evaluation
4. Aggregate results into a recommendation

Process all candidates and provide recommendations."""
        }
    ]

    results = []

    while True:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            tools=tools,
            messages=messages
        )

        if response.stop_reason == "end_turn":
            for block in response.content:
                if hasattr(block, "text"):
                    return {
                        "results": results,
                        "summary": block.text
                    }
            return {"results": results, "summary": "Screening complete"}

        if response.stop_reason == "tool_use":
            tool_results = []

            for block in response.content:
                if block.type == "tool_use":
                    tool_name = block.name
                    tool_input = block.input

                    if tool_name == "extract_criteria":
                        result = criteria_extractor_agent(tool_input["job_posting"])
                    elif tool_name == "quick_match":
                        result = keyword_matcher_agent(
                            tool_input["candidate_resume"],
                            tool_input["required_skills"]
                        )
                    elif tool_name == "deep_evaluate":
                        result = deep_evaluator_agent(
                            tool_input["candidate_resume"],
                            tool_input["job_criteria"]
                        )
                    elif tool_name == "make_recommendation":
                        result = aggregator_agent(
                            tool_input["candidate_name"],
                            tool_input["quick_eval"],
                            tool_input["deep_eval"],
                            tool_input["job_criteria"]
                        )
                        results.append({
                            "candidate": tool_input["candidate_name"],
                            "recommendation": result
                        })
                    else:
                        result = {"error": "Unknown tool"}

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result)
                    })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})


def main():
    """Run example job screening scenarios."""
    print("=" * 80)
    print("Job Application Screener - Hub-and-Spoke Architecture")
    print("=" * 80)

    job_posting = """
    Senior Full Stack Engineer - FinTech Startup

    We're looking for an experienced Full Stack Engineer to join our growing team.

    Requirements:
    - 5+ years of professional software development experience
    - Strong proficiency in Python and JavaScript/TypeScript
    - Experience with React or Vue.js for frontend
    - Backend experience with Django, FastAPI, or Node.js
    - Database design: SQL and NoSQL
    - Cloud platforms: AWS or GCP
    - Experience with Docker and Kubernetes
    - Strong understanding of REST APIs and microservices

    Nice to have:
    - FinTech or payment processing experience
    - Machine learning basics
    - DevOps experience

    Culture:
    - Self-motivated and independent learner
    - Strong communication and collaboration skills
    - Passion for clean code and best practices
    - Growth mindset and comfort with change
    """

    candidates = [
        {
            "name": "David Kumar",
            "resume": """
            David Kumar - Software Engineer

            Experience:
            - 7 years at E-commerce Giant (Flipkart equivalent)
            - 3 years at Mobile Startup as Android Lead

            Skills:
            - Java, Python, JavaScript
            - React Native
            - Spring Boot, Django
            - MongoDB, Firebase
            - GCP, some AWS exposure
            - Git, CI/CD basics
            - REST APIs

            Education:
            - BTech Information Technology, IIT Delhi

            Strengths:
            - Shipped 5 major mobile apps
            - Strong problem-solving skills
            - Team player and quick learner
            """
        },
        {
            "name": "Emma Thompson",
            "resume": """
            Emma Thompson - Lead Frontend Engineer

            Experience:
            - 8 years as Frontend Engineer at FAANG companies
            - 2 years at Design-focused Startup as Technical Lead

            Skills:
            - JavaScript, TypeScript
            - React, Next.js
            - Vue.js
            - CSS, Web Performance Optimization
            - Jest, React Testing Library
            - Figma Design Systems

            Education:
            - BS Graphic Design, RISD
            - Self-taught programming

            Strengths:
            - Expert in responsive design
            - Strong mentoring ability
            - Published numerous technical articles
            - Passion for user experience
            """
        },
        {
            "name": "Frank O'Brien",
            "resume": """
            Frank O'Brien - DevOps/Infrastructure Engineer

            Experience:
            - 6 years at TradFi Bank as Infrastructure Engineer
            - 4 years at Cloud-Native Startup as Senior DevOps Engineer

            Skills:
            - Kubernetes (CKA + CKAD certified)
            - Docker, container orchestration
            - Terraform, Infrastructure as Code
            - AWS, GCP, Azure
            - Python scripting
            - Jenkins, GitLab CI/CD
            - Prometheus, ELK stack

            Education:
            - BS Systems Engineering, Georgia Tech

            Achievements:
            - Reduced cloud costs by 35%
            - Designed zero-downtime deployment system
            - Open source Kubernetes contributor
            """
        },
        {
            "name": "Grace Lee",
            "resume": """
            Grace Lee - Full Stack Engineer

            Experience:
            - 4 years at SaaS Startup as Full Stack Developer
            - 2 years at EdTech Company as Senior Engineer
            - Freelance consultant (currently)

            Skills:
            - Python, JavaScript, TypeScript
            - FastAPI, Express.js
            - React
            - PostgreSQL
            - AWS (Lambda, RDS, EC2)
            - Docker basics
            - REST APIs, GraphQL

            Education:
            - BS Computer Science, UC Berkeley

            Strengths:
            - End-to-end feature ownership
            - Good communication with non-technical stakeholders
            - Proactive about learning new technologies
            - Contributed to company scaling from 10 to 100 people
            """
        }
    ]

    print(f"\nJob Posting: Senior Full Stack Engineer - FinTech Startup")
    print(f"Screening {len(candidates)} candidates...\n")

    results = screening_coordinator(job_posting, candidates)

    print("\n" + "=" * 80)
    print("SCREENING RESULTS")
    print("=" * 80)

    for result in results.get("results", []):
        candidate = result["candidate"]
        rec = result["recommendation"]
        print(f"\n{candidate}:")
        print(f"  Recommendation: {rec.get('recommendation', 'N/A')}")
        print(f"  Confidence: {rec.get('confidence', 'N/A')}/10")
        print(f"  Reasoning: {rec.get('reasoning', 'N/A')}")
        if rec.get('strengths'):
            print(f"  Strengths: {', '.join(rec.get('strengths', []))}")
        if rec.get('concerns'):
            print(f"  Concerns: {', '.join(rec.get('concerns', []))}")

    print("\n" + "=" * 80)
    print("COORDINATOR SUMMARY")
    print("=" * 80)
    print(results.get("summary", "No summary available"))


if __name__ == "__main__":
    main()
