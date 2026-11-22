-- =====================================================================
-- MoMu collection database
-- PostgreSQL 14+
--
-- Two schemas:
--   collection   reusable, app-neutral model of MoMu's public collection
--                data (harvested from the Omeka S APIs of
--                studycenter.momu.be and heron.libis.be/momu)
--   second_skin  thin app layer for the "Museum Atelier" hackathon demo
--                (QR unlocks, avatar slots, history layers). Other apps
--                can add their own schema next to it the same way.
--
-- Every harvested row keeps (source_id, omeka_id) so a re-harvest
-- upserts in place, and keeps its raw JSON so nothing is lost.
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS collection;
CREATE SCHEMA IF NOT EXISTS second_skin;

SET search_path = collection, public;

-- ---------------------------------------------------------------------
-- Provenance
-- ---------------------------------------------------------------------

-- One Omeka S installation (an API root).
CREATE TABLE IF NOT EXISTS source (
    id           smallserial PRIMARY KEY,
    code         text NOT NULL UNIQUE,          -- e.g. 'studycenter', 'heron'
    name         text NOT NULL,
    base_url     text NOT NULL,                 -- e.g. https://studycenter.momu.be
    api_url      text NOT NULL,                 -- e.g. https://studycenter.momu.be/api
    license_note text
);

-- One run of the harvester against one source.
CREATE TABLE IF NOT EXISTS harvest_run (
    id           serial PRIMARY KEY,
    source_id    smallint NOT NULL REFERENCES source(id),
    fetched_at   timestamptz,                   -- when the cache was fetched
    loaded_at    timestamptz NOT NULL DEFAULT now(),
    stats        jsonb NOT NULL DEFAULT '{}'::jsonb,
    notes        text
);

-- ---------------------------------------------------------------------
-- Omeka metadata (lets the EAV table below stay self-describing)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vocabulary (
    id            serial PRIMARY KEY,
    source_id     smallint NOT NULL REFERENCES source(id),
    omeka_id      integer NOT NULL,
    prefix        text NOT NULL,                -- dcterms, edm, cidoc-crm ...
    namespace_uri text,
    label         text,
    UNIQUE (source_id, omeka_id)
);

CREATE TABLE IF NOT EXISTS property (
    id            serial PRIMARY KEY,
    source_id     smallint NOT NULL REFERENCES source(id),
    omeka_id      integer NOT NULL,
    term          text NOT NULL,                -- e.g. dcterms:medium
    label         text,
    vocabulary_id integer REFERENCES vocabulary(id),
    UNIQUE (source_id, omeka_id)
);
CREATE INDEX IF NOT EXISTS property_term_idx ON property(term);

CREATE TABLE IF NOT EXISTS resource_class (
    id            serial PRIMARY KEY,
    source_id     smallint NOT NULL REFERENCES source(id),
    omeka_id      integer NOT NULL,
    term          text NOT NULL,                -- e.g. dctype:PhysicalObject
    label         text,
    UNIQUE (source_id, omeka_id)
);

CREATE TABLE IF NOT EXISTS resource_template (
    id            serial PRIMARY KEY,
    source_id     smallint NOT NULL REFERENCES source(id),
    omeka_id      integer NOT NULL,
    label         text,
    UNIQUE (source_id, omeka_id)
);

-- A public Omeka site (a curated view, e.g. 'studiecollectie', 'twinit').
CREATE TABLE IF NOT EXISTS site (
    id            serial PRIMARY KEY,
    source_id     smallint NOT NULL REFERENCES source(id),
    omeka_id      integer NOT NULL,
    slug          text,
    title         text,
    summary       text,
    public_url    text,
    raw           jsonb,
    UNIQUE (source_id, omeka_id)
);

-- An item set (a collection / group, e.g. 'TwinIt real world objects').
CREATE TABLE IF NOT EXISTS item_set (
    id            serial PRIMARY KEY,
    source_id     smallint NOT NULL REFERENCES source(id),
    omeka_id      integer NOT NULL,
    title         text,
    description   text,
    is_public     boolean,
    raw           jsonb,
    UNIQUE (source_id, omeka_id)
);

-- ---------------------------------------------------------------------
-- Core: objects
-- ---------------------------------------------------------------------

-- One collection record (Omeka "item"): a garment, fragment, textile
-- sample, pattern, drawing, archive document ...
CREATE TABLE IF NOT EXISTS object (
    id                  bigserial PRIMARY KEY,
    source_id           smallint NOT NULL REFERENCES source(id),
    omeka_id            integer NOT NULL,
    title               text,                   -- o:title
    inventory_number    text,                   -- first dcterms:identifier
    ark                 text,                   -- persistent id (data.momu.be ark)
    resource_class_id   integer REFERENCES resource_class(id),
    resource_template_id integer REFERENCES resource_template(id),
    date_text           text,                   -- first dcterms:date / dcterms:created
    year_begin          smallint,               -- edm:begin, else parsed from date_text
    year_end            smallint,               -- edm:end, else = year_begin
    extent              text,                   -- dimensions as given
    rights              text,
    is_public           boolean NOT NULL DEFAULT true,
    api_url             text,
    public_url          text,
    thumbnail_large     text,
    thumbnail_medium    text,
    thumbnail_square    text,
    omeka_created       timestamptz,
    omeka_modified      timestamptz,
    raw                 jsonb NOT NULL,         -- untouched API record
    harvest_run_id      integer REFERENCES harvest_run(id),
    UNIQUE (source_id, omeka_id)
);
CREATE INDEX IF NOT EXISTS object_inventory_idx ON object(inventory_number);
CREATE INDEX IF NOT EXISTS object_years_idx ON object(year_begin, year_end);

CREATE TABLE IF NOT EXISTS object_item_set (
    object_id   bigint  NOT NULL REFERENCES object(id) ON DELETE CASCADE,
    item_set_id integer NOT NULL REFERENCES item_set(id) ON DELETE CASCADE,
    PRIMARY KEY (object_id, item_set_id)
);

CREATE TABLE IF NOT EXISTS object_site (
    object_id   bigint  NOT NULL REFERENCES object(id) ON DELETE CASCADE,
    site_id     integer NOT NULL REFERENCES site(id) ON DELETE CASCADE,
    PRIMARY KEY (object_id, site_id)
);

-- Every metadata value of every object, lossless (EAV).
-- Multilingual literals (nl/en) live here; the views pivot them.
CREATE TABLE IF NOT EXISTS object_value (
    id                bigserial PRIMARY KEY,
    object_id         bigint  NOT NULL REFERENCES object(id) ON DELETE CASCADE,
    property_id       integer REFERENCES property(id),
    term              text    NOT NULL,         -- denormalised for easy querying
    position          smallint NOT NULL,        -- order within the property
    value_type        text    NOT NULL,         -- literal | uri | resource:item | numeric:* | customvocab:* ...
    lang              text,
    value_text        text,                     -- @value or o:label
    value_uri         text,                     -- @id for uri values
    linked_object_id  bigint REFERENCES object(id) ON DELETE SET NULL,  -- resource values
    is_public         boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS object_value_object_idx ON object_value(object_id, term);
CREATE INDEX IF NOT EXISTS object_value_term_idx   ON object_value(term);

-- ---------------------------------------------------------------------
-- Vocabulary terms: materials, techniques, subjects, types, places ...
-- (mostly from thesaurus.momu.be; literal-only terms get uri NULL)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS concept (
    id         serial PRIMARY KEY,
    key        text NOT NULL UNIQUE,            -- uri, or 'literal:<kind>:<label>'
    uri        text,
    scheme     text,                            -- host of the uri, e.g. thesaurus.momu.be
    kind       text NOT NULL                    -- material | technique | subject | type | place | period | style | other
);

CREATE TABLE IF NOT EXISTS concept_label (
    concept_id integer NOT NULL REFERENCES concept(id) ON DELETE CASCADE,
    lang       text    NOT NULL DEFAULT '',     -- '' when unknown
    label      text    NOT NULL,
    PRIMARY KEY (concept_id, lang, label)
);

CREATE TABLE IF NOT EXISTS object_concept (
    object_id  bigint  NOT NULL REFERENCES object(id) ON DELETE CASCADE,
    concept_id integer NOT NULL REFERENCES concept(id) ON DELETE CASCADE,
    role       text    NOT NULL,                -- material | technique | subject | type ...
    term       text    NOT NULL,                -- source property, e.g. dcterms:medium
    PRIMARY KEY (object_id, concept_id, role)
);
CREATE INDEX IF NOT EXISTS object_concept_concept_idx ON object_concept(concept_id);

-- ---------------------------------------------------------------------
-- People and organisations: designers, makers, houses, donors ...
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agent (
    id         serial PRIMARY KEY,
    key        text NOT NULL UNIQUE,            -- uri, or 'name:<normalised name>'
    name       text NOT NULL,
    uri        text,
    kind       text                             -- person | organisation | unknown
);

CREATE TABLE IF NOT EXISTS object_agent (
    object_id  bigint  NOT NULL REFERENCES object(id) ON DELETE CASCADE,
    agent_id   integer NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
    role       text    NOT NULL,                -- creator | designer | contributor | publisher | owner ...
    term       text    NOT NULL,                -- source property
    PRIMARY KEY (object_id, agent_id, role)
);
CREATE INDEX IF NOT EXISTS object_agent_agent_idx ON object_agent(agent_id);

-- ---------------------------------------------------------------------
-- Object-to-object links (pattern isVersionOf garment, part of ensemble ...)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS object_relation (
    subject_id  bigint NOT NULL REFERENCES object(id) ON DELETE CASCADE,
    predicate   text   NOT NULL,                -- property term, e.g. dcterms:isVersionOf
    object_id   bigint NOT NULL REFERENCES object(id) ON DELETE CASCADE,
    PRIMARY KEY (subject_id, predicate, object_id)
);
CREATE INDEX IF NOT EXISTS object_relation_object_idx ON object_relation(object_id);

-- ---------------------------------------------------------------------
-- Media: images, 3D models, pattern files, documents, video
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS media (
    id               bigserial PRIMARY KEY,
    source_id        smallint NOT NULL REFERENCES source(id),
    omeka_id         integer NOT NULL,
    object_id        bigint REFERENCES object(id) ON DELETE CASCADE,
    position         smallint,                  -- order within the object
    is_primary       boolean NOT NULL DEFAULT false,
    asset_kind       text NOT NULL,             -- image | model_3d | pattern | document | video | audio | iiif | link | other
    ingester         text,                      -- upload | url | iiif | youtube | html ...
    media_type       text,                      -- MIME type
    extension        text,
    title            text,
    filename         text,
    size_bytes       bigint,
    sha256           text,
    original_url     text,
    source_url       text,                      -- o:source (where Omeka got it)
    thumbnail_large  text,
    thumbnail_medium text,
    thumbnail_square text,
    local_path       text,                      -- set when --download-media was used
    is_public        boolean NOT NULL DEFAULT true,
    raw              jsonb NOT NULL,
    UNIQUE (source_id, omeka_id)
);
CREATE INDEX IF NOT EXISTS media_object_idx ON media(object_id);
CREATE INDEX IF NOT EXISTS media_kind_idx   ON media(asset_kind);

-- ---------------------------------------------------------------------
-- Convenience views (read these first)
-- ---------------------------------------------------------------------

-- One readable row per object.
CREATE OR REPLACE VIEW v_object AS
SELECT
    o.id,
    s.code                                   AS source,
    o.omeka_id,
    o.inventory_number,
    o.title,
    rc.term                                  AS resource_class,
    o.date_text,
    o.year_begin,
    o.year_end,
    (SELECT string_agg(v.value_text, E'\n' ORDER BY v.position)
       FROM object_value v WHERE v.object_id = o.id
        AND v.term = 'dcterms:description' AND v.lang = 'en')  AS description_en,
    (SELECT string_agg(v.value_text, E'\n' ORDER BY v.position)
       FROM object_value v WHERE v.object_id = o.id
        AND v.term = 'dcterms:description' AND v.lang = 'nl')  AS description_nl,
    (SELECT string_agg(DISTINCT a.name, '; ')
       FROM object_agent oa JOIN agent a ON a.id = oa.agent_id
      WHERE oa.object_id = o.id)                               AS agents,
    (SELECT string_agg(DISTINCT cl.label, '; ')
       FROM object_concept oc JOIN concept_label cl ON cl.concept_id = oc.concept_id
      WHERE oc.object_id = o.id AND oc.role = 'material'
        AND cl.lang IN ('en', ''))                             AS materials,
    (SELECT string_agg(DISTINCT cl.label, '; ')
       FROM object_concept oc JOIN concept_label cl ON cl.concept_id = oc.concept_id
      WHERE oc.object_id = o.id AND oc.role = 'technique')     AS techniques,
    (SELECT string_agg(DISTINCT cl.label, '; ')
       FROM object_concept oc JOIN concept_label cl ON cl.concept_id = oc.concept_id
      WHERE oc.object_id = o.id AND oc.role IN ('type', 'subject')) AS types,
    o.extent,
    o.rights,
    o.thumbnail_large,
    o.public_url,
    (SELECT count(*) FROM media m WHERE m.object_id = o.id)                               AS media_count,
    (SELECT count(*) FROM media m WHERE m.object_id = o.id AND m.asset_kind = 'model_3d') AS model_3d_count,
    (SELECT count(*) FROM media m WHERE m.object_id = o.id AND m.asset_kind = 'pattern')  AS pattern_file_count,
    (SELECT count(*) FROM object_relation r
       JOIN object p ON p.id = r.subject_id
      WHERE r.object_id = o.id AND r.predicate = 'dcterms:isVersionOf')                   AS version_count
FROM object o
JOIN source s ON s.id = o.source_id
LEFT JOIN resource_class rc ON rc.id = o.resource_class_id;

-- Objects that are good Museum Atelier demo candidates: they have an image
-- and a pattern (linked pattern record or pattern file) or a 3D model.
CREATE OR REPLACE VIEW v_demo_candidate AS
SELECT v.*
FROM v_object v
WHERE v.media_count > 0
  AND (v.model_3d_count > 0 OR v.pattern_file_count > 0 OR v.version_count > 0)
ORDER BY (v.model_3d_count > 0) DESC, v.version_count DESC, v.year_begin;

CREATE OR REPLACE VIEW v_hackathon_asset AS
SELECT CASE
  WHEN EXISTS (SELECT 1 FROM object_item_set ois JOIN item_set i ON i.id = ois.item_set_id WHERE ois.object_id = o.id AND i.omeka_id = 410823) THEN '2026 asset'
  WHEN rt.omeka_id = 18 THEN 'pattern' WHEN rt.omeka_id = 22 THEN 'digital textile' ELSE 'asset' END AS hackathon_group, v.*
FROM object o JOIN source s ON s.id = o.source_id AND s.code = 'heron'
LEFT JOIN resource_template rt ON rt.id = o.resource_template_id
JOIN v_object v ON v.id = o.id
WHERE rt.omeka_id IN (18, 22) OR EXISTS (SELECT 1 FROM object_item_set ois JOIN item_set i ON i.id = ois.item_set_id WHERE ois.object_id = o.id AND i.omeka_id IN (410823, 413025));

-- ---------------------------------------------------------------------
-- second_skin: app layer for the hackathon demo
-- ---------------------------------------------------------------------

SET search_path = second_skin, collection, public;

-- A collection object that is playable in Museum Atelier.
CREATE TABLE IF NOT EXISTS showcase_object (
    id             serial PRIMARY KEY,
    object_id      bigint NOT NULL UNIQUE REFERENCES collection.object(id),
    qr_slug        text   NOT NULL UNIQUE,      -- printed in the QR code
    avatar_slot    text   NOT NULL DEFAULT 'full_look'
                   CHECK (avatar_slot IN ('top','bottom','dress','outerwear','underwear',
                                          'footwear','headwear','accessory','full_look')),
    model_media_id bigint REFERENCES collection.media(id),   -- 3D asset worn by the avatar
    pattern_object_id bigint REFERENCES collection.object(id), -- linked pattern record
    display_order  smallint NOT NULL DEFAULT 0,
    is_active      boolean NOT NULL DEFAULT true
);

-- The history of an object, told layer by layer (outer to inner).
CREATE TABLE IF NOT EXISTS history_layer (
    id                 serial PRIMARY KEY,
    showcase_object_id integer NOT NULL REFERENCES showcase_object(id) ON DELETE CASCADE,
    layer_order        smallint NOT NULL,
    kind               text NOT NULL DEFAULT 'story'
                       CHECK (kind IN ('material','technique','maker','era','pattern','wear','conservation','story')),
    title              text NOT NULL,
    body               text,
    media_id           bigint REFERENCES collection.media(id),
    source_value_id    bigint REFERENCES collection.object_value(id),  -- the record field it is grounded in
    UNIQUE (showcase_object_id, layer_order)
);

CREATE TABLE IF NOT EXISTS visitor (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    handle      text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unlock (
    visitor_id         uuid    NOT NULL REFERENCES visitor(id) ON DELETE CASCADE,
    showcase_object_id integer NOT NULL REFERENCES showcase_object(id) ON DELETE CASCADE,
    unlocked_at        timestamptz NOT NULL DEFAULT now(),
    layers_revealed    smallint NOT NULL DEFAULT 1,
    PRIMARY KEY (visitor_id, showcase_object_id)
);

RESET search_path;
