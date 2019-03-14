import { check, all, every, okmap, endsWith } from 'typed-json-transform';

interface ValidateState {
    data?: any
    path?: string
}


export function validate(description: Moss.Schema.Options, state: ValidateState) {

}

export function parseDescription(description: Moss.Schema.Description): Moss.Schema.Options {
    if (check(description, String)) {
        return { type: description as string }
    }
    if (check(description, Array)) {
        const descriptionArray = description as Moss.Schema.Description[];
        // if (descriptionArray.length == 1) {
        //     return {
        //         type: "array",
        //         items: parseDescription(descriptionArray[0]),
        //     }
        // }
        // if (descriptionArray.length == 2 && (descriptionArray[0] == 'map')) {
        //     return {
        //         isMap: true,
        //         singleType: parseDescription(descriptionArray[1]),
        //     }
        // }
        return {
            type: "array",
            // isArray: true,
            items: descriptionArray.map(d => parseDescription(d)),
        }
    }
    if (check(description, Object)) {
        const options: Moss.Schema.Options = description as any;
        if (!options.type) {
            return okmap(options, (d: Moss.Schema.Description, key: string) => {
                return parseDescription(d)
            });
        }
        return options;
    }
}

export function validateArray(schema: Moss.Schema.Options, { data, path }: ValidateState) {

}

export function validateObject(current: any, { data, path }: ValidateState) {

}

export function validateScalar(current: any, { data, path }: ValidateState) {

}

