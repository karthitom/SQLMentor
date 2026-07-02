"""
AI explanation service — educational explanations of SQL injection concepts.

Security:
- System prompts are server-side only (never sent to client)
- API keys stored in environment variables only
- Responses sanitized before storage
- Rate limiting enforced upstream
"""

import json
from typing import AsyncGenerator, Optional

import structlog

from app.core.config import settings

log = structlog.get_logger()

# ── System Prompt ─────────────────────────────────────────────────────────────
# Kept server-side; never exposed to the client
EDUCATIONAL_SYSTEM_PROMPT = """You are SQLMentor, an expert cybersecurity educator specializing in SQL injection education.

Your role is to EDUCATE, not to enable attacks. You help learners understand SQL injection concepts through:
- Clear, structured explanations at multiple skill levels
- Secure coding recommendations and prevention techniques
- References to OWASP, CWE, and official documentation
- Emphasis on responsible disclosure and ethical security testing

IMPORTANT RULES:
1. Always emphasize that skills learned should only be used on systems the learner owns or has explicit written authorization to test.
2. Focus on understanding and prevention, not exploitation.
3. Always provide secure coding alternatives and remediation advice.
4. Reference OWASP Top 10 and CWE where applicable.
5. Never generate actual malicious payloads. Focus on conceptual understanding.

You explain concepts at three levels:
- BEGINNER: Simple analogies, everyday language, no jargon
- INTERMEDIATE: Technical concepts with examples
- ADVANCED: Deep dive into mechanics, database internals, security implications

Format your responses as structured JSON when asked for structured explanations."""

COMPARISON_PROMPT_TEMPLATE = """
An educational analysis of a lab application has produced the following observable differences between two HTTP responses.

BASELINE RESPONSE (normal input):
- HTTP Status: {baseline_status}
- Response Size: {baseline_size} bytes
- Response Time: {baseline_time}ms
- Content Preview: {baseline_excerpt}

MODIFIED RESPONSE (different input):
- HTTP Status: {modified_status}
- Response Size: {modified_size} bytes
- Response Time: {modified_time}ms
- Content Preview: {modified_excerpt}

OBSERVABLE DIFFERENCES:
- Status changed: {status_changed}
- Size difference: {size_diff} bytes
- Time difference: {time_diff}ms
- Similarity score: {similarity:.1%}

Please provide an educational explanation in JSON format with these fields:
{{
  "summary": "One sentence summary of what was observed",
  "what_happened": "Plain explanation of the observable difference",
  "why_it_happened": "Educational explanation of the likely cause",
  "concept_demonstrated": "The security concept this illustrates",
  "how_it_works": "Technical explanation of the underlying mechanism",
  "difficulty_level": "beginner|intermediate|advanced",
  "beginner_explanation": "Simple analogy-based explanation",
  "intermediate_explanation": "Technical explanation with context",
  "advanced_explanation": "Deep dive into database mechanics",
  "prevention": "How developers prevent this in secure code",
  "secure_code_example": "Pseudocode showing the secure alternative",
  "owasp_reference": "Relevant OWASP category",
  "cwe_reference": "Relevant CWE number",
  "recommended_reading": ["List of URLs or book titles"],
  "key_takeaways": ["List of 3-5 key learning points"],
  "developer_mistakes": ["Common mistakes that lead to this"],
  "educational_disclaimer": "Reminder about authorized testing only"
}}
"""


class AIService:
    """OpenAI-compatible AI service for educational explanations."""

    def __init__(self):
        self._client = None

    def _get_client(self):
        """Lazy-initialize the AI client based on configured provider."""
        if self._client is not None:
            return self._client

        provider = settings.AI_PROVIDER

        if provider == "openai" or provider == "openai-compatible":
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(
                    api_key=settings.OPENAI_API_KEY or "sk-dummy",
                    base_url=settings.OPENAI_BASE_URL,
                )
            except ImportError:
                log.error("openai package not installed")
                raise

        elif provider == "azure":
            try:
                from openai import AsyncAzureOpenAI
                self._client = AsyncAzureOpenAI(
                    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                    api_key=settings.AZURE_OPENAI_API_KEY,
                    api_version=settings.AZURE_OPENAI_API_VERSION,
                )
            except ImportError:
                log.error("openai package not installed")
                raise

        elif provider == "ollama":
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(
                    api_key="ollama",
                    base_url=f"{settings.OLLAMA_BASE_URL}/v1",
                )
            except ImportError:
                log.error("openai package not installed")
                raise
        else:
            raise ValueError(f"Unknown AI provider: {provider}")

        return self._client

    def _get_model(self) -> str:
        """Get the model name for the configured provider."""
        if settings.AI_PROVIDER == "azure":
            return settings.AZURE_OPENAI_DEPLOYMENT
        elif settings.AI_PROVIDER == "ollama":
            return settings.OLLAMA_MODEL
        return settings.OPENAI_MODEL

    async def explain_comparison(
        self,
        baseline: dict,
        modified: dict,
        similarity_score: float,
    ) -> dict:
        """
        Generate an educational explanation of observable response differences.
        Returns structured JSON explanation.
        """
        if not settings.FEATURE_AI_CHAT_ENABLED:
            return {"error": "AI explanations are disabled"}

        prompt = COMPARISON_PROMPT_TEMPLATE.format(
            baseline_status=baseline.get("status_code", "N/A"),
            baseline_size=baseline.get("content_length", 0),
            baseline_time=baseline.get("response_time_ms", 0),
            baseline_excerpt=str(baseline.get("body_excerpt", ""))[:500],
            modified_status=modified.get("status_code", "N/A"),
            modified_size=modified.get("content_length", 0),
            modified_time=modified.get("response_time_ms", 0),
            modified_excerpt=str(modified.get("body_excerpt", ""))[:500],
            status_changed=baseline.get("status_code") != modified.get("status_code"),
            size_diff=abs(
                (modified.get("content_length") or 0) - (baseline.get("content_length") or 0)
            ),
            time_diff=abs(
                (modified.get("response_time_ms") or 0) - (baseline.get("response_time_ms") or 0)
            ),
            similarity=similarity_score,
        )

        try:
            client = self._get_client()
            response = await client.chat.completions.create(
                model=self._get_model(),
                messages=[
                    {"role": "system", "content": EDUCATIONAL_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                max_tokens=2000,
                temperature=0.3,
            )

            content = response.choices[0].message.content
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return {"summary": content, "error": "Could not parse structured response"}

        except Exception as exc:
            log.error("AI explanation failed", error=str(exc))
            return {
                "error": "AI explanation temporarily unavailable",
                "summary": "Please review the response differences manually.",
            }

    async def chat(
        self,
        messages: list[dict],
        context: Optional[str] = None,
    ) -> str:
        """
        Educational AI chat for workspace conversations.
        messages: list of {"role": "user"|"assistant", "content": str}
        """
        if not settings.FEATURE_AI_CHAT_ENABLED:
            return "AI chat is currently disabled."

        system = EDUCATIONAL_SYSTEM_PROMPT
        if context:
            system += f"\n\nCURRENT CONTEXT:\n{context[:2000]}"

        # Build conversation with safety limits
        limited_messages = messages[-20:]  # Last 20 turns max

        chat_messages = [{"role": "system", "content": system}] + [
            {"role": m["role"], "content": m["content"][:4000]}
            for m in limited_messages
        ]

        try:
            client = self._get_client()
            response = await client.chat.completions.create(
                model=self._get_model(),
                messages=chat_messages,
                max_tokens=1500,
                temperature=0.5,
            )
            return response.choices[0].message.content
        except Exception as exc:
            log.error("AI chat failed", error=str(exc))
            return "I'm temporarily unavailable. Please try again in a moment."

    async def generate_learning_notes(self, analysis_summary: dict) -> str:
        """Generate personalized learning notes for a completed analysis."""
        prompt = f"""Based on this educational analysis session, generate concise learning notes:

Analysis: {json.dumps(analysis_summary, indent=2)[:2000]}

Generate markdown-formatted learning notes covering:
1. What was learned
2. Key concepts demonstrated
3. Secure coding practices to remember
4. Recommended next steps for deeper learning

Keep it educational, encouraging, and focused on prevention and understanding."""

        try:
            client = self._get_client()
            response = await client.chat.completions.create(
                model=self._get_model(),
                messages=[
                    {"role": "system", "content": EDUCATIONAL_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=800,
                temperature=0.4,
            )
            return response.choices[0].message.content
        except Exception as exc:
            log.error("Learning notes generation failed", error=str(exc))
            return "Unable to generate learning notes at this time."
