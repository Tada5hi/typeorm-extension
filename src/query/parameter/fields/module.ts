import {
    parseQueryFields,
} from 'rapiq';

import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { buildKeyWithPrefix, getAliasForPath } from '../../utils';
import { FieldsApplyOptions, FieldsApplyOutput } from './type';

/**
 * Apply parsed fields parameter data on the db query.
 *
 * @param query
 * @param data
 */
/* istanbul ignore next */
export function applyQueryFieldsParseOutput<T extends ObjectLiteral = ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    data: FieldsApplyOutput,
    options?: FieldsApplyOptions<T>,
) {
    options = options || {};

    if (data.length === 0) {
        return data;
    }

    query.select(data.map((field) => {
        const alias = getAliasForPath(options.relations, field.path) ||
            options.defaultAlias;
        return buildKeyWithPrefix(field.key, alias);
    }));

    return data;
}

/**
 * Apply raw fields parameter data on the db query.
 *
 * @param query
 * @param data
 * @param options
 */
export function applyQueryFields<T extends ObjectLiteral = ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    data: unknown,
    options?: FieldsApplyOptions<T>,
) : FieldsApplyOutput {
    options = options || {};
    if (options.defaultAlias) {
        options.defaultPath = options.defaultAlias;
    }

    return applyQueryFieldsParseOutput(query, parseQueryFields(data, options), options);
}

/**
 * Apply raw fields parameter data on the db query.
 *
 * @param query
 * @param data
 * @param options
 */
export function applyFields<T extends ObjectLiteral = ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    data: unknown,
    options?: FieldsApplyOptions<T>,
) : FieldsApplyOutput {
    return applyQueryFields(query, data, options);
}
