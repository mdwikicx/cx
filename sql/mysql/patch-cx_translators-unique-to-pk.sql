-- This file is automatically generated using maintenance/generateSchemaChangeSql.php.
-- Source: sql/abstractSchemaChanges/patch-cx_translators-unique-to-pk.json
-- Do not modify this file directly.
-- See https://www.mediawiki.org/wiki/Manual:Schema_changes
DROP  INDEX cx_translation_translators ON  /*_*/cx_translators;
ALTER TABLE  /*_*/cx_translators
ADD  PRIMARY KEY (    translator_user_id, translator_translation_id  );