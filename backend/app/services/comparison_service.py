"""
Response comparison service — compute structural differences between HTTP responses.
"""

import difflib
from typing import Optional


class ComparisonService:
    """Compare two HTTP responses and highlight educational observations."""

    @staticmethod
    def compute_similarity(text1: str, text2: str) -> float:
        """Compute sequence similarity ratio (0.0 = different, 1.0 = identical)."""
        if not text1 and not text2:
            return 1.0
        if not text1 or not text2:
            return 0.0
        return difflib.SequenceMatcher(None, text1, text2).ratio()

    @staticmethod
    def compute_diff(text1: str, text2: str, context_lines: int = 3) -> list[dict]:
        """
        Compute a structured diff between two response bodies.
        Returns list of change blocks suitable for frontend rendering.
        """
        lines1 = text1.splitlines(keepends=True)
        lines2 = text2.splitlines(keepends=True)

        diff_blocks = []
        matcher = difflib.SequenceMatcher(None, lines1, lines2)

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                continue
            diff_blocks.append({
                "type": tag,  # replace, insert, delete
                "baseline_lines": lines1[i1:i2],
                "modified_lines": lines2[j1:j2],
                "baseline_range": [i1, i2],
                "modified_range": [j1, j2],
            })

        return diff_blocks

    @staticmethod
    def identify_observable_changes(baseline: dict, modified: dict) -> list[dict]:
        """
        Identify educationally significant observable changes.
        Returns a list of human-readable change observations.
        """
        observations = []

        # Status code change
        b_status = baseline.get("status_code")
        m_status = modified.get("status_code")
        if b_status != m_status:
            observations.append({
                "type": "status_change",
                "severity": "high",
                "description": f"HTTP status changed from {b_status} to {m_status}",
                "educational_note": "Status code changes can indicate different server behavior based on input",
            })

        # Significant size change (>10% or >500 bytes)
        b_size = baseline.get("content_length", 0) or 0
        m_size = modified.get("content_length", 0) or 0
        size_diff = m_size - b_size
        if abs(size_diff) > 500 or (b_size > 0 and abs(size_diff / b_size) > 0.1):
            observations.append({
                "type": "size_change",
                "severity": "medium",
                "description": f"Response size changed by {size_diff:+d} bytes ({b_size}→{m_size})",
                "educational_note": "Size differences can indicate additional data being returned or error messages",
            })

        # Response time difference (>500ms)
        b_time = baseline.get("response_time_ms", 0) or 0
        m_time = modified.get("response_time_ms", 0) or 0
        time_diff = m_time - b_time
        if abs(time_diff) > 500:
            observations.append({
                "type": "time_change",
                "severity": "medium" if abs(time_diff) > 2000 else "low",
                "description": f"Response time changed by {time_diff:+.0f}ms ({b_time:.0f}→{m_time:.0f}ms)",
                "educational_note": (
                    "Significant time differences can indicate time-based behavior "
                    "(relevant to time-based blind injection concepts)"
                ),
            })

        # URL redirect change
        b_url = baseline.get("final_url", "")
        m_url = modified.get("final_url", "")
        if b_url != m_url:
            observations.append({
                "type": "redirect_change",
                "severity": "medium",
                "description": f"Final URL changed from {b_url} to {m_url}",
                "educational_note": "Redirect changes can indicate authentication state or error handling differences",
            })

        # Check for common error indicators in body
        b_body = (baseline.get("body_excerpt") or "").lower()
        m_body = (modified.get("body_excerpt") or "").lower()

        error_indicators = [
            ("sql error", "SQL error message visible"),
            ("syntax error", "SQL syntax error detected"),
            ("warning: mysql", "MySQL warning visible"),
            ("ora-", "Oracle database error"),
            ("pg::", "PostgreSQL error"),
            ("you have an error in your sql", "MySQL SQL error exposed"),
            ("unclosed quotation mark", "SQL quote error"),
            ("microsoft ole db", "MSSQL OLE DB error"),
        ]

        for indicator, description in error_indicators:
            if indicator not in b_body and indicator in m_body:
                observations.append({
                    "type": "error_message_appeared",
                    "severity": "high",
                    "description": f"Observable: {description} in modified response",
                    "educational_note": (
                        "Database error messages are a key observable indicator in educational SQL injection study. "
                        "In production, these should NEVER be visible to users."
                    ),
                })

        return observations

    def compare(self, baseline: dict, modified: dict) -> dict:
        """
        Full comparison between two responses.
        Returns comparison result with similarity, diff, and observations.
        """
        b_body = baseline.get("body_excerpt", "") or ""
        m_body = modified.get("body_excerpt", "") or ""

        similarity = self.compute_similarity(b_body, m_body)
        diff_blocks = self.compute_diff(b_body[:5000], m_body[:5000])  # Limit diff size
        observations = self.identify_observable_changes(baseline, modified)

        b_size = baseline.get("content_length", 0) or 0
        m_size = modified.get("content_length", 0) or 0
        b_time = baseline.get("response_time_ms", 0) or 0
        m_time = modified.get("response_time_ms", 0) or 0

        return {
            "similarity_score": round(similarity, 4),
            "size_difference": m_size - b_size,
            "time_difference_ms": round(m_time - b_time, 2),
            "status_changed": baseline.get("status_code") != modified.get("status_code"),
            "diff_blocks": diff_blocks,
            "observable_changes": observations,
            "educational_summary": self._generate_summary(similarity, observations),
        }

    @staticmethod
    def _generate_summary(similarity: float, observations: list) -> str:
        """Generate a brief educational summary of the comparison."""
        high_severity = [o for o in observations if o.get("severity") == "high"]

        if similarity > 0.95:
            return "Responses are nearly identical — minimal observable difference detected."
        elif similarity > 0.7:
            return f"Responses show moderate differences ({len(observations)} observable change(s))."
        elif high_severity:
            return (
                f"Significant observable differences detected, including: "
                f"{high_severity[0]['description']}. This is educationally significant."
            )
        else:
            return f"Responses show notable differences ({len(observations)} observable change(s)) worth examining."
