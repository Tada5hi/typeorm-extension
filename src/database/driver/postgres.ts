import { PostgresDriver } from 'typeorm/driver/postgres/PostgresDriver';
import { CockroachDriver } from 'typeorm/driver/cockroachdb/CockroachDriver';
import { DatabaseCreateContext, DatabaseDropContext } from '../type';
import { hasOwnProperty } from '../../utils';
import { DriverOptions } from './type';
import { buildDataSourceOptions } from '../../connection';
import { buildDriverOptions, createDriver } from './utils';

export async function createSimplePostgresConnection(
    driver: PostgresDriver | CockroachDriver,
    options: DriverOptions,
    operationContext: DatabaseCreateContext,
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
    context = context || {};
    context.options = context.options || await buildDataSourceOptions(context.options);

    const options = buildDriverOptions(context.options);
    const driver = createDriver(context.options) as PostgresDriver;

    const connection = await createSimplePostgresConnection(driver, options, context);

    if (context.ifNotExist) {
        const existQuery = `SELECT * FROM pg_database WHERE lower(datname) = lower('${options.database}');`;
        const existResult = await executeSimplePostgresQuery(connection, existQuery, false);

        if (
            typeof existResult === 'object' &&
            hasOwnProperty(existResult, 'rows') &&
            Array.isArray(existResult.rows) &&
            existResult.rows.length > 0
        ) {
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

    return executeSimplePostgresQuery(connection, query);
}

export async function dropPostgresDatabase(
    context?: DatabaseDropContext,
) {
    context = context || {};
    context.options = context.options || await buildDataSourceOptions(context.options);

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
