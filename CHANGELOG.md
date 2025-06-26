# 1.0.1

- [bug] fix preloading STI model via polymporhic association (polymorphic type was being altered to the STI child rather than left as the STI base)

## 1.0.2

- stop computing foreign keys in schema builder when building schema for through associations

## 1.0.3

- exclude type from `DreamParamSafeColumnNames`

## 1.0.4

- properly exclude type from `DreamParamSafeColumnNames`
