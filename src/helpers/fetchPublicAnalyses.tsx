import { getSolidDataset, getThingAll, getUrl, getUrlAll } from "@inrupt/solid-client";
import { RDF } from "@inrupt/vocab-common-rdf";
import { frbroo } from "./namespaces";

export const fetchPublicAnalyses = async (forWork: string) => {
        const dataset = await getSolidDataset('https://storage.inrupt.com/d14d1c60-6851-4c65-86fa-062c6989387c/preludes/works(4).ttl');
        const things = getThingAll(dataset);
        console.log('things from public storage', things);
        const e17 = things.find(thing => (
            getUrlAll(thing, RDF.type).includes(frbroo('F17_Aggregation_Work')) &&
            getUrl(thing, frbroo('R2_is_derivative_of')) === forWork
        ));

        if (!e17) {
            console.log(`It seems that no analyses have been published yet on this work:
            No F17 Aggregation Work has been found which relates to this work.`);
            return [];
        }

        return getUrlAll(e17, frbroo('R3_is_realised_in'));
}
