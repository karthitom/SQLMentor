"""Reports, Knowledge Base, and Admin API router stubs."""

from fastapi import APIRouter, Depends
from app.api.deps import get_current_user, require_admin
from app.models.user import User
from app.schemas.common import MessageResponse

# Reports router
reports_router = APIRouter()

@reports_router.get("")
async def list_reports(current_user: User = Depends(get_current_user)):
    return {"reports": [], "message": "Reports module - full implementation in extended version"}

@reports_router.post("/generate")
async def generate_report(current_user: User = Depends(get_current_user)):
    return {"message": "Report generation queued"}

# Knowledge base router
knowledge_router = APIRouter()

@knowledge_router.get("/articles")
async def list_articles(current_user: User = Depends(get_current_user)):
    return {
        "articles": KNOWLEDGE_BASE_ARTICLES,
        "total": len(KNOWLEDGE_BASE_ARTICLES),
    }

@knowledge_router.get("/articles/{slug}")
async def get_article(slug: str, current_user: User = Depends(get_current_user)):
    article = next((a for a in KNOWLEDGE_BASE_ARTICLES if a["slug"] == slug), None)
    if not article:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return article

# Admin router
admin_router = APIRouter()

@admin_router.get("/stats")
async def admin_stats(current_user: User = Depends(require_admin)):
    return {"message": "Admin stats - full implementation in extended version"}


# Bundled knowledge base content
KNOWLEDGE_BASE_ARTICLES = [
    {
        "slug": "sql-injection-basics",
        "title": "SQL Injection — The Fundamentals",
        "category": "sql-injection",
        "difficulty_level": "beginner",
        "summary": "Learn what SQL injection is, why it happens, and how to identify it in lab environments.",
        "estimated_read_minutes": 10,
        "owasp_reference": "A03:2021 – Injection",
        "cwe_reference": "CWE-89",
        "tags": ["sql-injection", "owasp", "fundamentals"],
        "content_markdown": """
# SQL Injection — The Fundamentals

> ⚠️ **Educational Disclaimer**: This article is for learning purposes only.
> Apply this knowledge only on systems you own or have explicit written authorization to test.

## What is SQL Injection?

SQL injection (SQLi) is a code injection technique that exploits a vulnerability in an application's
interaction with its database. It occurs when **user-supplied input is incorporated into SQL queries
without proper sanitization**.

## Why Does It Happen?

The root cause is **insufficient input validation**. When developers build SQL queries by concatenating
user input directly, the database cannot distinguish between SQL code and data.

### Vulnerable Code (Python — DO NOT USE):
```python
# ❌ VULNERABLE — Never do this
def get_user(username):
    query = "SELECT * FROM users WHERE username = '" + username + "'"
    return db.execute(query)
```

### Secure Code (Python — Parameterized Queries):
```python
# ✅ SECURE — Always use parameterized queries
def get_user(username):
    query = "SELECT * FROM users WHERE username = ?"
    return db.execute(query, (username,))
```

## Observable Indicators (In Educational Lab Environments)

When studying SQL injection in intentionally vulnerable labs, you may observe:

1. **Error messages** — Database errors visible in responses
2. **Different response sizes** — More or less data returned
3. **Response time changes** — Time-based behavior differences
4. **Status code changes** — 200 vs 500 errors
5. **Content changes** — Different data appearing in the page

## Prevention

- **Always use parameterized queries** or prepared statements
- **Use an ORM** (like SQLAlchemy, Hibernate, ActiveRecord)
- **Validate and sanitize all input** on the server side
- **Apply least privilege** — database users should have minimum necessary permissions
- **Never display database errors** to end users

## OWASP Reference

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [OWASP A03:2021 - Injection](https://owasp.org/Top10/A03_2021-Injection/)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
""",
    },
    {
        "slug": "parameterized-queries",
        "title": "Parameterized Queries & Prepared Statements",
        "category": "prevention",
        "difficulty_level": "beginner",
        "summary": "Learn how parameterized queries prevent SQL injection and see examples in multiple languages.",
        "estimated_read_minutes": 8,
        "owasp_reference": "A03:2021 – Injection",
        "cwe_reference": "CWE-89",
        "tags": ["prevention", "secure-coding", "parameterized-queries"],
        "content_markdown": """
# Parameterized Queries & Prepared Statements

## The Core Solution to SQL Injection

Parameterized queries (also called prepared statements) are the primary defense against SQL injection.
They work by **separating SQL code from data** — the database treats user input as data, never as SQL code.

## How It Works

Instead of building a SQL string that includes the user input:
```sql
-- DANGEROUS: SQL built from user input
SELECT * FROM products WHERE name = 'user_input_here'
```

You define the query structure first, then pass data separately:
```sql
-- SAFE: Query structure is fixed, data is passed separately
SELECT * FROM products WHERE name = ?
```

## Examples Across Languages

### Python (SQLAlchemy ORM)
```python
from sqlalchemy.orm import Session

# ✅ SECURE — ORM automatically parameterizes
def get_product(session: Session, product_name: str):
    return session.query(Product).filter(Product.name == product_name).first()
```

### Python (Raw SQL with parameters)
```python
import sqlite3
conn = sqlite3.connect('mydb.db')

# ✅ SECURE
cursor.execute("SELECT * FROM users WHERE email = ?", (email,))

# ❌ VULNERABLE
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")
```

### JavaScript (Node.js with pg)
```javascript
// ✅ SECURE
const { rows } = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ VULNERABLE
const { rows } = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### Java (JDBC Prepared Statements)
```java
// ✅ SECURE
PreparedStatement stmt = conn.prepareStatement(
    "SELECT * FROM users WHERE username = ?"
);
stmt.setString(1, username);
ResultSet rs = stmt.executeQuery();
```

## Key Takeaways

1. **Separate SQL code from data** — this is the fundamental principle
2. **Use your framework's ORM** when possible
3. **Never concatenate user input** into SQL strings
4. **Parameterized queries work regardless** of what the user types
""",
    },
    {
        "slug": "owasp-top-10-injection",
        "title": "OWASP Top 10 — A03: Injection",
        "category": "owasp",
        "difficulty_level": "intermediate",
        "summary": "Deep dive into OWASP's A03:2021 Injection category, including SQL, NoSQL, and command injection.",
        "estimated_read_minutes": 12,
        "owasp_reference": "A03:2021 – Injection",
        "cwe_reference": "CWE-89, CWE-78",
        "tags": ["owasp", "injection", "security-standards"],
        "content_markdown": """
# OWASP Top 10 — A03:2021: Injection

## Overview

Injection vulnerabilities move to third position in the OWASP Top 10 2021 update.
An application is vulnerable when user-supplied data is not validated, filtered, or sanitized.

## Types of Injection

| Type | Target | Example |
|------|--------|---------|
| SQL Injection | Relational databases | `' OR 1=1--` |
| NoSQL Injection | Document stores | `{$gt: ""}` |
| OS Command Injection | Operating system | `; rm -rf /` |
| LDAP Injection | Directory services | `*)(uid=*))(|(uid=*` |
| XML Injection | XML parsers | `<![CDATA[<script>]]>` |

## Detection

Injection flaws are most common in legacy code. Look for:
- User input incorporated into queries, commands, or interpreters
- Stored procedures that use dynamic SQL
- Error messages that reveal database information

## Prevention Strategy

1. Use a safe API that avoids the interpreter entirely
2. Use positive input validation ("allowlist")
3. For remaining dynamic queries, escape special characters
4. Use LIMIT and SQL controls to prevent mass data disclosure

## Real-World Impact

Injection can lead to:
- Authentication bypass
- Data exfiltration
- Data manipulation
- Remote code execution
- Complete system compromise

See [OWASP A03:2021](https://owasp.org/Top10/A03_2021-Injection/) for complete details.
""",
    },
]
