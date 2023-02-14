export type Reference = string | Selection

export type Selection = {
    url: string;
    refs: (Reference)[];
}

export const isSelection = (ref: Reference): ref is Selection => {
    return (ref as Selection).refs !== undefined
}
