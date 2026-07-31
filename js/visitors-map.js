/*!
 * visitors-map.js — Interactive choropleth world map for the Live Statistics dashboard.
 *
 * Renders an SVG world map showing visitor counts by country, sourced from
 * /analytics.json (committed hourly by .github/workflows/update-analytics.yml).
 *
 * Design:
 *   - Uses the public-domain world-atlas TopoJSON (via jsDelivr CDN, ~60KB
 *     gzipped, cached in localStorage for 30 days).
 *   - Uses topojson-client (~5KB from CDN) to convert TopoJSON → GeoJSON.
 *   - Vanilla JS SVG path generation — no D3 dependency.
 *   - Equirectangular projection (crops Antarctica for better use of space).
 *   - Logarithmic color scale: light gray (0 visitors) → dark teal (max).
 *   - Hover/tap tooltip with flag emoji, country name, visitor count, %.
 *   - Top-10 countries list below the map with flag + bar + count.
 *   - Hidden by default; shown only when /analytics.json exists and has data.
 *   - Fully self-contained — no external CSS or dependencies beyond the
 *     two CDN scripts (which are also cached).
 *
 * The card HTML (#ga-map-card) is injected into each page by the patcher
 * script. This JS file is loaded via <script src="/js/visitors-map.js">
 * and self-executes on DOMContentLoaded.
 */
(function () {
    'use strict';

    // ===== Configuration =====
    var MAP_WIDTH = 960;
    var MAP_HEIGHT = 480;
    var MAX_LAT = 83.6;     // northern tip of Greenland
    var MIN_LAT = -55.9;    // southern tip of South America (crops Antarctica)
    var TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
    var TOPOJSON_CLIENT_URL = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
    var CACHE_KEY = 'world_topojson_v1';
    var CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
    var SVGNS = 'http://www.w3.org/2000/svg';

    // ===== Equirectangular projection =====
    function project(lon, lat) {
        var x = (lon + 180) / 360 * MAP_WIDTH;
        var y = (MAX_LAT - lat) / (MAX_LAT - MIN_LAT) * MAP_HEIGHT;
        return [x, y];
    }

    // ===== SVG path generation from GeoJSON geometry =====
    function ringsToPath(rings) {
        return rings.map(function (ring) {
            return ring.map(function (coord, i) {
                var p = project(coord[0], coord[1]);
                return (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ',' + p[1].toFixed(2);
            }).join(' ') + 'Z';
        }).join(' ');
    }

    function geometryToPath(geom) {
        if (!geom) return '';
        if (geom.type === 'Polygon') return ringsToPath(geom.coordinates);
        if (geom.type === 'MultiPolygon') return geom.coordinates.map(ringsToPath).join(' ');
        return '';
    }

    // ===== Logarithmic color scale =====
    // Light gray (#e8eef2) for 0 visitors → light teal (#b2dfdb) for 1 →
    // dark teal (#00695C) for max. Log scale so small countries aren't
    // invisible next to large ones.
    function getFillColor(count, maxCount) {
        if (!count || count <= 0) return '#e8eef2';
        var t = Math.log(count) / Math.log(maxCount);
        if (t < 0) t = 0;
        if (t > 1) t = 1;
        var r = Math.round(178 + (0 - 178) * t);
        var g = Math.round(223 + (105 - 223) * t);
        var b = Math.round(219 + (92 - 219) * t);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    // ===== Make flag emoji from alpha-2 code =====
    function flagEmoji(alpha2) {
        if (!alpha2 || alpha2.length !== 2) return '🌍';
        try {
            return String.fromCodePoint(
                alpha2.toUpperCase().charCodeAt(0) - 65 + 0x1F1E6,
                alpha2.toUpperCase().charCodeAt(1) - 65 + 0x1F1E6
            );
        } catch (e) {
            return '🌍';
        }
    }

    // ===== Dynamically load a script =====
    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var existing = document.querySelector('script[src="' + src + '"]');
            if (existing) {
                if (window.topojson) { resolve(); return; }
                existing.addEventListener('load', resolve);
                existing.addEventListener('error', function () { reject(new Error('Failed: ' + src)); });
                return;
            }
            var s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = function () { reject(new Error('Failed to load ' + src)); };
            document.head.appendChild(s);
        });
    }

    // ===== Get TopoJSON (with localStorage cache) =====
    function getTopoJSON() {
        // Check cache
        try {
            var cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                var parsed = JSON.parse(cached);
                if (parsed && parsed.fetched_at && Date.now() - parsed.fetched_at < CACHE_TTL) {
                    return Promise.resolve(parsed.data);
                }
            }
        } catch (e) { /* corrupt cache, fall through to fetch */ }

        // Fetch from CDN
        return fetch(TOPOJSON_URL).then(function (resp) {
            if (!resp.ok) throw new Error('TopoJSON HTTP ' + resp.status);
            return resp.json();
        }).then(function (data) {
            // Cache for 30 days (map borders don't change)
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ fetched_at: Date.now(), data: data }));
            } catch (e) { /* localStorage full or disabled — non-fatal */ }
            return data;
        });
    }

    // ===== Main render function =====
    function renderMap() {
        var card = document.getElementById('ga-map-card');
        if (!card) return; // no map card on this page

        fetch('/analytics.json?ts=' + Date.now()).then(function (resp) {
            if (!resp.ok) return null; // 404 — GA not configured, card stays hidden
            return resp.json();
        }).then(function (data) {
            if (!data || !data.top_countries_all_time || data.top_countries_all_time.length === 0) return;

            // Build visitors map: numeric code → visitors
            var visitorsByNumeric = {};
            var countryInfoByNumeric = {};
            data.top_countries_all_time.forEach(function (c) {
                var num = c.country_numeric || '';
                if (num) {
                    visitorsByNumeric[num] = c.visitors;
                    countryInfoByNumeric[num] = c;
                }
            });

            // Find max for color scale
            var maxVisitors = 1;
            Object.keys(visitorsByNumeric).forEach(function (k) {
                if (visitorsByNumeric[k] > maxVisitors) maxVisitors = visitorsByNumeric[k];
            });

            // Load topojson-client library, then get TopoJSON data
            return loadScript(TOPOJSON_CLIENT_URL).then(function () {
                if (!window.topojson) throw new Error('topojson-client not available');
                return getTopoJSON();
            }).then(function (topo) {
                var geojson = window.topojson.feature(topo, topo.objects.countries);
                var svg = document.getElementById('world-map-svg');
                if (!svg) return;
                svg.innerHTML = '';

                var tooltip = document.getElementById('map-tooltip');
                var container = document.getElementById('world-map-container');
                var totalVisitors = data.totals.all_time_visitors || 1;

                // Render each country as an SVG path
                geojson.features.forEach(function (feature) {
                    var numeric = String(feature.id || '');
                    var visitors = visitorsByNumeric[numeric] || 0;
                    var countryName = (feature.properties && feature.properties.name) || 'Unknown';

                    var path = document.createElementNS(SVGNS, 'path');
                    path.setAttribute('d', geometryToPath(feature.geometry));
                    path.setAttribute('fill', getFillColor(visitors, maxVisitors));
                    path.setAttribute('stroke', '#ffffff');
                    path.setAttribute('stroke-width', '0.5');

                    if (visitors > 0) {
                        path.style.cursor = 'pointer';
                        path.setAttribute('tabindex', '0');
                        path.setAttribute('role', 'img');
                        var info = countryInfoByNumeric[numeric];
                        var flag = info && info.country_code ? flagEmoji(info.country_code) : '🌍';
                        var pct = ((visitors / totalVisitors) * 100).toFixed(1);
                        var tooltipText = flag + ' ' + countryName + ': ' + visitors.toLocaleString() + ' visitors (' + pct + '%)';

                        path.setAttribute('aria-label', tooltipText);

                        // Hover tooltip (desktop)
                        path.addEventListener('mouseenter', function (e) {
                            if (!tooltip) return;
                            tooltip.textContent = tooltipText;
                            tooltip.style.display = 'block';
                        });
                        path.addEventListener('mousemove', function (e) {
                            if (!tooltip || !container) return;
                            var rect = container.getBoundingClientRect();
                            var tx = e.clientX - rect.left + 12;
                            var ty = e.clientY - rect.top + 12;
                            // Keep tooltip within container bounds
                            tx = Math.min(tx, rect.width - 200);
                            ty = Math.min(ty, rect.height - 40);
                            tooltip.style.left = tx + 'px';
                            tooltip.style.top = ty + 'px';
                        });
                        path.addEventListener('mouseleave', function () {
                            if (tooltip) tooltip.style.display = 'none';
                        });

                        // Focus tooltip (keyboard accessibility)
                        path.addEventListener('focus', function () {
                            if (!tooltip) return;
                            tooltip.textContent = tooltipText;
                            tooltip.style.display = 'block';
                            tooltip.style.left = '50%';
                            tooltip.style.top = '10px';
                            tooltip.style.transform = 'translateX(-50%)';
                        });
                        path.addEventListener('blur', function () {
                            if (tooltip) {
                                tooltip.style.display = 'none';
                                tooltip.style.transform = '';
                            }
                        });

                        // Click: scroll to this country in the top-10 list (if present)
                        path.addEventListener('click', function () {
                            var listEl = document.getElementById('map-top-countries');
                            if (!listEl || !info) return;
                            var items = listEl.querySelectorAll('[data-country-code]');
                            for (var i = 0; i < items.length; i++) {
                                if (items[i].getAttribute('data-country-code') === info.country_code) {
                                    items[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                    items[i].style.transition = 'background 0.3s';
                                    items[i].style.background = 'var(--secondary)';
                                    setTimeout(function () { items[i].style.background = ''; }, 1500);
                                    break;
                                }
                            }
                        });
                    }

                    svg.appendChild(path);
                });

                // Render top-10 list
                var listEl = document.getElementById('map-top-countries');
                if (listEl) {
                    var top10 = data.top_countries_all_time.slice(0, 10);
                    var listMax = 1;
                    top10.forEach(function (c) { if (c.visitors > listMax) listMax = c.visitors; });
                    listEl.innerHTML = top10.map(function (c) {
                        var pct = Math.max((c.visitors / listMax) * 100, c.visitors > 0 ? 8 : 0);
                        return '<div data-country-code="' + (c.country_code || '') + '" ' +
                            'style="display:flex;align-items:center;gap:10px;padding:8px 12px;' +
                            'background:#f0f4f7;border-radius:8px;transition:background 0.3s;">' +
                            '<span style="font-size:20px;min-width:28px;text-align:center;">' + (c.flag_emoji || '🌍') + '</span>' +
                            '<span style="font-size:13px;min-width:100px;color:#333;font-weight:600;">' + c.country + '</span>' +
                            '<div style="flex:1;height:16px;background:rgba(0,0,0,0.05);border-radius:8px;overflow:hidden;">' +
                                '<div style="height:100%;background:linear-gradient(90deg,#20B2AA,#00695C);' +
                                'border-radius:8px;width:' + pct + '%;transition:width 1s ease;"></div>' +
                            '</div>' +
                            '<span style="font-size:13px;font-weight:700;color:#0A1C3C;min-width:40px;text-align:right;">' +
                                c.visitors.toLocaleString() + '</span>' +
                        '</div>';
                    }).join('');
                }

                // Update footer stats
                var tvs = document.querySelectorAll('.map-total-visitors');
                var tcs = document.querySelectorAll('.map-total-countries');
                var tvText = (data.totals.all_time_visitors || 0).toLocaleString();
                var tcText = String(data.top_countries_all_time.length);
                tvs.forEach(function (el) { el.textContent = tvText; });
                tcs.forEach(function (el) { el.textContent = tcText; });

                // Show the card
                card.style.display = 'block';
            });
        }).catch(function (e) {
            // Silently skip — the card stays hidden. Console.log for debugging.
            if (typeof console !== 'undefined' && console.log) {
                console.log('Visitors map skipped:', e.message);
            }
        });
    }

    // ===== Run on DOMContentLoaded =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderMap);
    } else {
        renderMap();
    }
})();
