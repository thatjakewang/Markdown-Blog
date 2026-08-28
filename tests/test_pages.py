"""The HTML half: page rendering, error pages, and asset/caching policy.

The pages are static templates — every number on the dashboard is fetched
client-side — so rendering them for real is the cheapest meaningful check
that templates, Jinja globals, and the routes still line up.
"""

import re

import pytest

from app.main import PAGE_CACHE_MAX_AGE, STATIC_CACHE_MAX_AGE

PAGES = ["/", "/mytesla/"]


@pytest.mark.parametrize("path", PAGES)
def test_pages_render(client, path):
    response = client.get(path)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert "</html>" in response.text


def test_dashboard_includes_all_charts(client):
    html = client.get("/mytesla/").text
    for canvas_id in (
        "costBreakdownChart",
        "providerChart",
        "chargingScatterChart",
        "chargingHistogram",
        "trendChart",
        "cumulativeCostChart",
    ):
        assert canvas_id in html, f"missing canvas #{canvas_id}"


def test_dashboard_includes_period_and_coverage_controls(client):
    html = client.get("/mytesla/").text
    for element_id in (
        "period-total-cost", "period-energy-cost-km", "period-change",
        "coverage-charging", "coverage-odometer", "provider-details",
    ):
        assert f'id="{element_id}"' in html
    assert 'data-period="trailing_90_days"' in html


def test_dashboard_calls_the_api_on_this_origin(client):
    """The merged service serves both halves, so the JS must stay relative."""
    js = client.get("/static/js/tesla.js").text
    assert 'const API_BASE = "";' in js
    assert "api.jakewang.dev" not in js
    assert "data-api-base" not in client.get("/mytesla/").text


@pytest.mark.parametrize("path", PAGES)
def test_pages_ship_no_tracking_or_seo_markup(client, path):
    # The site is a personal project, not a traffic funnel — no analytics,
    # no crawler hints. Easy to reintroduce by accident when editing base.html.
    html = client.get(path).text
    for needle in ("googletagmanager", "google-analytics", "dataLayer",
                   "application/ld+json", 'rel="canonical"',
                   'property="og:', 'name="twitter:'):
        assert needle not in html, f"{needle} came back on {path}"


def test_retired_urls_are_gone(client):
    # The blog and the sitemap were removed before the merge. robots.txt came
    # back later, for the opposite reason — see TestNoIndex.
    for path in ("/blog/", "/blog/some-post/", "/feed.xml", "/sitemap.xml"):
        assert client.get(path).status_code == 404, path


class TestNoIndex:
    """The site is deliberately kept out of search indexes and AI corpora.

    The two halves pull in opposite directions and are easy to get wrong:
    a crawler blocked in robots.txt never reads the noindex, which strands
    already-indexed URLs in the results. So search engines stay allowed and
    only the AI crawlers are disallowed.
    """

    @pytest.mark.parametrize(
        "path", PAGES + ["/api/tesla/expenses/recent", "/static/css/style.css"]
    )
    def test_everything_is_noindex(self, client, path):
        tag = client.get(path).headers["X-Robots-Tag"]
        assert "noindex" in tag and "nofollow" in tag

    @pytest.mark.parametrize("path", PAGES)
    def test_pages_also_carry_the_meta_tag(self, client, path):
        assert '<meta name="robots" content="noindex, nofollow">' in client.get(path).text

    def test_robots_txt_blocks_the_ai_crawlers(self, client):
        body = client.get("/robots.txt").text
        for bot in ("GPTBot", "ClaudeBot", "Google-Extended", "CCBot",
                    "PerplexityBot", "Bytespider", "Applebot-Extended"):
            assert f"User-agent: {bot}\n" in body, bot
        assert "Disallow: /\n" in body

    def test_robots_txt_still_lets_search_engines_in(self, client):
        """Googlebot must be able to fetch a page to see the noindex."""
        body = client.get("/robots.txt").text
        assert body.rstrip().endswith("User-agent: *\nAllow: /")
        # No blanket block that would apply to every crawler
        assert "User-agent: *\nDisallow: /" not in body


class TestErrorPages:
    def test_unknown_page_gets_the_friendly_html_404(self, client):
        response = client.get("/definitely-not-a-page/")
        assert response.status_code == 404
        assert response.headers["content-type"].startswith("text/html")
        assert "</html>" in response.text

    def test_unknown_api_path_stays_json(self, client):
        """API clients (iPhone Shortcuts) must not get an HTML error page."""
        response = client.get("/api/tesla/nope")
        assert response.status_code == 404
        assert response.headers["content-type"].startswith("application/json")
        assert "detail" in response.json()


class TestAssetPolicy:
    @pytest.mark.parametrize("path", PAGES)
    def test_pages_get_a_short_shared_cache(self, client, path):
        response = client.get(path)
        assert response.headers["Cache-Control"] == f"public, max-age={PAGE_CACHE_MAX_AGE}"

    def test_static_files_get_long_max_age(self, client):
        response = client.get("/static/css/style.css")
        assert response.status_code == 200
        assert f"max-age={STATIC_CACHE_MAX_AGE}" in response.headers["Cache-Control"]

    def test_pages_version_static_asset_urls(self, client):
        # The ?v= cache-buster is what makes the long max-age safe to serve.
        html = client.get("/").text
        assert re.search(r"/static/css/style\.css\?v=\d+", html)

    def test_missing_asset_versions_to_zero(self):
        from app.main import static_url

        assert static_url("does-not-exist.css").endswith("?v=0")


@pytest.mark.parametrize(
    "path", PAGES + ["/api/tesla/expenses/recent", "/static/css/style.css"]
)
def test_security_headers_on_everything(client, path):
    """Pages, API and static assets all go through the same middleware."""
    headers = client.get(path).headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert headers["Permissions-Policy"] == "camera=(), microphone=(), geolocation=()"
