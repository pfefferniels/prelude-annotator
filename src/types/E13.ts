import { UrlString } from "@inrupt/solid-client";
import { Selection } from "./Selection";

export type E13 = {
    url: UrlString
    treatise: UrlString
    property: UrlString
    attribute: Selection | UrlString
    target: string
    comment: string
}
