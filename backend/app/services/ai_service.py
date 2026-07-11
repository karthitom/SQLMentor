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

TUTOR_PROMPT_TEMPLATE = """
A student is working on the following lab scenario:
- Lab Title: {lab_title}
- Scenario: {scenario}
- Current Task: {current_task}
- Student's Query: {student_query}
- Execution Error (if any): {error}

Provide an educational hint or explanation that guides them towards understanding the vulnerability without giving away the exact solution immediately. If they ask a conceptual question, explain it clearly using analogies.
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

    async def generate_lab_hint(
        self,
        lab_title: str,
        scenario: str,
        current_task: str,
        student_query: str,
        error: Optional[str] = None
    ) -> str:
        """
        Generate a contextual hint based on what the student is trying to do.
        """
        if not settings.FEATURE_AI_CHAT_ENABLED:
            return "AI tutor is disabled."

        prompt = TUTOR_PROMPT_TEMPLATE.format(
            lab_title=lab_title,
            scenario=scenario,
            current_task=current_task,
            student_query=student_query,
            error=error or "None",
        )

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
            log.error("AI hint generation failed", error=str(exc))
            return "Unable to generate a hint at this time."

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

