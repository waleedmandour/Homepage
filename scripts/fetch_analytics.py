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

# ISO 3166-1 alpha-2 → numeric code mapping.
# Used to add a 'country_numeric' field to each country entry in
# analytics.json, so the browser-side world map (js/visitors-map.js)
# can match countries from the world-atlas TopoJSON (which uses
# numeric IDs like "840" for the US) without needing a mapping table
# in the browser.
ALPHA2_TO_NUMERIC = {
    'AD': '020', 'AE': '784', 'AF': '004', 'AG': '028', 'AI': '660', 'AL': '008', 'AM': '051', 'AO': '024',
    'AQ': '010', 'AR': '032', 'AS': '016', 'AT': '040', 'AU': '036', 'AW': '533', 'AX': '248', 'AZ': '031',
    'BA': '070', 'BB': '052', 'BD': '050', 'BE': '056', 'BF': '854', 'BG': '100', 'BH': '048', 'BI': '108',
    'BJ': '204', 'BL': '652', 'BM': '060', 'BN': '096', 'BO': '068', 'BQ': '535', 'BR': '076', 'BS': '044',
    'BT': '064', 'BV': '074', 'BW': '072', 'BY': '112', 'BZ': '084', 'CA': '124', 'CC': '166', 'CD': '180',
    'CF': '140', 'CG': '178', 'CH': '756', 'CI': '384', 'CK': '184', 'CL': '152', 'CM': '120', 'CN': '156',
    'CO': '170', 'CR': '188', 'CU': '192', 'CV': '132', 'CW': '531', 'CX': '162', 'CY': '196', 'CZ': '203',
    'DE': '276', 'DJ': '262', 'DK': '208', 'DM': '212', 'DO': '214', 'DZ': '012', 'EC': '218', 'EE': '233',
    'EG': '818', 'EH': '732', 'ER': '232', 'ES': '724', 'ET': '231', 'FI': '246', 'FJ': '242', 'FK': '238',
    'FM': '583', 'FO': '234', 'FR': '250', 'GA': '266', 'GB': '826', 'GD': '308', 'GE': '268', 'GF': '254',
    'GG': '831', 'GH': '288', 'GI': '292', 'GL': '304', 'GM': '270', 'GN': '324', 'GP': '312', 'GQ': '226',
    'GR': '300', 'GS': '239', 'GT': '320', 'GU': '316', 'GW': '624', 'GY': '328', 'HK': '344', 'HM': '334',
    'HN': '340', 'HR': '191', 'HT': '332', 'HU': '348', 'ID': '360', 'IE': '372', 'IL': '376', 'IM': '833',
    'IN': '356', 'IO': '086', 'IQ': '368', 'IR': '364', 'IS': '352', 'IT': '380', 'JE': '832', 'JM': '388',
    'JO': '400', 'JP': '392', 'KE': '404', 'KG': '417', 'KH': '116', 'KI': '296', 'KM': '174', 'KN': '659',
    'KP': '408', 'KR': '410', 'KW': '414', 'KY': '136', 'KZ': '398', 'LA': '418', 'LB': '422', 'LC': '662',
    'LI': '438', 'LK': '144', 'LR': '430', 'LS': '426', 'LT': '440', 'LU': '442', 'LV': '428', 'LY': '434',
    'MA': '504', 'MC': '492', 'MD': '498', 'ME': '499', 'MF': '663', 'MG': '450', 'MH': '584', 'MK': '807',
    'ML': '466', 'MM': '104', 'MN': '496', 'MO': '446', 'MP': '580', 'MQ': '474', 'MR': '478', 'MS': '500',
    'MT': '470', 'MU': '480', 'MV': '462', 'MW': '454', 'MX': '484', 'MY': '458', 'MZ': '508', 'NA': '516',
    'NC': '540', 'NE': '562', 'NF': '574', 'NG': '566', 'NI': '558', 'NL': '528', 'NO': '578', 'NP': '524',
    'NR': '520', 'NU': '570', 'NZ': '554', 'OM': '512', 'PA': '591', 'PE': '604', 'PF': '258', 'PG': '598',
    'PH': '608', 'PK': '586', 'PL': '616', 'PM': '666', 'PN': '612', 'PR': '630', 'PS': '275', 'PT': '620',
    'PW': '585', 'PY': '600', 'QA': '634', 'RE': '638', 'RO': '642', 'RS': '688', 'RU': '643', 'RW': '646',
    'SA': '682', 'SB': '090', 'SC': '690', 'SD': '729', 'SE': '752', 'SG': '702', 'SH': '654', 'SI': '705',
    'SJ': '744', 'SK': '703', 'SL': '694', 'SM': '674', 'SN': '686', 'SO': '706', 'SR': '740', 'SS': '728',
    'ST': '678', 'SV': '222', 'SX': '534', 'SY': '760', 'SZ': '748', 'TC': '796', 'TD': '144', 'TF': '260',
    'TG': '768', 'TH': '764', 'TJ': '762', 'TK': '772', 'TL': '626', 'TM': '795', 'TN': '788', 'TO': '776',
    'TR': '792', 'TT': '780', 'TV': '798', 'TW': '158', 'TZ': '834', 'UA': '804', 'UG': '800', 'UM': '581',
    'US': '840', 'UY': '858', 'UZ': '860', 'VA': '336', 'VC': '670', 'VE': '862', 'VG': '092', 'VI': '850',
    'VN': '704', 'VU': '548', 'WF': '876', 'WS': '882', 'YE': '887', 'YT': '175', 'ZA': '710', 'ZM': '894',
    'ZW': '716',
}


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

    # ----- 4. Top countries with codes (all-time, top 100 for the world map) -----
    countries_all_time_report = client.run_report(RunReportRequest(
        property=f'properties/{property_id}',
        date_ranges=[DateRange(start_date='2020-01-01', end_date='today')],
        dimensions=[Dimension(name='country'), Dimension(name='countryId')],
        metrics=[Metric(name='totalUsers')],
        order_bys=[{
            'metric': {'metric_name': 'totalUsers'},
            'desc': True,
        }],
        limit=100,
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
                'country_numeric': ALPHA2_TO_NUMERIC.get(country_code, ''),
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
