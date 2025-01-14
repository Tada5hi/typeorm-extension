import { isObject } from 'locter';
import type { PostgresDriver } from 'typeorm/driver/postgres/PostgresDriver';
import type { CockroachDriver } from 'typeorm/driver/cockroachdb/CockroachDriver';
import { OptionsError } from '../../errors';
import type { DatabaseBaseContext, DatabaseCreateContext, DatabaseDropContext } from '../type';
import { hasOwnProperty } from '../../utils';
import type { DriverOptions } from './type';
import { buildDriverOptions, createDriver } from './utils';
import { buildDatabaseCreateContext, buildDatabaseDropContext, synchronizeDatabaseSchema } from '../utils';

export async function createSimplePostgresConnection(
    driver: PostgresDriver | CockroachDriver,
    options: DriverOptions,
    operationContext: DatabaseBaseContext,
) {
    /**
     * pg library
     */
    const { Client } = driver.postgres;

    const data : Record<string, any> = {
        host: options.host,
        port: options.port,
        user: options.user,
        password: options.password,
        ssl: options.ssl,
        schema: options.schema,
        ...(options.extra ? options.extra : {}),
    };

    if (typeof operationContext.initialDatabase === 'string') {
        data.database = operationContext.initialDatabase;
    }

    const client = new Client(data);

    await client.connect();

    return client;
}

export async function executeSimplePostgresQuery(connection: any, query: string, endConnection = true) {
    return new Promise(((resolve, reject) => {
        connection.query(query, (queryErr: any, queryResult: any) => {
            if (endConnection) {
                connection.end();
            }

            if (queryErr) {
                reject(queryErr);
            }

            resolve(queryResult);
        });
    }));
}

export async function createPostgresDatabase(
    context?: DatabaseCreateContext,
) {
    context = await buildDatabaseCreateContext(context);
    if (!context.options) {
        throw OptionsError.undeterminable();
    }

    const options = buildDriverOptions(context.options);
    const driver = createDriver(context.options) as PostgresDriver;

    const connection = await createSimplePostgresConnection(driver, options, context);

    if (context.ifNotExist) {
        const existQuery = `SELECT * FROM pg_database WHERE lower(datname) = lower('${options.database}');`;
        const existResult = await executeSimplePostgresQuery(connection, existQuery, false);

        if (
            isObject(existResult) &&
            hasOwnProperty(existResult, 'rows') &&
            Array.isArray(existResult.rows) &&
            existResult.rows.length > 0
        ) {
            await connection.end();

            return Promise.resolve();
        }
    }

    /**
     * @link https://github.com/typeorm/typeorm/blob/master/src/driver/postgres/PostgresQueryRunner.ts#L326
     */
    let query = `CREATE DATABASE "${options.database}"`;
    if (typeof options.characterSet === 'string') {
        query += ` WITH ENCODING '${options.characterSet}'`;
    }
    const result = await executeSimplePostgresQuery(connection, query);

    if (typeof options.schema === 'string' && options.schema !== 'public') {
        const schemaConnection = await createSimplePostgresConnection(driver, options, {
            ...context,
            initialDatabase: options.database,
        });
        const schemaQuery = `CREATE SCHEMA IF NOT EXISTS "${options.schema}"`;
        await executeSimplePostgresQuery(schemaConnection, schemaQuery);
    }

    if (context.synchronize) {
        await synchronizeDatabaseSchema(context.options);
    }

    return result;
}

export async function dropPostgresDatabase(
    context?: DatabaseDropContext,
) {
    context = await buildDatabaseDropContext(context);
    if (!context.options) {
        throw OptionsError.undeterminable();
    }

    const options = buildDriverOptions(context.options);
    const driver = createDriver(context.options) as PostgresDriver;

    const connection = await createSimplePostgresConnection(driver, options, context);
    /**
     * @link https://github.com/typeorm/typeorm/blob/master/src/driver/postgres/PostgresQueryRunner.ts#L343
     */
    const query = context.ifExist ?
        `DROP DATABASE IF EXISTS "${options.database}"` :
        `DROP DATABASE "${options.database}"`;

    return executeSimplePostgresQuery(connection, query);
}
