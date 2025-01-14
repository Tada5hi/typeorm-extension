import type { DataSourceOptions } from 'typeorm';
import { DriverUtils } from 'typeorm/driver/DriverUtils';
import { getCharsetFromDataSourceOptions } from './charset';
import { getCharacterSetFromDataSourceOptions } from './character-set';
import type { DriverOptions } from '../type';

export function buildDriverOptions(options: DataSourceOptions): DriverOptions {
    let driverOptions: Record<string, any>;

    switch (options.type) {
        case 'mysql':
        case 'mariadb':
        case 'postgres':
        case 'cockroachdb':
        case 'mssql':
        case 'oracle':
            driverOptions = DriverUtils.buildDriverOptions(options.replication ? options.replication.master : options);
            break;
        case 'mongodb':
            driverOptions = DriverUtils.buildMongoDBDriverOptions(options);
            break;
        default:
            driverOptions = DriverUtils.buildDriverOptions(options);
    }

    const charset = getCharsetFromDataSourceOptions(options);
    const characterSet = getCharacterSetFromDataSourceOptions(options);

    return {
        host: driverOptions.host,
        user: driverOptions.user || driverOptions.username,
        password: driverOptions.password,
        database: driverOptions.database,
        port: driverOptions.port,
        ...(charset ? { charset } : {}),
        ...(characterSet ? { characterSet } : {}),
        ...(driverOptions.ssl ? { ssl: driverOptions.ssl } : {}),
        ...(driverOptions.url ? { url: driverOptions.url } : {}),
        ...(driverOptions.connectString ? { connectString: driverOptions.connectString } : {}),
        ...(driverOptions.sid ? { sid: driverOptions.sid } : {}),
        ...(driverOptions.serviceName ? { serviceName: driverOptions.serviceName } : {}),
        ...(options.extra ? { extra: options.extra } : {}),
        ...(driverOptions.domain ? { domain: driverOptions.domain } : {}),
        ...(driverOptions.schema ? { schema: driverOptions.schema } : {}),
    };
}
