import {FiltersParseOptions, parseQueryFilters, parseQueryRelations} from "rapiq";
import {ObjectLiteral} from "typeorm";
import {FakeSelectQueryBuilder} from "../../data/typeorm/FakeSelectQueryBuilder";
import {
    applyFilters,
    applyFiltersTransformed, applyQueryFilters,
    applyQueryFiltersParseOutput, FiltersApplyOptions, FiltersApplyOutput,
    FiltersTransformOutput,
    transformParsedFilters
} from "../../../src";

function parseAndTransformFilters<T extends ObjectLiteral = ObjectLiteral>(
    data: unknown,
    options: FiltersApplyOptions<T>
) : FiltersTransformOutput {
    const parsed = parseQueryFilters(data, options);

    return transformParsedFilters(parsed, options);
}

describe('src/api/filters.ts', () => {
    const queryBuilder = new FakeSelectQueryBuilder();

    it('should transform request filters', () => {
        // filter id
        let allowedFilters = parseAndTransformFilters({id: 1}, {allowed: ['id']});
        expect(allowedFilters).toEqual([{statement: 'id = :filter_id', binding: {'filter_id': 1}}]  as FiltersTransformOutput);

        // filter none
        allowedFilters = parseAndTransformFilters({id: 1}, {allowed: []});
        expect(allowedFilters).toEqual([]  as FiltersTransformOutput);

        // filter with alias
        allowedFilters = parseAndTransformFilters({aliasId: 1}, {mapping: {aliasId: 'id'}, allowed: ['id']});
        expect(allowedFilters).toEqual([{statement: 'id = :filter_id', binding: {'filter_id': 1}}] as FiltersTransformOutput);

        // filter with custom queryBindingKey
        allowedFilters = parseAndTransformFilters({id: 1}, {allowed: ['id'],bindingKey: key => 'prefix_' + key});
        expect(allowedFilters).toEqual([{statement: 'id = :prefix_id', binding: {'prefix_id': 1}}] as FiltersTransformOutput);

        // filter with query alias
        allowedFilters = parseAndTransformFilters({id: 1}, {defaultAlias: 'user', allowed: ['id']});
        expect(allowedFilters).toEqual([{statement: 'user.id = :filter_user_id', binding: {'filter_user_id': 1}}] as FiltersTransformOutput);

        // filter allowed
        allowedFilters = parseAndTransformFilters({name: 'tada5hi'}, {allowed: ['name']});
        expect(allowedFilters).toEqual( [{statement: 'name = :filter_name', binding: {'filter_name': 'tada5hi'}}] as FiltersTransformOutput);

        // filter data with el empty value
        allowedFilters = parseAndTransformFilters({name: ''}, {allowed: ['name']});
        expect(allowedFilters).toEqual([] as FiltersTransformOutput);

        // --------------------------------------------------

        // filter data with el null value
        allowedFilters = parseAndTransformFilters({name: null}, {allowed: ['name']});
        expect(allowedFilters).toEqual([{statement: 'name IS NULL', binding: {}}] as FiltersTransformOutput);

        allowedFilters = parseAndTransformFilters({name: 'null'}, {allowed: ['name']});
        expect(allowedFilters).toEqual([{statement: 'name IS NULL', binding: {}}] as FiltersTransformOutput);

        allowedFilters = parseAndTransformFilters({name: '!null'}, {allowed: ['name']});
        expect(allowedFilters).toEqual([{statement: 'name IS NOT NULL', binding: {}}] as FiltersTransformOutput);

        // --------------------------------------------------

        // filter wrong allowed
        allowedFilters = parseAndTransformFilters({id: 1}, {allowed: ['name']});
        expect(allowedFilters).toEqual([] as FiltersTransformOutput);

        // filter empty data
        allowedFilters = parseAndTransformFilters({}, {allowed: ['name']});
        expect(allowedFilters).toEqual([] as FiltersTransformOutput);
    });

    it('should transform filters with different operators', () => {
        // equal operator
        let data = parseAndTransformFilters({id: '1'}, {allowed: ['id']});
        expect(data).toEqual([
            {statement: 'id = :filter_id', binding: {'filter_id': 1}}
        ] as FiltersTransformOutput);

        // negation with equal operator
        data = parseAndTransformFilters({id: '!1'}, {allowed: ['id']});
        expect(data).toEqual([
            {statement: 'id != :filter_id', binding: {'filter_id': 1}}
        ] as FiltersTransformOutput);

        // in operator
        data = parseAndTransformFilters({id: '1,2,3'}, {allowed: ['id']});
        expect(data).toEqual([
            {statement: 'id IN (:...filter_id)', binding: {'filter_id': [1,2,3]}}
        ] as FiltersTransformOutput);

        // negation with in operator
        data = parseAndTransformFilters({id: '!1,2,3'}, {allowed: ['id']});
        expect(data).toEqual([
            {statement: 'id NOT IN (:...filter_id)', binding: {'filter_id': [1,2,3]}}
        ] as FiltersTransformOutput);

        // like operator
        data = parseAndTransformFilters({name: '~name'}, {allowed: ['name']});
        expect(data).toEqual([
            {statement: 'name LIKE :filter_name', binding: {'filter_name': 'name%'}}
        ] as FiltersTransformOutput);

        // negation with like operator
        data = parseAndTransformFilters({name: '!~name'}, {allowed: ['name']});
        expect(data).toEqual([
            {statement: 'name NOT LIKE :filter_name', binding: {'filter_name': 'name%'}}
        ] as FiltersTransformOutput);

        // lessThan operator
        data = parseAndTransformFilters({id: '<10'}, {allowed: ['id']});
        expect(data).toEqual([
            {statement: 'id < :filter_id', binding: {'filter_id': 10}}
        ] as FiltersTransformOutput);

        // lessThanEqual operator
        data = parseAndTransformFilters({id: '<=10'}, {allowed: ['id']});
        expect(data).toEqual([
            {statement: 'id <= :filter_id', binding: {'filter_id': 10}}
        ] as FiltersTransformOutput);

        // moreThan operator
        data = parseAndTransformFilters({id: '>10'}, {allowed: ['id']});
        expect(data).toEqual([
            {statement: 'id > :filter_id', binding: {'filter_id': 10}}
        ] as FiltersTransformOutput);

        // moreThanEqual operator
        data = parseAndTransformFilters({id: '>=10'}, {allowed: ['id']});
        expect(data).toEqual([
            {statement: 'id >= :filter_id', binding: {'filter_id': 10}}
        ] as FiltersTransformOutput);
    });

    it('should transform filters with includes', () => {
        const includes = parseQueryRelations(['profile', 'user_roles.role'], {allowed: ['profile', 'user_roles.role']});

        const options : FiltersParseOptions = {
            allowed: ['id', 'profile.id', 'user_roles.role.id'],
            relations: includes,
        };

        // simple
        let transformed = parseAndTransformFilters({id: 1, 'profile.id': 2}, options);
        expect(transformed).toEqual([
            {statement: 'id = :filter_id', binding: {'filter_id': 1}},
            {statement: 'profile.id = :filter_profile_id', binding: {'filter_profile_id': 2}}
        ] as FiltersTransformOutput);

        // with include & query alias
        transformed = parseAndTransformFilters({id: 1, 'profile.id': 2}, {...options, defaultAlias: 'user'});
        expect(transformed).toEqual([
            {statement: 'user.id = :filter_user_id', binding: {'filter_user_id': 1}},
            {statement: 'profile.id = :filter_profile_id', binding: {'filter_profile_id': 2}}
        ] as FiltersTransformOutput);

        // with deep nested include
        transformed = parseAndTransformFilters({id: 1, 'user_roles.role.id': 2}, options);
        expect(transformed).toEqual([
            {statement: 'id = :filter_id', binding: {'filter_id': 1}},
            {statement: 'role.id = :filter_role_id', binding: {'filter_role_id': 2}}
        ] as FiltersTransformOutput);
    });

    it('should apply filters parse output', () => {
        const data = applyQueryFiltersParseOutput(queryBuilder, parseQueryFilters({id: 1}, {allowed: ['id']}));
        expect(data).toEqual([
            {key: 'id', operator: {}, value: 1}
        ] as FiltersApplyOutput);
    });

    it('should apply filters transform output', () => {
        let data = applyFiltersTransformed(queryBuilder, parseAndTransformFilters(
                {id: 1},
            {allowed: ['id']}

        ));

        expect(data).toEqual([
            {statement: 'id = :filter_id', binding: {'filter_id': 1}}
        ]);

        data = applyFiltersTransformed(queryBuilder,[]);
        expect(data).toEqual([]);
    });

    it('should apply query filters', () => {
        let data = applyQueryFilters(queryBuilder, {id: 1}, {allowed: ['id']});

        expect(data).toEqual([
            {key: 'id', operator: {}, value: 1}
        ]);

        data = applyFilters(queryBuilder, {id: 1}, {allowed: ['id']});

        expect(data).toEqual([
            {key: 'id', operator: {}, value: 1}
        ]);
    });
});
