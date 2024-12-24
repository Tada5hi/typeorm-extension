# CLI

If you use esm, the executable must be changed from `typeorm-extension` to `typeorm-extension-esm`.
The following commands are available in the terminal:
- `typeorm-extension db:create` to create the database
- `typeorm-extension db:drop` to drop the database
- `typeorm-extension seed:run` seed the database
- `typeorm-extension seed:create` to create a new seeder

If the application has not yet been built or is to be tested with ts-node, the commands can be adapted as follows:

```
"scripts": {
    "db:create": "ts-node ./node_modules/typeorm-extension/bin/cli.cjs db:create",
    "db:drop": "ts-node ./node_modules/typeorm-extension/bin/cli.cjs db:drop",
    "seed:run": "ts-node ./node_modules/typeorm-extension/bin/cli.cjs seed:run",
    "seed:create": "ts-node ./node_modules/typeorm-extension/bin/cli.cjs seed:create"
}
```
To test the application in the context of an esm project, the following adjustments must be made:
- executable `ts-node` to `ts-node-esm`
- library path `cli.cjs` to `cli.mjs`

Read the [Seeding Configuration](./seeding#configuration) section to find out how to specify the path,
for the seeder- & factory-location.

#### CLI Options

| Option                  | Commands                                           | Default         | Description                                                                                                                                                                                                                              |
|-------------------------|----------------------------------------------------|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--root` or `-r`        | `db:create`, `db:drop`, `seed:create` & `seed:run` | `process.cwd()` | Root directory of the project.                                                                                                                                                                                                           |
| `--dataSource` or `-d`  | `db:create`, `db:drop` & `seed:run`                | `data-source`   | Name (or relative path incl. name) of the data-source file.                                                                                                                                                                              |
| `--synchronize` or `-s` | `db:create` & `db:drop`                            | `yes`           | Synchronize the database schema after database creation. Options: `yes` or `no`.                                                                                                                                                         |
| `--initialDatabase`     | `db:create`                                        | `undefined`     | Specify the initial database to connect to. This option is only relevant for the `postgres` driver, which must always connect to a database. If no database is provided, the database name will be equal to the connection user name. |
| `--name`                | `seed:create` & `seed:run`                         | `undefined`     | Name (or relative path incl. name) of the seeder.                                                                                                                                                                                        |
| `--preserveFilePaths`   | `db:create`, `db:drop`, `seed:create` & `seed:run` | `false`         | This option indicates if file paths should be preserved and treated as if the just-in-time compilation environment is detected.                                                                                                          |
