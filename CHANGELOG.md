## 1.2.2

- sti-child generator includes check constraint instead of not-null since the column should only be not-null for that STI child (or modified by hand to accommodate more than one STI child)

## 1.2.1

- Throw DataTypeColumnTypeMismatch when Postgres throws an error attempting to save to a column with a value that can't be cast to the column type.

## 1.2.0

- Add Dream.lookup, enabling devs to tap into the IOC provided by dream to dodge circular import issues

## 1.1.2

- CliFileWriter does not raise error if the file we are writing is not in the file system yet.

## 1.1.1

- Add fs.writeFile options as third argument to CliFileWriter.write, enabling psychic to provide custom flags when writing openapi.json files.

## 1.1.0

- Remove support for preloadThroughColumns. They were broken, fixing them would be overly complex, and the same effect can be obtained using flatten on a serializer rendersOne

## 1.0.6

- Fix joining after a through a polymorphic BelongsTo
  association.

- Improve join implementation

- Disable leftJoinPreload preloadThroughColumns since it doesn't actually work on through associations that resolve to a source that doesn't match the association name (and we were unnecessarily including columns in the leftJoinPreload statement even when there was no `preloadThroughColumns`, thereby bloating the queries unnecessarily)

## 1.0.5

- Support HasOne/Many through polymorphic BelongsTo (trick is that it uses the associated model from the HasOne/Many to limit the BelongsTo to a single associated class / table)

- Fix HasOne/Many through source type

- sync process is now fail-safe, leveraging a utility which caches old copies of files before writing to them. If an exception is thrown at any point during the process, dream will revert all files written using the new `CliFileWriter` class

## 1.0.4

- properly exclude type from `DreamParamSafeColumnNames`

## 1.0.3

- exclude type from `DreamParamSafeColumnNames`

## 1.0.2

- stop computing foreign keys in schema builder when building schema for through associations

## 1.0.1

- [bug] fix preloading STI model via polymporhic association (polymorphic type was being altered to the STI child rather than left as the STI base)
