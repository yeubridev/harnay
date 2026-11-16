## Stack: Python + FastAPI

- Use the environment tool the repo already uses (look for `uv.lock`, `poetry.lock` or `requirements.txt`). Do not mix them.
- Every request and response body is a Pydantic model. No raw dicts across the API boundary.
- Authentication is a dependency (`Depends`) on every route that is not public. Authorisation, meaning "does this user own this row", is checked in the query or the handler, never assumed.
- Database access goes through SQLAlchemy or SQLModel with bound parameters. No string-built SQL.
- Schema changes are Alembic migrations: `alembic revision --autogenerate`, then read the generated file before applying it. Autogenerate misses renames and drops data on type changes.
- Settings come from the environment through `pydantic-settings`. No secrets in code. Names are listed in `.env.example`.
- An `async def` route never calls blocking I/O. Use an async client or `run_in_threadpool`.
- Errors are `HTTPException` with a clear `detail`. Never return a stack trace.
- Every endpoint has a happy-path test and a test that an unauthorised caller is refused (pytest with `httpx`).
- Lint and format with ruff. Run the type checker if the repo configures one.
