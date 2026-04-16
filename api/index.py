from api.main import app as _app


async def app(scope, receive, send):
    if scope.get("type") in {"http", "websocket"}:
        path = scope.get("path") or ""
        if path.startswith("/api/"):
            scope = dict(scope)
            scope["path"] = path[len("/api") :]
        elif path == "/api":
            scope = dict(scope)
            scope["path"] = "/"

    await _app(scope, receive, send)
