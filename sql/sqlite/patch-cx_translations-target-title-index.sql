-- This file is automatically generated using maintenance/generateSchemaChangeSql.php.
-- Source: extensions/ContentTranslation/sql/abstractSchemaChanges/patch-cx_translations-target-title-index.json
-- Do not modify this file directly.
-- See https://www.mediawiki.org/wiki/Manual:Schema_changes
CREATE TEMPORARY TABLE /*_*/__temp__cx_translations AS
SELECT
  translation_id,
  translation_source_title,
  translation_target_title,
  translation_source_language,
  translation_target_language,
  translation_source_revision_id,
  translation_target_revision_id,
  translation_source_url,
  translation_target_url,
  translation_status,
  translation_start_timestamp,
  translation_last_updated_timestamp,
  translation_progress,
  translation_started_by,
  translation_last_update_by,
  translation_cx_version
FROM /*_*/cx_translations;
DROP TABLE /*_*/cx_translations;


CREATE TABLE /*_*/cx_translations (
    translation_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    translation_source_title BLOB NOT NULL,
    translation_target_title BLOB NOT NULL,
    translation_source_language BLOB NOT NULL,
    translation_target_language BLOB NOT NULL,
    translation_source_revision_id INTEGER UNSIGNED DEFAULT NULL,
    translation_target_revision_id INTEGER UNSIGNED DEFAULT NULL,
    translation_source_url BLOB NOT NULL,
    translation_target_url BLOB DEFAULT NULL,
    translation_status TEXT DEFAULT NULL,
    translation_start_timestamp BLOB NOT NULL,
    translation_last_updated_timestamp BLOB NOT NULL,
    translation_progress BLOB NOT NULL,
    translation_started_by INTEGER DEFAULT NULL,
    translation_last_update_by INTEGER DEFAULT NULL,
    translation_cx_version SMALLINT UNSIGNED DEFAULT 1
  );
INSERT INTO /*_*/cx_translations (
    translation_id, translation_source_title,
    translation_target_title, translation_source_language,
    translation_target_language, translation_source_revision_id,
    translation_target_revision_id,
    translation_source_url, translation_target_url,
    translation_status, translation_start_timestamp,
    translation_last_updated_timestamp,
    translation_progress, translation_started_by,
    translation_last_update_by, translation_cx_version
  )
SELECT
  translation_id,
  translation_source_title,
  translation_target_title,
  translation_source_language,
  translation_target_language,
  translation_source_revision_id,
  translation_target_revision_id,
  translation_source_url,
  translation_target_url,
  translation_status,
  translation_start_timestamp,
  translation_last_updated_timestamp,
  translation_progress,
  translation_started_by,
  translation_last_update_by,
  translation_cx_version
FROM
  /*_*/__temp__cx_translations;
DROP TABLE /*_*/__temp__cx_translations;

CREATE UNIQUE INDEX cx_translation_ref ON /*_*/cx_translations (
    translation_source_title, translation_source_language,
    translation_target_language, translation_started_by
  );

CREATE INDEX cx_translation_languages ON /*_*/cx_translations (
    translation_source_language, translation_target_language,
    translation_status
  );

CREATE INDEX cx_translation_target_title ON /*_*/cx_translations (translation_target_title);
