declare namespace Moss {
    namespace Schema {
        // interface Options {
        //     scalarType?: string
        //     singleType?: Schema.Options
        //     multiType?: { [x: string]: Schema.Options } | Schema.Options[]
        //     isArray?: boolean
        //     isMap?: boolean
        // }
        interface Options {
            type: string,
            properties?: {[x: string]: Options},
            items?: Options[],
            $id?: string
        }
        type Description = Options | [Options] | string
    }
}