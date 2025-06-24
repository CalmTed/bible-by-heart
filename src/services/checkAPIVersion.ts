import { API_LINK } from "src/constants"
import { fetchAPI } from "./fetch"

export const checkAPIVersion:(a: {
    localAPIVersion: string
}) => Promise<boolean> = async ({localAPIVersion}) => {
    const response = await fetchAPI({
        link: API_LINK.apiVersion,
        method: "GET"
    })
    console.log(response?.version === localAPIVersion)
    return response?.version === localAPIVersion;

    return false;
}