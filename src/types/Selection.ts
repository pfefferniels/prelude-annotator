import { Provenience } from "./Provenience";

export type Reference = string | Selection

export type Selection = {
    id: string;
    refs: (Reference)[];
} & Provenience;

export const isSelection = (ref: Reference): ref is Selection => {
    return (ref as Selection).refs !== undefined
}
