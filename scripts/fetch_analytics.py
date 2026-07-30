#!/usr/bin/env python3
"""
Fetch historical visitor statistics from Google Analytics 4 (GA4) via the
Google Analytics Data API v1beta and write them to analytics.json.

This script runs inside a GitHub Actions workflow (see
.github/workflows/update-analytics.yml). The GA service-account credentials
are passed via the GA_CREDENTIALS_JSON environment variable (a JSON string
containing the full key file). The GA4 property ID is passed via
GA_PROPERTY_ID (or hardcoded as the default below).

Output: analytics.json at the repository root, containing:
  {
    "fetched_at": "2026-07-30T12:00:00Z",
    "property_id": "123456789",
    "totals": {
      "all_time_visitors": 1234,
      "all_time_pageviews": 5678,
      "last_7_days_visitors": 56,
      "last_30_days_visitors": 234
    },
    "top_countries_all_time": [
      {"country": "Oman", "country_code": "OM", "visitors": 312, "flag_emoji": "..."},
      ...
    ],
    "top_countries_last_30_days": [...],
    "top_pages_all_time": [
      {"url": "waleedmandour.org/", "pageviews": 1234, "visitors": 567},
      ...
    ]
  }

Setup: see docs/ANALYTICS_SETUP.md for the one-time Google Cloud setup.
"""
import json
import os
import sys
import datetime
from pathlib import Path

# ----- Configuration -----
# The GA4 property ID for waleedmandour.org (extracted from the GA URL
# the user shared: a60056981p514716245 → property ID = 514716245).
# Can still be overridden via GA_PROPERTY_ID env var if needed.
DEFAULT_PROPERTY_ID = os.environ.get('GA_PROPERTY_ID', '514716245')

# Output path (repo root when run in GitHub Actions)
OUTPUT_PATH = Path(__file__).resolve().parent.parent / 'analytics.json'


def make_flag_emoji(country_code: str) -> str:
    """Convert a 2-letter ISO country code to a flag emoji."""
    if not country_code or len(country_code) != 2:
        return ''
    cc = country_code.upper()
    return ''.join(chr(0x1F1E6 + ord(c) - ord('A')) for c in cc)


def fetch_metrics(property_id: str, credentials_json: str) -> dict:
    """Authenticate with GA Data API and fetch the metrics we need.

    Returns a dict matching the analytics.json schema (without fetched_at).
    Raises on any error."""
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (
        DateRange,
        Dimension,
        Metric,
        RunReportRequest,
        GetMetadataRequest,
    )
    from google.oauth2 import service_account

    # Parse the credentials JSON and build a credentials object
    try:
        creds_info = json.loads(credentials_json)
    except json.JSONDecodeError as e:
        raise RuntimeError(
            f'GA_CREDENTIALS_JSON is not valid JSON: {e}. '
            f'Expected the full contents of a service-account JSON key file.'
        ) from e

    # Required fields in a service-account key file
    required_fields = {'type', 'project_id', 'private_key', 'client_email'}
    missing = required_fields - set(creds_info.keys())
    if missing:
        raise RuntimeError(
            f'GA_CREDENTIALS_JSON is missing required fields: {sorted(missing)}. '
            f'Expected a service-account JSON key file from Google Cloud Console.'
        )

    credentials = service_account.Credentials.from_service_account_info(creds_info)
    client = BetaAnalyticsDataClient(credentials=credentials)

    # ----- Verify the property is accessible -----
    try:
        client.get_metadata(
            GetMetadataRequest(name=f'properties/{property_id}/metadata')
        )
    except Exception as e:
        raise RuntimeError(
            f'Could not access GA4 property {property_id}. '
            f'Check that the service account {creds_info["client_email"]} '
            f'has been granted Viewer on the GA4 property. Original error: {e}'
        ) from e

    # ----- 1. All-time totals -----
    all_time_report = client.run_report(RunReportRequest(
        property=f'properties/{property_id}',
        date_ranges=[DateRange(start_date='2020-01-01', end_date='today')],
        metrics=[Metric(name='totalUsers'), Metric(name='screenPageViews')],
    ))
    all_time_visitors = 0
    all_time_pageviews = 0
    if all_time_report.rows:
        for row in all_time_report.rows:
            all_time_visitors += int(row.metric_values[0].value or 0)
            all_time_pageviews += int(row.metric_values[1].value or 0)

    # ----- 2. Last 7 days -----
    seven_day_report = client.run_report(RunReportRequest(
        property=f'properties/{property_id}',
        date_ranges=[DateRange(start_date='7daysAgo', end_date='today')],
        metrics=[Metric(name='totalUsers')],
    ))
    last_7_days_visitors = 0
    if seven_day_report.rows:
        for row in seven_day_report.rows:
            last_7_days_visitors += int(row.metric_values[0].value or 0)

    # ----- 3. Last 30 days -----
    thirty_day_report = client.run_report(RunReportRequest(
        property=f'properties/{property_id}',
        date_ranges=[DateRange(start_date='30daysAgo', end_date='today')],
        metrics=[Metric(name='totalUsers')],
    ))
    last_30_days_visitors = 0
    if thirty_day_report.rows:
        for row in thirty_day_report.rows:
            last_30_days_visitors += int(row.metric_values[0].value or 0)

    # ----- 4. Top countries with codes (all-time, top 10) -----
    countries_all_time_report = client.run_report(RunReportRequest(
        property=f'properties/{property_id}',
        date_ranges=[DateRange(start_date='2020-01-01', end_date='today')],
        dimensions=[Dimension(name='country'), Dimension(name='countryId')],
        metrics=[Metric(name='totalUsers')],
        order_bys=[{
            'metric': {'metric_name': 'totalUsers'},
            'desc': True,
        }],
        limit=10,
    ))
    top_countries_all_time = []
    if countries_all_time_report.rows:
        for row in countries_all_time_report.rows:
            country = row.dimension_values[0].value or ''
            country_code = row.dimension_values[1].value or ''
            visitors = int(row.metric_values[0].value or 0)
            if not country or country == '(not set)':
                continue
            top_countries_all_time.append({
                'country': country,
                'country_code': country_code,
                'visitors': visitors,
                'flag_emoji': make_flag_emoji(country_code),
            })

    # ----- 5. Top countries (last 30 days, top 10) -----
    countries_last_30_report = client.run_report(RunReportRequest(
        property=f'properties/{property_id}',
        date_ranges=[DateRange(start_date='30daysAgo', end_date='today')],
        dimensions=[Dimension(name='country'), Dimension(name='countryId')],
        metrics=[Metric(name='totalUsers')],
        order_bys=[{
            'metric': {'metric_name': 'totalUsers'},
            'desc': True,
        }],
        limit=10,
    ))
    top_countries_last_30_days = []
    if countries_last_30_report.rows:
        for row in countries_last_30_report.rows:
            country = row.dimension_values[0].value or ''
            country_code = row.dimension_values[1].value or ''
            visitors = int(row.metric_values[0].value or 0)
            if not country or country == '(not set)':
                continue
            top_countries_last_30_days.append({
                'country': country,
                'country_code': country_code,
                'visitors': visitors,
                'flag_emoji': make_flag_emoji(country_code),
            })

    # ----- 6. Top pages (all-time, top 10) -----
    top_pages_report = client.run_report(RunReportRequest(
        property=f'properties/{property_id}',
        date_ranges=[DateRange(start_date='2020-01-01', end_date='today')],
        dimensions=[Dimension(name='hostName'), Dimension(name='pagePath')],
        metrics=[Metric(name='screenPageViews'), Metric(name='totalUsers')],
        order_bys=[{
            'metric': {'metric_name': 'screenPageViews'},
            'desc': True,
        }],
        limit=10,
    ))
    top_pages = []
    if top_pages_report.rows:
        for row in top_pages_report.rows:
            hostname = row.dimension_values[0].value or ''
            path = row.dimension_values[1].value or ''
            pageviews = int(row.metric_values[0].value or 0)
            visitors = int(row.metric_values[1].value or 0)
            top_pages.append({
                'url': f'{hostname}{path}',
                'pageviews': pageviews,
                'visitors': visitors,
            })

    return {
        'property_id': property_id,
        'totals': {
            'all_time_visitors': all_time_visitors,
            'all_time_pageviews': all_time_pageviews,
            'last_7_days_visitors': last_7_days_visitors,
            'last_30_days_visitors': last_30_days_visitors,
        },
        'top_countries_all_time': top_countries_all_time,
        'top_countries_last_30_days': top_countries_last_30_days,
        'top_pages_all_time': top_pages,
    }


def main():
    credentials_json = os.environ.get('GA_CREDENTIALS_JSON')
    property_id = os.environ.get('GA_PROPERTY_ID', DEFAULT_PROPERTY_ID)

    # When credentials aren't configured yet, exit SUCCESS (not failure).
    # The dashboard UI gracefully degrades to a 'Configure GA' hint, so
    # there's no reason to mark the workflow as failing — that just
    # creates noise in the GitHub Actions tab. The user can configure
    # GA at any time by following docs/ANALYTICS_SETUP.md, then manually
    # trigger this workflow to verify the pipeline works.
    if not credentials_json or credentials_json.strip() == '':
        print(
            'NOTE: GA_CREDENTIALS_JSON is not set — the GA pipeline is not\n'
            'configured yet. This is expected if you have not yet completed\n'
            'the one-time setup in docs/ANALYTICS_SETUP.md.\n\n'
            'No analytics.json was written (existing file, if any, is\n'
            'preserved so the dashboard can keep showing stale data).\n\n'
            'Exiting with success (exit 0) so this workflow does not show\n'
            'as a failure in the Actions tab. Once you configure GA, this\n'
            'workflow will start producing analytics.json automatically.',
            file=sys.stderr,
        )
        sys.exit(0)

    if property_id == 'YOUR_PROPERTY_ID_HERE' or not property_id:
        # This branch is now unreachable in practice (the default is set above),
        # but kept as a defensive guard in case someone overrides the default
        # to the placeholder string.
        print(
            'NOTE: GA_PROPERTY_ID is not set — the GA pipeline is not\n'
            'configured yet. This is expected if you have not yet completed\n'
            'the one-time setup in docs/ANALYTICS_SETUP.md.\n\n'
            'Exiting with success (exit 0) so this workflow does not show\n'
            'as a failure in the Actions tab.',
            file=sys.stderr,
        )
        sys.exit(0)

    print(f'Fetching GA4 metrics for property {property_id}...', file=sys.stderr)
    try:
        data = fetch_metrics(property_id, credentials_json)
    except Exception as e:
        # Real fetch errors (auth failed, property not found, etc.) still
        # fail the workflow — these only happen AFTER the user has
        # configured credentials, so they indicate a real problem.
        print(f'ERROR: Failed to fetch GA4 metrics: {e}', file=sys.stderr)
        sys.exit(2)

    data['fetched_at'] = datetime.datetime.now(datetime.timezone.utc).strftime(
        '%Y-%m-%dT%H:%M:%SZ'
    )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + '\n',
        encoding='utf-8',
    )
    print(
        f'Wrote {OUTPUT_PATH}\n'
        f'  all_time_visitors:       {data["totals"]["all_time_visitors"]}\n'
        f'  last_7_days_visitors:    {data["totals"]["last_7_days_visitors"]}\n'
        f'  last_30_days_visitors:   {data["totals"]["last_30_days_visitors"]}\n'
        f'  top_countries_all_time:  {len(data["top_countries_all_time"])} countries\n'
        f'  top_pages_all_time:      {len(data["top_pages_all_time"])} pages',
        file=sys.stderr,
    )


if __name__ == '__main__':
    main()
