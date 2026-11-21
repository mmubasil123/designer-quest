#!/usr/bin/env python3
"""
MoMu collection harvester.

Harvests MoMu's public collection data from the Omeka S JSON APIs behind
studycenter.momu.be and heron.libis.be/momu, then loads it into the
normalised Postgres schema in ../schema.sql.

Two stages, so the polite network part runs once and the database part can
be re-run offline as often as you like:

  fetch   API  -> cache/<source>/<resource>/page-NNNNN.json   (stdlib only)
  load    cache -> Postgres                                    (needs psycopg)

Examples
  python momu_harvest.py fetch                       # all enabled sources
  python momu_harvest.py fetch --source studycenter --max-pages 2
  python momu_harvest.py load  --dsn postgresql://localhost/momu --init-schema
  python momu_harvest.py all   --dsn postgresql://localhost/momu --init-schema

Politeness
  * robots.txt is read for every source and every URL is checked against it;
    disallowed URLs are skipped and reported, never fetched.
  * One request at a time, with a delay of max(--delay, robots Crawl-delay).
  * 429 / 5xx are retried with exponential backoff and Retry-After honoured.
  * Pages already in the cache are not fetched again (the run is resumable).
"""
from __future__ import annotations

import argparse
import datetime as dt
import gzip
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from pathlib import Path

USER_AGENT = (
    "MoMuCollectionHarvester/1.0 "
    "(MoMu Hackathon 2026 research; polite; +https://studycenter.momu.be/page/hackathon-2026)"
)

# --------------------------------------------------------------------------
# Sources
# --------------------------------------------------------------------------

SOURCES: dict[str, dict] = {
    "studycenter": {
        "name": "MoMu Library & Dries Van Noten Study Center",
        "base_url": "https://studycenter.momu.be",
        "license_note": "See rights statement per record.",
    },
    "bikkembergs": {
        "name": "MoMu Archive Dirk Bikkembergs",
        "base_url": "https://studycenter.momu.be/archiefdirkbikkembergs",
        "license_note": "CC-BY-NC-SA MoMu / Archive Dirk Bikkembergs (per record).",
    },
    "heron": {
        "name": "MoMu Study Collection (LIBIS Heron)",
        "base_url": "https://heron.libis.be/momu",
        "license_note": "See rights statement per record.",
    },
}

# Omeka S API resources, in the order they are fetched/loaded.
RESOURCES = [
    "vocabularies",
    "properties",
    "resource_classes",
    "resource_templates",
    "sites",
    "item_sets",
    "items",
    "media",
]

PER_PAGE = 100

# --------------------------------------------------------------------------
# Fetch stage
# --------------------------------------------------------------------------


class PoliteClient:
    def __init__(self, base_url: str, delay: float, timeout: float = 60.0,
                 max_retries: int = 5, log=print):
        self.base_url = base_url.rstrip("/")
        parts = urllib.parse.urlsplit(self.base_url)
        self.origin = f"{parts.scheme}://{parts.netloc}"
        self.timeout = timeout
        self.max_retries = max_retries
        self.log = log
        self.robots = urllib.robotparser.RobotFileParser()
        self.robots_url = f"{self.origin}/robots.txt"
        self.robots_status = "unknown"
        self._load_robots()
        crawl_delay = None
        try:
            crawl_delay = self.robots.crawl_delay(USER_AGENT)
        except Exception:
            pass
        self.delay = max(delay, float(crawl_delay or 0))
        self._last = 0.0

    def _load_robots(self):
        req = urllib.request.Request(self.robots_url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                body = r.read().decode("utf-8", "replace")
            self.robots.parse(body.splitlines())
            self.robots_status = "ok"
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                # Per RFC 9309: treat as full disallow.
                self.robots.parse(["User-agent: *", "Disallow: /"])
                self.robots_status = f"http {e.code}: treated as disallow all"
            else:
                # 404 and other 4xx: no restrictions.
                self.robots.parse([])
                self.robots_status = f"http {e.code}: no robots.txt, allowed"
        except Exception as e:  # network problem: be conservative
            self.robots.parse(["User-agent: *", "Disallow: /"])
            self.robots_status = f"unreachable ({e.__class__.__name__}): treated as disallow all"
        self.robots.modified()  # marks the rules as loaded (needed for crawl_delay/can_fetch)

    def allowed(self, url: str) -> bool:
        return self.robots.can_fetch(USER_AGENT, url)

    def get_json(self, url: str):
        """Returns (data, headers). Raises PermissionError if robots disallows."""
        if not self.allowed(url):
            raise PermissionError(f"robots.txt disallows {url}")
        attempt = 0
        while True:
            wait = self._last + self.delay - time.monotonic()
            if wait > 0:
                time.sleep(wait)
            req = urllib.request.Request(url, headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
            })
            try:
                self._last = time.monotonic()
                with urllib.request.urlopen(req, timeout=self.timeout) as r:
                    raw = r.read()
                    if r.headers.get("Content-Encoding") == "gzip":
                        raw = gzip.decompress(raw)
                    return json.loads(raw.decode("utf-8")), dict(r.headers)
            except urllib.error.HTTPError as e:
                if e.code in (429, 500, 502, 503, 504) and attempt < self.max_retries:
                    attempt += 1
                    retry_after = e.headers.get("Retry-After")
                    backoff = float(retry_after) if retry_after and retry_after.isdigit() \
                        else min(300, self.delay * (2 ** attempt) + 1)
                    self.log(f"    HTTP {e.code}, retry {attempt}/{self.max_retries} in {backoff:.0f}s")
                    time.sleep(backoff)
                    continue
                raise
            except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
                if attempt < self.max_retries:
                    attempt += 1
                    backoff = min(300, self.delay * (2 ** attempt) + 1)
                    self.log(f"    {e.__class__.__name__}: {e}; retry {attempt} in {backoff:.0f}s")
                    time.sleep(backoff)
                    continue
                raise


def fetch_source(code: str, cache_dir: Path, delay: float, max_pages: int | None,
                 resources: list[str], extra_query: dict[str, str], log=print) -> dict:
    src = SOURCES[code]
    api = src["base_url"].rstrip("/") + "/api"
    client = PoliteClient(src["base_url"], delay=delay, log=log)
    out = cache_dir / code
    out.mkdir(parents=True, exist_ok=True)
    log(f"[{code}] {api}")
    log(f"  robots.txt: {client.robots_status}; delay {client.delay:.1f}s")
    manifest = {
        "source": code, "api_url": api, "base_url": src["base_url"],
        "robots_status": client.robots_status,
        "started_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "user_agent": USER_AGENT, "resources": {},
    }
    for res in resources:
        rdir = out / res
        rdir.mkdir(exist_ok=True)
        page, fetched, cached, total, skipped = 1, 0, 0, None, None
        while True:
            if max_pages and page > max_pages:
                break
            path = rdir / f"page-{page:05d}.json"
            if path.exists():
                data = json.loads(path.read_text("utf-8"))
                cached += 1
            else:
                q = {"per_page": str(PER_PAGE), "page": str(page),
                     "sort_by": "id", "sort_order": "asc"}
                if res in ("items", "media", "item_sets"):
                    q.update(extra_query)
                url = f"{api}/{res}?{urllib.parse.urlencode(q)}"
                try:
                    data, headers = client.get_json(url)
                except PermissionError as e:
                    skipped = str(e)
                    log(f"  {res}: SKIPPED, {e}")
                    break
                except urllib.error.HTTPError as e:
                    skipped = f"HTTP {e.code} for {url}"
                    log(f"  {res}: stopped, {skipped}")
                    break
                if total is None:
                    t = headers.get("Omeka-S-Total-Results") or headers.get("omeka-s-total-results")
                    total = int(t) if t and t.isdigit() else None
                tmp = path.with_suffix(".tmp")
                tmp.write_text(json.dumps(data, ensure_ascii=False), "utf-8")
                tmp.replace(path)
                fetched += 1
            n = len(data) if isinstance(data, list) else 0
            if page == 1 or page % 10 == 0:
                log(f"  {res}: page {page} ({n} records){f' of ~{total} total' if total else ''}")
            if n < PER_PAGE:
                break
            page += 1
        manifest["resources"][res] = {
            "pages_fetched": fetched, "pages_cached": cached,
            "total_reported": total, "skipped": skipped,
        }
    manifest["finished_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2), "utf-8")
    return manifest


def download_media(cache_dir: Path, media_dir: Path, delay: float, kinds: set[str], log=print):
    """Optional: download original files for media of the given asset kinds."""
    for code in SOURCES:
        mdir = cache_dir / code / "media"
        if not mdir.exists():
            continue
        client = PoliteClient(SOURCES[code]["base_url"], delay=delay, log=log)
        for page in sorted(mdir.glob("page-*.json")):
            for m in json.loads(page.read_text("utf-8")):
                url = m.get("o:original_url")
                kind = classify_media(m)
                if not url or kind not in kinds:
                    continue
                target = media_dir / code / f"{m['o:id']}{Path(urllib.parse.urlsplit(url).path).suffix}"
                if target.exists():
                    continue
                if not client.allowed(url):
                    log(f"  skip (robots) {url}")
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                wait = client._last + client.delay - time.monotonic()
                if wait > 0:
                    time.sleep(wait)
                client._last = time.monotonic()
                req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
                try:
                    with urllib.request.urlopen(req, timeout=120) as r, open(target, "wb") as f:
                        while chunk := r.read(1 << 16):
                            f.write(chunk)
                    log(f"  saved {target}")
                except Exception as e:
                    log(f"  failed {url}: {e}")


# --------------------------------------------------------------------------
# Normalisation helpers (pure functions, unit-testable)
# --------------------------------------------------------------------------

MODEL_EXT = {"glb", "gltf", "obj", "fbx", "usdz", "usd", "stl", "ply", "dae", "3ds", "x3d", "zprj", "zpac", "avt"}
PATTERN_EXT = {"dxf", "aama", "plt", "hpgl", "rul", "mdl", "pds", "dxf-aama", "zpac", "svg"}
IMAGE_EXT = {"jpg", "jpeg", "png", "tif", "tiff", "gif", "webp", "jp2", "bmp", "heic"}
DOC_EXT = {"pdf", "doc", "docx", "txt", "xml", "csv", "xls", "xlsx"}
VIDEO_EXT = {"mp4", "mov", "webm", "avi", "m4v"}
AUDIO_EXT = {"mp3", "wav", "ogg", "m4a"}


def media_extension(m: dict) -> str | None:
    for key in ("o:filename", "o:source", "o:original_url"):
        v = m.get(key)
        if v:
            suffix = Path(urllib.parse.urlsplit(v).path).suffix.lower().lstrip(".")
            if suffix and len(suffix) <= 6:
                return suffix
    return None


def classify_media(m: dict) -> str:
    ingester = (m.get("o:ingester") or "").lower()
    mime = (m.get("o:media_type") or "").lower()
    ext = media_extension(m) or ""
    title = (m.get("o:title") or "").lower()
    if ext in MODEL_EXT or mime.startswith("model/") or "gltf" in mime:
        return "model_3d"
    if ext in PATTERN_EXT and ext != "svg":
        return "pattern"
    if ext == "svg" or ext in DOC_EXT or ext in IMAGE_EXT:
        if "pattern" in title or "patroon" in title:
            return "pattern"
    if ingester == "iiif" or ingester == "iiif_presentation":
        return "iiif"
    if mime.startswith("image/") or ext in IMAGE_EXT:
        return "image"
    if mime.startswith("video/") or ext in VIDEO_EXT or ingester in ("youtube", "vimeo"):
        return "video"
    if mime.startswith("audio/") or ext in AUDIO_EXT:
        return "audio"
    if mime == "application/pdf" or ext in DOC_EXT:
        return "document"
    if ingester in ("url", "html", "oembed"):
        return "link"
    return "other"


# property term -> (concept kind / role)
CONCEPT_TERMS = {
    "dcterms:medium": "material",
    "edmfp:material": "material",
    "edm:material": "material",
    "edmfp:technique": "technique",
    "dcterms:subject": "subject",
    "dcterms:type": "type",
    "edm:hasType": "type",
    "dcterms:format": "type",
    "dcterms:spatial": "place",
    "edm:currentLocation": "place",
    "dcterms:temporal": "period",
    "edm:isShownBy": None,  # explicit: not a concept
    "curation:theme": "subject",
    "skos:Concept": "subject",
}

# property term -> agent role
AGENT_TERMS = {
    "dcterms:creator": "creator",
    "dcterms:contributor": "contributor",
    "dcterms:publisher": "publisher",
    "foaf:maker": "creator",
    "edmfp:designer": "designer",
    "dcterms:rightsHolder": "rights_holder",
    "dcterms:provenance": None,  # usually free text, kept only in object_value
}
# MARC relators (mrel:*) are agent roles too, e.g. mrel:dsr = designer.
MREL_ROLES = {
    "dsr": "designer", "cre": "creator", "aut": "author", "pht": "photographer",
    "own": "owner", "fmo": "former_owner", "dnr": "donor", "mfr": "manufacturer",
    "ill": "illustrator", "art": "artist", "cwt": "commentator", "edt": "editor",
    "pbl": "publisher", "ctb": "contributor", "prt": "printer", "csl": "consultant",
    "wde": "wood_engraver", "tlr": "tailor", "cst": "costume_designer",
}

RESOURCE_TYPES_PREFIX = "resource"
YEAR_RE = re.compile(r"(?<!\d)(1[0-9]{3}|20[0-9]{2})(?!\d)")


def agent_role(term: str) -> str | None:
    if term in AGENT_TERMS:
        return AGENT_TERMS[term]
    if term.startswith("mrel:"):
        code = term.split(":", 1)[1]
        return MREL_ROLES.get(code, code)
    return None


def concept_kind(term: str) -> str | None:
    return CONCEPT_TERMS.get(term)


def parse_year(s: str | None) -> int | None:
    if not s:
        return None
    m = YEAR_RE.search(str(s))
    return int(m.group(1)) if m else None


def iter_values(record: dict):
    """Yields (term, position, value_dict) for every property value."""
    for key, vals in record.items():
        if ":" not in key or key.startswith("o:") or key.startswith("@"):
            continue
        if not isinstance(vals, list):
            continue
        for pos, v in enumerate(vals):
            if isinstance(v, dict) and "type" in v:
                yield key, pos, v


def first_literal(record: dict, *terms: str, lang_pref=("en", None, "nl")) -> str | None:
    for term in terms:
        vals = [v for v in record.get(term, []) if isinstance(v, dict)]
        if not vals:
            continue
        for lang in lang_pref:
            for v in vals:
                if v.get("@language") == lang or (lang is None and not v.get("@language")):
                    text = v.get("@value") or v.get("o:label")
                    if text:
                        return str(text)
        text = vals[0].get("@value") or vals[0].get("o:label") or vals[0].get("@id")
        if text:
            return str(text)
    return None


INVENTORY_RE = re.compile(r"^(ST|T|A_)[\w/ .-]*\d", re.I)


def inventory_number(record: dict) -> str | None:
    """MoMu inventory number (e.g. ST2435, T12/123/O11).

    heron puts a short ARK code (m02vfs) in dcterms:identifier and the ST
    number in modsrdf:identifier, so prefer whichever value looks like an
    inventory number, then fall back to the first dcterms:identifier.
    """
    for term in ("modsrdf:identifier", "dcterms:identifier", "bibo:identifier"):
        for v in record.get(term, []) or []:
            text = isinstance(v, dict) and (v.get("@value") or v.get("o:label"))
            if text and INVENTORY_RE.match(str(text).strip()):
                return str(text).strip().splitlines()[0].strip()
    return first_literal(record, "dcterms:identifier")


def ref_id(ref) -> int | None:
    if isinstance(ref, dict) and ref.get("o:id") is not None:
        return int(ref["o:id"])
    return None


def norm_key(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip().lower())


def iter_cache(cache_dir: Path, code: str, res: str):
    d = cache_dir / code / res
    if not d.exists():
        return
    for page in sorted(d.glob("page-*.json")):
        data = json.loads(page.read_text("utf-8"))
        if isinstance(data, list):
            yield from data


# --------------------------------------------------------------------------
# Load stage
# --------------------------------------------------------------------------

def load(cache_dir: Path, dsn: str, init_schema: bool, schema_path: Path, sources: list[str],
         media_dir: Path | None = None, log=print):
    try:
        import psycopg
        from psycopg.types.json import Jsonb
    except ImportError:
        sys.exit("The load stage needs psycopg 3:  pip install 'psycopg[binary]'")

    with psycopg.connect(dsn) as conn:
        if init_schema:
            log(f"Initialising schema from {schema_path}")
            conn.execute(schema_path.read_text("utf-8"))
            conn.commit()
        conn.execute("SET search_path = collection, public")
        for code in sources:
            if not (cache_dir / code).exists():
                log(f"[{code}] no cache, skipping")
                continue
            log(f"[{code}] loading")
            stats = _load_source(conn, Jsonb, cache_dir, code, media_dir, log)
            log(f"[{code}] {json.dumps(stats)}")
            conn.commit()


def _upsert_returning(cur, sql, params):
    cur.execute(sql, params)
    return cur.fetchone()[0]


def _load_source(conn, Jsonb, cache_dir: Path, code: str, media_dir: Path | None, log) -> dict:
    src = SOURCES[code]
    manifest_path = cache_dir / code / "manifest.json"
    manifest = json.loads(manifest_path.read_text("utf-8")) if manifest_path.exists() else {}
    cur = conn.cursor()
    base = src["base_url"].rstrip("/")
    source_id = _upsert_returning(cur, """
        INSERT INTO source (code, name, base_url, api_url, license_note)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, base_url = EXCLUDED.base_url,
            api_url = EXCLUDED.api_url, license_note = EXCLUDED.license_note
        RETURNING id""", (code, src["name"], base, base + "/api", src["license_note"]))
    run_id = _upsert_returning(cur, """
        INSERT INTO harvest_run (source_id, fetched_at, notes) VALUES (%s, %s, %s) RETURNING id""",
        (source_id, manifest.get("finished_at"), f"robots.txt: {manifest.get('robots_status')}"))
    stats = {}

    # -- Omeka metadata ------------------------------------------------
    vocab_map, prop_map, class_map, tmpl_map, site_map, set_map = {}, {}, {}, {}, {}, {}
    for v in iter_cache(cache_dir, code, "vocabularies"):
        vocab_map[v["o:id"]] = _upsert_returning(cur, """
            INSERT INTO vocabulary (source_id, omeka_id, prefix, namespace_uri, label)
            VALUES (%s,%s,%s,%s,%s)
            ON CONFLICT (source_id, omeka_id) DO UPDATE SET prefix=EXCLUDED.prefix,
              namespace_uri=EXCLUDED.namespace_uri, label=EXCLUDED.label RETURNING id""",
            (source_id, v["o:id"], v.get("o:prefix"), v.get("o:namespace_uri"), v.get("o:label")))
    for p in iter_cache(cache_dir, code, "properties"):
        prop_map[p["o:id"]] = _upsert_returning(cur, """
            INSERT INTO property (source_id, omeka_id, term, label, vocabulary_id)
            VALUES (%s,%s,%s,%s,%s)
            ON CONFLICT (source_id, omeka_id) DO UPDATE SET term=EXCLUDED.term,
              label=EXCLUDED.label, vocabulary_id=EXCLUDED.vocabulary_id RETURNING id""",
            (source_id, p["o:id"], p.get("o:term"), p.get("o:label"),
             vocab_map.get(ref_id(p.get("o:vocabulary")))))
    for c in iter_cache(cache_dir, code, "resource_classes"):
        class_map[c["o:id"]] = _upsert_returning(cur, """
            INSERT INTO resource_class (source_id, omeka_id, term, label) VALUES (%s,%s,%s,%s)
            ON CONFLICT (source_id, omeka_id) DO UPDATE SET term=EXCLUDED.term, label=EXCLUDED.label
            RETURNING id""", (source_id, c["o:id"], c.get("o:term"), c.get("o:label")))
    for t in iter_cache(cache_dir, code, "resource_templates"):
        tmpl_map[t["o:id"]] = _upsert_returning(cur, """
            INSERT INTO resource_template (source_id, omeka_id, label) VALUES (%s,%s,%s)
            ON CONFLICT (source_id, omeka_id) DO UPDATE SET label=EXCLUDED.label RETURNING id""",
            (source_id, t["o:id"], t.get("o:label")))
    for s in iter_cache(cache_dir, code, "sites"):
        slug = s.get("o:slug")
        site_map[s["o:id"]] = _upsert_returning(cur, """
            INSERT INTO site (source_id, omeka_id, slug, title, summary, public_url, raw)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (source_id, omeka_id) DO UPDATE SET slug=EXCLUDED.slug, title=EXCLUDED.title,
              summary=EXCLUDED.summary, public_url=EXCLUDED.public_url, raw=EXCLUDED.raw RETURNING id""",
            (source_id, s["o:id"], slug, s.get("o:title"), s.get("o:summary"),
             f"{base}/s/{slug}" if slug else None, Jsonb(s)))
    for s in iter_cache(cache_dir, code, "item_sets"):
        set_map[s["o:id"]] = _upsert_returning(cur, """
            INSERT INTO item_set (source_id, omeka_id, title, description, is_public, raw)
            VALUES (%s,%s,%s,%s,%s,%s)
            ON CONFLICT (source_id, omeka_id) DO UPDATE SET title=EXCLUDED.title,
              description=EXCLUDED.description, is_public=EXCLUDED.is_public, raw=EXCLUDED.raw
            RETURNING id""",
            (source_id, s["o:id"], s.get("o:title"), first_literal(s, "dcterms:description"),
             s.get("o:is_public", True), Jsonb(s)))
    stats.update(vocabularies=len(vocab_map), properties=len(prop_map), classes=len(class_map),
                 templates=len(tmpl_map), sites=len(site_map), item_sets=len(set_map))

    # Prefer a public site slug for building object page URLs.
    first_site_slug = None
    for s in iter_cache(cache_dir, code, "sites"):
        first_site_slug = s.get("o:slug")
        break

    # -- Objects: pass 1, rows -----------------------------------------
    obj_map: dict[int, int] = {}
    items = list(iter_cache(cache_dir, code, "items"))
    for it in items:
        oid = it["o:id"]
        thumbs = it.get("thumbnail_display_urls") or it.get("o:thumbnail_urls") or {}
        date_text = first_literal(it, "dcterms:date", "dcterms:created", "dcterms:temporal")
        yb = parse_year(first_literal(it, "edm:begin")) or parse_year(date_text)
        ye = parse_year(first_literal(it, "edm:end")) or (parse_year(date_text.split("-")[-1]) if date_text and "-" in date_text else None) or yb
        if not date_text and yb:
            date_text = str(yb) if ye in (None, yb) else f"{yb}-{ye}"
        ark = None
        # studycenter uses the cidoc-crm: prefix, heron uses cidoc:
        for v in (it.get("cidoc-crm:P48_has_preferred_identifier") or it.get("cidoc:P48_has_preferred_identifier") or []):
            ark = v.get("o:label") or v.get("@value") or v.get("@id")
            break
        site_ids = [ref_id(s) for s in it.get("o:site", [])]
        slug = first_site_slug
        public_url = f"{base}/s/{slug}/item/{oid}" if slug else f"{base}/item/{oid}"
        if code == "studycenter":
            public_url = f"{base}/item/{oid}"
        obj_map[oid] = _upsert_returning(cur, """
            INSERT INTO object (source_id, omeka_id, title, inventory_number, ark, resource_class_id,
              resource_template_id, date_text, year_begin, year_end, extent, rights, is_public,
              api_url, public_url, thumbnail_large, thumbnail_medium, thumbnail_square,
              omeka_created, omeka_modified, raw, harvest_run_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (source_id, omeka_id) DO UPDATE SET
              title=EXCLUDED.title, inventory_number=EXCLUDED.inventory_number, ark=EXCLUDED.ark,
              resource_class_id=EXCLUDED.resource_class_id, resource_template_id=EXCLUDED.resource_template_id,
              date_text=EXCLUDED.date_text, year_begin=EXCLUDED.year_begin, year_end=EXCLUDED.year_end,
              extent=EXCLUDED.extent, rights=EXCLUDED.rights, is_public=EXCLUDED.is_public,
              api_url=EXCLUDED.api_url, public_url=EXCLUDED.public_url,
              thumbnail_large=EXCLUDED.thumbnail_large, thumbnail_medium=EXCLUDED.thumbnail_medium,
              thumbnail_square=EXCLUDED.thumbnail_square, omeka_created=EXCLUDED.omeka_created,
              omeka_modified=EXCLUDED.omeka_modified, raw=EXCLUDED.raw, harvest_run_id=EXCLUDED.harvest_run_id
            RETURNING id""",
            (source_id, oid, it.get("o:title"), inventory_number(it), ark,
             class_map.get(ref_id(it.get("o:resource_class"))),
             tmpl_map.get(ref_id(it.get("o:resource_template"))),
             date_text, yb, ye, first_literal(it, "dcterms:extent"), first_literal(it, "dcterms:rights"),
             it.get("o:is_public", True), it.get("@id"), public_url,
             thumbs.get("large"), thumbs.get("medium"), thumbs.get("square"),
             (it.get("o:created") or {}).get("@value"), (it.get("o:modified") or {}).get("@value"),
             Jsonb(it), run_id))
        cur.execute("DELETE FROM object_item_set WHERE object_id=%s", (obj_map[oid],))
        for s in it.get("o:item_set", []):
            sid = set_map.get(ref_id(s))
            if sid:
                cur.execute("INSERT INTO object_item_set VALUES (%s,%s) ON CONFLICT DO NOTHING", (obj_map[oid], sid))
        cur.execute("DELETE FROM object_site WHERE object_id=%s", (obj_map[oid],))
        for s_id in site_ids:
            sid = site_map.get(s_id)
            if sid:
                cur.execute("INSERT INTO object_site VALUES (%s,%s) ON CONFLICT DO NOTHING", (obj_map[oid], sid))
    stats["objects"] = len(obj_map)

    # -- Objects: pass 2, values, concepts, agents, relations ----------
    prop_by_term = {}
    cur.execute("SELECT term, id FROM property WHERE source_id=%s", (source_id,))
    for term, pid in cur.fetchall():
        prop_by_term[term] = pid
    n_values = n_concepts = n_agents = n_rel = 0
    concept_cache: dict[str, int] = {}
    agent_cache: dict[str, int] = {}
    for it in items:
        o = obj_map[it["o:id"]]
        cur.execute("DELETE FROM object_value WHERE object_id=%s", (o,))
        cur.execute("DELETE FROM object_concept WHERE object_id=%s", (o,))
        cur.execute("DELETE FROM object_agent WHERE object_id=%s", (o,))
        cur.execute("DELETE FROM object_relation WHERE subject_id=%s", (o,))
        rows = []
        for term, pos, v in iter_values(it):
            vtype = v.get("type", "literal")
            lang = v.get("@language")
            text = v.get("@value") if v.get("@value") is not None else v.get("o:label")
            if text is not None and not isinstance(text, str):
                text = json.dumps(text) if isinstance(text, (dict, list)) else str(text)
            uri = v.get("@id") if not vtype.startswith(RESOURCE_TYPES_PREFIX) else None
            linked = obj_map.get(v.get("value_resource_id")) if vtype.startswith(RESOURCE_TYPES_PREFIX) else None
            if linked is None and vtype.startswith(RESOURCE_TYPES_PREFIX) and not text:
                text = v.get("display_title")
            pid = prop_by_term.get(term) or prop_map.get(v.get("property_id"))
            rows.append((o, pid, term, pos, vtype, lang, text, uri, linked, v.get("is_public", True)))

            if linked:
                cur.execute("INSERT INTO object_relation VALUES (%s,%s,%s) ON CONFLICT DO NOTHING",
                            (o, term, linked))
                n_rel += 1
                continue
            label = text or uri
            if not label:
                continue
            kind = concept_kind(term)
            role = agent_role(term)
            if kind:
                key = uri if uri else f"literal:{kind}:{norm_key(label)}"
                cid = concept_cache.get(key)
                if cid is None:
                    scheme = urllib.parse.urlsplit(uri).netloc if uri else None
                    cid = _upsert_returning(cur, """
                        INSERT INTO concept (key, uri, scheme, kind) VALUES (%s,%s,%s,%s)
                        ON CONFLICT (key) DO UPDATE SET uri=EXCLUDED.uri RETURNING id""",
                        (key, uri, scheme, kind))
                    concept_cache[key] = cid
                if text:
                    cur.execute("INSERT INTO concept_label VALUES (%s,%s,%s) ON CONFLICT DO NOTHING",
                                (cid, lang or "", text))
                cur.execute("INSERT INTO object_concept VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING",
                            (o, cid, kind, term))
                n_concepts += 1
            elif role:
                key = uri if uri else f"name:{norm_key(label)}"
                aid = agent_cache.get(key)
                if aid is None:
                    aid = _upsert_returning(cur, """
                        INSERT INTO agent (key, name, uri, kind) VALUES (%s,%s,%s,'unknown')
                        ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name RETURNING id""",
                        (key, text or uri, uri))
                    agent_cache[key] = aid
                cur.execute("INSERT INTO object_agent VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING",
                            (o, aid, role, term))
                n_agents += 1
        if rows:
            cur.executemany("""
                INSERT INTO object_value (object_id, property_id, term, position, value_type, lang,
                  value_text, value_uri, linked_object_id, is_public)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""", rows)
            n_values += len(rows)
    stats.update(values=n_values, concept_links=n_concepts, agent_links=n_agents, relations=n_rel)

    # -- Media ----------------------------------------------------------
    primary = {ref_id(it.get("o:primary_media")) for it in items if it.get("o:primary_media")}
    position_of = {}
    for it in items:
        for i, m in enumerate(it.get("o:media", [])):
            position_of[ref_id(m)] = i
    n_media = 0
    kinds: dict[str, int] = {}
    for m in iter_cache(cache_dir, code, "media"):
        mid = m["o:id"]
        item_oid = ref_id(m.get("o:item"))
        kind = classify_media(m)
        kinds[kind] = kinds.get(kind, 0) + 1
        thumbs = m.get("thumbnail_display_urls") or m.get("o:thumbnail_urls") or {}
        local = None
        if media_dir:
            hits = list((media_dir / code).glob(f"{mid}.*")) if (media_dir / code).exists() else []
            local = str(hits[0]) if hits else None
        cur.execute("""
            INSERT INTO media (source_id, omeka_id, object_id, position, is_primary, asset_kind, ingester,
              media_type, extension, title, filename, size_bytes, sha256, original_url, source_url,
              thumbnail_large, thumbnail_medium, thumbnail_square, local_path, is_public, raw)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (source_id, omeka_id) DO UPDATE SET object_id=EXCLUDED.object_id,
              position=EXCLUDED.position, is_primary=EXCLUDED.is_primary, asset_kind=EXCLUDED.asset_kind,
              ingester=EXCLUDED.ingester, media_type=EXCLUDED.media_type, extension=EXCLUDED.extension,
              title=EXCLUDED.title, filename=EXCLUDED.filename, size_bytes=EXCLUDED.size_bytes,
              sha256=EXCLUDED.sha256, original_url=EXCLUDED.original_url, source_url=EXCLUDED.source_url,
              thumbnail_large=EXCLUDED.thumbnail_large, thumbnail_medium=EXCLUDED.thumbnail_medium,
              thumbnail_square=EXCLUDED.thumbnail_square,
              local_path=COALESCE(EXCLUDED.local_path, media.local_path),
              is_public=EXCLUDED.is_public, raw=EXCLUDED.raw""",
            (source_id, mid, obj_map.get(item_oid), position_of.get(mid), mid in primary, kind,
             m.get("o:ingester"), m.get("o:media_type"), media_extension(m), m.get("o:title"),
             m.get("o:filename"), m.get("o:size"), m.get("o:sha256"), m.get("o:original_url"),
             m.get("o:source"), thumbs.get("large"), thumbs.get("medium"), thumbs.get("square"),
             local, m.get("o:is_public", True), Jsonb(m)))
        n_media += 1
    stats.update(media=n_media, media_kinds=kinds)
    cur.execute("UPDATE harvest_run SET stats=%s WHERE id=%s", (Jsonb(stats), run_id))
    return stats


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def main(argv=None):
    here = Path(__file__).resolve().parent
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("command", choices=["fetch", "load", "all", "download-media"])
    p.add_argument("--source", action="append", choices=list(SOURCES),
                   help="source(s) to use; default: all")
    p.add_argument("--cache", type=Path, default=here.parent / "cache")
    p.add_argument("--delay", type=float, default=1.0, help="seconds between requests (min)")
    p.add_argument("--max-pages", type=int, help="limit pages per resource (for testing)")
    p.add_argument("--resource", action="append", choices=RESOURCES, help="only these API resources")
    p.add_argument("--site-id", type=int, help="only items/media of this Omeka site")
    p.add_argument("--item-set-id", type=int, help="only items of this Omeka item set")
    p.add_argument("--dsn", default=os.environ.get("DATABASE_URL", "postgresql://localhost/momu"))
    p.add_argument("--init-schema", action="store_true", help="run schema.sql before loading")
    p.add_argument("--schema", type=Path, default=here.parent / "schema.sql")
    p.add_argument("--media-dir", type=Path, default=here.parent / "media")
    p.add_argument("--media-kinds", default="model_3d,pattern",
                   help="asset kinds for download-media (comma list, or 'all')")
    a = p.parse_args(argv)
    sources = a.source or list(SOURCES)
    resources = a.resource or RESOURCES

    if a.command in ("fetch", "all"):
        extra = {}
        if a.site_id:
            extra["site_id"] = str(a.site_id)
        if a.item_set_id:
            extra["item_set_id"] = str(a.item_set_id)
        for code in sources:
            m = fetch_source(code, a.cache, a.delay, a.max_pages, resources, extra)
            print(json.dumps(m["resources"], indent=1))
    if a.command == "download-media":
        kinds = {"image", "model_3d", "pattern", "document", "video", "audio", "other"} \
            if a.media_kinds == "all" else set(a.media_kinds.split(","))
        download_media(a.cache, a.media_dir, a.delay, kinds)
    if a.command in ("load", "all"):
        load(a.cache, a.dsn, a.init_schema, a.schema, sources,
             media_dir=a.media_dir if a.media_dir.exists() else None)


if __name__ == "__main__":
    main()
