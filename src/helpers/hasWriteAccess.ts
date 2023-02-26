import { getAgentAccess, getSolidDataset, getSolidDatasetWithAcl, hasAccessibleAcl, UrlString, WebId } from "@inrupt/solid-client";

export const hasWriteAccessTo = async (url: UrlString, webId: WebId, fetch: any) => {
    const containingDataset = await getSolidDataset(url, { fetch: fetch as any })

    if (hasAccessibleAcl(containingDataset)) {
        const datasetWithAcl = await getSolidDatasetWithAcl(url, { fetch: fetch as any });
        const agentAccess = await getAgentAccess(datasetWithAcl, webId)
        return agentAccess?.read || false
    }
    return false
}
