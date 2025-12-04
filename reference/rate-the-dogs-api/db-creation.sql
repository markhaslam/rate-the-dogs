DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS images;
--DROP DATABASE IF EXISTS rate_the_dogs;

--CREATE DATABASE rate_the_dogs;

CREATE TABLE IF NOT EXISTS images
(
    id      serial PRIMARY KEY,
    url     text UNIQUE NOT NULL,
    breed   text NOT NULL
);

CREATE TABLE IF NOT EXISTS ratings
(
    id            serial PRIMARY KEY,
    image_id      integer REFERENCES images (id) NOT NULL,
    rating        smallint NOT NULL,
    session_id    uuid NULL,
    ip_address    inet NULL,
    user_agent    text NULL,
    created_at    timestamptz NOT NULL
);
