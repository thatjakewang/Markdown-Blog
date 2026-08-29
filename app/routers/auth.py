"""Login and logout for the single browser user.

Pages, not API endpoints, so they live at the site root rather than under /api/
and they answer with redirects and HTML instead of JSON. The password check and
the session helpers are in app/auth.py; this module is only the HTTP shell.

Nothing here touches the database — there is no users table (see app/auth.py).
"""

from fastapi import APIRouter, Form, Query, Request
from fastapi.responses import RedirectResponse

from app.auth import check_password, is_logged_in, log_in, log_out, safe_next
from app.limiter import LOGIN_RATE_LIMIT, limiter
from app.templating import templates

router = APIRouter()

LOGIN_TITLE = "Sign in – Jake Wang"
# Deliberately says nothing about which part was wrong, or whether a login has
# ever succeeded. There is one password; any detail beyond this only helps
# someone guessing at it.
LOGIN_FAILED = "Incorrect password."


def _render_login(request: Request, next_path: str, error: str | None = None, status: int = 200):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        status_code=status,
        context={"meta_title": LOGIN_TITLE, "next": next_path, "error": error},
    )


@router.get("/login")
def login_form(request: Request, next_path: str = Query("/", alias="next")):
    """The sign-in page. Already signed in? Go straight where you were headed."""
    target = safe_next(next_path)
    if is_logged_in(request):
        return RedirectResponse(target, status_code=303)
    return _render_login(request, target)


@router.post("/login")
@limiter.limit(LOGIN_RATE_LIMIT)
def submit_login(
    request: Request,
    password: str = Form(...),
    next_path: str = Form("/", alias="next"),
):
    """Check the password and, on success, issue the session cookie.

    Rate limited far below the site-wide budget: this is the one endpoint where
    an attacker gets something out of retrying.
    """
    target = safe_next(next_path)
    if not check_password(password):
        return _render_login(request, target, error=LOGIN_FAILED, status=401)

    log_in(request)
    return RedirectResponse(target, status_code=303)


@router.post("/logout")
def logout(request: Request):
    """Drop the session. POST, so a stray link or prefetch cannot sign you out."""
    log_out(request)
    return RedirectResponse("/", status_code=303)
