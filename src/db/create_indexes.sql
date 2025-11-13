CREATE INDEX IF NOT EXISTS gdx2_sta_geom_idx ON gdx2.sta USING GIST (geom);
CREATE INDEX IF NOT EXISTS gdx2_stp_geom_idx ON gdx2.stp USING GIST (geom);
CREATE INDEX IF NOT EXISTS gdx2_stl_geom_idx ON gdx2.stl USING GIST (geom);
CREATE INDEX IF NOT EXISTS gdx2_field_geom_idx ON gdx2.field USING GIST (geom);
CREATE INDEX IF NOT EXISTS gdx2_lu_geom_idx ON gdx2.lu USING GIST (geom);
