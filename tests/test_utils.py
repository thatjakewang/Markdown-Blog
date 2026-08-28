"""Tests for the pure helpers in app/utils.py (dates, serialization)."""

from datetime import date, datetime
from decimal import Decimal

import pytest

from app.utils import get_today, serialize_row, serialize_value


class TestDateHelpers:
    def test_get_today_survives_invalid_timezone(self, monkeypatch):
        from zoneinfo import ZoneInfo

        from app.config import get_settings

        monkeypatch.setattr(get_settings(), "app_timezone", "Not/AZone")
        before = datetime.now(ZoneInfo("Asia/Taipei")).date()
        result = get_today()  # must fall back to Asia/Taipei, not raise
        after = datetime.now(ZoneInfo("Asia/Taipei")).date()
        assert result in {before, after}


class TestSerialization:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            (date(2026, 7, 6), "2026-07-06"),
            (datetime(2026, 7, 6, 12, 30), "2026-07-06T12:30:00"),
            (Decimal("10"), 10),
            (Decimal("10.25"), 10.25),
            (10.256, 10.26),
            ("text", "text"),
            (42, 42),
            (None, None),
        ],
    )
    def test_serialize_value(self, raw, expected):
        assert serialize_value(raw) == expected

    def test_integral_decimal_becomes_int(self):
        assert isinstance(serialize_value(Decimal("10")), int)

    def test_serialize_row(self):
        row = {"d": date(2026, 1, 2), "amount": Decimal("3.5")}
        assert serialize_row(row) == {"d": "2026-01-02", "amount": 3.5}
