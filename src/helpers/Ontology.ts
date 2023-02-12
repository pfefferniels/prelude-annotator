import { asUrl, getStringNoLocale, getThingAll, getUrl, getUrlAll, SolidDataset, Thing } from "@inrupt/solid-client";
import { DCTERMS, OWL, RDF, RDFS } from "@inrupt/vocab-common-rdf";

export type LabeledURI = {
    uri: string,
    label: string
}

type Property = LabeledURI & {
    domain: string
    range: string
}

/**
 * Represents the ontology of a specific treatise
 * and provides useful methods for working with it.
 */
export class Ontology {
    private things: Thing[]
    url: string
    name: string
    label: string

    constructor(ontology: SolidDataset, name: string, label: string) {
        this.things = getThingAll(ontology);
        this.name = name;
        this.label = label
        const owlOntology = this.things.find(thing => getUrl(thing, RDF.type) === OWL.Ontology);
        if (!owlOntology)
            this.url = '';
        else
            this.url = asUrl(owlOntology);
    }

    title() {
        const owlOntology = this.things.find(thing => getUrl(thing, RDF.type) === OWL.Ontology);
        if (!owlOntology)
            return this.name;
        return getStringNoLocale(owlOntology, DCTERMS.title) || this.name;
    }

    allClasses() {
        return this.things
            .filter(thing => getUrl(thing, RDF.type) === OWL.Class)
            .map(thing => ({
                uri: asUrl(thing),
                label: getStringNoLocale(thing, RDFS.label)
            }) as LabeledURI);
    }

    propertiesWithDomain(url: string) {
        const classObj = this.things.find(thing => asUrl(thing) === url);
        if (!classObj)
            return [];
        const parents = getUrlAll(classObj, RDFS.subClassOf);

        return this.things
            .filter(thing => getUrl(thing, RDF.type) === OWL.ObjectProperty &&
                [...parents, url].includes(getUrl(thing, RDFS.domain) || ''))
            .map(thing => ({
                uri: asUrl(thing),
                label: getStringNoLocale(thing, RDFS.label)
            }) as LabeledURI);
    }

    rangeOfProperty(propertyUrl: string): string | null {
        const obj = this.things.find(thing => asUrl(thing) === propertyUrl);
        if (!obj)
            return null;
        return getUrl(obj, RDFS.range);
    }

    labelOf(url: string): string | null {
        const thing = this.things.find(thing => asUrl(thing) === url);
        return thing ? getStringNoLocale(thing, RDFS.label) : null;
    }
}
